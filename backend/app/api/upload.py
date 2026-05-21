import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..models.schemas import UploadResponse

router = APIRouter(prefix="/api", tags=["Upload"])

UPLOAD_DIR = Path(__file__).parent.parent / "storage" / "uploads"

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="لم يتم تحديد ملف")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".txt", ".csv", ".xlsx"]:
        raise HTTPException(status_code=400, detail=f"امتداد الملف غير مدعوم: {ext}")
        
    # إنشاء مُعرّف آمن للملف
    file_id = str(uuid.uuid4())
    saved_filename = f"{file_id}{ext}"
    
    # التأكد من وجود المجلد
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    file_path = UPLOAD_DIR / saved_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء حفظ الملف: {str(e)}")
        
    file_size = os.path.getsize(file_path)
    
    return UploadResponse(
        file_id=file_id,
        original_filename=file.filename,
        saved_filename=saved_filename,
        file_size=file_size,
        message="تم رفع الملف بنجاح"
    )
