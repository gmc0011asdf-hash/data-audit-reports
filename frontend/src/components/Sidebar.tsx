"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "التدفق الأساسي",
    items: [
      { href: "/",        label: "الرئيسية",          icon: "⊞" },
      { href: "/upload",  label: "رفع الملف",          icon: "⇑" },
      { href: "/preview", label: "معاينة البيانات",    icon: "◉" },
      { href: "/mapping", label: "تحديد الأعمدة",     icon: "⇄" },
    ],
  },
  {
    label: "التحليل والتقارير",
    items: [
      { href: "/filters", label: "الفلاتر / السجلات",  icon: "▤" },
      { href: "/stats",   label: "الإحصائيات",         icon: "∑" },
      { href: "/charts",  label: "الرسوم البيانية",    icon: "◈" },
      { href: "/reports", label: "التقارير الرسمية",   icon: "⊟" },
      { href: "/export",  label: "التصدير",            icon: "↗" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-l border-slate-100 flex flex-col z-10 shrink-0 print:hidden">
      {/* Brand */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0">
            ت
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-snug">نظام تدقيق وتحليل</h1>
            <p className="text-xs text-slate-400 leading-none mt-0.5">إعداد التقارير الإدارية</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span className={`w-5 text-center text-base shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">Export Phase v1</p>
      </div>
    </aside>
  );
}
