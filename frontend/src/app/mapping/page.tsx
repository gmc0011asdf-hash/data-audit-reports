"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getPreview, applyMapping, applyClassification } from "@/lib/api";

function MappingContent() {
  const router = useRouter();
  
  const [fileId, setFileId] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [classificationLoading, setClassificationLoading] = useState(false);
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
  const [classifiedData, setClassifiedData] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);

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
    setClassifiedData(null);
    setSummary(null);
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

  const handleApplyClassification = async () => {
    if (!previewData) return;
    
    setClassificationLoading(true);
    setError(null);
    
    try {
      const response = await applyClassification(previewData);
      setClassifiedData(response.records);
      setSummary(response.summary);
    } catch (err: any) {
      setError(err.message || "فشل عملية التصنيف");
    } finally {
      setClassificationLoading(false);
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
      {/* رأس الصفحة */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">تحديد الأعمدة وربطها</h2>
          <p className="text-gray-500">
            اختر العمود المناسب لكل حقل حتى يتم توحيد البيانات. الملف المفتوح: <span className="text-blue-500 font-mono text-xs bg-blue-50 px-2 py-1 rounded">{fileId}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* قسم الربط */}
      {!classifiedData && (
        <>
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
                  <option value="">-- غير موجود --</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button 
              onClick={handleApplyMapping}
              disabled={mappingLoading}
              className={`px-10 py-3 rounded-xl font-bold text-white shadow-md transition ${
                mappingLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {mappingLoading ? "جاري التطبيق..." : "تطبيق الربط"}
            </button>
          </div>
        </>
      )}

      {/* قسم جدول CanonicalRecord قبل التصنيف */}
      {previewData && !classifiedData && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">البيانات بعد الربط (قبل التنظيف)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-white text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold">رقم الاستمارة</th>
                    <th className="p-4 font-semibold">رب الأسرة</th>
                    <th className="p-4 font-semibold">العنوان الأصلي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition">
                      <td className="p-4 text-gray-800 font-medium">{row.form_number || "-"}</td>
                      <td className="p-4 text-gray-700">{row.head_name || "-"}</td>
                      <td className="p-4 text-blue-600 font-medium">{row.raw_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
              يتم عرض أول 5 صفوف فقط للمعاينة. إجمالي العينة: {previewData.length}
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button 
              onClick={handleApplyClassification}
              disabled={classificationLoading}
              className={`px-10 py-3 rounded-xl font-bold text-white shadow-md transition ${
                classificationLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {classificationLoading ? "جاري التصنيف..." : "تنظيف وتصنيف المناطق"}
            </button>
          </div>
        </div>
      )}

      {/* قسم الإحصائيات وجدول التصنيف النهائي */}
      {classifiedData && summary && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">نتائج التصنيف والتنظيف</h2>
              <p className="text-gray-500">تم تنظيف وتصنيف العينة بنجاح بناءً على قاموس المناطق والقواعد.</p>
            </div>
          </div>
          
          {/* كروت الملخص */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm text-center">
              <div className="text-sm text-green-600 font-semibold mb-1">مناطق صحيحة</div>
              <div className="text-3xl font-bold text-green-700">{summary.area}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="text-sm text-gray-500 font-semibold mb-1">غير مذكور</div>
              <div className="text-3xl font-bold text-gray-700">{summary.empty}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm text-center">
              <div className="text-sm text-red-500 font-semibold mb-1">ليست مناطق</div>
              <div className="text-3xl font-bold text-red-600">{summary.non_area}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-yellow-100 shadow-sm text-center">
              <div className="text-sm text-yellow-600 font-semibold mb-1">تحتاج مراجعة</div>
              <div className="text-3xl font-bold text-yellow-700">{summary.needs_review}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold">رقم الاستمارة</th>
                    <th className="p-4 font-semibold">رب الأسرة</th>
                    <th className="p-4 font-semibold">العنوان الأصلي</th>
                    <th className="p-4 font-semibold">المنطقة الموحدة</th>
                    <th className="p-4 font-semibold">التصنيف</th>
                    <th className="p-4 font-semibold">حالة السجل</th>
                    <th className="p-4 font-semibold">سبب التصنيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classifiedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-800">{row.form_number || "-"}</td>
                      <td className="p-4 text-gray-800">{row.head_name || "-"}</td>
                      <td className="p-4 text-gray-500 font-medium">{row.original_address_variant || "-"}</td>
                      <td className="p-4 font-bold text-blue-700">{row.normalized_area || "-"}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          row.address_classification === 'area' ? 'bg-green-100 text-green-800' :
                          row.address_classification === 'empty' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.address_classification}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.record_status === 'complete' ? 'text-green-600' :
                          row.record_status === 'incomplete' ? 'text-gray-500' :
                          'text-yellow-600'
                        }`}>
                          {row.record_status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500 max-w-xs">{row.classification_reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
