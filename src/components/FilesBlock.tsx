import { useState, useRef, useEffect, useCallback } from "react";
import type { FileTreeNode } from "../types";
import { FILE_TREE } from "../data";

// ─── Tree utilities ───────────────────────────────────────────────────────────

function findNode(nodes: FileTreeNode[], id: string): FileTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.kind === "folder") { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
}

function removeNode(nodes: FileTreeNode[], id: string): FileTreeNode[] {
  return nodes.filter(n => n.id !== id).map(n =>
    n.kind === "folder" ? { ...n, children: removeNode(n.children, id) } : n
  );
}

function addToFolder(nodes: FileTreeNode[], folderId: string | null, node: FileTreeNode): FileTreeNode[] {
  if (folderId === null) return [...nodes, node];
  return nodes.map(n =>
    n.kind === "folder"
      ? n.id === folderId
        ? { ...n, children: [...n.children, node] }
        : { ...n, children: addToFolder(n.children, folderId, node) }
      : n
  );
}

function renameNode(nodes: FileTreeNode[], id: string, name: string): FileTreeNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, name };
    if (n.kind === "folder") return { ...n, children: renameNode(n.children, id, name) };
    return n;
  });
}

function getAllFolders(nodes: FileTreeNode[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const n of nodes) {
    if (n.kind === "folder") {
      result.push({ id: n.id, name: n.name, depth });
      result.push(...getAllFolders(n.children, depth + 1));
    }
  }
  return result;
}

function matchesSearch(node: FileTreeNode, q: string): boolean {
  if (!q) return true;
  if (node.name.toLowerCase().includes(q.toLowerCase())) return true;
  if (node.kind === "folder") return node.children.some(c => matchesSearch(c, q));
  return false;
}

const FILE_ICON: Record<string, string> = { pdf: "PDF", doc: "DOC", sheet: "XLS", slide: "PPT", other: "···" };
const FILE_COLOR: Record<string, string> = {
  pdf: "text-[#F0684D]", doc: "text-blue-400", sheet: "text-emerald-400",
  slide: "text-amber-400", other: "text-[#C4A882]",
};

function uid() { return Math.random().toString(36).slice(2); }

// ─── Context menu ─────────────────────────────────────────────────────────────

type MenuState = { nodeId: string; x: number; y: number };

