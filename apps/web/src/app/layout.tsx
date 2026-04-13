import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "TennisHub",
  description: "Tennis player rankings, live scores, and stories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
