const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", body: formData });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء رفع الملف");
  }
  return response.json();
}

export interface PreviewParams {
  page?: number;
  page_size?: number;
  search?: string;
  form_number?: string;
  head_name?: string;
}

export async function getPreview(fileId: string, params: PreviewParams = {}) {
  const q = new URLSearchParams();
  if (params.page      !== undefined) q.set("page",         String(params.page));
  if (params.page_size !== undefined) q.set("page_size",    String(params.page_size));
  if (params.search)                  q.set("search",       params.search);
  if (params.form_number)             q.set("form_number",  params.form_number);
  if (params.head_name)               q.set("head_name",    params.head_name);

  const url = `${API_BASE_URL}/api/preview/${fileId}${q.toString() ? "?" + q.toString() : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء جلب المعاينة");
  }
  return response.json();
}

export async function applyMapping(fileId: string, mapping: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}/api/mapping/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, mapping }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء تطبيق الربط");
  }
  return response.json();
}

export async function applyClassification(records: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/classification/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء تصنيف البيانات");
  }
  return response.json();
}

// ── SQL Database API ──────────────────────────────────────────────────────────

export async function getDatasets() {
  const response = await fetch(`${API_BASE_URL}/api/datasets`);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء جلب قائمة مجموعات البيانات");
  }
  return response.json();
}

export interface RecordsParams {
  dataset_id?: number;
  page?: number;
  page_size?: number;
  search?: string;
  form_number?: string;
  head_name?: string;
}

export async function searchRecords(params: RecordsParams = {}) {
  const q = new URLSearchParams();
  if (params.dataset_id !== undefined) q.set("dataset_id", String(params.dataset_id));
  if (params.page       !== undefined) q.set("page",       String(params.page));
  if (params.page_size  !== undefined) q.set("page_size",  String(params.page_size));
  if (params.search)                   q.set("search",     params.search);
  if (params.form_number)              q.set("form_number", params.form_number);
  if (params.head_name)                q.set("head_name",  params.head_name);

  const url = `${API_BASE_URL}/api/records${q.toString() ? "?" + q.toString() : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء البحث في السجلات");
  }
  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getStatistics(records: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/statistics/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ أثناء جلب الإحصائيات");
  }
  return response.json();
}
