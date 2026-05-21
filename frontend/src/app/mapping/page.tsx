"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getPreview, applyMapping } from "@/lib/api";

function MappingContent() {
  const router = useRouter();
  
  const [fileId, setFileId] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mapping, setMapping] = useState<Record<string, string>>({
    form_number: "",
    head_name: "",
    wife_name: "",
    mother_name: "",
    district: "",
    alley: "",
    house_number: "",
    raw_address: ""
  });
  
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  const canonicalFields = [
    { id: "form_number", label: "رقم الاستمارة", icon: "📄" },
    { id: "head_name", label: "رب الأسرة", icon: "👨" },
    { id: "wife_name", label: "اسم الزوجة", icon: "👩" },
    { id: "mother_name", label: "اسم الأم", icon: "👵" },
    { id: "district", label: "المحلة", icon: "🏘️" },
    { id: "alley", label: "الزقاق", icon: "🛣️" },
    { id: "house_number", label: "رقم الدار", icon: "🏠" },
    { id: "raw_address", label: "العنوان / المنطقة", icon: "📍" },
  ];

  useEffect(() => {
    const fetchPreview = async () => {
      const localFileId = localStorage.getItem("current_file_id");

      if (!localFileId) {
        setError("لم يتم العثور على ملف مفتوح. الرجاء رفع ملف أولاً.");
        setLoading(false);
        return;
      }
      
      setFileId(localFileId);

      try {
        const data = await getPreview(localFileId);
        setColumns(data.columns || []);
        
        // محاولة ربط تلقائي ذكي إذا كانت الأسماء متطابقة
        const autoMapping: Record<string, string> = { ...mapping };
        data.columns.forEach((col: string) => {
          if (col.includes("استمارة")) autoMapping.form_number = col;
          if (col.includes("رب") || col.includes("الاسرة")) autoMapping.head_name = col;
          if (col.includes("زوجة")) autoMapping.wife_name = col;
          if (col.includes("ام") || col.includes("أم")) autoMapping.mother_name = col;
          if (col.includes("محلة")) autoMapping.district = col;
          if (col.includes("زقاق")) autoMapping.alley = col;
          if (col.includes("دار")) autoMapping.house_number = col;
          if (col.includes("عنوان") || col.includes("منطقة")) autoMapping.raw_address = col;
        });
        setMapping(autoMapping);
        
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء جلب الأعمدة");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, []);

  const handleSelectChange = (canonicalId: string, value: string) => {
    setMapping(prev => ({
      ...prev,
      [canonicalId]: value
    }));
  };

  const handleApplyMapping = async () => {
    if (!fileId) return;
    
    setMappingLoading(true);
    setError(null);
    
    try {
      const response = await applyMapping(fileId, mapping);
      setPreviewData(response.records_preview);
    } catch (err: any) {
      setError(err.message || "فشل تطبيق الربط");
    } finally {
      setMappingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !columns.length) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
        <h3 className="text-xl font-bold mb-4">تنبيه</h3>
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
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">تحديد وربط الأعمدة</h2>
          <p className="text-gray-500">
            قم باختيار العمود المناسب من ملفك لكل حقل من الحقول المرجعية للنظام.
          </p>
        </div>
        <div className="w-16 h-16 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {canonicalFields.map((field) => (
          <div key={field.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{field.icon}</span>
              <span className="font-semibold text-gray-700">{field.label}</span>
            </div>
            <select 
              value={mapping[field.id] || ""}
              onChange={(e) => handleSelectChange(field.id, e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            >
              <option value="">-- تجاهل / غير موجود --</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button 
          onClick={handleApplyMapping}
          disabled={mappingLoading}
          className={`px-10 py-3 rounded-xl font-bold text-white shadow-md transition ${
            mappingLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {mappingLoading ? "جاري التطبيق..." : "تطبيق الربط ومعاينة النتائج"}
        </button>
      </div>

      {previewData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">نتيجة الربط (أول 50 صف)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-white text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold">رقم الاستمارة</th>
                  <th className="p-4 font-semibold">رب الأسرة</th>
                  <th className="p-4 font-semibold">الزوجة</th>
                  <th className="p-4 font-semibold">العنوان/المنطقة</th>
                  <th className="p-4 font-semibold">المحلة-الزقاق-الدار</th>
                  <th className="p-4 font-semibold">حالة التدقيق المبدئية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition">
                    <td className="p-4 text-gray-800 font-medium">{row.form_number || "-"}</td>
                    <td className="p-4 text-gray-700">{row.head_name || "-"}</td>
                    <td className="p-4 text-gray-600">{row.wife_name || "-"}</td>
                    <td className="p-4 text-blue-600 font-medium">{row.raw_address || "-"}</td>
                    <td className="p-4 text-gray-500">
                      {[row.district, row.alley, row.house_number].filter(Boolean).join(" - ") || "-"}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        {row.record_status === "needs_review" ? "يحتاج تدقيق" : row.record_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MappingPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <MappingContent />
    </Suspense>
  );
}
