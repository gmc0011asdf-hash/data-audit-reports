"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StatsPage() {
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("last_statistics");
      if (raw) setStats(JSON.parse(raw));
    } catch {}
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الإحصائيات</h2>
          <p className="text-slate-500 text-sm mt-1">ملخص إحصائي شامل لآخر بيانات مصنفة</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-6xl mb-5 select-none">∑</div>
          <p className="text-slate-600 text-lg font-semibold mb-2">لا توجد إحصائيات بعد.</p>
          <p className="text-slate-400 text-sm mb-8">قم بتطبيق التصنيف والإحصائيات أولاً.</p>
          <Link href="/mapping"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-sm">
            الانتقال إلى التصنيف
          </Link>
        </div>
      </div>
    );
  }

  const cs = stats.classification_summary;
  const ss = stats.status_summary;
  const areas: any[] = stats.area_distribution || [];
  const total = stats.total_records;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الإحصائيات</h2>
          <p className="text-slate-500 text-sm mt-1">
            ملخص شامل لـ <strong className="text-slate-700">{total}</strong> سجل مصنف
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/charts"
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold text-sm hover:bg-purple-200 transition">
            الرسوم البيانية
          </Link>
          <Link href="/reports"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
            التقارير
          </Link>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي السجلات", value: total,         pct: 100, cls: "border-slate-200  bg-white       text-slate-700"   },
          { label: "مناطق صحيحة",   value: cs.area,       pct: pct(cs.area),         cls: "border-emerald-100 bg-emerald-50  text-emerald-700" },
          { label: "قيم فارغة",      value: cs.empty,      pct: pct(cs.empty),        cls: "border-slate-200  bg-slate-50    text-slate-500"   },
          { label: "ليست مناطق",    value: cs.non_area,   pct: pct(cs.non_area),     cls: "border-red-100   bg-red-50       text-red-600"     },
          { label: "تحتاج مراجعة", value: cs.needs_review, pct: pct(cs.needs_review), cls: "border-amber-100 bg-amber-50    text-amber-700"   },
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border shadow-sm text-center ${c.cls}`}>
            <div className="text-xs font-semibold mb-1 opacity-70">{c.label}</div>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-xs opacity-60 mt-1">{c.pct}%</div>
          </div>
        ))}
      </div>

      {/* Classification + Status side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Classification */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">ملخص التصنيف</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "مناطق صحيحة",   value: cs.area,         bar: "bg-emerald-500" },
              { label: "قيم فارغة",      value: cs.empty,        bar: "bg-slate-300"   },
              { label: "ليست مناطق",    value: cs.non_area,     bar: "bg-red-400"     },
              { label: "تحتاج مراجعة", value: cs.needs_review, bar: "bg-amber-400"   },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-bold text-slate-800">{row.value} ({pct(row.value)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.bar} rounded-full transition-all`}
                    style={{ width: `${Math.max(pct(row.value), row.value > 0 ? 3 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">ملخص الحالات</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "مكتمل",         value: ss.complete,     bar: "bg-indigo-500" },
              { label: "غير مكتمل",    value: ss.incomplete,   bar: "bg-slate-300"  },
              { label: "يحتاج مراجعة", value: ss.needs_review, bar: "bg-orange-400" },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-bold text-slate-800">{row.value} ({pct(row.value)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.bar} rounded-full transition-all`}
                    style={{ width: `${Math.max(pct(row.value), row.value > 0 ? 3 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Distribution */}
      {areas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">توزيع المناطق الموحدة ({areas.length})</h3>
          </div>
          <div className="p-5 space-y-3">
            {areas.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-5 shrink-0 text-left">{i + 1}</span>
                <span className="text-sm font-semibold text-indigo-700 w-28 shrink-0">{a.area_name}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full flex items-center justify-end px-2"
                    style={{ width: `${Math.max((a.count / Math.max(...areas.map((x: any) => x.count))) * 100, 10)}%` }}>
                    <span className="text-xs text-white font-bold">{a.count}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 w-10 shrink-0">{pct(a.count)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex justify-center gap-4">
        <Link href="/charts"
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-md text-sm">
          عرض الرسوم البيانية
        </Link>
        <Link href="/reports"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-sm">
          فتح التقارير الرسمية
        </Link>
      </div>

    </div>
  );
}
