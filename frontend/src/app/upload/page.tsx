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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("الرجاء اختيار ملف أولاً");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadFile(file);
      setFileId(response.file_id);
      setSuccess(true);
      // Save file_id to localStorage for easy access
      localStorage.setItem("current_file_id", response.file_id);
    } catch (err: any) {
      setError(err.message || "فشل رفع الملف");
    } finally {
      setLoading(false);
    }
  };

  const goToPreview = () => {
    if (fileId) {
      router.push(`/preview?fileId=${fileId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-10">
      <h2 className="text-3xl font-bold text-gray-800 text-center">رفع ملف البيانات</h2>
      <p className="text-gray-500 text-center mb-8">
        قم برفع ملف البيانات (txt, csv, xlsx) لبدء المعالجة.
      </p>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <label className="w-full flex flex-col items-center px-4 py-10 bg-blue-50 text-blue-500 rounded-lg shadow-inner tracking-wide border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11.2V14a1 1 0 0 1-2 0v-2.8l-1.6 1.6a1 1 0 1 1-1.4-1.4l3.3-3.3a1 1 0 0 1 1.4 0l3.3 3.3a1 1 0 0 1-1.4 1.4L11 11.2z" />
          </svg>
          <span className="mt-4 text-base font-semibold leading-normal">
            {file ? file.name : "اختر ملفاً أو اسحبه هنا"}
          </span>
          <input type="file" className="hidden" accept=".txt,.csv,.xlsx" onChange={handleFileChange} />
        </label>

        {error && (
          <div className="w-full mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full mt-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100 text-center">
            تم رفع الملف بنجاح!
          </div>
        )}

        <div className="flex gap-4 mt-8 w-full">
          {!success ? (
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className={`w-full py-3 rounded-lg font-bold text-white transition ${
                loading || !file ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "جاري الرفع..." : "رفع الملف"}
            </button>
          ) : (
            <button 
              onClick={goToPreview}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white transition shadow-md"
            >
              الانتقال لمعاينة البيانات
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
