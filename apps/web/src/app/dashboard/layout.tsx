import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of platform activity, your cases, and quick actions.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
