"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Donut Chart ────────────────────────────────────────────────────────────────

interface Segment { label: string; value: number; color: string; }

function DonutChart({ segments, title }: { segments: Segment[]; title: string }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const nonZero = segments.filter(s => s.value > 0);

  let gradient = "#e2e8f0";
  if (total > 0) {
    let offset = 0;
    const parts = nonZero.map(s => {
      const pct = (s.value / total) * 100;
      const part = `${s.color} ${offset.toFixed(2)}% ${(offset + pct).toFixed(2)}%`;
      offset += pct;
      return part;
    });
    gradient = `conic-gradient(${parts.join(", ")})`;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-5">
      <h3 className="font-bold text-slate-700 text-sm self-start">{title}</h3>
      <div className="relative" style={{ width: 168, height: 168 }}>
        <div className="w-full h-full rounded-full"
          style={{ background: total > 0 ? gradient : "#e2e8f0" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-full flex flex-col items-center justify-center shadow-sm"
            style={{ width: 88, height: 88 }}>
            <span className="text-2xl font-bold text-slate-800 leading-none">{total}</span>
            <span className="text-xs text-slate-400 mt-0.5">سجل</span>
          </div>
        </div>
      </div>
      <div className="w-full space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-slate-600 flex-1">{s.label}</span>
            <span className="text-sm font-bold text-slate-800 w-6 text-left">{s.value}</span>
            {total > 0 && (
              <span className="text-xs text-slate-400 w-9 text-left">
                {Math.round((s.value / total) * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────────

interface BarItem { label: string; count: number; }

function BarChart({ items, title, color = "#6366f1" }: { items: BarItem[]; title: string; color?: string }) {
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-700 text-sm mb-5">{title}</h3>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">لا توجد مناطق مصنفة</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-28 shrink-0 text-right">{item.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                <div className="h-full rounded-full flex items-center justify-end px-3"
                  style={{ width: `${Math.max((item.count / max) * 100, 10)}%`, backgroundColor: color, transition: "width 0.6s ease" }}>
                  <span className="text-xs text-white font-bold">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ChartsPage() {
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
          <h2 className="text-2xl font-bold text-slate-800">الرسوم البيانية</h2>
          <p className="text-slate-400 text-sm mt-1">عرض بصري لنتائج التصنيف والإحصائيات</p>
        </div>
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="text-7xl mb-5 select-none">📊</div>
          <p className="text-slate-600 text-lg font-semibold mb-2">لا توجد بيانات مصنفة بعد.</p>
          <p className="text-slate-400 text-sm mb-8">الرجاء رفع ملف وتطبيق التصنيف والإحصائيات أولاً.</p>
          <Link href="/mapping"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-sm">
            الانتقال لصفحة الربط والتصنيف
          </Link>
        </div>
      </div>
    );
  }

  const cs = stats.classification_summary;
  const ss = stats.status_summary;

  const classificationSegments: Segment[] = [
    { label: "مناطق صحيحة",   value: cs.area,         color: "#10b981" },
    { label: "غير مذكور",     value: cs.empty,        color: "#94a3b8" },
    { label: "ليست مناطق",   value: cs.non_area,     color: "#ef4444" },
    { label: "تحتاج مراجعة", value: cs.needs_review, color: "#f59e0b" },
  ];

  const statusSegments: Segment[] = [
    { label: "مكتمل",         value: ss.complete,     color: "#6366f1" },
    { label: "غير مكتمل",    value: ss.incomplete,   color: "#cbd5e1" },
    { label: "يحتاج مراجعة", value: ss.needs_review, color: "#f97316" },
  ];

  const areaItems: BarItem[] = (stats.area_distribution || []).map((r: any) => ({
    label: r.area_name, count: r.count,
  }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الرسوم البيانية</h2>
          <p className="text-slate-500 text-sm mt-1">
            تحليل بصري لـ <strong className="text-slate-700">{stats.total_records}</strong> سجل مصنف
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/stats"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">
            الإحصائيات
          </Link>
          <Link href="/mapping"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
            التصنيف
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي",        value: stats.total_records, cls: "border-slate-200  bg-white       text-slate-700"   },
          { label: "مناطق صحيحة", value: cs.area,             cls: "border-emerald-100 bg-emerald-50  text-emerald-700" },
          { label: "غير مذكور",   value: cs.empty,            cls: "border-slate-200  bg-slate-50    text-slate-500"   },
          { label: "ليست مناطق", value: cs.non_area,         cls: "border-red-100   bg-red-50       text-red-600"     },
          { label: "مراجعة",      value: cs.needs_review,     cls: "border-amber-100 bg-amber-50    text-amber-700"   },
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border shadow-sm text-center ${card.cls}`}>
            <div className={`text-xs font-semibold mb-1 opacity-70`}>{card.label}</div>
            <div className="text-3xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChart segments={classificationSegments} title="توزيع التصنيفات" />
        <DonutChart segments={statusSegments}         title="توزيع حالات السجلات" />
      </div>

      {/* Area Bar Chart */}
      <BarChart items={areaItems} title="توزيع السجلات حسب المنطقة الموحدة" color="#6366f1" />

    </div>
  );
}
