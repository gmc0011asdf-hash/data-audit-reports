import Link from "next/link";

const steps = [
  { num: "1", href: "/upload",  label: "رفع الملف",               desc: "رفع ملف TXT أو CSV أو Excel",             color: "bg-indigo-600" },
  { num: "2", href: "/preview", label: "معاينة البيانات",         desc: "التحقق من الترميز والأعمدة المكتشفة",     color: "bg-indigo-500" },
  { num: "3", href: "/mapping", label: "تحديد الأعمدة وتصنيفها", desc: "ربط الأعمدة وتنظيف العناوين وتصنيفها",   color: "bg-indigo-500" },
  { num: "4", href: "/charts",  label: "الرسوم البيانية",         desc: "تحليل بصري للتصنيفات والمناطق",           color: "bg-purple-600" },
  { num: "5", href: "/reports", label: "التقارير الرسمية",        desc: "تقرير إداري كامل قابل للطباعة",           color: "bg-emerald-600" },
  { num: "6", href: "/export",  label: "التصدير",                 desc: "تنزيل البيانات بصيغ JSON / CSV / TXT",    color: "bg-slate-600"  },
];

const features = [
  { icon: "🔤", title: "دعم الترميز العربي",    desc: "إصلاح تلقائي لمشاكل Mojibake وترميز Windows-1256 وUTF-8" },
  { icon: "🗂️", title: "تصنيف ذكي للمناطق",   desc: "توحيد أسماء المناطق باستخدام قاموس القواعد والأسماء البديلة" },
  { icon: "📊", title: "تقارير إدارية رسمية", desc: "تقارير كاملة قابلة للطباعة والتصدير بصيغ متعددة" },
];

export default function HomePage() {
  return (
    <div className="space-y-8 max-w-5xl">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-indigo-900 to-indigo-600 rounded-2xl p-8 text-white">
        <p className="text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-2">
          نظام إداري — تدقيق البيانات
        </p>
        <h1 className="text-3xl font-bold mb-3">نظام تدقيق وتحليل الملفات</h1>
        <p className="text-indigo-100 leading-relaxed max-w-2xl text-sm">
          منصة متكاملة لرفع ملفات البيانات الإدارية، تحليلها وتصنيف عناوينها، وإعداد التقارير الرسمية القابلة للطباعة والتصدير.
        </p>
        <div className="flex gap-3 mt-5 flex-wrap">
          <Link href="/upload"
            className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition shadow-md text-sm">
            ← رفع ملف جديد
          </Link>
          <Link href="/mapping"
            className="px-5 py-2.5 bg-indigo-500/40 text-white rounded-xl font-semibold hover:bg-indigo-500/60 transition text-sm border border-indigo-400/30">
            متابعة جلسة سابقة
          </Link>
        </div>
      </div>

      {/* Workflow Steps */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-4">مراحل العمل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((step) => (
            <Link key={step.href} href={step.href}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition flex items-start gap-4 group">
              <div className={`w-9 h-9 ${step.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0`}>
                {step.num}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition">{step.label}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-4">مميزات النظام</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-slate-800 text-sm mb-1.5">{f.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Formats */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-5 flex-wrap">
        <span className="text-sm font-semibold text-slate-600">الصيغ المدعومة:</span>
        {[".txt", ".csv", ".xlsx", ".xls"].map((f) => (
          <span key={f} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono font-semibold">
            {f}
          </span>
        ))}
        <span className="text-xs text-slate-400 mr-auto">ترميز: UTF-8 / CP1256 / Windows-1256</span>
      </div>

    </div>
  );
}
