"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDatasets, searchRecords } from "@/lib/api";

const PAGE_SIZE = 100;

const COLS = [
  { key: "form_number", label: "الاستمارة" },
  { key: "head_name",   label: "رب الأسرة" },
  { key: "wife_name",   label: "اسم الزوجة" },
  { key: "mother_name", label: "اسم الأم" },
  { key: "district",    label: "المحلة" },
  { key: "alley",       label: "الزقاق" },
  { key: "house_number",label: "رقم الدار" },
  { key: "raw_address", label: "العنوان" },
];

export default function FiltersPage() {
  const [datasets,   setDatasets]   = useState<any[]>([]);
  const [datasetId,  setDatasetId]  = useState<number | undefined>(undefined);
  const [data,       setData]       = useState<any | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [searching,  setSearching]  = useState(false);
  const [dbError,    setDbError]    = useState<string | null>(null);

  const [searchVal,  setSearchVal]  = useState("");
  const [formNum,    setFormNum]    = useState("");
  const [headName,   setHeadName]   = useState("");
  const [page,       setPage]       = useState(1);

  // Load datasets list
  useEffect(() => {
    getDatasets()
      .then(res => {
        setDatasets(res.datasets || []);
        if (res.datasets?.length > 0) {
          const first = res.datasets[0].id;
          setDatasetId(first);
          fetchRecords(first, 1, "", "", "");
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        setDbError(err.message);
        setLoading(false);
      });
  }, []);

  const fetchRecords = useCallback(async (
    dsId: number | undefined, pg: number, sv: string, fn: string, hn: string
  ) => {
    setSearching(true);
    try {
      const result = await searchRecords({
        dataset_id: dsId,
        page: pg, page_size: PAGE_SIZE,
        search: sv.trim(), form_number: fn.trim(), head_name: hn.trim(),
      });
      setData(result);
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchRecords(datasetId, 1, searchVal, formNum, headName);
  };

  const handleClear = () => {
    setSearchVal(""); setFormNum(""); setHeadName(""); setPage(1);
    fetchRecords(datasetId, 1, "", "", "");
  };

  const handleDatasetChange = (id: number) => {
    setDatasetId(id); setPage(1);
    setSearchVal(""); setFormNum(""); setHeadName("");
    fetchRecords(id, 1, "", "", "");
  };

  const goPage = (pg: number) => {
    setPage(pg);
    fetchRecords(datasetId, pg, searchVal, formNum, headName);
  };

  const hasFilter = searchVal || formNum || headName;
  const totalRecords = data?.total_records ?? 0;
  const totalPages   = data?.total_pages   ?? 1;

  // ── Database not available ──
  if (dbError) return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">السجلات والبحث</h2></div>
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4 select-none">🗄️</div>
        <p className="text-amber-700 font-semibold text-lg mb-2">قاعدة البيانات غير متاحة</p>
        <p className="text-slate-500 text-sm mb-2">{dbError}</p>
        <div className="bg-slate-50 rounded-xl p-4 text-right mt-4 text-xs text-slate-600 font-mono max-w-lg mx-auto">
          <p className="font-semibold text-slate-700 mb-2">لاستيراد البيانات:</p>
          <p>python scripts/import_to_sql.py "مسار_الملف.txt"</p>
        </div>
      </div>
    </div>
  );

  // ── No datasets imported yet ──
  if (!loading && datasets.length === 0) return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">السجلات والبحث</h2></div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
        <div className="text-6xl mb-5 select-none">📂</div>
        <p className="text-slate-600 text-lg font-semibold mb-2">لا توجد بيانات مستوردة بعد.</p>
        <div className="bg-slate-50 rounded-xl p-4 text-right mt-4 text-xs text-slate-600 font-mono max-w-lg mx-auto">
          <p className="font-semibold text-slate-700 mb-2">لاستيراد الملف:</p>
          <p>python scripts/import_to_sql.py "مسار_الملف.txt"</p>
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
          <h2 className="text-2xl font-bold text-slate-800">السجلات والبحث</h2>
          <p className="text-slate-500 text-sm mt-1">
            البحث في{" "}
            <span className="font-semibold text-slate-700">{totalRecords.toLocaleString()}</span>
            {" "}سجل من قاعدة البيانات
          </p>
        </div>
        <Link href="/mapping" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
          التصنيف
        </Link>
      </div>

      {/* Dataset Selector */}
      {datasets.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
          <label className="text-sm font-semibold text-slate-600 shrink-0">مجموعة البيانات:</label>
          <select value={datasetId ?? ""}
            onChange={e => handleDatasetChange(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-64">
            {datasets.map((ds: any) => (
              <option key={ds.id} value={ds.id}>
                {ds.original_filename} — {(ds.row_count || 0).toLocaleString()} سجل
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">بحث وفلترة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">بحث عام</label>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="ابحث في أي عمود..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">رقم الاستمارة</label>
            <input type="text" value={formNum} onChange={e => setFormNum(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="مثال: 1001"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">رب الأسرة</label>
            <input type="text" value={headName} onChange={e => setHeadName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="ابحث بالاسم..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={handleSearch}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">
            {searching ? "جاري البحث..." : "بحث"}
          </button>
          {hasFilter && (
            <button onClick={handleClear}
              className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition">
              مسح
            </button>
          )}
          {hasFilter && data && (
            <span className="text-xs text-slate-500 mr-1">
              {totalRecords.toLocaleString()} نتيجة
            </span>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-700 text-sm">السجلات</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasFilter
                ? `يعرض ${((page-1)*PAGE_SIZE+1).toLocaleString()}–${Math.min(page*PAGE_SIZE, totalRecords).toLocaleString()} من ${totalRecords.toLocaleString()} نتيجة`
                : `يعرض ${((page-1)*PAGE_SIZE+1).toLocaleString()}–${Math.min(page*PAGE_SIZE, totalRecords).toLocaleString()} من ${totalRecords.toLocaleString()} سجل`
              }
            </p>
          </div>
          {searching && <span className="text-xs text-indigo-600 animate-pulse">جاري البحث...</span>}
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
                <tr>
                  <td colSpan={COLS.length} className="p-10 text-center text-slate-400">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                (data?.records ?? []).map((row: any, ri: number) => (
                  <tr key={row.id ?? ri}
                    className={`hover:bg-indigo-50/40 transition ${ri % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                    {COLS.map(col => (
                      <td key={col.key} className="p-3 text-slate-700 whitespace-nowrap">
                        {row[col.key] || "—"}
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
