export type EventType = "event" | "meeting";
export type InviteStatus = "pending" | "accepted" | "declined";
export type CalView = "day" | "week" | "month";

export interface MemberInvite { memberId: string; status: InviteStatus; }

export interface VoteGroup { for: string[]; against: string[]; abstain: string[]; }

export interface DiscussionPoint {
  id: string; title: string; notes: string;
  votingEnabled: boolean;
  votes: VoteGroup;
}

export interface CalEvent {
  id: string; title: string; type: EventType;
  date: string; startTime: string; endDate: string; endTime: string;
  color: string; description: string; location: string;
  invitees: MemberInvite[];
  sendMail: boolean;
  linkedFiles: string[];
  localFiles: string[];
  repeat: { every: number; unit: "days" | "weeks" } | null;
  discussionPoints: DiscussionPoint[];
}

export interface Subtask { id: string; text: string; done: boolean; }

export interface TodoItem {
  id: string; text: string; description: string; done: boolean;
  color: string; assignedMembers: string[]; linkedFiles: string[];
  addToCalendar: boolean; calendarDate: string;
  subtasks: Subtask[];
  dueDate?: string;
}

export interface DriveFile {
  id: string; name: string; type: "pdf"|"doc"|"sheet"|"slide"|"other";
  size: string; modified: string; url: string;
}

export type FileTreeNode =
  | { kind: "folder"; id: string; name: string; children: FileTreeNode[] }
  | { kind: "file"; id: string; name: string; type: DriveFile["type"]; size: string; modified: string; url: string };

export interface Member {
  id: string; name: string; email: string; team: string; department: string;
  role: string; avatar: string; status: "active"|"inactive";
  isSubLead: boolean; strikes: number;
}

export interface RoadmapItem {
  id: string; title: string; department: string;
  startDate: string; endDate: string;
  color: string; progress: number;
}

export interface OrderLineItem { name: string; qty: number; price: number; }
export interface Order {
  id: string; date: string; startTime: string; endTime: string;
  title: string; items: OrderLineItem[];
}

export interface BudgetSubSub { name: string; budget: number; spent: number; }
export interface BudgetSub { name: string; budget: number; spent: number; subs?: BudgetSubSub[]; }
export interface BudgetDept {
  name: string; budget: number; spent: number; color: string;
  subs: BudgetSub[];
}
export interface BudgetData {
  total: number; spent: number; departments: BudgetDept[];
}

export interface AppNotification {
  id: string; type: "order"|"member"|"event"|"todo"|"budget";
  title: string; body: string; time: string; read: boolean;
}
