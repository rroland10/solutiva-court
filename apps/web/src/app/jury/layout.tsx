import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jury Pool",
  description: "Participate in jury voting and earn AVF rewards.",
};

export default function JuryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
