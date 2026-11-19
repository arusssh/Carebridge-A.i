import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware

from .models.care_plan import (
    CarePlan,
    IngestDocumentRequest,
    ValidateItemRequest,
    UpdateTaskStatusRequest,
    ValidationStatus,
    TaskStatus
)
from .models.safety import SafetyAuditResult
from .models.evaluation import OverallBenchmarkReport
from .models.caregiver import CareCircle, CaregiverMember, CareActivityLogItem
from .models.notification import (
    NotificationMessage,
    SendNotificationRequest,
    NotificationReplyRequest,
    NotificationChannel
)

from .services.ai_extractor import AIExtractor
from .services.safety_auditor import SafetyAuditor
from .services.timeline_service import TimelineService
from .services.task_service import TaskService
from .services.benchmark_runner import BenchmarkRunner
from .services.document_parser import DocumentParser
from .services.caregiver_service import CaregiverService
from .services.notification_service import NotificationService

app = FastAPI(
    title="CareBridge AI API",
    description="AI-Assisted Healthcare Information & Care Coordination Companion Backend",
    version="1.0.0"
)

# CORS setup for web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (with fallback persistence)
CARE_PLANS: Dict[str, CarePlan] = {}
SAFETY_AUDITS: Dict[str, SafetyAuditResult] = {}

def get_cases() -> List[Dict[str, Any]]:
    path = Path(__file__).parent / "data" / "synthetic_cases.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/api/health")
def api_health():
    return {
        "app": "CareBridge AI",
        "status": "online",
        "description": "Healthcare Information & Care Coordination Companion",
        "endpoints": [
            "/api/presets",
            "/api/ingest",
            "/api/careplan/{plan_id}",
            "/api/benchmark/run"
        ]
    }

@app.get("/api/presets")
def list_presets():
    """List available synthetic clinical vignettes for instant ingestion & testing."""
    cases = get_cases()
    return [
        {
            "id": c["id"],
            "title": c["title"],
            "category": c["category"],
            "patient_name": c["patient_name"],
            "patient_age": c["patient_age"],
            "preview": c["raw_text"][:220] + "..."
        }
        for c in cases
    ]

@app.get("/api/presets/{preset_id}")
def get_preset(preset_id: str):
    cases = get_cases()
    for c in cases:
        if c["id"] == preset_id:
            return c
    raise HTTPException(status_code=404, detail="Preset case not found")

