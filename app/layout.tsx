import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata = {
  title: "NewsForge",
  description: "Autonomous AI content pipeline agent dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text antialiased">
        <div className="flex min-h-screen bg-background text-text">
          <Sidebar />
          <main className="min-h-screen flex-1 overflow-y-auto md:pl-[240px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
