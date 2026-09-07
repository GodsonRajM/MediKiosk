"""
Privacy-Preserving Audit Logging Service.
Logs healthcare access actions with metadata only (no full medical notes, passwords, or PII).
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.db.database import db
from app.core.logging import logger


class AuditService:
    @staticmethod
    def log_action(
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        log_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "patient_id": patient_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        }
        db.audit_logs.append(log_entry)
        logger.info(f"AUDIT: [{action}] on {resource_type} (Resource: {resource_id}, Patient: {patient_id})")
        return log_entry


audit_service = AuditService()
