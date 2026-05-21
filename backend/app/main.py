from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="نظام تدقيق وتحليل الملفات وإعداد التقارير",
    description="واجهة برمجة التطبيقات للنظام",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/info")
def get_info():
    return {
        "system_name": "نظام تدقيق وتحليل الملفات وإعداد التقارير",
        "version": "1.0.0"
    }

# سيتم إضافة باقي مسارات API لاحقاً
