import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "نظام تدقيق وتحليل الملفات",
  description: "نظام محلي/ويب خفيف لتحليل ملفات بيانات متغيرة",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 text-slate-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-slate-50 p-8 print:p-0 print:overflow-visible">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
