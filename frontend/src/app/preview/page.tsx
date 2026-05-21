"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPreview } from "@/lib/api";

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      const urlFileId = searchParams.get("fileId");
      const localFileId = localStorage.getItem("current_file_id");
      const fileId = urlFileId || localFileId;

      if (!fileId) {
        setError("لم يتم العثور على ملف للمعاينة. الرجاء رفع ملف أولاً.");
        setLoading(false);
        return;
      }

      try {
        const previewData = await getPreview(fileId);
        setData(previewData);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
        <h3 className="text-xl font-bold mb-4">خطأ في المعاينة</h3>
        <p>{error}</p>
        <button 
          onClick={() => router.push("/upload")}
          className="mt-6 px-6 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition text-red-800"
        >
          العودة لصفحة الرفع
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">معاينة البيانات</h2>
        <button 
          onClick={() => router.push("/mapping")}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition font-medium"
        >
          تحديد الأعمدة ⬅
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm">الترميز المكتشف</span>
          <p className="text-lg font-semibold text-gray-800">{data?.detected_encoding}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm">الفاصل المكتشف</span>
          <p className="text-lg font-semibold text-gray-800">
            {data?.detected_separator === "\t" ? "Tab (مسافة جدولة)" : data?.detected_separator}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm">إجمالي الصفوف</span>
          <p className="text-lg font-semibold text-gray-800">{data?.row_count} صف</p>
        </div>
      </div>

      {data?.warnings?.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <h4 className="font-bold text-yellow-800 mb-2">تحذيرات:</h4>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            {data.warnings.map((w: any, idx: number) => (
              <li key={idx}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">عينة البيانات (أول 20 صف)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                {data?.columns.map((col: string, idx: number) => (
                  <th key={idx} className="p-3 border-b border-gray-200 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.preview_rows.map((row: any, rIdx: number) => (
                <tr key={rIdx} className="hover:bg-blue-50/50 transition">
                  {data?.columns.map((col: string, cIdx: number) => (
                    <td key={cIdx} className="p-3 text-gray-700 whitespace-nowrap">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <PreviewContent />
    </Suspense>
  );
}
