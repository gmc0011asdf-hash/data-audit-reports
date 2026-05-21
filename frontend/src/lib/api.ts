const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "حدث خطأ أثناء رفع الملف");
  }

  return response.json();
}

export async function getPreview(fileId: string) {
  const response = await fetch(`${API_BASE_URL}/api/preview/${fileId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "حدث خطأ أثناء جلب المعاينة");
  }

  return response.json();
}

export async function applyMapping(fileId: string, mapping: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}/api/mapping/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file_id: fileId,
      mapping: mapping
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "حدث خطأ أثناء تطبيق الربط");
  }

  return response.json();
}

export async function getStatistics(records: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/statistics/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "حدث خطأ أثناء جلب الإحصائيات");
  }

  return response.json();
}

export async function applyClassification(records: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/classification/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: records
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "حدث خطأ أثناء تصنيف البيانات");
  }

  return response.json();
}