@app.post("/api/ingest")
def ingest_document(req: IngestDocumentRequest):
    """
    Ingest a healthcare document (raw text or preset),
    runs AI extraction, runs safety audit, and stores the resulting care plan.
    """
    raw_text = req.raw_text
    patient_name = req.patient_name

    # If preset_id provided, fetch raw text if missing
    if req.preset_id and (not raw_text or len(raw_text.strip()) < 10):
        cases = get_cases()
        for c in cases:
            if c["id"] == req.preset_id:
                raw_text = c["raw_text"]
                patient_name = c["patient_name"]
                break

    if not raw_text or len(raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Document text is empty or too short.")

    # 1. AI Extraction
    care_plan = AIExtractor.extract_care_plan(raw_text, patient_name=patient_name, preset_id=req.preset_id)

    # 2. Safety & Ambiguity Audit
    audit_result = SafetyAuditor.audit_care_plan(care_plan)

    # Store in memory
    CARE_PLANS[care_plan.id] = care_plan
    SAFETY_AUDITS[care_plan.id] = audit_result

    # Compute timeline & adherence
    timeline = TimelineService.generate_timeline(care_plan)
    adherence = TaskService.compute_adherence(care_plan)

    return {
        "care_plan": care_plan,
        "safety_audit": audit_result,
        "timeline": timeline,
        "adherence": adherence
    }

@app.get("/api/careplan/{plan_id}")
def get_care_plan(plan_id: str):
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")
    
    plan = CARE_PLANS[plan_id]
    audit = SAFETY_AUDITS.get(plan_id) or SafetyAuditor.audit_care_plan(plan)
    timeline = TimelineService.generate_timeline(plan)
    adherence = TaskService.compute_adherence(plan)

    return {
        "care_plan": plan,
        "safety_audit": audit,
        "timeline": timeline,
        "adherence": adherence
    }

@app.post("/api/careplan/{plan_id}/validate")
def validate_item(plan_id: str, req: ValidateItemRequest):
    """
    Responsible Human-in-the-Loop Validation Endpoint:
    Allows patient/caregiver to approve, modify, or flag extracted items.
    """
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")

    plan = CARE_PLANS[plan_id]

    target = None
    if req.item_type == "medication":
        for med in plan.medications:
            if med.id == req.item_id:
                target = med
                if req.updated_fields:
                    for k, v in req.updated_fields.items():
                        if hasattr(med, k):
                            setattr(med, k, v)
                med.validation_status = req.new_status
                if req.clarification_note:
                    med.clarification_note = req.clarification_note
                break

    elif req.item_type == "appointment":
        for apt in plan.appointments:
            if apt.id == req.item_id:
                target = apt
                if req.updated_fields:
                    for k, v in req.updated_fields.items():
                        if hasattr(apt, k):
                            setattr(apt, k, v)
                apt.validation_status = req.new_status
                if req.clarification_note:
                    apt.clarification_note = req.clarification_note
                break

    elif req.item_type == "task":
        for tsk in plan.tasks:
            if tsk.id == req.item_id:
                target = tsk
                if req.updated_fields:
                    for k, v in req.updated_fields.items():
                        if hasattr(tsk, k):
                            setattr(tsk, k, v)
                tsk.validation_status = req.new_status
                if req.clarification_note:
                    tsk.clarification_note = req.clarification_note
                break

    if not target:
        raise HTTPException(status_code=404, detail=f"Item {req.item_id} not found in care plan")

    # Re-run safety audit with updated validation states
    updated_audit = SafetyAuditor.audit_care_plan(plan)
    SAFETY_AUDITS[plan_id] = updated_audit

    return {
        "status": "success",
        "updated_item": target,
        "safety_audit": updated_audit
    }

@app.post("/api/careplan/{plan_id}/tasks/{task_id}/status")
def update_task_status(plan_id: str, task_id: str, req: UpdateTaskStatusRequest):
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")

    plan = CARE_PLANS[plan_id]
    try:
        updated_task = TaskService.update_task_status(plan, task_id, req.status, req.completion_notes)
        adherence = TaskService.compute_adherence(plan)
        return {
            "status": "success",
            "task": updated_task,
            "adherence": adherence
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/careplan/{plan_id}/timeline")
def get_timeline(plan_id: str):
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")
    return TimelineService.generate_timeline(CARE_PLANS[plan_id])

@app.get("/api/careplan/{plan_id}/clarifications")
def get_doctor_questions(plan_id: str):
    """
    Returns an export-ready questionnaire sheet of all ambiguous or unverified items
    for the patient/caregiver to take to their next doctor visit.
    """
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")

    audit = SAFETY_AUDITS.get(plan_id) or SafetyAuditor.audit_care_plan(CARE_PLANS[plan_id])
    plan = CARE_PLANS[plan_id]

    questions = []
    for flag in audit.flags:
        questions.append({
            "category": flag.item_type.upper(),
            "severity": flag.severity,
            "question": flag.suggested_clarification_question,
            "context": flag.description,
            "source_snippet": flag.source_snippet
        })

    return {
        "patient_name": plan.patient_name,
        "primary_physician": plan.primary_physician,
        "questions_count": len(questions),
        "questions": questions
    }

@app.post("/api/benchmark/run")
def run_benchmark():
    """
    Executes automated benchmark evaluation on synthetic clinical test cases,
    measuring Precision, Recall, F1, Hallucination Prevention Rate, and Ambiguity Detection.
    """
    report = BenchmarkRunner.run_benchmark()
    return report

# --- OPTION 1: DOCUMENT UPLOAD & CAMERA SCANNING (OCR) ---
@app.post("/api/upload-document")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    """
    Accepts PDF or Image uploads (smartphone photos, prescription scans),
    extracts text via OCR/Vision (with advanced handwriting deciphering),
    and generates a structured care plan.
    """
    effective_api_key = api_key or request.headers.get("x-gemini-api-key") or os.environ.get("GEMINI_API_KEY")

    file_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    content_type = file.content_type or ""

    if filename.lower().endswith(".pdf") or "pdf" in content_type:
        parse_result = DocumentParser.parse_pdf(file_bytes, filename)
    else:
        parse_result = DocumentParser.parse_image(
            file_bytes, 
            filename, 
            content_type, 
            api_key=effective_api_key
        )

    if not parse_result.get("success") or not parse_result.get("text"):
        raise HTTPException(status_code=400, detail=parse_result.get("error", "Unable to extract text from file."))

    raw_text = parse_result["text"]

    # Run AI Extraction & Safety Audit
    care_plan = AIExtractor.extract_care_plan(
        raw_text, 
        patient_name=patient_name, 
        api_key=effective_api_key
    )
    audit_result = SafetyAuditor.audit_care_plan(care_plan)

    CARE_PLANS[care_plan.id] = care_plan
    SAFETY_AUDITS[care_plan.id] = audit_result

    # Initialize caregiver circle
    CaregiverService.get_or_create_circle(care_plan.id, care_plan.patient_name)

    timeline = TimelineService.generate_timeline(care_plan)
    adherence = TaskService.compute_adherence(care_plan)

    return {
        "care_plan": care_plan,
        "safety_audit": audit_result,
        "timeline": timeline,
        "adherence": adherence,
        "parsed_metadata": {
            "filename": filename,
            "file_type": parse_result.get("file_type"),
            "engine": parse_result.get("engine", "CareBridge Handwriting Engine"),
            "is_handwriting_optimized": parse_result.get("is_handwriting_optimized", True),
            "page_count": parse_result.get("page_count", 1),
            "char_count": parse_result.get("char_count", len(raw_text))
        }
    }

# --- GEMINI VISION MODEL CONFIGURATION ---
@app.get("/api/config/gemini-key")
def get_gemini_config():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    return {
        "has_key": bool(api_key),
        "key_preview": f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "",
        "active_model": "Google Gemini 2.5 Flash Multimodal Vision",
        "supported_models": ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    }

@app.post("/api/config/gemini-key")
def set_gemini_config(req: Dict[str, str]):
    key = req.get("api_key", "").strip()
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    lines = []
    if env_path.exists():
        with open(env_path, "r") as f:
            lines = [l for l in f if not l.startswith("GEMINI_API_KEY=")]

    if key:
        os.environ["GEMINI_API_KEY"] = key
        lines.append(f"GEMINI_API_KEY={key}\n")
        with open(env_path, "w") as f:
            f.writelines(lines)
        return {
            "status": "success",
            "has_key": True,
            "message": "Connected to Google Gemini 2.5 Flash Vision. Handwriting OCR will now use latest Gemini vision models."
        }
    else:
        os.environ.pop("GEMINI_API_KEY", None)
        with open(env_path, "w") as f:
            f.writelines(lines)
        return {
            "status": "success",
            "has_key": False,
            "message": "Gemini API key disconnected. System reverted to local computer vision handwriting engine."
        }

# --- OPTION 4: CAREGIVER MULTI-USER SYNC & CARE CIRCLE ---
@app.get("/api/careplan/{plan_id}/circle")
def get_care_circle(plan_id: str):
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")
    plan = CARE_PLANS[plan_id]
    return CaregiverService.get_or_create_circle(plan_id, plan.patient_name)

@app.post("/api/careplan/{plan_id}/circle/member")
def add_caregiver_member(plan_id: str, member: CaregiverMember):
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")
    circle = CaregiverService.add_member(plan_id, member)
    return circle

@app.post("/api/careplan/{plan_id}/circle/activity")
def log_caregiver_activity(
    plan_id: str,
    actor_name: str = Form(...),
    actor_role: str = Form(...),
    action_type: str = Form(...),
    description: str = Form(...),
    item_id: Optional[str] = Form(None)
):
    if plan_id not in CARE_PLANS:
        raise HTTPException(status_code=404, detail="Care plan not found")
    circle = CaregiverService.log_activity(plan_id, actor_name, actor_role, action_type, description, item_id)
    return circle

# --- OPTION 2: NOTIFICATIONS & SMS / WHATSAPP SIMULATOR ---
@app.get("/api/notifications")
def get_notifications():
    return NotificationService.get_all_messages()

@app.post("/api/notifications/send")
def send_notification(req: SendNotificationRequest):
    msg = NotificationService.send_notification(req)
    return msg

@app.post("/api/notifications/reply")
def reply_notification(req: NotificationReplyRequest):
    msg = NotificationService.process_reply(req.notification_id, req.reply_text)
    if not msg:
        raise HTTPException(status_code=404, detail="Notification not found")

    # If the notification was linked to a task, complete the task automatically!
    if msg.task_id:
        for plan_id, plan in CARE_PLANS.items():
            for t in plan.tasks:
                if t.id == msg.task_id:
                    TaskService.update_task_status(plan, t.id, TaskStatus.COMPLETED, f"Confirmed via two-way {msg.channel} reply: '{req.reply_text}'")
                    CaregiverService.log_activity(
                        plan_id,
                        msg.recipient_name,
                        "Patient (via SMS)",
                        "TASK_COMPLETED",
                        f"Patient confirmed task '{t.title}' via 2-way {msg.channel}.",
                        t.id
                    )
                    break

    return {"status": "success", "message": msg}


# Mount static build files from frontend/dist if built
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to pass through
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