function ContextMenu({
  menu, tree, onRename, onMove, onDelete, onClose
}: {
  menu: MenuState;
  tree: FileTreeNode[];
  onRename: () => void;
  onMove: (folderId: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [showMove, setShowMove] = useState(false);
  const folders = getAllFolders(tree);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed z-[100] rounded-xl border border-[#3D3330] bg-[#232120] shadow-2xl overflow-hidden min-w-[140px]"
      style={{ top: menu.y, left: menu.x }}>
      {!showMove ? (
        <>
          <button className="w-full px-3 py-2 text-left text-xs text-[#C4A882] hover:bg-[#2A2724] hover:text-[#FFEDD1] transition-colors" onClick={onRename}>Rename</button>
          <button className="w-full px-3 py-2 text-left text-xs text-[#C4A882] hover:bg-[#2A2724] hover:text-[#FFEDD1] transition-colors" onClick={() => setShowMove(true)}>Move to folder</button>
          <div className="h-px bg-[#3D3330] mx-2" />
          <button className="w-full px-3 py-2 text-left text-xs text-[#F0684D] hover:bg-[#F0684D]/10 transition-colors" onClick={onDelete}>Delete</button>
        </>
      ) : (
        <>
          <button className="w-full px-3 py-2 text-left text-[9px] text-[#7A6555] hover:text-[#C4A882] flex items-center gap-1" onClick={() => setShowMove(false)}>
            ← Back
          </button>
          <div className="h-px bg-[#3D3330] mx-2 mb-1" />
          <button className="w-full px-3 py-2 text-left text-xs text-[#C4A882] hover:bg-[#2A2724] hover:text-[#FFEDD1] transition-colors"
            onClick={() => { onMove(null); onClose(); }}>
            / Root
          </button>
          {folders.map(f => (
            <button key={f.id} className="w-full px-3 py-2 text-left text-xs text-[#C4A882] hover:bg-[#2A2724] hover:text-[#FFEDD1] transition-colors"
              style={{ paddingLeft: 12 + f.depth * 10 }}
              onClick={() => { onMove(f.id); onClose(); }}>
              {f.name}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Tree node ────────────────────────────────────────────────────────────────

function TreeNode({
  node, depth, q, open, onToggle,
  draggingId, onDragStart, onDrop, onLocalDrop,
  renamingId, onRenameCommit,
  onMenuOpen,
}: {
  node: FileTreeNode; depth: number; q: string;
  open: boolean; onToggle: () => void;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (targetFolderId: string) => void;
  onLocalDrop: (folderId: string, files: FileList) => void;
  renamingId: string | null;
  onRenameCommit: (id: string, name: string) => void;
  onMenuOpen: (nodeId: string, x: number, y: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const indent = depth * 14;

  if (!matchesSearch(node, q)) return null;

  if (node.kind === "file") {
    return (
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); onDragStart(node.id); e.dataTransfer.effectAllowed = "move"; }}
        className={`group flex items-center gap-2 py-1 rounded-lg hover:bg-[#2A2724] transition-colors cursor-grab select-none ${draggingId === node.id ? "opacity-40" : ""}`}
        style={{ paddingLeft: indent + 8, paddingRight: 6 }}>
        {renamingId === node.id ? (
          <input autoFocus defaultValue={node.name}
            className="flex-1 bg-[#141212] border border-[#F0684D] rounded px-1.5 text-xs text-[#FFEDD1] outline-none"
            onBlur={e => onRenameCommit(node.id, e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onRenameCommit(node.id, (e.target as HTMLInputElement).value); if (e.key === "Escape") onRenameCommit(node.id, node.name); }} />
        ) : (
          <>
            <span className={`text-[9px] font-bold w-6 shrink-0 ${FILE_COLOR[node.type]}`}>{FILE_ICON[node.type]}</span>
            <span className="flex-1 text-[11px] text-[#C4A882] truncate group-hover:text-[#FFEDD1] transition-colors">{node.name}</span>
            <span className="text-[9px] text-[#4A3F38] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1">{node.size}</span>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7A6555] hover:text-[#FFEDD1] px-1 text-sm leading-none shrink-0"
              onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenuOpen(node.id, r.left - 144, r.bottom + 4); }}>
              ···
            </button>
          </>
        )}
      </div>
    );
  }

  // Folder
  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-1 rounded-lg transition-colors cursor-pointer select-none ${dragOver ? "bg-[#F0684D]/10 ring-1 ring-[#F0684D]/40" : "hover:bg-[#2A2724]"}`}
        style={{ paddingLeft: indent + 8, paddingRight: 6 }}
        onClick={onToggle}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); e.dataTransfer.dropEffect = "move"; }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); e.stopPropagation(); setDragOver(false);
          if (e.dataTransfer.files.length > 0) { onLocalDrop(node.id, e.dataTransfer.files); }
          else { onDrop(node.id); }
        }}>
        <span className="text-[#7A6555] text-[9px] w-3 shrink-0 transition-transform duration-150" style={{ transform: open ? "rotate(90deg)" : "none" }}>▶</span>
        <svg className="w-3.5 h-3.5 shrink-0 text-[#FFD142]/70" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        {renamingId === node.id ? (
          <input autoFocus defaultValue={node.name}
            className="flex-1 bg-[#141212] border border-[#F0684D] rounded px-1.5 text-xs text-[#FFEDD1] outline-none"
            onClick={e => e.stopPropagation()}
            onBlur={e => onRenameCommit(node.id, e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onRenameCommit(node.id, (e.target as HTMLInputElement).value); if (e.key === "Escape") onRenameCommit(node.id, node.name); }} />
        ) : (
          <>
            <span className="flex-1 text-[11px] font-medium text-[#FFEDD1] truncate">{node.name}</span>
            <span className="text-[9px] text-[#4A3F38] shrink-0 opacity-0 group-hover:opacity-60 transition-opacity">{node.children.length}</span>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7A6555] hover:text-[#FFEDD1] px-1 text-sm leading-none shrink-0"
              onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenuOpen(node.id, r.left - 144, r.bottom + 4); }}>
              ···
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="relative">
          <div className="absolute top-0 bottom-0 w-px bg-[#3D3330]" style={{ left: indent + 16 }} />
          {node.children.map(child => (
            <ConnectedTreeNode key={child.id} node={child} depth={depth + 1} q={q}
              draggingId={draggingId} onDragStart={onDragStart} onDrop={onDrop} onLocalDrop={onLocalDrop}
              renamingId={renamingId} onRenameCommit={onRenameCommit} onMenuOpen={onMenuOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper that manages own open state per node
function ConnectedTreeNode(props: Omit<Parameters<typeof TreeNode>[0], "open" | "onToggle">) {
  const [open, setOpen] = useState(props.depth === 0);
  return <TreeNode {...props} open={open} onToggle={() => setOpen(o => !o)} />;
}

// ─── FilesBlock ───────────────────────────────────────────────────────────────

export function FilesBlock() {
  const [tree, setTree] = useState<FileTreeNode[]>(FILE_TREE);
  const [q, setQ] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);

  const handleDrop = useCallback((targetFolderId: string) => {
    if (!draggingId || draggingId === targetFolderId) { setDraggingId(null); return; }
    const node = findNode(tree, draggingId);
    if (!node) { setDraggingId(null); return; }
    setTree(t => addToFolder(removeNode(t, draggingId), targetFolderId, node));
    setDraggingId(null);
  }, [draggingId, tree]);

  const handleLocalDrop = useCallback((folderId: string | null, files: FileList) => {
    const newNodes: FileTreeNode[] = Array.from(files).map(f => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const type = ext === "pdf" ? "pdf" : ext === "doc" || ext === "docx" ? "doc" : ext === "xls" || ext === "xlsx" ? "sheet" : ext === "ppt" || ext === "pptx" ? "slide" : "other";
      const size = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      return { kind: "file" as const, id: uid(), name: f.name, type, size, modified: "Just now", url: "#" };
    });
    setTree(t => newNodes.reduce((acc, node) => addToFolder(acc, folderId, node), t));
  }, []);

  const handleMove = useCallback((nodeId: string, folderId: string | null) => {
    const node = findNode(tree, nodeId);
    if (!node) return;
    setTree(t => addToFolder(removeNode(t, nodeId), folderId, node));
  }, [tree]);

  const handleRenameCommit = useCallback((id: string, name: string) => {
    if (name.trim()) setTree(t => renameNode(t, id, name.trim()));
    setRenamingId(null);
  }, []);

  const handleDelete = useCallback((nodeId: string) => {
    setTree(t => removeNode(t, nodeId));
    setMenu(null);
  }, []);

  const menuNodeId = menu?.nodeId ?? null;

  return (
    <div className="flex flex-col h-full"
      onDragEnd={() => setDraggingId(null)}>
      <h2 className="text-sm font-semibold text-[#FFEDD1] mb-2 shrink-0">Files</h2>
      <div className="relative mb-2 shrink-0">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search files…"
          className="w-full bg-[#232120] border border-[#3D3330] rounded-lg pl-3 pr-3 py-1.5 text-xs text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] transition-colors" />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto min-h-0 -mx-1 px-1">
        {tree.map(node => (
          <ConnectedTreeNode key={node.id} node={node} depth={0} q={q}
            draggingId={draggingId} onDragStart={setDraggingId}
            onDrop={handleDrop} onLocalDrop={handleLocalDrop}
            renamingId={renamingId} onRenameCommit={handleRenameCommit}
            onMenuOpen={(nodeId, x, y) => { setMenu({ nodeId, x, y }); }} />
        ))}
      </div>

      {/* Root drop zone for local files */}
      <div
        className={`shrink-0 mt-2 rounded-xl border border-dashed py-2 text-center text-[9px] transition-colors ${rootDragOver ? "border-[#F0684D] bg-[#F0684D]/8 text-[#F0684D]" : "border-[#3D3330] text-[#4A3F38]"}`}
        onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes("Files")) setRootDragOver(true); }}
        onDragLeave={() => setRootDragOver(false)}
        onDrop={e => { e.preventDefault(); setRootDragOver(false); if (e.dataTransfer.files.length) handleLocalDrop(null, e.dataTransfer.files); }}>
        Drop file here to add to root
      </div>

      {/* Context menu */}
      {menu && menuNodeId && (
        <ContextMenu
          menu={menu}
          tree={tree}
          onRename={() => { setRenamingId(menuNodeId); setMenu(null); }}
          onMove={folderId => handleMove(menuNodeId, folderId)}
          onDelete={() => handleDelete(menuNodeId)}
          onClose={() => setMenu(null)} />
      )}
    </div>
  );
}
