"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Download Helpers ───────────────────────────────────────────────────────────

const BOM = "﻿";

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON(stats: any) {
  const content = JSON.stringify(stats, null, 2);
  downloadBlob(content, "statistics_summary.json", "application/json;charset=utf-8");
}

function exportAreasCSV(stats: any) {
  const rows = ["المنطقة الموحدة,عدد السجلات,النسبة"];
  const total = stats.total_records || 1;
  for (const a of stats.area_distribution || []) {
    const pct = Math.round((a.count / total) * 100);
    rows.push(`${a.area_name},${a.count},${pct}%`);
  }
  downloadBlob(BOM + rows.join("\n"), "area_distribution.csv", "text/csv;charset=utf-8");
}

function exportReviewCSV(stats: any) {
  const rows = ["رقم الاستمارة,رب الأسرة,العنوان الأصلي,التصنيف,سبب التصنيف"];
  for (const r of stats.review_records || []) {
    const cols = [
      r.form_number          || "",
      r.head_name            || "",
      r.raw_address          || "",
      r.address_classification || "",
      r.classification_reason  || "",
    ].map((c: string) => `"${String(c).replace(/"/g, '""')}"`);
    rows.push(cols.join(","));
  }
  downloadBlob(BOM + rows.join("\n"), "review_records.csv", "text/csv;charset=utf-8");
}

