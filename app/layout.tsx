import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata = {
  title: "NewsForge",
  description: "Autonomous AI content pipeline agent dashboard",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-white min-h-screen">
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-text">
          <Sidebar />
          <main className="flex-1 bg-[#0A0A0A] w-full md:w-auto overflow-x-hidden pt-16 md:pt-0 px-4 md:px-0 min-h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
