from fastapi import APIRouter, HTTPException
from ..models.schemas import StatisticsRequest, StatisticsResponse
from ..services.statistics_service import compute_summary

router = APIRouter(prefix="/api", tags=["Statistics"])

@router.post("/statistics/summary", response_model=StatisticsResponse)
def get_statistics_summary(request: StatisticsRequest):
    try:
        result = compute_summary(request.records)
        return StatisticsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء حساب الإحصائيات: {str(e)}")
