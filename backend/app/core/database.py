import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.core.config import settings

# Attempt to import supabase client
try:
    from supabase import create_client, Client
    HAS_SUPABASE_SDK = True
except ImportError:
    HAS_SUPABASE_SDK = False

def format_supabase_error(e: Exception) -> dict:
    """Extracts structured message, code, details, and hint from a Supabase/PostgREST error."""
    if hasattr(e, "message"):
        m = getattr(e, "message")
        if isinstance(m, dict):
            return {
                "message": m.get("message", str(m)),
                "code": m.get("code", "DB_ERROR"),
                "details": m.get("details"),
                "hint": m.get("hint")
            }
        elif isinstance(m, str):
            return {
                "message": m,
                "code": getattr(e, "code", "DB_ERROR"),
                "details": getattr(e, "details", None),
                "hint": getattr(e, "hint", None)
            }
    if hasattr(e, "args") and len(e.args) > 0 and isinstance(e.args[0], dict):
        d = e.args[0]
        return {
            "message": d.get("message", str(d)),
            "code": d.get("code", "DB_ERROR"),
            "details": d.get("details"),
            "hint": d.get("hint")
        }
    return {
        "message": str(e),
        "code": getattr(e, "code", "DB_ERROR"),
        "details": getattr(e, "details", None),
        "hint": getattr(e, "hint", None)
    }

class MediKioskDatabase:
    """
    Authoritative Database Manager for MediKiosk.
    Directly interfaces with Supabase PostgreSQL as the primary single source of truth.
    Supports atomic identifier generation via database RPC and ensures transaction safety.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self.supabase_client: Optional[Any] = None
        
        if HAS_SUPABASE_SDK and settings.SUPABASE_URL and (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_ANON_KEY):
            key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_ANON_KEY
            try:
                self.supabase_client = create_client(settings.SUPABASE_URL, key)
                print(f"[Database] Successfully connected to authoritative cloud Supabase: {settings.SUPABASE_URL}")
            except Exception as e:
                print(f"[Database] Warning: Could not initialize cloud Supabase client: {e}")
                self.supabase_client = None

        # Clean relational tables (fallback store)
        self._tables: Dict[str, List[Dict[str, Any]]] = {
            "profiles": [],
            "patient_identifiers": [],
            "doctor_identifiers": [],
            "consents": [],
            "doctor_patient_relationships": [],
            "clinical_sessions": [],
            "clinical_interviews": [],
            "clinical_answers": [],
            "clinical_entities": [],
            "medical_history": [],
            "medical_documents": [],
            "document_entities": [],
            "medical_timeline": [],
            "medical_summaries": [],
            "doctor_reviews": [],
            "audit_logs": [],
            "patients": []
        }
        self._counters = {
            "PS": 0,
            "DR": 0,
            "MK": 0,
            "DK": 0
        }

    def get_next_id(self, prefix: str) -> str:
        """
        Atomically generates genuinely unique identifiers via Supabase RPC:
        Patient: PS000001, PS000002... (PS + exactly 6 digits)
        Doctor:  DR000001, DR000002... (DR + exactly 6 digits)
        """
        prefix = prefix.upper()
        if self.supabase_client:
            try:
                rpc_res = self.supabase_client.rpc("get_next_formatted_id", {"p_prefix": prefix}).execute()
                if rpc_res.data:
                    # Format as prefix + 6 digits without hyphen (e.g. PS000001, DR000001)
                    clean_id = str(rpc_res.data).replace("-", "").strip()
                    return clean_id
            except Exception as e:
                print(f"[Database] Warning: Failed RPC get_next_formatted_id: {e}")

        # Fallback local atomic generator
        with self._lock:
            if prefix not in self._counters:
                self._counters[prefix] = 0
            self._counters[prefix] += 1
            return f"{prefix}{self._counters[prefix]:06d}"

    def insert(self, table: str, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a record into the database table.
        Executes on Supabase PostgreSQL. Does NOT inject non-existent columns.
        """
        record_copy = dict(record)

        # Cloud Supabase Write
        if self.supabase_client:
            res = self.supabase_client.table(table).insert(record_copy).execute()
            if res.data and len(res.data) > 0:
                record_copy = res.data[0]

        # Sync local cache
        with self._lock:
            if table not in self._tables:
                self._tables[table] = []
            self._tables[table].append(record_copy)
            return record_copy

    def select(self, table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Select records matching filters from database table."""
        # Query Supabase PostgreSQL
        if self.supabase_client:
            try:
                query = self.supabase_client.table(table).select("*")
                if filters:
                    for k, v in filters.items():
                        query = query.eq(k, v)
                res = query.execute()
                return res.data if res.data is not None else []
            except Exception as e:
                print(f"[Database] Error selecting from {table}: {e}")
                raise e

        # Fallback in-memory store
        with self._lock:
            rows = self._tables.get(table, [])
            if not filters:
                return [dict(r) for r in rows]
            
            results = []
            for row in rows:
                match = True
                for k, v in filters.items():
                    if row.get(k) != v:
                        match = False
                        break
                if match:
                    results.append(dict(row))
            return results

    def select_one(self, table: str, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Select single record matching filters."""
        if self.supabase_client:
            try:
                query = self.supabase_client.table(table).select("*")
                for k, v in filters.items():
                    query = query.eq(k, v)
                res = query.limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                print(f"[Database] Error select_one from {table}: {e}")
                raise e

        res = self.select(table, filters)
        return res[0] if res else None

    def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Update records matching filters."""
        if self.supabase_client:
            try:
                query = self.supabase_client.table(table).update(data)
                for k, v in filters.items():
                    query = query.eq(k, v)
                res = query.execute()
                return res.data if res.data else []
            except Exception as e:
                print(f"[Database] Error updating {table}: {e}")
                raise e

        updated = []
        with self._lock:
            rows = self._tables.get(table, [])
            for row in rows:
                match = True
                for k, v in filters.items():
                    if row.get(k) != v:
                        match = False
                        break
                if match:
                    row.update(data)
                    row["updated_at"] = datetime.now(timezone.utc).isoformat()
                    updated.append(dict(row))
            return updated

    def delete(self, table: str, filters: Dict[str, Any]) -> int:
        """Delete records matching filters."""
        if self.supabase_client:
            try:
                query = self.supabase_client.table(table).delete()
                for k, v in filters.items():
                    query = query.eq(k, v)
                res = query.execute()
                return len(res.data) if res.data else 0
            except Exception as e:
                print(f"[Database] Error deleting from {table}: {e}")
                raise e

        count = 0
        with self._lock:
            if table not in self._tables:
                return 0
            original = self._tables[table]
            new_rows = []
            for row in original:
                match = True
                for k, v in filters.items():
                    if row.get(k) != v:
                        match = False
                        break
                if match:
                    count += 1
                else:
                    new_rows.append(row)
            self._tables[table] = new_rows
            return count

# Global database instance
db = MediKioskDatabase()
