export default function Home() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">نظرة عامة</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
          <span className="text-gray-500 text-sm font-medium">إجمالي السجلات</span>
          <span className="text-3xl font-bold text-blue-600 mt-2">12,450</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
          <span className="text-gray-500 text-sm font-medium">أخطاء مكتشفة</span>
          <span className="text-3xl font-bold text-red-500 mt-2">342</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
          <span className="text-gray-500 text-sm font-medium">مناطق غير معروفة</span>
          <span className="text-3xl font-bold text-orange-500 mt-2">89</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
          <span className="text-gray-500 text-sm font-medium">حالة التدقيق</span>
          <span className="text-3xl font-bold text-green-500 mt-2">75%</span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center mt-10">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">أهلاً بك في نظام التدقيق</h3>
        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
          هذا النظام يتيح لك رفع أي ملف بيانات، تحديد أعمدته بمرونة، ومن ثم تطبيق عمليات التدقيق، الإحصائيات، وإنشاء التقارير الرسمية بكفاءة عالية. للبدء، قم بالانتقال إلى صفحة رفع الملف.
        </p>
      </div>
    </div>
  );
}
