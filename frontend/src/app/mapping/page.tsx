export default function MappingPage() {
  const canonicalFields = [
    { id: "form_number", label: "رقم الاستمارة", description: "رقم الاستمارة الخاص بالسجل" },
    { id: "head_name", label: "رب الأسرة", description: "الاسم الرئيسي لرب الأسرة" },
    { id: "wife_name", label: "اسم الزوجة", description: "اسم زوجة رب الأسرة" },
    { id: "mother_name", label: "اسم الأم", description: "اسم أم رب الأسرة" },
    { id: "district", label: "المحلة", description: "رقم المحلة" },
    { id: "alley", label: "الزقاق", description: "رقم الزقاق" },
    { id: "house_number", label: "رقم الدار", description: "رقم الدار" },
    { id: "raw_address", label: "العنوان / المنطقة", description: "العنوان النصي أو المنطقة التي سيتم تحليلها" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">تحديد الأعمدة</h2>
      <p className="text-gray-500 mb-8">
        بناءً على المعاينة السابقة، سيتم في هذه المرحلة لاحقاً ربط أعمدة الملف المرفوع بالحقول المرجعية للنظام الموضحة أدناه.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="p-4 w-1/3">الحقل المرجعي المطلوب</th>
                <th className="p-4 w-1/3">الوصف</th>
                <th className="p-4 w-1/3">العمود في الملف (سيتم تفعيله لاحقاً)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {canonicalFields.map((field) => (
                <tr key={field.id} className="hover:bg-blue-50/50 transition">
                  <td className="p-4 font-semibold text-gray-800">{field.label}</td>
                  <td className="p-4 text-gray-500 text-xs">{field.description}</td>
                  <td className="p-4">
                    <select 
                      className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      <option value="">-- يتم تطويرها في المرحلة القادمة --</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition" disabled>
          إلغاء
        </button>
        <button className="px-6 py-2 bg-gray-400 text-white rounded-lg shadow-md cursor-not-allowed" disabled>
          حفظ ومتابعة
        </button>
      </div>
    </div>
  );
}
