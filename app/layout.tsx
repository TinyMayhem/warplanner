import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Last War Copper Planner",
  description: "Season 4 Copper War planning and intelligence tracking"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
