"""Student AI chatbot -- reuses the admin-configured LLM (services/llm_client +
services/llm_config_service) so no new provider/key setup is needed."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from core import current_user_id, single_tenant_or_raise
from services.llm_client import call_llm_json, LlmCallError

router = APIRouter(prefix="/api/student", tags=["chat"])

SYSTEM_PROMPT = (
    "You are a friendly, encouraging study assistant inside the Coteacher learning app. "
    "Explain concepts simply for a school student, keep replies short (a few sentences "
    "or steps), and use the given chapter/topic as context when relevant. "
    'Respond with JSON only: {"answer": "<your reply>"}.'
)


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    chapter: Optional[str] = None
    topic: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, user_id: str = Depends(current_user_id)):
    single_tenant_or_raise(user_id, roles=("STUDENT", "TEACHER", "ADMIN"))

    lines = []
    if payload.chapter:
        lines.append(f"Current chapter: {payload.chapter}")
    if payload.topic:
        lines.append(f"Current topic: {payload.topic}")
    for turn in (payload.history or [])[-6:]:
        lines.append(f"{turn.role}: {turn.content}")
    lines.append(f"user: {payload.message}")

    try:
        result = call_llm_json("default", SYSTEM_PROMPT, "\n".join(lines))
        return ChatResponse(reply=result.get("answer") or "Sorry, could you rephrase that?")
    except (LlmCallError, HTTPException) as exc:
        return ChatResponse(reply=f"Sorry, I couldn't reach the study assistant right now. ({exc})")
