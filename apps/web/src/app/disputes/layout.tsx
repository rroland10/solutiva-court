import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes",
  description: "Browse, file, and manage decentralized dispute resolution cases.",
};

export default function DisputesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
