"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Donut Chart (CSS conic-gradient) ──────────────────────────────────────────

interface Segment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ segments, title }: { segments: Segment[]; title: string }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const nonZero = segments.filter(s => s.value > 0);

  let gradientStyle = "#e5e7eb";
  if (total > 0) {
    let offset = 0;
    const parts = nonZero.map(s => {
      const pct = (s.value / total) * 100;
      const part = `${s.color} ${offset.toFixed(2)}% ${(offset + pct).toFixed(2)}%`;
      offset += pct;
      return part;
    });
    gradientStyle = `conic-gradient(${parts.join(", ")})`;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-5">
      <h3 className="font-bold text-gray-700 text-base self-start">{title}</h3>

      {/* Donut */}
      <div className="relative" style={{ width: 168, height: 168 }}>
        <div
          className="w-full h-full rounded-full"
          style={{ background: total > 0 ? gradientStyle : "#e5e7eb" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-white rounded-full flex flex-col items-center justify-center shadow-sm"
            style={{ width: 88, height: 88 }}
          >
            <span className="text-2xl font-bold text-gray-800 leading-none">{total}</span>
            <span className="text-xs text-gray-400 mt-0.5">سجل</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-gray-600 flex-1">{s.label}</span>
            <span className="text-sm font-bold text-gray-800 w-6 text-left">{s.value}</span>
            {total > 0 && (
              <span className="text-xs text-gray-400 w-9 text-left">
                {Math.round((s.value / total) * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ───────────────────────────────────────────────────────

interface BarItem {
  label: string;
  count: number;
}

function BarChart({ items, title, color = "#3b82f6" }: { items: BarItem[]; title: string; color?: string }) {
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-700 text-base mb-5">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">لا توجد مناطق مصنفة</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-28 shrink-0 text-right">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end px-3"
                  style={{
                    width: `${Math.max((item.count / max) * 100, 10)}%`,
                    backgroundColor: color,
                    transition: "width 0.6s ease",
                  }}
                >
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ChartsPage() {
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("last_statistics");
      if (raw) setStats(JSON.parse(raw));
    } catch {}
  }, []);

  // ── Empty state ──
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">الرسوم البيانية</h2>
          <p className="text-gray-400 text-sm">عرض بصري لنتائج التصنيف والإحصائيات</p>
        </div>
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="text-7xl mb-5 select-none">📊</div>
          <p className="text-gray-600 text-lg font-semibold mb-2">
            لا توجد بيانات مصنفة بعد.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            الرجاء رفع ملف وتطبيق التصنيف والإحصائيات أولاً.
          </p>
          <Link
            href="/mapping"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
          >
            الانتقال لصفحة الربط والتصنيف
          </Link>
        </div>
      </div>
    );
  }

  const cs = stats.classification_summary;
  const ss = stats.status_summary;

  const classificationSegments: Segment[] = [
    { label: "مناطق صحيحة", value: cs.area,         color: "#22c55e" },
    { label: "غير مذكور",   value: cs.empty,        color: "#9ca3af" },
    { label: "ليست مناطق", value: cs.non_area,      color: "#ef4444" },
    { label: "تحتاج مراجعة", value: cs.needs_review, color: "#f59e0b" },
  ];

  const statusSegments: Segment[] = [
    { label: "مكتمل",         value: ss.complete,     color: "#3b82f6" },
    { label: "غير مكتمل",    value: ss.incomplete,   color: "#d1d5db" },
    { label: "يحتاج مراجعة", value: ss.needs_review, color: "#f97316" },
  ];

  const areaItems: BarItem[] = (stats.area_distribution || []).map((r: any) => ({
    label: r.area_name,
    count: r.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">الرسوم البيانية</h2>
          <p className="text-gray-500 text-sm">
            تحليل بصري لـ <span className="font-bold text-gray-700">{stats.total_records}</span> سجل مصنف
          </p>
        </div>
        <Link href="/mapping" className="text-sm text-blue-600 hover:underline">
          ← العودة للتصنيف
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "إجمالي السجلات", value: stats.total_records, border: "border-blue-100",   text: "text-blue-700" },
          { label: "مناطق صحيحة",   value: cs.area,             border: "border-green-100",  text: "text-green-700" },
          { label: "غير مذكور",     value: cs.empty,            border: "border-gray-200",   text: "text-gray-700" },
          { label: "ليست مناطق",   value: cs.non_area,         border: "border-red-100",    text: "text-red-600" },
          { label: "تحتاج مراجعة", value: cs.needs_review,     border: "border-yellow-100", text: "text-yellow-700" },
        ].map((card, i) => (
          <div key={i} className={`bg-white p-4 rounded-xl border ${card.border} shadow-sm text-center`}>
            <div className={`text-xs font-semibold mb-1 ${card.text}`}>{card.label}</div>
            <div className={`text-3xl font-bold ${card.text}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChart segments={classificationSegments} title="توزيع التصنيفات" />
        <DonutChart segments={statusSegments}         title="توزيع حالات السجلات" />
      </div>

      {/* Area Bar Chart */}
      <BarChart
        items={areaItems}
        title="توزيع السجلات حسب المنطقة الموحدة"
        color="#6366f1"
      />
    </div>
  );
}