function exportTXT(stats: any) {
  const cs = stats.classification_summary;
  const ss = stats.status_summary;
  const areas: any[] = stats.area_distribution || [];
  const review: any[] = stats.review_records || [];
  const total = stats.total_records;
  const date = new Date().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric"
  });

  const notes: string[] = [];
  if (cs.empty > 0)        notes.push(`- توجد ${cs.empty} سجل(ات) عناوينها فارغة وتحتاج إلى استكمال.`);
  if (cs.non_area > 0)     notes.push(`- توجد ${cs.non_area} سجل(ات) تحتوي ملاحظات إدارية وليست مناطق.`);
  if (ss.needs_review > 0) notes.push(`- توجد ${ss.needs_review} سجل(ات) تحتاج مراجعة إدارية قبل الاعتماد.`);
  if (areas.length > 0)    notes.push(`- تم تحديد ${areas.length} منطقة موحدة قابلة للاعتماد.`);

  const lines = [
    "========================================",
    "  تقرير تدقيق وتحليل ملف البيانات",
    "========================================",
    `تاريخ التقرير: ${date}`,
    "",
    "1. معلومات عامة",
    "----------------",
    `   إجمالي السجلات : ${total}`,
    "",
    "2. ملخص التصنيف",
    "----------------",
    `   مناطق صحيحة   : ${cs.area}`,
    `   قيم فارغة     : ${cs.empty}`,
    `   ليست مناطق   : ${cs.non_area}`,
    `   تحتاج مراجعة : ${cs.needs_review}`,
    "",
    "3. ملخص الحالات",
    "----------------",
    `   مكتمل         : ${ss.complete}`,
    `   غير مكتمل     : ${ss.incomplete}`,
    `   يحتاج مراجعة : ${ss.needs_review}`,
    "",
    "4. توزيع المناطق الموحدة",
    "------------------------",
    ...areas.map((a: any, i: number) => `   ${i + 1}. ${a.area_name} : ${a.count} سجل`),
    areas.length === 0 ? "   لا توجد مناطق مصنفة." : "",
    "",
    "5. السجلات التي تحتاج مراجعة",
    "-----------------------------",
    review.length === 0
      ? "   لا توجد سجلات تحتاج مراجعة."
      : review.map((r: any) =>
          `   - الاستمارة ${r.form_number || "—"} | ${r.head_name || "—"} | ${r.raw_address || "—"} | ${r.classification_reason || "—"}`
        ).join("\n"),
    "",
    "6. الملاحظات الإدارية",
    "---------------------",
    ...(notes.length > 0 ? notes : ["   لا توجد ملاحظات."]),
    "",
    "========================================",
    "  سيتم دعم PDF و Excel الرسمي في Export Phase v2.",
    "========================================",
  ];

  downloadBlob(BOM + lines.join("\n"), "admin_report.txt", "text/plain;charset=utf-8");
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("last_statistics");
      if (raw) setStats(JSON.parse(raw));
    } catch {}
  }, []);

  // ── Empty State ──
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">التصدير</h2>
          <p className="text-gray-400 text-sm">تنزيل بيانات التصنيف والتقارير</p>
        </div>
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="text-7xl mb-5 select-none">📤</div>
          <p className="text-gray-600 text-lg font-semibold mb-2">
            لا توجد بيانات جاهزة للتصدير.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            الرجاء رفع ملف وتطبيق التصنيف والإحصائيات أولاً.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/mapping"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md text-sm">
              العودة إلى التصنيف
            </Link>
            <Link href="/reports"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-sm">
              العودة إلى التقارير
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Data ──
  const cs = stats.classification_summary;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">التصدير</h2>
          <p className="text-gray-400 text-sm">تنزيل بيانات التصنيف والتقارير</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports"
            className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-semibold">
            التقارير
          </Link>
          <Link href="/mapping"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
            التصنيف
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي السجلات", value: stats.total_records, cls: "border-blue-100 bg-blue-50 text-blue-700" },
          { label: "مناطق صحيحة",   value: cs.area,             cls: "border-green-100 bg-green-50 text-green-700" },
          { label: "غير مذكور",     value: cs.empty,            cls: "border-gray-200 bg-gray-50 text-gray-600" },
          { label: "ليست مناطق",   value: cs.non_area,         cls: "border-red-100 bg-red-50 text-red-600" },
          { label: "تحتاج مراجعة", value: cs.needs_review,     cls: "border-yellow-100 bg-yellow-50 text-yellow-700" },
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border text-center ${c.cls}`}>
            <div className="text-xs font-semibold mb-1 opacity-80">{c.label}</div>
            <div className="text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 bg-gray-50 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">خيارات التصدير</h3>
          <p className="text-xs text-gray-400 mt-1">جميع الملفات تدعم اللغة العربية بشكل صحيح</p>
        </div>

        <div className="p-6 space-y-3">

          <ExportRow
            icon="📊"
            label="ملخص الإحصائيات الكامل"
            desc="كل بيانات التصنيف والإحصائيات"
            badge="JSON"
            badgeCls="bg-gray-800 text-white"
            onClick={() => exportJSON(stats)}
          />

          <ExportRow
            icon="🗺️"
            label="توزيع المناطق الموحدة"
            desc={`${(stats.area_distribution || []).length} منطقة مع الأعداد والنسب`}
            badge="CSV"
            badgeCls="bg-green-600 text-white"
            onClick={() => exportAreasCSV(stats)}
          />

          <ExportRow
            icon="⚠️"
            label="سجلات تحتاج مراجعة"
            desc={`${(stats.review_records || []).length} سجل مع تفاصيل التصنيف`}
            badge="CSV"
            badgeCls="bg-yellow-500 text-white"
            onClick={() => exportReviewCSV(stats)}
            disabled={(stats.review_records || []).length === 0}
          />

          <ExportRow
            icon="📄"
            label="تقرير إداري نصي"
            desc="ملف نص كامل قابل للطباعة والأرشفة"
            badge="TXT"
            badgeCls="bg-indigo-600 text-white"
            onClick={() => exportTXT(stats)}
          />

          <div className="border-t border-gray-100 pt-3 mt-1">
            <ExportRow
              icon="🖨️"
              label="فتح التقرير الإداري"
              desc="عرض التقرير الكامل ثم طباعته من المتصفح"
              badge="فتح"
              badgeCls="bg-blue-600 text-white"
              onClick={() => router.push("/reports")}
            />
          </div>
        </div>
      </div>

      {/* v2 Note */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-center">
        <p className="text-sm text-gray-500">
          سيتم دعم{" "}
          <span className="font-semibold text-gray-700">PDF</span> و{" "}
          <span className="font-semibold text-gray-700">Excel</span> الرسمي في Export Phase v2.
        </p>
      </div>

    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────

function ExportRow({
  icon, label, desc, badge, badgeCls, onClick, disabled = false,
}: {
  icon: string;
  label: string;
  desc: string;
  badge: string;
  badgeCls: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-right ${
        disabled
          ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
          : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer"
      }`}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 text-sm">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${badgeCls}`}>
        {badge}
      </span>
    </button>
  );
}
