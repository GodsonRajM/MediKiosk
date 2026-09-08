from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.database import db

router = APIRouter(prefix="/red-flags", tags=["Safety Engine & Red Flags"])

@router.get("/session/{session_id}")
async def get_session_red_flags(session_id: str):
    flags = [f for f in db.red_flags if f["session_id"] == session_id]
    return flags
