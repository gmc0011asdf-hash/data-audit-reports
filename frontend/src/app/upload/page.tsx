"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) { setError("الرجاء اختيار ملف أولاً"); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await uploadFile(file);
      setFileId(response.file_id);
      setSuccess(true);
      localStorage.setItem("current_file_id", response.file_id);
    } catch (err: any) {
      setError(err.message || "فشل رفع الملف");
    } finally {
      setLoading(false);
    }
  };

  const goToPreview = () => {
    if (fileId) router.push(`/preview?fileId=${fileId}`);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">رفع ملف البيانات</h2>
        <p className="text-slate-500 text-sm mt-1">رفع ملف للبدء في عملية التدقيق والتحليل</p>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

        {/* Drop Zone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center px-6 py-12 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : file
              ? "border-emerald-300 bg-emerald-50"
              : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl ${
            file ? "bg-emerald-100" : "bg-indigo-100"
          }`}>
            {file ? "✅" : "📂"}
          </div>

          {file ? (
            <div className="text-center">
              <p className="font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-400 mt-1">{formatSize(file.size)}</p>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">الملف جاهز للرفع</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-semibold text-slate-700">اسحب الملف هنا أو انقر للاختيار</p>
              <p className="text-sm text-slate-400 mt-1">يدعم النظام ترميز UTF-8 وWindows-1256</p>
            </div>
          )}

          <input type="file" className="hidden" accept=".txt,.csv,.xlsx,.xls" onChange={handleFileChange} />
        </label>

        {/* Supported types */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">الصيغ:</span>
          {[".txt", ".csv", ".xlsx", ".xls"].map((ext) => (
            <span key={ext} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono">
              {ext}
            </span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
            <p className="font-semibold">تم رفع الملف بنجاح</p>
            <p className="text-xs mt-0.5 font-mono text-emerald-500">{fileId}</p>
          </div>
        )}

        {/* Action Button */}
        {!success ? (
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`w-full py-3 rounded-xl font-bold text-white transition ${
              loading || !file
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
            }`}
          >
            {loading ? "جاري الرفع..." : "رفع الملف"}
          </button>
        ) : (
          <button
            onClick={goToPreview}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white transition shadow-md"
          >
            الانتقال لمعاينة البيانات ←
          </button>
        )}
      </div>

      {/* Guide Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">إرشادات الرفع</h3>
        <ul className="space-y-2 text-xs text-slate-500">
          {[
            "يدعم النظام ملفات TXT و CSV المفصولة بـ Tab أو فاصلة.",
            "يتم اكتشاف الترميز تلقائياً وإصلاح النص العربي المشوه.",
            "الصف الأول في الملف يجب أن يكون رؤوس الأعمدة.",
            "بعد الرفع انتقل للمعاينة لتحديد الأعمدة وربطها.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-indigo-400 shrink-0 mt-0.5">●</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
