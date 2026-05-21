"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ReportsPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [reportDate, setReportDate] = useState<string>("");

  const loadStats = () => {
    try {
      const raw = localStorage.getItem("last_statistics");
      if (raw) {
        setStats(JSON.parse(raw));
        setReportDate(
          new Date().toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      } else {
        setStats(null);
      }
    } catch {}
  };

  useEffect(() => {
    loadStats();
  }, []);

  // ── Empty State ──────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-800 mb-1">التقارير الإدارية</h2>
          <p className="text-gray-400 text-sm">تقرير مبني على آخر بيانات مصنفة</p>
        </div>
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="text-7xl mb-5 select-none">📋</div>
          <p className="text-gray-600 text-lg font-semibold mb-2">
            لا توجد بيانات تقرير بعد.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            الرجاء رفع ملف وتطبيق التصنيف والإحصائيات أولاً.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/mapping"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md text-sm"
            >
              العودة إلى التصنيف
            </Link>
            <Link
              href="/charts"
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-md text-sm"
            >
              العودة إلى الرسوم البيانية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Data ────────────────────────────────────────────────────────────────────
  const cs = stats.classification_summary;
  const ss = stats.status_summary;
  const areas: any[] = stats.area_distribution || [];
  const reviewRecords: any[] = stats.review_records || [];

  // Auto admin notes
  const adminNotes: string[] = [];
  if (cs.empty > 0)
    adminNotes.push(`توجد ${cs.empty} سجل(ات) عناوينها فارغة وتحتاج إلى استكمال.`);
  if (cs.non_area > 0)
    adminNotes.push(`توجد ${cs.non_area} سجل(ات) تحتوي ملاحظات إدارية وليست مناطق سكنية.`);
  if (ss.needs_review > 0)
    adminNotes.push(`توجد ${ss.needs_review} سجل(ات) تحتاج مراجعة إدارية قبل الاعتماد.`);
  if (areas.length > 0)
    adminNotes.push(
      `تم تحديد ${areas.length} منطقة موحدة قابلة للاعتماد في التقارير القادمة.`
    );

  const pct = (n: number) =>
    stats.total_records > 0 ? Math.round((n / stats.total_records) * 100) : 0;

  // ── Report ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Page Header */}
      <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">التقارير الإدارية</h2>
          <p className="text-gray-400 text-sm">تقرير مبني على آخر بيانات مصنفة</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={loadStats}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-slate-50 transition text-gray-600"
          >
            تحديث التقرير
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            طباعة التقرير
          </button>
          <Link
            href="/export"
            className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-semibold"
          >
            التصدير
          </Link>
          <Link
            href="/charts"
            className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-semibold"
          >
            الرسوم البيانية
          </Link>
          <Link
            href="/mapping"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            التصنيف
          </Link>
        </div>
      </div>

      {/* Report Document */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Report Title Banner */}
        <div className="bg-gradient-to-l from-blue-800 to-blue-600 text-white p-8 text-center">
          <p className="text-blue-200 text-xs mb-2 tracking-widest uppercase">تقرير رسمي</p>
          <h1 className="text-2xl font-bold mb-4">تقرير تدقيق وتحليل ملف البيانات</h1>
          <div className="flex justify-center gap-8 text-sm text-blue-100 flex-wrap">
            <span>📅 {reportDate}</span>
            <span>📊 إجمالي السجلات: <strong className="text-white">{stats.total_records}</strong></span>
          </div>
        </div>

        <div className="p-8 space-y-10">

          {/* ── 1. General Info ── */}
          <section>
            <SectionTitle num="1" title="معلومات عامة" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "إجمالي السجلات", value: stats.total_records, cls: "border-blue-100 bg-blue-50 text-blue-700" },
                { label: "مناطق صحيحة",   value: cs.area,             cls: "border-green-100 bg-green-50 text-green-700" },
                { label: "قيم فارغة",      value: cs.empty,            cls: "border-gray-200 bg-slate-50 text-gray-600" },
                { label: "ليست مناطق",    value: cs.non_area,         cls: "border-red-100 bg-red-50 text-red-600" },
                { label: "تحتاج مراجعة", value: cs.needs_review,     cls: "border-yellow-100 bg-yellow-50 text-yellow-700" },
              ].map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border text-center ${c.cls}`}>
                  <div className="text-xs font-semibold mb-1 opacity-80">{c.label}</div>
                  <div className="text-3xl font-bold">{c.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 2. Classification Summary ── */}
          <section>
            <SectionTitle num="2" title="ملخص التصنيف" />
            <ReportTable
              headers={["التصنيف", "عدد السجلات", "النسبة"]}
              rows={[
                [<Badge label="مناطق صحيحة — area"       cls="bg-green-100 text-green-800" />, cs.area,         `${pct(cs.area)}%`],
                [<Badge label="قيم فارغة — empty"         cls="bg-gray-100 text-slate-700" />,  cs.empty,        `${pct(cs.empty)}%`],
                [<Badge label="ليست مناطق — non_area"    cls="bg-red-100 text-red-700" />,    cs.non_area,     `${pct(cs.non_area)}%`],
                [<Badge label="تحتاج مراجعة — needs_review" cls="bg-yellow-100 text-yellow-700" />, cs.needs_review, `${pct(cs.needs_review)}%`],
              ]}
            />
          </section>

          {/* ── 3. Status Summary ── */}
          <section>
            <SectionTitle num="3" title="ملخص حالات السجلات" />
            <ReportTable
              headers={["الحالة", "عدد السجلات", "النسبة"]}
              rows={[
                [<Badge label="مكتمل — complete"           cls="bg-blue-100 text-blue-800" />,   ss.complete,     `${pct(ss.complete)}%`],
                [<Badge label="غير مكتمل — incomplete"     cls="bg-gray-100 text-slate-700" />,   ss.incomplete,   `${pct(ss.incomplete)}%`],
                [<Badge label="يحتاج مراجعة — needs_review" cls="bg-orange-100 text-orange-700" />, ss.needs_review, `${pct(ss.needs_review)}%`],
              ]}
            />
          </section>

          {/* ── 4. Area Distribution ── */}
          {areas.length > 0 && (
            <section>
              <SectionTitle num="4" title="توزيع المناطق الموحدة" />
              <ReportTable
                headers={["#", "المنطقة الموحدة", "عدد السجلات", "النسبة من الكل"]}
                rows={areas.map((a: any, i: number) => [
                  <span className="text-gray-400 text-xs">{i + 1}</span>,
                  <span className="font-semibold text-blue-700">{a.area_name}</span>,
                  a.count,
                  `${pct(a.count)}%`,
                ])}
              />
            </section>
          )}

          {/* ── 5. Review Records ── */}
          {reviewRecords.length > 0 && (
            <section>
              <SectionTitle
                num="5"
                title="السجلات التي تحتاج مراجعة"
                badge={`${reviewRecords.length} سجل`}
              />
              <ReportTable
                headers={["رقم الاستمارة", "رب الأسرة", "العنوان الأصلي", "سبب التصنيف"]}
                rows={reviewRecords.map((r: any) => [
                  r.form_number || "—",
                  r.head_name   || "—",
                  r.raw_address || "—",
                  <span className="text-xs text-gray-500">{r.classification_reason || "—"}</span>,
                ])}
                headerCls="bg-yellow-50"
              />
            </section>
          )}

          {/* ── 6. Admin Notes ── */}
          {adminNotes.length > 0 && (
            <section>
              <SectionTitle num="6" title="ملاحظات إدارية" />
              <ul className="space-y-2.5">
                {adminNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-blue-500 mt-0.5 shrink-0 text-base">●</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-gray-400">
              سيتم دعم تصدير هذا التقرير (PDF / Excel) في مرحلة لاحقة.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom Nav */}
      <div className="print:hidden flex justify-center gap-4 pb-6">
        <Link
          href="/mapping"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md text-sm"
        >
          العودة إلى التصنيف
        </Link>
        <Link
          href="/charts"
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-md text-sm"
        >
          العودة إلى الرسوم البيانية
        </Link>
      </div>
    </div>
  );
}

// ── Shared Sub-components ──────────────────────────────────────────────────────

function SectionTitle({ num, title, badge }: { num: string; title: string; badge?: string }) {
  return (
    <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
      <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center shrink-0">
        {num}
      </span>
      {title}
      {badge && (
        <span className="mr-1 text-xs font-normal text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
          {badge}
        </span>
      )}
    </h2>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{label}</span>
  );
}

function ReportTable({
  headers,
  rows,
  headerCls = "bg-slate-50",
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  headerCls?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className={`${headerCls} text-gray-600`}>
            {headers.map((h, i) => (
              <th key={i} className="p-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition">
              {row.map((cell, j) => (
                <td key={j} className="p-3 text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
