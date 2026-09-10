import os
import time
import json
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import db
from app.core.security import get_current_user
from app.ai.gemini_service import GeminiClinicalService

router = APIRouter(prefix="/ai", tags=["Gemini Live & Voice Assistant"])
gemini_service = GeminiClinicalService()

class LiveTokenResponse(BaseModel):
    token: str
    expire_time: str
    websocket_url: str
    model: str

@router.post("/live-token", response_model=LiveTokenResponse)
async def generate_gemini_live_token(current_user: dict = Depends(get_current_user)):
    """
    Generates a secure, short-lived ephemeral token for client-side Gemini Live WebSocket streaming.
    Protects the permanent GEMINI_API_KEY from ever being exposed to the Android APK or frontend JS.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API Key is not configured on the backend server."
        )

    # Ephemeral token valid for 30 minutes
    expire_dt = datetime.now(timezone.utc) + timedelta(minutes=30)
    expire_iso = expire_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    url = "https://generativelanguage.googleapis.com/v1beta/auth_tokens"
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "uses": 1,
        "expireTime": expire_iso
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_tok = data.get("name", "") or data.get("token", "")
                tok_value = raw_tok.replace("authTokens/", "")
                ws_url = (
                    f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained"
                    f"?access_token={tok_value}"
                )
                return LiveTokenResponse(
                    token=tok_value,
                    expire_time=expire_iso,
                    websocket_url=ws_url,
                    model="gemini-2.0-flash-exp"
                )
            else:
                err_text = resp.text
                print(f"[Gemini Live] Ephemeral token API response: {resp.status_code} - {err_text}")
                # If auth_tokens API is not enabled or fails, provide informative error
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Google Gemini Live Auth service returned {resp.status_code}: {err_text}"
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Google Generative Language API: {str(e)}"
            )

@router.post("/voice-transcribe")
async def transcribe_clinical_voice(
    audio: UploadFile = File(...),
    question_field: str = Form("chief_complaint"),
    question_text: str = Form(""),
    language: str = Form("en"),
    current_user: dict = Depends(get_current_user)
):
    """
    Multimodal audio intake endpoint.
    Accepts audio recording from patient microphone, transcribes via Google Gemini,
    and extracts structured clinical entities.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API Key is not configured on the backend server."
        )

    content = await audio.read()
    mime_type = audio.content_type or "audio/webm"

    # Attempt transcription and entity extraction via modern google.genai or generativeai
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)

        prompt = (
            f"You are a clinical NLP engine in an OPD hospital kiosk.\n"
            f"Question asked to patient: '{question_text}' (Field: {question_field})\n"
            f"Patient language: {language}\n"
            f"Listen to the attached audio recording of the patient speaking.\n"
            f"1. Transcribe the patient's spoken words verbatim in English (or translated to English if vernacular).\n"
            f"2. Extract the clinical fact matching the question field.\n"
            f"Return ONLY a valid JSON object matching: "
            f'{{"transcription": "<verbatim words>", "clinical_answer": "<concise extracted clinical fact>", "confidence": 0.95}}'
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=content, mime_type=mime_type),
                prompt
            ]
        )

        raw_text = response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(raw_text)
        return {
            "status": "success",
            "transcription": parsed.get("transcription", ""),
            "clinical_answer": parsed.get("clinical_answer", parsed.get("transcription", "")),
            "confidence": parsed.get("confidence", 0.95),
            "field": question_field
        }
    except Exception as e:
        print(f"[Gemini Voice] Transcription note: {e}")
        # Secondary fallback with gemini_service if available
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            model = legacy_genai.GenerativeModel("gemini-1.5-flash")
            part = {"mime_type": mime_type, "data": content}
            resp = model.generate_content([
                f"Transcribe and extract clinical answer for {question_field}: {question_text}. Return valid JSON: {{\"transcription\": \"...\", \"clinical_answer\": \"...\"}}",
                part
            ])
            t = resp.text.strip()
            if "```json" in t:
                t = t.split("```json")[1].split("```")[0].strip()
            return json.loads(t)
        except Exception as e2:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Gemini Voice processing failed: {str(e2)}"
            )
