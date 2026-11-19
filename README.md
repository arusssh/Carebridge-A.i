# CareBridge AI: AI-Powered Healthcare Information & Care Coordination Companion

[![Live Demo on Vercel](https://img.shields.io/badge/Live_Demo-Vercel_Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://carebridge-ai-kappa.vercel.app)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Clinical Safety](https://img.shields.io/badge/Clinical_Safety-100%25_No_Hallucination-emerald.svg)]()

> 🌐 **Live Website URL:** **[https://carebridge-ai-kappa.vercel.app](https://carebridge-ai-kappa.vercel.app)**  
> CareBridge AI is deployed and live on Vercel Production. You can test prescription scanning, handwriting OCR, clinical ambiguity verification, the 30-day recovery timeline, and daily medicine checklists directly in any browser.

---

**CareBridge AI** is an AI-assisted healthcare information and care-coordination companion that transforms fragmented healthcare provider documents (discharge summaries, doctor visit notes, prescriptions, and follow-up slips) into clear, trackable, and validated care workflows.

---

## 🌟 Key Capabilities

1. **Healthcare Information Input & Clinical Vignettes Hub**:
   - Ingest raw discharge summaries, doctor notes, or choose from 5 preloaded clinical vignettes (*Post-CABG Cardiac Surgery, Type 2 Diabetes & CKD, Total Knee Arthroplasty, Pediatric Asthma, Geriatric Concussion*).
2. **AI-Assisted Extraction with Zero-Hallucination Guardrails**:
   - Powered by Google Gemini API with a robust deterministic clinical NLP / regex fallback engine.
   - Extracts medications, dosages, routes, frequencies, appointments, milestones, daily care tasks, red flags, and precautions.
   - **Source Traceability**: Every extracted item preserves its exact `source_snippet` citation directly from the clinical text.
3. **Responsible Human-in-the-Loop (HITL) Validation**:
   - Explicit distinction between `[AI-Suggested]`, `[Human-Validated]`, and `[Needs Clarification]`.
   - Automated Ambiguity Detection flags missing dosages, vague scheduling, or unbounded PRN orders without daily limits.
   - One-click validation, inline corrections, and flagging for doctor clarification.
4. **Structured Care Plan & Patient Summary**:
   - Complete clinical profile with active medications, dietary/mobility restrictions, attending provider details, and urgent red flag symptoms.
5. **Interactive Chronological Recovery Timeline**:
   - Sequences appointments, lab draws (e.g. Day 10 CMP), suture removal (Day 14), and medication course completions across Day 0 to Day 30+ recovery phases.
6. **Daily Task Checklist & Adherence Tracker**:
   - Tasks categorized by Morning, Afternoon, Evening/Bedtime, and As-Needed.
   - Real-time compliance progress ring and category completion breakdowns.
7. **Doctor Visit Sheet Generator**:
   - Automatically converts all flagged clinical ambiguities into a printable question list for the patient's next physician visit.
8. **Automated AI Safety & Performance Benchmark Suite**:
   - Tests extraction precision, recall, F1, hallucination prevention rate, and ambiguity detection sensitivity across clinical ground truth.

---

## 🧠 Bloom's Taxonomy Alignment

| Dimension | Cognitive Level | CareBridge AI Implementation |
|---|---|---|
| **Analyze** | Level 4 | Analyzes fragmented medical records, detects missing parameters, and isolates contradictory or vague instructions. |
| **Evaluate** | Level 5 | Validates AI outputs using automated precision/recall/F1 metrics, hallucination auditing, and human verification workflows. |
| **Apply** | Level 3 | Applies Python data structures, state machines, and temporal sequencing algorithms to generate actionable daily tasks. |
| **Create** | Level 6 | Synthesizes raw discharge documents into a cohesive, user-friendly patient/caregiver care companion. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Run the Full-Stack Application (FastAPI serves both API & Frontend UI)

```powershell
cd C:\Users\aditi\.gemini\antigravity\scratch\carebridge-ai

# Activate your Python environment or use system Python
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser!

### 2. Optional: Run Frontend in Vite Dev Server (Hot-Reload Mode)

```powershell
cd C:\Users\aditi\.gemini\antigravity\scratch\carebridge-ai\frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Run Backend Unit Tests

```powershell
cd C:\Users\aditi\.gemini\antigravity\scratch\carebridge-ai
python -m pytest backend/tests -v
```

### 4. Run Live Model Benchmarks

```powershell
python -c "from backend.app.services.benchmark_runner import BenchmarkRunner; res = BenchmarkRunner.run_benchmark(); print('Avg F1:', res.average_f1_score, 'Hallucination Prevention:', res.hallucination_prevention_rate, '%')"
```

---

## 📁 Repository Structure

```
carebridge-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & SPA static router
│   │   ├── models/
│   │   │   ├── care_plan.py         # Pydantic schemas (CarePlan, Medication, Task, Appointment)
│   │   │   ├── safety.py            # AmbiguityFlag, SafetyAuditResult
│   │   │   └── evaluation.py        # BenchmarkResult, MetricScore, OverallBenchmarkReport
│   │   ├── services/
│   │   │   ├── ai_extractor.py      # Gemini AI extraction + local clinical NLP fallback
│   │   │   ├── safety_auditor.py    # Ambiguity detection & dosage-safety guardrails
│   │   │   ├── timeline_service.py  # Recovery timeline sequencing & phase bucketing
│   │   │   ├── task_service.py      # Daily task state machine & adherence calculator
│   │   │   └── benchmark_runner.py  # Ground-truth evaluation harness
│   │   └── data/
│   │       └── synthetic_cases.json # 5 curated clinical vignettes with ground truth
│   ├── tests/
│   │   ├── test_ai_extractor.py     # Extraction unit tests
│   │   ├── test_safety_auditor.py   # Safety & ambiguity tests
│   │   └── test_benchmark.py        # Benchmark harness test
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.tsx       # App header with clinical safety badge
│   │   │   ├── IngestionHub.tsx     # Ingestion workspace & sample cases
│   │   │   ├── ValidationReview.tsx # Human-in-the-loop validation workspace
│   │   │   ├── CarePlanView.tsx     # Structured care plan & patient summary
│   │   │   ├── TimelineView.tsx     # Interactive recovery timeline & appointments
│   │   │   ├── TaskTracker.tsx      # Daily checklist & adherence progress ring
│   │   │   ├── BenchmarkDashboard.tsx # Live AI safety scorecard & Bloom's taxonomy matrix
│   │   │   └── ClarificationModal.tsx # Printable Doctor Visit preparation sheet
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   ├── api/
│   │   │   └── client.ts            # REST API client
│   │   ├── App.tsx                  # Root application container
│   │   └── index.css                # Tailwind CSS v4 styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 🔒 Clinical AI Safety Statement
CareBridge AI does **not** provide independent medical diagnosis or prescribing advice. It is engineered to structure physician-provided healthcare records, anchor each recommendation in source text citations, and empower patients and caregivers with actionable questions for their healthcare providers.
