from fastapi import APIRouter, HTTPException
from ..models.schemas import ClassificationApplyRequest, ClassificationApplyResponse, ClassificationSummary
from ..services.classification_service import classify_canonical_records

router = APIRouter(prefix="/api", tags=["Classification"])

@router.post("/classification/apply", response_model=ClassificationApplyResponse)
def apply_classification(request: ClassificationApplyRequest):
    try:
        classified_records = classify_canonical_records(request.records)
        
        summary = ClassificationSummary()
        
        for r in classified_records:
            if r.address_classification == "area":
                summary.area += 1
            elif r.address_classification == "empty":
                summary.empty += 1
            elif r.address_classification == "non_area":
                summary.non_area += 1
            else:
                summary.needs_review += 1
                
        return ClassificationApplyResponse(
            classified_count=len(classified_records),
            records=classified_records,
            summary=summary,
            warnings=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تصنيف البيانات: {str(e)}")
