from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.schemas.safety import TriageAlertResponse, TriageActionRequest
from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/triage", tags=["Triage Console"])

@router.get("/alerts")
async def get_triage_alerts(status_filter: Optional[str] = None):
    alerts = db.triage_alerts
    if status_filter:
        alerts = [a for a in alerts if a["status"].upper() == status_filter.upper()]
    return alerts

@router.post("/alerts/{alert_id}/action")
async def take_triage_action(alert_id: str, req: TriageActionRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    target = None
    for a in db.triage_alerts:
        if a["id"] == alert_id:
            target = a
            break
    if not target:
        raise HTTPException(status_code=404, detail="Triage alert not found")

    target["status"] = req.status.upper()
    target["action_taken"] = req.action_taken
    target["updated_at"] = datetime.utcnow().isoformat()

    return {"status": "SUCCESS", "alert": target}
