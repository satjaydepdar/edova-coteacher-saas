from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json
import psycopg

from core import db, q, current_user_id, single_tenant_or_raise

router = APIRouter(prefix="/api/resources", tags=["learning_resources"])

class ResourceCreatePayload(BaseModel):
    title: str
    description: Optional[str] = ""
    resource_type: str  # textbook, slides, worksheet, notes, formula_sheet, video
    subject_id: Optional[str] = None
    chapter_id: Optional[str] = None
    file_url: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    assigned_sections: Optional[List[str]] = []
    status: Optional[str] = "ready"

class ResourceUpdatePayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    resource_type: Optional[str] = None
    subject_id: Optional[str] = None
    chapter_id: Optional[str] = None
    file_url: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    assigned_sections: Optional[List[str]] = None
    status: Optional[str] = None

class AssignResourcePayload(BaseModel):
    section_names: List[str]
    action: Optional[str] = "assign"  # 'assign' or 'unassign'

@router.get("")
def list_resources(
    subject_id: Optional[str] = Query(None),
    chapter_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    section_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        sql = """
            SELECT 
                r.id, r.tenant_id, r.created_by, r.subject_id, r.chapter_id,
                r.title, r.description, r.resource_type, r.file_url, r.meta,
                r.assigned_sections, r.status, r.created_at, r.updated_at,
                s.name AS subject_name,
                c.name AS chapter_name
            FROM learning_resources r
            LEFT JOIN subjects s ON r.subject_id = s.id
            LEFT JOIN chapters c ON r.chapter_id = c.id
            WHERE r.tenant_id = %s
        """
        params = [tenant_id]

        if subject_id and subject_id != "ALL":
            sql += " AND r.subject_id = %s"
            params.append(subject_id)
        if chapter_id and chapter_id != "ALL":
            sql += " AND r.chapter_id = %s"
            params.append(chapter_id)
        if resource_type and resource_type != "ALL":
            sql += " AND r.resource_type = %s"
            params.append(resource_type)
        if section_name and section_name != "ALL":
            sql += " AND r.assigned_sections @> %s::jsonb"
            params.append(json.dumps([section_name]))
        if search:
            sql += " AND (r.title ILIKE %s OR r.description ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])

        sql += " ORDER BY r.created_at DESC"
        rows = q(conn, sql, params).fetchall()

        out = []
        for r in rows:
            out.append({
                "id": str(r[0]),
                "tenant_id": str(r[1]),
                "created_by": str(r[2]),
                "subject_id": str(r[3]) if r[3] else None,
                "chapter_id": str(r[4]) if r[4] else None,
                "title": r[5],
                "description": r[6] or "",
                "resource_type": r[7],
                "file_url": r[8] or "",
                "meta": r[9] or {},
                "assigned_sections": r[10] or [],
                "status": r[11],
                "created_at": r[12].isoformat() if r[12] else None,
                "updated_at": r[13].isoformat() if r[13] else None,
                "subject_name": r[14] or "General",
                "chapter_name": r[15] or "General Chapter"
            })
        return out

@router.post("", status_code=201)
def create_resource(
    payload: ResourceCreatePayload,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        row = q(conn, """
            INSERT INTO learning_resources (
                tenant_id, created_by, subject_id, chapter_id, title,
                description, resource_type, file_url, meta, assigned_sections, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at, updated_at
        """, (
            tenant_id, user_id, payload.subject_id, payload.chapter_id,
            payload.title, payload.description or "", payload.resource_type,
            payload.file_url or "", json.dumps(payload.meta or {}),
            json.dumps(payload.assigned_sections or []), payload.status or "ready"
        )).fetchone()
        conn.commit()

        return {
            "id": str(row[0]),
            "title": payload.title,
            "resource_type": payload.resource_type,
            "status": payload.status or "ready",
            "created_at": row[1].isoformat(),
            "updated_at": row[2].isoformat()
        }

@router.get("/{id}")
def get_resource_detail(
    id: str,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        row = q(conn, """
            SELECT 
                r.id, r.tenant_id, r.created_by, r.subject_id, r.chapter_id,
                r.title, r.description, r.resource_type, r.file_url, r.meta,
                r.assigned_sections, r.status, r.created_at, r.updated_at,
                s.name AS subject_name,
                c.name AS chapter_name
            FROM learning_resources r
            LEFT JOIN subjects s ON r.subject_id = s.id
            LEFT JOIN chapters c ON r.chapter_id = c.id
            WHERE r.id = %s AND r.tenant_id = %s
        """, (id, tenant_id)).fetchone()

        if not row:
            raise HTTPException(404, "Learning resource not found")

        return {
            "id": str(row[0]),
            "tenant_id": str(row[1]),
            "created_by": str(row[2]),
            "subject_id": str(row[3]) if row[3] else None,
            "chapter_id": str(row[4]) if row[4] else None,
            "title": row[5],
            "description": row[6] or "",
            "resource_type": row[7],
            "file_url": row[8] or "",
            "meta": row[9] or {},
            "assigned_sections": row[10] or [],
            "status": row[11],
            "created_at": row[12].isoformat() if row[12] else None,
            "updated_at": row[13].isoformat() if row[13] else None,
            "subject_name": row[14] or "General",
            "chapter_name": row[15] or "General Chapter"
        }

@router.put("/{id}")
def update_resource(
    id: str,
    payload: ResourceUpdatePayload,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        existing = q(conn, "SELECT id FROM learning_resources WHERE id = %s AND tenant_id = %s", (id, tenant_id)).fetchone()
        if not existing:
            raise HTTPException(404, "Resource not found")

        updates = []
        params = []

        if payload.title is not None:
            updates.append("title = %s")
            params.append(payload.title)
        if payload.description is not None:
            updates.append("description = %s")
            params.append(payload.description)
        if payload.resource_type is not None:
            updates.append("resource_type = %s")
            params.append(payload.resource_type)
        if payload.subject_id is not None:
            updates.append("subject_id = %s")
            params.append(payload.subject_id)
        if payload.chapter_id is not None:
            updates.append("chapter_id = %s")
            params.append(payload.chapter_id)
        if payload.file_url is not None:
            updates.append("file_url = %s")
            params.append(payload.file_url)
        if payload.meta is not None:
            updates.append("meta = %s")
            params.append(json.dumps(payload.meta))
        if payload.assigned_sections is not None:
            updates.append("assigned_sections = %s")
            params.append(json.dumps(payload.assigned_sections))
        if payload.status is not None:
            updates.append("status = %s")
            params.append(payload.status)

        if updates:
            updates.append("updated_at = NOW()")
            params.extend([id, tenant_id])
            q(conn, f"UPDATE learning_resources SET {', '.join(updates)} WHERE id = %s AND tenant_id = %s", params)
            conn.commit()

        return {"status": "ok", "id": id}

@router.delete("/{id}")
def delete_resource(
    id: str,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        res = q(conn, "DELETE FROM learning_resources WHERE id = %s AND tenant_id = %s RETURNING id", (id, tenant_id)).fetchone()
        if not res:
            raise HTTPException(404, "Resource not found")
        conn.commit()
        return {"status": "deleted", "id": id}

@router.post("/{id}/assign")
def assign_resource_to_sections(
    id: str,
    payload: AssignResourcePayload,
    user_id: str = Depends(current_user_id)
):
    tenant = single_tenant_or_raise(user_id, roles=("TEACHER", "ADMIN"))
    tenant_id = tenant[0]

    with db() as conn:
        row = q(conn, "SELECT assigned_sections FROM learning_resources WHERE id = %s AND tenant_id = %s", (id, tenant_id)).fetchone()
        if not row:
            raise HTTPException(404, "Resource not found")

        current_sections = set(row[0] or [])
        if payload.action == "assign":
            for sec in payload.section_names:
                current_sections.add(sec)
        else:
            for sec in payload.section_names:
                current_sections.discard(sec)

        updated_list = sorted(list(current_sections))
        status = "assigned" if len(updated_list) > 0 else "ready"

        q(conn, """
            UPDATE learning_resources 
            SET assigned_sections = %s, status = %s, updated_at = NOW() 
            WHERE id = %s AND tenant_id = %s
        """, (json.dumps(updated_list), status, id, tenant_id))
        conn.commit()

        return {
            "status": "ok",
            "id": id,
            "assigned_sections": updated_list,
            "resource_status": status
        }
