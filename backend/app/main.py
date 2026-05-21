from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import upload, preview, mapping, classification

app = FastAPI(
    title="نظام تدقيق وتحليل الملفات",
    description="واجهة برمجة التطبيقات لرفع وتحليل البيانات",
    version="1.0.0"
)

# السماح للواجهة المحلية بالاتصال (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إضافة موجهات API (Routers)
app.include_router(upload.router)
app.include_router(preview.router)
app.include_router(mapping.router)
app.include_router(classification.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/info")
def get_info():
    return {
        "system_name": "نظام تدقيق وتحليل الملفات وإعداد التقارير",
        "version": "1.0.0"
    }
