"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPreview } from "@/lib/api";

const CANONICAL_COLS = ["الاستمارة", "رب الأسرة", "اسم الزوجة", "اسم الأم", "المحلة", "الزقاق", "رقم الدار", "العنوان"];
const PAGE_SIZE = 100;

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fileId, setFileId]       = useState<string | null>(null);

  // Search state
  const [searchVal, setSearchVal]   = useState("");
  const [formNum,   setFormNum]     = useState("");
  const [headName,  setHeadName]    = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (fid: string, pg: number, sv: string, fn: string, hn: string) => {
    setSearching(true);
    try {
      const result = await getPreview(fid, {
        page: pg, page_size: PAGE_SIZE,
        search: sv.trim(), form_number: fn.trim(), head_name: hn.trim(),
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء جلب البيانات");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fid = searchParams.get("fileId") || localStorage.getItem("current_file_id");
    if (!fid) { setError("لم يتم العثور على ملف. الرجاء رفع ملف أولاً."); setLoading(false); return; }
    setFileId(fid);
    fetchData(fid, 1, "", "", "");
  }, [searchParams, fetchData]);

  const handleSearch = () => {
    if (!fileId) return;
    setPage(1);
    fetchData(fileId, 1, searchVal, formNum, headName);
  };

  const handleClear = () => {
    setSearchVal(""); setFormNum(""); setHeadName(""); setPage(1);
    if (fileId) fetchData(fileId, 1, "", "", "");
  };

  const goPage = (pg: number) => {
    if (!fileId) return;
    setPage(pg);
    fetchData(fileId, pg, searchVal, formNum, headName);
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="max-w-xl mx-auto mt-10 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
      <div className="text-4xl mb-4">⚠</div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">تعذّر تحميل المعاينة</h3>
      <p className="text-slate-500 text-sm mb-6">{error}</p>
      <button onClick={() => router.push("/upload")}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition text-sm">
        العودة لصفحة الرفع
      </button>
    </div>
  );

  const sepLabel = data?.detected_separator === "\t" ? "Tab" : (data?.detected_separator ?? "—");
  const headerIdx = data?.header_row_index ?? 0;
  const headerScore = (data?.warnings ?? []).some((w: any) => w.type === "header_not_found");
  const totalRows    = data?.row_count ?? 0;
  const filteredRows = data?.filtered_count ?? totalRows;
  const totalPages   = data?.total_pages ?? 1;
  const hasFilter    = searchVal || formNum || headName;

  // Determine which columns to show — prefer canonical 8, fallback to whatever API returns
  const displayCols: string[] = (data?.columns ?? []).filter((c: string) =>
    CANONICAL_COLS.includes(c)
  );
  // If none match (unrecognized format), show all
  const showCols = displayCols.length > 0 ? displayCols : (data?.columns ?? []);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">معاينة البيانات</h2>
          <p className="text-slate-500 text-sm mt-1">
            {data?.detected_encoding} · {sepLabel} · {totalRows.toLocaleString()} صف
          </p>
        </div>
        <button onClick={() => router.push("/mapping")}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition font-semibold text-sm">
          تحديد الأعمدة ←
        </button>
      </div>

      {/* Header Detection Banner */}
      {headerScore ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0">⚠</span>
          <p className="text-amber-800 text-sm font-semibold">
            لم يتم اكتشاف صف عناوين مطابق — يرجى التحقق من الملف.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
          <span className="text-emerald-500">✓</span>
          <p className="text-emerald-700 text-sm">
            {headerIdx > 0
              ? `تم اكتشاف العناوين في السطر ${headerIdx + 1} — تخطي ${headerIdx} سطر تمهيدي.`
              : "تم اكتشاف صف العناوين في السطر الأول."}
          </p>
        </div>
      )}

      {/* Encoding Repaired */}
      {(data?.warnings ?? []).some((w: any) => w.type === "encoding_repaired") && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-blue-700 text-sm flex items-center gap-2">
          <span>🔤</span> تم إصلاح ترميز النص العربي تلقائياً.
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">البحث في البيانات</h3>
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
              placeholder="ابحث برقم..."
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
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-700 text-sm">بيانات الملف</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasFilter
                ? `يعرض ${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(page * PAGE_SIZE, filteredRows).toLocaleString()} من ${filteredRows.toLocaleString()} نتيجة (من أصل ${totalRows.toLocaleString()})`
                : `يعرض ${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(page * PAGE_SIZE, totalRows).toLocaleString()} من أصل ${totalRows.toLocaleString()} صف`
              }
            </p>
          </div>
          {searching && <span className="text-xs text-indigo-600">جاري التحديث...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-indigo-700 text-white">
              <tr>
                {showCols.map((col: string, i: number) => (
                  <th key={i} className="p-3 font-semibold whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.preview_rows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={showCols.length}
                    className="p-10 text-center text-slate-400 text-sm">
                    لا توجد نتائج تطابق البحث
                  </td>
                </tr>
              ) : (
                (data?.preview_rows ?? []).map((row: any, ri: number) => (
                  <tr key={ri} className={`hover:bg-indigo-50/40 transition ${ri % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                    {showCols.map((col: string, ci: number) => (
                      <td key={ci} className="p-3 text-slate-700 whitespace-nowrap">{row[col] ?? ""}</td>
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
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">
                الأول
              </button>
              <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">
                السابق
              </button>
              <span className="text-xs text-slate-600 px-2">
                صفحة <strong>{page}</strong> من <strong>{totalPages}</strong>
              </span>
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">
                التالي
              </button>
              <button onClick={() => goPage(totalPages)} disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition">
                الأخير
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">انتقل إلى:</label>
              <input type="number" min={1} max={totalPages} defaultValue={page}
                onBlur={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) goPage(v); }}
                className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
