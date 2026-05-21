"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDatasets, searchRecords, getAnalyticsSummary } from "@/lib/api";

const PAGE_SIZE = 100;

const COLS = [
  { key: "form_number",          label: "الاستمارة"    },
  { key: "head_name",            label: "رب الأسرة"    },
  { key: "wife_name",            label: "اسم الزوجة"   },
  { key: "mother_name",          label: "اسم الأم"     },
  { key: "district",             label: "المحلة"       },
  { key: "alley",                label: "الزقاق"       },
  { key: "house_number",         label: "رقم الدار"    },
  { key: "raw_address",          label: "العنوان"      },
  { key: "normalized_area",      label: "المنطقة الموحدة" },
  { key: "address_classification",label: "التصنيف"    },
  { key: "record_status",        label: "الحالة"       },
];

const CLS_LABELS: Record<string, string> = {
  area: "منطقة", empty: "فارغ", non_area: "ليست منطقة", needs_review: "مراجعة"
};
const STATUS_LABELS: Record<string, string> = {
  complete: "مكتمل", incomplete: "غير مكتمل", needs_review: "يحتاج مراجعة"
};
const CLS_COLORS: Record<string, string> = {
  area: "bg-emerald-100 text-emerald-800",
  empty: "bg-slate-100 text-slate-600",
  non_area: "bg-red-100 text-red-700",
  needs_review: "bg-amber-100 text-amber-700",
};

