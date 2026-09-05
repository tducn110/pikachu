import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return <section className="dashboard-shell">{children}</section>;
}
