import type { Activity, Expression } from "../src/index.js";

export interface TaskStep {
  activity: Activity;
  task: string;
  tool: string;
}

export const TASK_STEPS: TaskStep[] = [
  { activity: "reading", task: "Read 14 files in /billing", tool: "Repo" },
  { activity: "thinking", task: "Plan the migration", tool: "Notes" },
  { activity: "coding", task: "Write the new invoice module", tool: "Editor" },
  { activity: "reviewing", task: "Review its own diff", tool: "GitHub" },
  { activity: "busy", task: "Wait for CI to pass", tool: "CI" },
  { activity: "busy", task: "Open pull request #482", tool: "GitHub" },
];

export interface Worker {
  activity: Activity;
  app: string;
  expression?: Expression;
  name: string;
  task: string;
}

export const WORKERS: Worker[] = [
  { name: "Inbox", app: "Mail", activity: "reading", task: "Triaging 212 new emails" },
  { name: "Ledger", app: "Sheets", activity: "busy", task: "Reconciling March expenses" },
  {
    name: "Patch",
    app: "GitHub",
    activity: "coding",
    expression: "happy",
    task: "Fixing a flaky checkout test",
  },
  { name: "Scout", app: "Web", activity: "thinking", task: "Comparing nine vendors" },
  { name: "Herald", app: "Docs", activity: "listening", task: "Taking notes in the standup" },
  { name: "Gate", app: "Billing", activity: "asking", task: "Needs your OK: send 38 invoices" },
];

export interface Quote {
  activity: Activity;
  expression?: Expression;
  handle: string;
  text: string;
}

export const QUOTES: Quote[] = [
  {
    handle: "@lint-bot",
    activity: "reviewing",
    text: "I narrow my eyes to a slit and check every diff twice.",
  },
  {
    handle: "@voice-desk",
    activity: "listening",
    text: "I turn into bouncing sound bars. Everyone knows I'm listening.",
  },
  {
    handle: "@queue-keeper",
    activity: "busy",
    text: "I fold into three dots. Nobody asks if I've crashed anymore.",
  },
  {
    handle: "@hotfix",
    activity: "error",
    text: "One sweep, then x x. My stack traces feel seen.",
  },
  {
    handle: "@curious-one",
    activity: "idle",
    expression: "happy",
    text: "I follow your pointer around the page. Go on, try it.",
  },
  {
    handle: "@doc-crawler",
    activity: "reading",
    text: "Three hops right, one line down. I read like a person now.",
  },
  {
    handle: "@prompt-pal",
    activity: "coding",
    text: "My eyes turn into a >_ prompt. The cursor even blinks.",
  },
  {
    handle: "@night-shift",
    activity: "sleeping",
    text: "Droop, catch myself, droop again. Wake me when CI is green.",
  },
];
