from typing import List
from collections import Counter
from ..models.schemas import (
    CanonicalRecord, ClassificationSummary, StatusSummary, AreaDistributionRow
)

def compute_summary(records: List[CanonicalRecord]) -> dict:
    classification_summary = ClassificationSummary()
    status_summary = StatusSummary()
    area_counts: Counter = Counter()
    review_records = []

    for r in records:
        cls = r.address_classification
        if cls == "area":
            classification_summary.area += 1
        elif cls == "empty":
            classification_summary.empty += 1
        elif cls == "non_area":
            classification_summary.non_area += 1
        else:
            classification_summary.needs_review += 1

        status = r.record_status
        if status == "complete":
            status_summary.complete += 1
        elif status == "incomplete":
            status_summary.incomplete += 1
        else:
            status_summary.needs_review += 1

        if cls == "area" and r.normalized_area:
            area_counts[r.normalized_area] += 1

        if r.record_status == "needs_review":
            review_records.append(r)

    area_distribution = [
        AreaDistributionRow(area_name=k, count=v)
        for k, v in sorted(area_counts.items(), key=lambda x: -x[1])
    ]

    return {
        "total_records": len(records),
        "classification_summary": classification_summary,
        "status_summary": status_summary,
        "area_distribution": area_distribution,
        "top_areas": area_distribution[:10],
        "review_records": review_records,
        "warnings": [],
    }
