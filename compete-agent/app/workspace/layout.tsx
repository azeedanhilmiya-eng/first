import type { ReactNode } from "react";
import { WorkspaceShell } from "@/app/_components/WorkspaceShell";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
