import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your account, jury membership, and case history.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