export default function FiltersPage() {
  const [datasets,   setDatasets]   = useState<any[]>([]);
  const [datasetId,  setDatasetId]  = useState<number | undefined>(undefined);
  const [data,       setData]       = useState<any | null>(null);
  const [analytics,  setAnalytics]  = useState<any | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [searching,  setSearching]  = useState(false);
  const [dbError,    setDbError]    = useState<string | null>(null);

  // Filters
  const [searchVal,       setSearchVal]       = useState("");
  const [formNum,         setFormNum]         = useState("");
  const [headName,        setHeadName]        = useState("");
  const [areaFilter,      setAreaFilter]      = useState("");
  const [clsFilter,       setClsFilter]       = useState("");
  const [statusFilter,    setStatusFilter]    = useState("");
  const [page,            setPage]            = useState(1);

  const buildParams = useCallback((pg: number) => ({
    dataset_id:     datasetId,
    page: pg, page_size: PAGE_SIZE,
    search:         searchVal.trim(),
    form_number:    formNum.trim(),
    head_name:      headName.trim(),
    area:           areaFilter.trim(),
    classification: clsFilter.trim(),
    status:         statusFilter.trim(),
  }), [datasetId, searchVal, formNum, headName, areaFilter, clsFilter, statusFilter]);

  const fetchData = useCallback(async (dsId: number | undefined, pg: number,
    sv: string, fn: string, hn: string, ar: string, cl: string, st: string) => {
    setSearching(true);
    const p = { dataset_id: dsId, page: pg, page_size: PAGE_SIZE,
      search: sv, form_number: fn, head_name: hn, area: ar, classification: cl, status: st };
    try {
      const [records, summary] = await Promise.all([
        searchRecords(p),
        getAnalyticsSummary(p),
      ]);
      setData(records);
      setAnalytics(summary);
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setSearching(false);
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
          fetchData(first, 1, "", "", "", "", "", "");
        } else {
          setLoading(false);
        }
      })
      .catch(err => { setDbError(err.message); setLoading(false); });
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData(datasetId, 1, searchVal, formNum, headName, areaFilter, clsFilter, statusFilter);
  };

  const handleClear = () => {
    setSearchVal(""); setFormNum(""); setHeadName("");
    setAreaFilter(""); setClsFilter(""); setStatusFilter(""); setPage(1);
    fetchData(datasetId, 1, "", "", "", "", "", "");
  };

  const goPage = (pg: number) => {
    setPage(pg);
    fetchData(datasetId, pg, searchVal, formNum, headName, areaFilter, clsFilter, statusFilter);
  };

  const handleDatasetChange = (id: number) => {
    setDatasetId(id); setPage(1);
    fetchData(id, 1, searchVal, formNum, headName, areaFilter, clsFilter, statusFilter);
  };

  const hasFilter = searchVal || formNum || headName || areaFilter || clsFilter || statusFilter;
  const totalRecords = data?.total_records ?? 0;
  const totalPages   = data?.total_pages   ?? 1;
  const cs = analytics?.classification_summary;
  const ss = analytics?.status_summary;

  if (dbError) return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">السجلات والإحصائيات</h2></div>
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🗄️</div>
        <p className="text-amber-700 font-semibold mb-2">{dbError}</p>
        <div className="bg-slate-50 rounded-xl p-4 mt-4 text-xs text-slate-600 font-mono max-w-lg mx-auto">
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">السجلات والإحصائيات</h2>
          <p className="text-slate-500 text-sm mt-1">
            <strong className="text-slate-700">{(analytics?.total_records ?? 0).toLocaleString()}</strong> نتيجة
            {hasFilter ? " — حسب الفلاتر المحددة" : " — إجمالي قاعدة البيانات"}
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      {cs && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "إجمالي", value: analytics.total_records, cls: "border-slate-200 bg-white text-slate-700" },
            { label: "مناطق",  value: cs.area,         cls: "border-emerald-100 bg-emerald-50 text-emerald-700" },
            { label: "فارغة",  value: cs.empty,        cls: "border-slate-200 bg-slate-50 text-slate-500" },
            { label: "ليست مناطق", value: cs.non_area,  cls: "border-red-100 bg-red-50 text-red-600" },
            { label: "مراجعة", value: cs.needs_review,  cls: "border-amber-100 bg-amber-50 text-amber-700" },
          ].map((c, i) => (
            <div key={i} className={`p-4 rounded-xl border text-center ${c.cls}`}>
              <div className="text-xs font-semibold mb-1 opacity-70">{c.label}</div>
              <div className="text-2xl font-bold">{c.value?.toLocaleString?.() ?? c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dataset selector */}
      {datasets.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
          <label className="text-sm font-semibold text-slate-600 shrink-0">مجموعة البيانات:</label>
          <select value={datasetId ?? ""} onChange={e => handleDatasetChange(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-56">
            {datasets.map((ds: any) => (
              <option key={ds.id} value={ds.id}>
                {ds.original_filename} — {(ds.row_count || 0).toLocaleString()} سجل
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">بحث وفلترة</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">بحث عام</label>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="ابحث في أي عمود..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">رقم الاستمارة</label>
            <input type="text" value={formNum} onChange={e => setFormNum(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="مثال: 1001"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">رب الأسرة</label>
            <input type="text" value={headName} onChange={e => setHeadName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="ابحث بالاسم..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">المنطقة الموحدة</label>
            <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">الكل</option>
              {(analytics?.distinct_areas ?? []).map((a: string) => (
                <option key={a} value={a}>{a}</option>
              ))}
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
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={handleSearch}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">
            {searching ? "جاري البحث..." : "بحث وتحديث الإحصائيات"}
          </button>
          {hasFilter && (
            <button onClick={handleClear}
              className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition">
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Area Distribution mini-table */}
      {analytics?.area_distribution?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">توزيع المناطق (الأعلى)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="text-sm text-right w-full">
              <thead className="bg-indigo-50 text-indigo-700">
                <tr>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">المنطقة الموحدة</th>
                  <th className="p-3 font-semibold">العدد</th>
                  <th className="p-3 font-semibold">النسبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analytics.top_areas.map((a: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="p-3 font-semibold text-indigo-700">{a.area_name}</td>
                    <td className="p-3 text-slate-700">{a.count.toLocaleString()}</td>
                    <td className="p-3 text-slate-400 text-xs">
                      {analytics.total_records > 0
                        ? Math.round((a.count / analytics.total_records) * 100) + "%"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-700 text-sm">السجلات</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              يعرض {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
              {Math.min(page * PAGE_SIZE, totalRecords).toLocaleString()} من {totalRecords.toLocaleString()}
            </p>
          </div>
          {searching && <span className="text-xs text-indigo-600 animate-pulse">جاري التحديث...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-indigo-700 text-white">
              <tr>
                {COLS.map(col => (
                  <th key={col.key} className="p-3 font-semibold whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.records ?? []).length === 0 ? (
                <tr><td colSpan={COLS.length} className="p-10 text-center text-slate-400">لا توجد نتائج</td></tr>
              ) : (
                (data?.records ?? []).map((row: any, ri: number) => (
                  <tr key={row.id ?? ri}
                    className={`hover:bg-indigo-50/40 transition ${ri % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                    {COLS.map(col => (
                      <td key={col.key} className="p-3 text-slate-700 whitespace-nowrap">
                        {col.key === "address_classification" ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CLS_COLORS[row[col.key]] ?? "bg-slate-100 text-slate-600"}`}>
                            {(CLS_LABELS[row[col.key]] ?? row[col.key]) || "—"}
                          </span>
                        ) : col.key === "record_status" ? (
                          <span className={`text-xs font-semibold ${
                            row[col.key] === "complete"   ? "text-emerald-600" :
                            row[col.key] === "incomplete" ? "text-slate-400" : "text-amber-600"
                          }`}>
                            {(STATUS_LABELS[row[col.key]] ?? row[col.key]) || "—"}
                          </span>
                        ) : (row[col.key] || "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => goPage(1)} disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">الأول</button>
              <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">السابق</button>
              <span className="text-xs text-slate-600 px-2">
                <strong>{page}</strong> / <strong>{totalPages}</strong>
              </span>
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">التالي</button>
              <button onClick={() => goPage(totalPages)} disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">الأخير</button>
            </div>
            <span className="text-xs text-slate-400">{PAGE_SIZE} سجل / صفحة</span>
          </div>
        )}
      </div>

    </div>
  );
}
