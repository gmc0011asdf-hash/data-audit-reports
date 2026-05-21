import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "نظام تدقيق وتحليل الملفات",
  description: "نظام محلي/ويب خفيف لتحليل ملفات بيانات متغيرة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-md flex flex-col z-10 relative">
            <div className="p-6 border-b border-gray-100">
              <h1 className="text-xl font-bold text-blue-700 leading-tight">نظام تدقيق وتحليل الملفات</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link href="/" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">الرئيسية</Link>
              <Link href="/upload" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">رفع الملف</Link>
              <Link href="/preview" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">معاينة البيانات</Link>
              <Link href="/mapping" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">تحديد الأعمدة</Link>
              <Link href="/filters" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">الفلاتر</Link>
              <Link href="/stats" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">الإحصائيات</Link>
              <Link href="/charts" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">الرسوم البيانية</Link>
              <Link href="/reports" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">التقارير الرسمية</Link>
              <Link href="/export" className="block p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition">التصدير</Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
