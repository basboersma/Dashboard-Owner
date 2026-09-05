import type { CalEvent, Member, DriveFile, FileTreeNode, TodoItem, RoadmapItem, Order, BudgetData, AppNotification } from "./types";

// ─── Date utilities ───────────────────────────────────────────────────────────
export const addDays = (d: Date, n: number): Date => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
export const getMonday = (d: Date): Date => { const r=new Date(d); const day=r.getDay(); r.setDate(r.getDate()-(day===0?6:day-1)); r.setHours(0,0,0,0); return r; };
export const formatDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const parseDate = (s: string): Date => { const [y,m,day]=s.split("-").map(Number); return new Date(y,m-1,day); };
export const isSameDay = (a: Date, b: Date): boolean => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
export const diffDays = (a: string, b: string): number => Math.round((parseDate(b).getTime()-parseDate(a).getTime())/86400000);

export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAY_SHORT = ["Mo","Tu","We","Th","Fr","Sa","Su"];
export const DAY_FULL = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── Calendar layout ──────────────────────────────────────────────────────────
export const HOURS = Array.from({length:14},(_,i)=>i+7);
export const HOUR_H = 56;
export const HEADER_H = 32;
export const TIME_COL_W = 44;

// ─── Departments ──────────────────────────────────────────────────────────────
export const DEPARTMENTS = ["Mechanical","PR","Board","Software","Finance","Design"];
export const SUBTEAMS: Record<string, string[]> = {
  Mechanical: ["Arm", "Chassis", "Science"],
  PR:         ["Print", "Digital", "Events"],
  Software:   ["Licenses", "Hosting", "Tools"],
  Finance:    ["Audit", "Banking", "Insurance"],
  Board:      ["Travel", "Events", "Misc"],
  Design:     ["Software", "Assets", "Print"],
};
export const DEPT_COLORS: Record<string,string> = {
  Mechanical:"#4f6ef7", PR:"#10b981", Board:"#8b5cf6",
  Software:"#f59e0b", Finance:"#f43f5e", Design:"#ec4899",
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────
export const AVATAR_BG = ["bg-blue-500","bg-purple-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-indigo-500"];
export const avatarBg = (i: number) => AVATAR_BG[((i%AVATAR_BG.length)+AVATAR_BG.length)%AVATAR_BG.length];
export const memberIdx = (id: string) => MEMBERS.findIndex(m=>m.id===id);

// ─── Members ──────────────────────────────────────────────────────────────────
export const MEMBERS: Member[] = [
  {id:"m1",name:"Alex van den Berg",email:"a.vandenberg@gearsnl.org",team:"Mechanical",department:"Mechanical",role:"Lead Engineer",avatar:"A",status:"active",isSubLead:true,strikes:0},
  {id:"m2",name:"Sophie Janssen",email:"s.janssen@gearsnl.org",team:"PR",department:"PR",role:"Marketing",avatar:"S",status:"active",isSubLead:false,strikes:0},
  {id:"m3",name:"Daan Mulder",email:"d.mulder@gearsnl.org",team:"Mechanical",department:"Mechanical",role:"Engineer",avatar:"D",status:"active",isSubLead:false,strikes:1},
  {id:"m4",name:"Emma de Vries",email:"e.devries@gearsnl.org",team:"PR",department:"Design",role:"Designer",avatar:"E",status:"inactive",isSubLead:false,strikes:0},
  {id:"m5",name:"Liam Bakker",email:"l.bakker@gearsnl.org",team:"Board",department:"Board",role:"President",avatar:"L",status:"active",isSubLead:false,strikes:0},
  {id:"m6",name:"Noah Smit",email:"n.smit@gearsnl.org",team:"Mechanical",department:"Mechanical",role:"Technician",avatar:"N",status:"active",isSubLead:false,strikes:2},
];

// ─── Drive files ──────────────────────────────────────────────────────────────
export const FILES: DriveFile[] = [
  {id:"f1",name:"Q3 Financial Report.pdf",type:"pdf",size:"2.4 MB",modified:"Sep 2, 2026",url:"#"},
  {id:"f2",name:"Member Handbook 2026.pdf",type:"pdf",size:"1.1 MB",modified:"Aug 28, 2026",url:"#"},
  {id:"f3",name:"Event Planning Template.doc",type:"doc",size:"340 KB",modified:"Aug 20, 2026",url:"#"},
  {id:"f4",name:"Budget Overview Q4.sheet",type:"sheet",size:"780 KB",modified:"Sep 1, 2026",url:"#"},
  {id:"f5",name:"AGM Slides.slide",type:"slide",size:"5.6 MB",modified:"Aug 15, 2026",url:"#"},
  {id:"f6",name:"Code of Conduct.pdf",type:"pdf",size:"220 KB",modified:"Jul 30, 2026",url:"#"},
  {id:"f7",name:"Sponsorship Deck 2026.slide",type:"slide",size:"8.2 MB",modified:"Sep 3, 2026",url:"#"},
];

export const FILE_TREE: FileTreeNode[] = [
  { kind:"folder", id:"fd1", name:"Finance", children:[
    { kind:"file", id:"f1", name:"Q3 Financial Report.pdf", type:"pdf", size:"2.4 MB", modified:"Sep 2, 2026", url:"#" },
    { kind:"file", id:"f4", name:"Budget Overview Q4.xlsx", type:"sheet", size:"780 KB", modified:"Sep 1, 2026", url:"#" },
    { kind:"folder", id:"fd1a", name:"Audits", children:[
      { kind:"file", id:"f1a", name:"External Audit 2025.pdf", type:"pdf", size:"3.1 MB", modified:"Jul 12, 2026", url:"#" },
      { kind:"file", id:"f1b", name:"Internal Review Notes.doc", type:"doc", size:"180 KB", modified:"Jun 5, 2026", url:"#" },
    ]},
  ]},
  { kind:"folder", id:"fd2", name:"PR & Marketing", children:[
    { kind:"file", id:"f7", name:"Sponsorship Deck 2026.pptx", type:"slide", size:"8.2 MB", modified:"Sep 3, 2026", url:"#" },
    { kind:"file", id:"f5", name:"AGM Slides.pptx", type:"slide", size:"5.6 MB", modified:"Aug 15, 2026", url:"#" },
    { kind:"folder", id:"fd2a", name:"Print Assets", children:[
      { kind:"file", id:"f2a", name:"Flyer A5 Template.pdf", type:"pdf", size:"1.4 MB", modified:"Aug 10, 2026", url:"#" },
      { kind:"file", id:"f2b", name:"Roll-up Banner.pdf", type:"pdf", size:"2.0 MB", modified:"Aug 10, 2026", url:"#" },
    ]},
  ]},
  { kind:"folder", id:"fd3", name:"Mechanical", children:[
    { kind:"folder", id:"fd3a", name:"Arm", children:[
      { kind:"file", id:"f3a", name:"Arm CAD v3.other", type:"other", size:"12.4 MB", modified:"Sep 1, 2026", url:"#" },
      { kind:"file", id:"f3b", name:"Arm BOM.xlsx", type:"sheet", size:"320 KB", modified:"Aug 29, 2026", url:"#" },
    ]},
    { kind:"folder", id:"fd3b", name:"Chassis", children:[
      { kind:"file", id:"f3c", name:"Chassis CAD v5.other", type:"other", size:"18.7 MB", modified:"Sep 3, 2026", url:"#" },
      { kind:"file", id:"f3d", name:"Stress Analysis.pdf", type:"pdf", size:"4.2 MB", modified:"Aug 22, 2026", url:"#" },
    ]},
  ]},
  { kind:"folder", id:"fd4", name:"General", children:[
    { kind:"file", id:"f2", name:"Member Handbook 2026.pdf", type:"pdf", size:"1.1 MB", modified:"Aug 28, 2026", url:"#" },
    { kind:"file", id:"f6", name:"Code of Conduct.pdf", type:"pdf", size:"220 KB", modified:"Jul 30, 2026", url:"#" },
    { kind:"file", id:"f3", name:"Event Planning Template.docx", type:"doc", size:"340 KB", modified:"Aug 20, 2026", url:"#" },
  ]},
];

// ─── Calendar events ──────────────────────────────────────────────────────────
export const INIT_EVENTS: CalEvent[] = [
  {
    id:"e1",title:"Team Sync",type:"meeting",
    date:"2026-09-01",startTime:"10:00",endDate:"2026-09-01",endTime:"11:00",
    color:"#4f6ef7",description:"Weekly sync for the Mechanical team.",location:"Room 2.4",
    invitees:[{memberId:"m1",status:"accepted"},{memberId:"m2",status:"pending"},{memberId:"m3",status:"declined"}],
    sendMail:false,linkedFiles:["f3"],localFiles:[],repeat:null,
    discussionPoints:[
      {id:"dp1",title:"Q3 project status",notes:"",votingEnabled:false,votes:{for:["m1"],against:[],abstain:["m2"]}},
      {id:"dp2",title:"Sprint planning",notes:"",votingEnabled:true,votes:{for:[],against:[],abstain:[]}},
    ],
  },
  {
    id:"e2",title:"PR Workshop",type:"event",
    date:"2026-09-03",startTime:"14:00",endDate:"2026-09-03",endTime:"16:00",
    color:"#10b981",description:"Social media strategy workshop for Q4.",location:"Main Hall",
    invitees:[{memberId:"m2",status:"accepted"},{memberId:"m4",status:"accepted"},{memberId:"m5",status:"pending"}],
    sendMail:false,linkedFiles:["f5","f7"],localFiles:[],repeat:null,discussionPoints:[],
  },
  {
    id:"e3",title:"Board Review",type:"meeting",
    date:"2026-09-04",startTime:"11:00",endDate:"2026-09-04",endTime:"12:30",
    color:"#8b5cf6",description:"Quarterly board review.",location:"Boardroom",
    invitees:[{memberId:"m5",status:"accepted"},{memberId:"m1",status:"pending"},{memberId:"m2",status:"declined"}],
    sendMail:true,linkedFiles:["f4"],localFiles:[],repeat:{every:2,unit:"weeks"},
    discussionPoints:[
      {id:"dp3",title:"Budget approval Q4",notes:"Discuss allocation.",votingEnabled:true,votes:{for:["m5"],against:[],abstain:[]}},
    ],
  },
  {
    id:"e4",title:"Design Sprint",type:"event",
    date:"2026-09-05",startTime:"09:00",endDate:"2026-09-05",endTime:"10:30",
    color:"#10b981",description:"Design sprint for new member portal.",location:"Design Room",
    invitees:[{memberId:"m4",status:"accepted"},{memberId:"m6",status:"pending"}],
    sendMail:false,linkedFiles:[],localFiles:[],repeat:null,discussionPoints:[],
  },
];

// ─── Todos ────────────────────────────────────────────────────────────────────
export const INIT_TODOS: TodoItem[] = [
  {id:"t1",text:"Submit Q3 order forms",description:"Fill in all Q3 order forms before Friday. Coordinate with finance team.",done:false,color:"#F0684D",assignedMembers:["m1","m3"],linkedFiles:["f1"],addToCalendar:false,calendarDate:"",dueDate:"2026-09-12",
    subtasks:[{id:"st1",text:"Fill mechanical forms",done:true},{id:"st2",text:"Finance sign-off",done:false},{id:"st3",text:"Submit portal",done:false}]},
  {id:"t2",text:"Review workshop attendee list",description:"Confirm attendees for the PR workshop and send reminders.",done:false,color:"#FFD142",assignedMembers:["m2"],linkedFiles:["f5"],addToCalendar:false,calendarDate:"",dueDate:"2026-09-08",
    subtasks:[{id:"st4",text:"Check RSVPs",done:true},{id:"st5",text:"Send reminders",done:false}]},
  {id:"t3",text:"Upload event photos",description:"",done:true,color:"#10b981",assignedMembers:[],linkedFiles:[],addToCalendar:false,calendarDate:"",dueDate:"2026-09-01",subtasks:[]},
  {id:"t4",text:"Update member handbook",description:"Add the new onboarding section to the handbook.",done:false,color:"#8b5cf6",assignedMembers:["m1"],linkedFiles:["f2"],addToCalendar:false,calendarDate:"",dueDate:"2026-09-20",
    subtasks:[{id:"st6",text:"Draft new section",done:false},{id:"st7",text:"Review + publish",done:false}]},
];

// ─── Monthly spend per dept (last 6 months) ───────────────────────────────────
export interface MonthlySpend { month: string; budget: number; spent: number; }
export const MONTHLY_SPEND: Record<string, MonthlySpend[]> = {
  Total:      [{month:"Oct",budget:8333,spent:6200},{month:"Nov",budget:8333,spent:5800},{month:"Dec",budget:8333,spent:7100},{month:"Jan",budget:8333,spent:4200},{month:"Feb",budget:8333,spent:5100},{month:"Mar",budget:8333,spent:3900},{month:"Apr",budget:8333,spent:2900},{month:"May",budget:8333,spent:4100},{month:"Jun",budget:8333,spent:5300},{month:"Jul",budget:8333,spent:4700},{month:"Aug",budget:8333,spent:5800},{month:"Sep",budget:8333,spent:3800}],
  Mechanical: [{month:"Oct",budget:2500,spent:1800},{month:"Nov",budget:2500,spent:1500},{month:"Dec",budget:2500,spent:2200},{month:"Jan",budget:2500,spent:1200},{month:"Feb",budget:2500,spent:1600},{month:"Mar",budget:2500,spent:1100},{month:"Apr",budget:2500,spent:900},{month:"May",budget:2500,spent:1400},{month:"Jun",budget:2500,spent:1800},{month:"Jul",budget:2500,spent:1600},{month:"Aug",budget:2500,spent:2100},{month:"Sep",budget:2500,spent:400}],
  Arm:        [{month:"Oct",budget:1000,spent:700},{month:"Nov",budget:1000,spent:600},{month:"Dec",budget:1000,spent:900},{month:"Jan",budget:1000,spent:500},{month:"Feb",budget:1000,spent:650},{month:"Mar",budget:1000,spent:450},{month:"Apr",budget:1000,spent:380},{month:"May",budget:1000,spent:560},{month:"Jun",budget:1000,spent:720},{month:"Jul",budget:1000,spent:640},{month:"Aug",budget:1000,spent:840},{month:"Sep",budget:1000,spent:160}],
  Chassis:    [{month:"Oct",budget:917,spent:600},{month:"Nov",budget:917,spent:500},{month:"Dec",budget:917,spent:750},{month:"Jan",budget:917,spent:400},{month:"Feb",budget:917,spent:550},{month:"Mar",budget:917,spent:380},{month:"Apr",budget:917,spent:300},{month:"May",budget:917,spent:480},{month:"Jun",budget:917,spent:620},{month:"Jul",budget:917,spent:550},{month:"Aug",budget:917,spent:720},{month:"Sep",budget:917,spent:140}],
  Science:    [{month:"Oct",budget:583,spent:400},{month:"Nov",budget:583,spent:350},{month:"Dec",budget:583,spent:480},{month:"Jan",budget:583,spent:250},{month:"Feb",budget:583,spent:350},{month:"Mar",budget:583,spent:240},{month:"Apr",budget:583,spent:200},{month:"May",budget:583,spent:300},{month:"Jun",budget:583,spent:400},{month:"Jul",budget:583,spent:350},{month:"Aug",budget:583,spent:480},{month:"Sep",budget:583,spent:80}],
  PR:         [{month:"Oct",budget:2000,spent:1400},{month:"Nov",budget:2000,spent:1200},{month:"Dec",budget:2000,spent:1800},{month:"Jan",budget:2000,spent:800},{month:"Feb",budget:2000,spent:1100},{month:"Mar",budget:2000,spent:900},{month:"Apr",budget:2000,spent:600},{month:"May",budget:2000,spent:900},{month:"Jun",budget:2000,spent:1200},{month:"Jul",budget:2000,spent:800},{month:"Aug",budget:2000,spent:1000},{month:"Sep",budget:2000,spent:600}],
  Software:   [{month:"Oct",budget:1667,spent:900},{month:"Nov",budget:1667,spent:700},{month:"Dec",budget:1667,spent:1100},{month:"Jan",budget:1667,spent:500},{month:"Feb",budget:1667,spent:800},{month:"Mar",budget:1667,spent:600},{month:"Apr",budget:1667,spent:400},{month:"May",budget:1667,spent:600},{month:"Jun",budget:1667,spent:700},{month:"Jul",budget:1667,spent:800},{month:"Aug",budget:1667,spent:700},{month:"Sep",budget:1667,spent:200}],
  Finance:    [{month:"Oct",budget:833,spent:800},{month:"Nov",budget:833,spent:750},{month:"Dec",budget:833,spent:900},{month:"Jan",budget:833,spent:600},{month:"Feb",budget:833,spent:700},{month:"Mar",budget:833,spent:650},{month:"Apr",budget:833,spent:700},{month:"May",budget:833,spent:900},{month:"Jun",budget:833,spent:850},{month:"Jul",budget:833,spent:950},{month:"Aug",budget:833,spent:1000},{month:"Sep",budget:833,spent:400}],
  Board:      [{month:"Oct",budget:833,spent:300},{month:"Nov",budget:833,spent:250},{month:"Dec",budget:833,spent:400},{month:"Jan",budget:833,spent:150},{month:"Feb",budget:833,spent:200},{month:"Mar",budget:833,spent:180},{month:"Apr",budget:833,spent:100},{month:"May",budget:833,spent:200},{month:"Jun",budget:833,spent:300},{month:"Jul",budget:833,spent:250},{month:"Aug",budget:833,spent:200},{month:"Sep",budget:833,spent:150}],
  Design:     [{month:"Oct",budget:500,spent:350},{month:"Nov",budget:500,spent:280},{month:"Dec",budget:500,spent:420},{month:"Jan",budget:500,spent:180},{month:"Feb",budget:500,spent:240},{month:"Mar",budget:500,spent:200},{month:"Apr",budget:500,spent:200},{month:"May",budget:500,spent:100},{month:"Jun",budget:500,spent:450},{month:"Jul",budget:500,spent:300},{month:"Aug",budget:500,spent:800},{month:"Sep",budget:500,spent:50}],
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ORDERS: Order[] = [
  {id:"ord1",date:"2026-09-01",startTime:"09:00",endTime:"09:30",title:"Mechanical Parts Order",
    items:[{name:"Steel bolts M8 (100x)",qty:2,price:12},{name:"Bearing 6204",qty:5,price:8},{name:"Welding wire 1kg",qty:1,price:24}]},
  {id:"ord2",date:"2026-09-04",startTime:"11:30",endTime:"12:00",title:"PR Materials Order",
    items:[{name:"Flyers A5 (500x)",qty:1,price:45},{name:"Roll-up banner 200cm",qty:2,price:85}]},
  {id:"ord3",date:"2026-09-05",startTime:"15:00",endTime:"15:30",title:"Software Tools Order",
    items:[{name:"JetBrains license",qty:3,price:50},{name:"GitHub Pro seats",qty:5,price:4}]},
];

// ─── Budget ───────────────────────────────────────────────────────────────────
export const BUDGET: BudgetData = {
  total: 50000, spent: 24600,
  departments: [
    {name:"Mechanical",budget:15000,spent:8200,color:DEPT_COLORS.Mechanical,
      subs:[
        {name:"Arm",budget:6000,spent:3400,subs:[{name:"Electronics",budget:2500,spent:1400},{name:"Hardware",budget:2000,spent:1200},{name:"Software",budget:1500,spent:800}]},
        {name:"Chassis",budget:5500,spent:3000,subs:[{name:"Electronics",budget:1500,spent:900},{name:"Hardware",budget:3000,spent:1700},{name:"Software",budget:1000,spent:400}]},
        {name:"Science",budget:3500,spent:1800,subs:[{name:"Electronics",budget:1200,spent:700},{name:"Hardware",budget:1300,spent:600},{name:"Software",budget:1000,spent:500}]},
      ]},
    {name:"PR",budget:12000,spent:5100,color:DEPT_COLORS.PR,
      subs:[
        {name:"Print",budget:5000,spent:2400,subs:[{name:"Flyers",budget:2500,spent:1200},{name:"Banners",budget:1500,spent:800},{name:"Posters",budget:1000,spent:400}]},
        {name:"Digital",budget:4000,spent:1800,subs:[{name:"Ads",budget:2000,spent:1000},{name:"Social",budget:1200,spent:500},{name:"Web",budget:800,spent:300}]},
        {name:"Events",budget:3000,spent:900,subs:[{name:"Venue",budget:1500,spent:500},{name:"Catering",budget:1000,spent:300},{name:"Setup",budget:500,spent:100}]},
      ]},
    {name:"Software",budget:10000,spent:3400,color:DEPT_COLORS.Software,
      subs:[
        {name:"Licenses",budget:5000,spent:1800,subs:[{name:"IDEs",budget:2000,spent:800},{name:"SaaS tools",budget:2000,spent:700},{name:"CI/CD",budget:1000,spent:300}]},
        {name:"Hosting",budget:3000,spent:1100,subs:[{name:"Cloud",budget:2000,spent:800},{name:"Domains",budget:1000,spent:300}]},
        {name:"Tools",budget:2000,spent:500,subs:[{name:"Hardware",budget:1200,spent:350},{name:"Misc",budget:800,spent:150}]},
      ]},
    {name:"Finance",budget:5000,spent:4800,color:DEPT_COLORS.Finance,
      subs:[
        {name:"Audit",budget:2500,spent:2500,subs:[{name:"External",budget:1800,spent:1800},{name:"Internal",budget:700,spent:700}]},
        {name:"Banking",budget:1500,spent:1400,subs:[{name:"Fees",budget:800,spent:750},{name:"Transfers",budget:700,spent:650}]},
        {name:"Insurance",budget:1000,spent:900,subs:[{name:"Liability",budget:600,spent:550},{name:"Equipment",budget:400,spent:350}]},
      ]},
    {name:"Board",budget:5000,spent:1200,color:DEPT_COLORS.Board,
      subs:[
        {name:"Travel",budget:2000,spent:600,subs:[{name:"Flights",budget:1200,spent:400},{name:"Accommodation",budget:800,spent:200}]},
        {name:"Events",budget:2000,spent:500,subs:[{name:"Kickoff",budget:1200,spent:350},{name:"End-of-year",budget:800,spent:150}]},
        {name:"Misc",budget:1000,spent:100,subs:[{name:"Office",budget:600,spent:80},{name:"Gifts",budget:400,spent:20}]},
      ]},
    {name:"Design",budget:3000,spent:1900,color:DEPT_COLORS.Design,
      subs:[
        {name:"Software",budget:1500,spent:900,subs:[{name:"Figma",budget:800,spent:500},{name:"Adobe",budget:700,spent:400}]},
        {name:"Assets",budget:1000,spent:700,subs:[{name:"Photography",budget:600,spent:450},{name:"Illustration",budget:400,spent:250}]},
        {name:"Print",budget:500,spent:300,subs:[{name:"Proofing",budget:300,spent:200},{name:"Production",budget:200,spent:100}]},
      ]},
  ],
};

// ─── Roadmap ──────────────────────────────────────────────────────────────────
export const INIT_ROADMAP: RoadmapItem[] = [
  {id:"rm1",title:"Q4 Campaign",department:"PR",startDate:"2026-09-01",endDate:"2026-09-14",color:DEPT_COLORS.PR,progress:60},
  {id:"rm2",title:"Social Strategy",department:"PR",startDate:"2026-09-16",endDate:"2026-09-30",color:DEPT_COLORS.PR,progress:10},
  {id:"rm3",title:"Engine Redesign",department:"Mechanical",startDate:"2026-09-03",endDate:"2026-09-22",color:DEPT_COLORS.Mechanical,progress:30},
  {id:"rm4",title:"Prototype Testing",department:"Mechanical",startDate:"2026-09-20",endDate:"2026-09-30",color:DEPT_COLORS.Mechanical,progress:0},
  {id:"rm5",title:"Board Annual Report",department:"Board",startDate:"2026-09-15",endDate:"2026-09-30",color:DEPT_COLORS.Board,progress:5},
  {id:"rm6",title:"v2 Release",department:"Software",startDate:"2026-09-01",endDate:"2026-09-25",color:DEPT_COLORS.Software,progress:40},
  {id:"rm7",title:"Bug Sprint",department:"Software",startDate:"2026-09-22",endDate:"2026-09-30",color:DEPT_COLORS.Software,progress:0},
  {id:"rm8",title:"Q4 Budget Review",department:"Finance",startDate:"2026-09-10",endDate:"2026-09-13",color:DEPT_COLORS.Finance,progress:80},
  {id:"rm9",title:"Annual Audit Prep",department:"Finance",startDate:"2026-09-20",endDate:"2026-09-30",color:DEPT_COLORS.Finance,progress:0},
  {id:"rm10",title:"Portal Redesign",department:"Design",startDate:"2026-09-04",endDate:"2026-09-18",color:DEPT_COLORS.Design,progress:45},
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATIONS: AppNotification[] = [
  {id:"notif1",type:"order",title:"Order delivered",body:"Mechanical Parts Order has arrived at the workshop",time:"2h ago",read:false},
  {id:"notif2",type:"budget",title:"Budget alert",body:"Finance dept is at 96% of allocated budget",time:"5h ago",read:false},
  {id:"notif3",type:"member",title:"New member joined",body:"Sophie Janssen was added to the PR team",time:"1d ago",read:true},
  {id:"notif4",type:"event",title:"Board Review tomorrow",body:"Reminder: Board Review at 11:00 in the Boardroom",time:"1d ago",read:true},
  {id:"notif5",type:"todo",title:"Task overdue",body:"Submit Q3 order forms was due 2 days ago",time:"2d ago",read:true},
];
