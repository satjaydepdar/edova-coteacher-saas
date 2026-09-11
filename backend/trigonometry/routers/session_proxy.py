import os
import httpx
from fastapi import APIRouter, Header, HTTPException
from core import current_principal

REASONING_ENGINE_URL = os.getenv("REASONING_ENGINE_URL", "http://127.0.0.1:8000")

router = APIRouter(prefix="/api/trig/session", tags=["Trigonometry Reasoning Engine Session Proxy"])

@router.post("/init")
async def init_session(payload: dict, authorization: str = Header(...)):
    """
    Proxies problem initialization to the dedicated Neuro-Symbolic Reasoning Engine Service (edova-reasoner).
    Automatically derives student_id and school_id from verified JWT token.
    """
    principal = current_principal(authorization)
    student_id = principal.get("user_id") or f"device:{principal.get('key_id')}"
    school_id = str(principal.get("tenant_id") or "default_school")
    
    forward_payload = {
        "problem_text": payload.get("problem_text"),
        "student_id": student_id,
        "school_id": school_id,
        "initial_sal": payload.get("initial_sal", 1.0)
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(f"{REASONING_ENGINE_URL}/api/v1/session/init", json=forward_payload)
            if res.status_code != 200:
                detail = "Reasoning engine error"
                try:
                    detail = res.json().get("detail", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=res.status_code, detail=detail)
            return res.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503, 
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable. Please ensure it is running on port 8000."
            )

@router.post("/step")
async def submit_step(payload: dict, authorization: str = Header(...)):
    """
    Proxies step submission to the dedicated Neuro-Symbolic Reasoning Engine Service (edova-reasoner).
    """
    _ = current_principal(authorization)
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(f"{REASONING_ENGINE_URL}/api/v1/session/step", json=payload)
            if res.status_code != 200:
                detail = "Reasoning engine step error"
                try:
                    detail = res.json().get("detail", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=res.status_code, detail=detail)
            return res.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503, 
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable."
            )

@router.get("/{session_id}")
async def get_session(session_id: str, authorization: str = Header(...)):
    """
    Fetches active session state from the Reasoning Engine Service.
    """
    _ = current_principal(authorization)
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(f"{REASONING_ENGINE_URL}/api/v1/session/{session_id}")
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Session not found")
            return res.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=503, 
                detail=f"Reasoning Engine Service (edova-reasoner at {REASONING_ENGINE_URL}) is currently unreachable."
            )
