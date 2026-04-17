import type { LucideIcon } from "lucide-react";
import {
  Code2,
  FileText,
  Lightbulb,
  MessageSquareText,
  Presentation,
} from "lucide-react";

export const C = {
  bg: "#FCF7F9",
  elevated: "#FFFDFD",
  card: "rgba(255,255,255,0.76)",
  cardStrong: "rgba(255,255,255,0.92)",
  border: "rgba(214,188,197,0.62)",
  borderStrong: "rgba(196,163,175,0.82)",
  text: "#43373D",
  textSec: "#88767F",
  textSoft: "#B8A5AE",
  pink: "#D89CAF",
  pinkStrong: "#C88399",
  blush: "#F4DBE3",
  blushStrong: "#ECC7D3",
  accent: "#F8EDF1",
  success: "#92B8AD",
  warning: "#D4A980",
  danger: "#D48F9C",
};

export interface WorkspaceStep {
  key: string;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  path: string;
}

export const WORKSPACE_STEPS: WorkspaceStep[] = [
  { key: "topic", label: "立项", shortcut: "I", icon: Lightbulb, path: "/workspace/topic" },
  { key: "bp", label: "BP", shortcut: "B", icon: FileText, path: "/workspace/bp" },
  { key: "prototype", label: "原型", shortcut: "P", icon: Code2, path: "/workspace/prototype" },
  { key: "review", label: "评审", shortcut: "R", icon: MessageSquareText, path: "/workspace/review" },
  { key: "ppt", label: "PPT", shortcut: "S", icon: Presentation, path: "/workspace/ppt" },
];

export const SAMPLE_PROJECTS = [
  {
    id: 1,
    name: "高校申赛智策官",
    track: "教育数字化方向",
    competition: "互联网+",
    progress: { topic: 100, bp: 75, prototype: 45, review: 20, ppt: 0 },
    status: "撰写 BP",
    updated: "28 分钟前",
  },
  {
    id: 2,
    name: "校园安全情境学习平台",
    track: "产业命题赛道",
    competition: "挑战杯",
    progress: { topic: 100, bp: 100, prototype: 88, review: 56, ppt: 24 },
    status: "评审阶段",
    updated: "昨天",
  },
  {
    id: 3,
    name: "县域文旅导览设计云",
    track: "乡村振兴方向",
    competition: "大创",
    progress: { topic: 100, bp: 40, prototype: 10, review: 0, ppt: 0 },
    status: "进行中",
    updated: "3 天前",
  },
];
