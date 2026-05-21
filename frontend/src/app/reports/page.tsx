"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDatasets, getAnalyticsSummary, searchRecords } from "@/lib/api";

const CLS_LABELS: Record<string, string> = {
  area: "مناطق صحيحة — area",
  empty: "قيم فارغة — empty",
  non_area: "ليست مناطق — non_area",
  needs_review: "تحتاج مراجعة — needs_review",
};
const STATUS_LABELS: Record<string, string> = {
  complete: "مكتمل — complete",
  incomplete: "غير مكتمل — incomplete",
  needs_review: "يحتاج مراجعة — needs_review",
};

export default function ReportsPage() {
  const [datasets,     setDatasets]     = useState<any[]>([]);
  const [datasetId,    setDatasetId]    = useState<number | undefined>(undefined);
  const [analytics,    setAnalytics]    = useState<any | null>(null);
  const [reviewRecs,   setReviewRecs]   = useState<any[]>([]);
  const [reportDate,   setReportDate]   = useState("");
  const [loading,      setLoading]      = useState(true);
  const [dbError,      setDbError]      = useState<string | null>(null);

  // Filters
  const [searchVal,    setSearchVal]    = useState("");
  const [formNum,      setFormNum]      = useState("");
  const [headName,     setHeadName]     = useState("");
  const [areaFilter,   setAreaFilter]   = useState("");
  const [clsFilter,    setClsFilter]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const buildParams = useCallback(() => ({
    dataset_id:     datasetId,
    search:         searchVal.trim(),
    form_number:    formNum.trim(),
    head_name:      headName.trim(),
    area:           areaFilter.trim(),
    classification: clsFilter.trim(),
    status:         statusFilter.trim(),
  }), [datasetId, searchVal, formNum, headName, areaFilter, clsFilter, statusFilter]);

  const loadReport = useCallback(async (dsId: number | undefined,
    sv: string, fn: string, hn: string, ar: string, cl: string, st: string) => {
    setLoading(true);
    const p = { dataset_id: dsId, search: sv, form_number: fn, head_name: hn,
                area: ar, classification: cl, status: st };
    try {
      const [summary, recs] = await Promise.all([
        getAnalyticsSummary(p),
        searchRecords({ ...p, classification: cl || "needs_review",
                        status: st || "needs_review", page_size: 200 }),
      ]);
      setAnalytics(summary);
      // review records = those with needs_review status
      const reviewData = await searchRecords({ ...p, status: "needs_review", page_size: 200 });
      setReviewRecs(reviewData.records || []);
      setReportDate(new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }));
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDatasets()
      .then(res => {
        setDatasets(res.datasets || []);
        if (res.datasets?.length > 0) {
          const first = res.datasets[0].id;
          setDatasetId(first);
          loadReport(first, "", "", "", "", "", "");
        } else {
          setLoading(false);
        }
      })
      .catch(err => { setDbError(err.message); setLoading(false); });
  }, [loadReport]);

  const handleApply = () => {
    loadReport(datasetId, searchVal, formNum, headName, areaFilter, clsFilter, statusFilter);
  };

  const handleClear = () => {
    setSearchVal(""); setFormNum(""); setHeadName("");
    setAreaFilter(""); setClsFilter(""); setStatusFilter("");
    loadReport(datasetId, "", "", "", "", "", "");
  };

  const hasFilter = searchVal || formNum || headName || areaFilter || clsFilter || statusFilter;
  const activeFiltersText = [
    datasetId && datasets.find(d => d.id === datasetId)?.original_filename,
    searchVal && `بحث: "${searchVal}"`,
    formNum && `استمارة: ${formNum}`,
    headName && `رب الأسرة: ${headName}`,
    areaFilter && `منطقة: ${areaFilter}`,
    clsFilter && `تصنيف: ${clsFilter}`,
    statusFilter && `حالة: ${statusFilter}`,
  ].filter(Boolean);

  // ── DB Error ──
  if (dbError) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div><h2 className="text-2xl font-bold text-slate-800">التقارير الإدارية</h2></div>
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🗄️</div>
        <p className="text-amber-700 font-semibold mb-2">{dbError}</p>
        <div className="mt-4 text-xs font-mono bg-slate-50 rounded-xl p-4 max-w-lg mx-auto">
          python scripts/import_to_sql.py "مسار_الملف.txt"
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  const cs = analytics?.classification_summary ?? {};
  const ss = analytics?.status_summary ?? {};
  const areas: any[] = analytics?.area_distribution ?? [];
  const total = analytics?.total_records ?? 0;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const adminNotes: string[] = [];
  if (cs.empty > 0)        adminNotes.push(`توجد ${cs.empty} سجل(ات) عناوينها فارغة وتحتاج إلى استكمال.`);
  if (cs.non_area > 0)     adminNotes.push(`توجد ${cs.non_area} سجل(ات) تحتوي ملاحظات إدارية وليست مناطق سكنية.`);
  if (ss.needs_review > 0) adminNotes.push(`توجد ${ss.needs_review} سجل(ات) تحتاج مراجعة إدارية قبل الاعتماد.`);
  if (areas.length > 0)    adminNotes.push(`تم تحديد ${areas.length} منطقة موحدة قابلة للاعتماد.`);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Page Header */}
      <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">التقارير الإدارية</h2>
          <p className="text-slate-400 text-sm">تقرير حسب الفلاتر المحددة</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleApply}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold">
            تطبيق الفلاتر
          </button>
          {hasFilter && (
            <button onClick={handleClear}
              className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition">
              مسح
            </button>
          )}
          <button onClick={() => window.print()}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold">
            طباعة التقرير
          </button>
          <Link href="/filters"
            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-semibold">
            السجلات
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="print:hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">فلاتر التقرير</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {datasets.length > 1 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">مجموعة البيانات</label>
              <select value={datasetId ?? ""} onChange={e => setDatasetId(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {datasets.map((ds: any) => <option key={ds.id} value={ds.id}>{ds.original_filename}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">رقم الاستمارة</label>
            <input type="text" value={formNum} onChange={e => setFormNum(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleApply()} placeholder="ابحث برقم..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">رب الأسرة</label>
            <input type="text" value={headName} onChange={e => setHeadName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleApply()} placeholder="ابحث بالاسم..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">المنطقة</label>
            <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">الكل</option>
              {(analytics?.distinct_areas ?? []).map((a: string) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">التصنيف</label>
            <select value={clsFilter} onChange={e => setClsFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">الكل</option>
              <option value="area">منطقة</option>
              <option value="empty">فارغ</option>
              <option value="non_area">ليست منطقة</option>
              <option value="needs_review">تحتاج مراجعة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">حالة السجل</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">الكل</option>
              <option value="complete">مكتمل</option>
              <option value="incomplete">غير مكتمل</option>
              <option value="needs_review">يحتاج مراجعة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Document */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Banner */}
        <div className="bg-gradient-to-l from-indigo-900 to-indigo-600 text-white p-8 text-center">
          <p className="text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-2">تقرير رسمي</p>
          <h1 className="text-2xl font-bold mb-3">تقرير تدقيق وتحليل ملف البيانات</h1>
          <div className="flex justify-center gap-6 text-sm text-indigo-200 flex-wrap">
            <span>📅 {reportDate}</span>
            <span>📊 {total.toLocaleString()} سجل</span>
            {hasFilter && <span>🔍 حسب فلاتر محددة</span>}
          </div>
          {activeFiltersText.length > 0 && (
            <div className="mt-3 text-xs text-indigo-300">
              {activeFiltersText.join(" · ")}
            </div>
          )}
        </div>

        <div className="p-8 space-y-10">

          {/* 1 - Summary Cards */}
          <section>
            <SectionTitle num="1" title="معلومات عامة" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "إجمالي",        value: total,           cls: "border-slate-200 bg-white text-slate-700" },
                { label: "مناطق صحيحة",   value: cs.area ?? 0,   cls: "border-emerald-100 bg-emerald-50 text-emerald-700" },
                { label: "قيم فارغة",      value: cs.empty ?? 0,  cls: "border-slate-200 bg-slate-50 text-slate-500" },
                { label: "ليست مناطق",    value: cs.non_area ?? 0, cls: "border-red-100 bg-red-50 text-red-600" },
                { label: "تحتاج مراجعة", value: cs.needs_review ?? 0, cls: "border-amber-100 bg-amber-50 text-amber-700" },
              ].map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border text-center ${c.cls}`}>
                  <div className="text-xs font-semibold mb-1 opacity-70">{c.label}</div>
                  <div className="text-3xl font-bold">{c.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 2 - Classification */}
          <section>
            <SectionTitle num="2" title="ملخص التصنيف" />
            <ReportTable
              headers={["التصنيف", "عدد السجلات", "النسبة"]}
              rows={[
                [CLS_LABELS.area,         cs.area ?? 0,         `${pct(cs.area ?? 0)}%`],
                [CLS_LABELS.empty,        cs.empty ?? 0,        `${pct(cs.empty ?? 0)}%`],
                [CLS_LABELS.non_area,     cs.non_area ?? 0,     `${pct(cs.non_area ?? 0)}%`],
                [CLS_LABELS.needs_review, cs.needs_review ?? 0, `${pct(cs.needs_review ?? 0)}%`],
              ]}
            />
          </section>

          {/* 3 - Status */}
          <section>
            <SectionTitle num="3" title="ملخص حالات السجلات" />
            <ReportTable
              headers={["الحالة", "عدد السجلات", "النسبة"]}
              rows={[
                [STATUS_LABELS.complete,     ss.complete ?? 0,     `${pct(ss.complete ?? 0)}%`],
                [STATUS_LABELS.incomplete,   ss.incomplete ?? 0,   `${pct(ss.incomplete ?? 0)}%`],
                [STATUS_LABELS.needs_review, ss.needs_review ?? 0, `${pct(ss.needs_review ?? 0)}%`],
              ]}
            />
          </section>

          {/* 4 - Area distribution */}
          {areas.length > 0 && (
            <section>
              <SectionTitle num="4" title={`توزيع المناطق (${areas.length} منطقة)`} />
              <ReportTable
                headers={["#", "المنطقة الموحدة", "عدد السجلات", "النسبة"]}
                rows={areas.map((a: any, i: number) => [
                  i + 1, a.area_name, a.count.toLocaleString(), `${pct(a.count)}%`
                ])}
              />
            </section>
          )}

          {/* 5 - Review records */}
          {reviewRecs.length > 0 && (
            <section>
              <SectionTitle num="5" title="السجلات التي تحتاج مراجعة"
                badge={`${reviewRecs.length} سجل`} />
              <ReportTable
                headers={["رقم الاستمارة", "رب الأسرة", "العنوان الأصلي", "التصنيف", "سبب التصنيف"]}
                rows={reviewRecs.map((r: any) => [
                  r.form_number || "—", r.head_name || "—", r.raw_address || "—",
                  r.address_classification || "—", r.classification_reason || "—"
                ])}
                headerCls="bg-amber-50"
              />
            </section>
          )}

          {/* 6 - Admin notes */}
          {adminNotes.length > 0 && (
            <section>
              <SectionTitle num="6" title="ملاحظات إدارية" />
              <ul className="space-y-2">
                {adminNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-indigo-500 mt-0.5 shrink-0">●</span> {note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              سيتم دعم تصدير هذا التقرير (PDF / Excel) في Export Phase v2.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="print:hidden flex justify-center gap-4 pb-6">
        <Link href="/filters"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-sm">
          السجلات والبحث
        </Link>
        <Link href="/charts"
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-md text-sm">
          الرسوم البيانية
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ num, title, badge }: { num: string; title: string; badge?: string }) {
  return (
    <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center shrink-0">{num}</span>
      {title}
      {badge && (
        <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 mr-1">{badge}</span>
      )}
    </h2>
  );
}

function ReportTable({ headers, rows, headerCls = "bg-slate-50" }: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  headerCls?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className={`${headerCls} text-slate-600`}>
            {headers.map((h, i) => <th key={i} className="p-3 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition">
              {row.map((cell, j) => <td key={j} className="p-3 text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
