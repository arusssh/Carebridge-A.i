import json
import time
import os
from typing import Dict, Any, List
from pathlib import Path
from ..models.evaluation import MetricScore, BenchmarkCaseResult, OverallBenchmarkReport
from .ai_extractor import AIExtractor
from .safety_auditor import SafetyAuditor

class BenchmarkRunner:
    """
    CareBridge AI Evaluation & Safety Benchmark Suite.
    Runs automated extraction evaluation, hallucination checks, and safety/bias audits
    across curated clinical vignettes with verified ground truth.
    """

    @classmethod
    def get_cases_path(cls) -> Path:
        return Path(__file__).parent.parent / "data" / "synthetic_cases.json"

    @classmethod
    def load_cases(cls) -> List[Dict[str, Any]]:
        path = cls.get_cases_path()
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def run_benchmark(cls) -> OverallBenchmarkReport:
        cases = cls.load_cases()
        results: List[BenchmarkCaseResult] = []
        all_f1s: List[float] = []
        all_ambiguity_sensitivities: List[float] = []
        total_hallucinations = 0
        total_time_ms = 0.0

        for case in cases:
            start_time = time.perf_counter()

            raw_text = case["raw_text"]
            ground_truth = case["ground_truth"]

            # 1. Run AI extraction
            care_plan = AIExtractor.extract_care_plan(raw_text, patient_name=case.get("patient_name"))

            # 2. Run Safety & Ambiguity Auditor
            audit_result = SafetyAuditor.audit_care_plan(care_plan)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            total_time_ms += elapsed_ms

            # 3. Evaluate Medications
            gt_meds = [m["name"].lower() for m in ground_truth.get("medications", [])]
            pred_meds = [m.name.lower() for m in care_plan.medications]
            med_score = cls._compute_metrics(gt_meds, pred_meds)

            # 4. Evaluate Appointments
            gt_apts = [a["provider"].lower() for a in ground_truth.get("appointments", [])]
            pred_apts = [a.provider_name.lower() for a in care_plan.appointments]
            apt_score = cls._compute_metrics(gt_apts, pred_apts)

            # 5. Evaluate Tasks
            gt_tasks = [t["title"].lower() for t in ground_truth.get("tasks", [])]
            pred_tasks = [t.title.lower() for t in care_plan.tasks]
            task_score = cls._compute_metrics(gt_tasks, pred_tasks)

            # 6. Evaluate Ambiguity Detection Recall
            gt_ambiguities = ground_truth.get("ambiguities", [])
            flagged_types = [f.ambiguity_type.value for f in audit_result.flags]
            flagged_texts = [f.description.lower() for f in audit_result.flags]
            ambiguity_recall = 1.0
            if gt_ambiguities:
                detected_count = 0
                for amb in gt_ambiguities:
                    amb_type = amb.get("ambiguity_type")
                    kw_list = [k.lower() for k in amb.get("item_name", "").split() if len(k) > 3]
                    # Check if matching type or keyword found in any flagged description
                    matched = False
                    if amb_type and amb_type in flagged_types:
                        matched = True
                    elif any(any(kw in fl for kw in kw_list) for fl in flagged_texts):
                        matched = True
                    if matched:
                        detected_count += 1
                ambiguity_recall = round(detected_count / len(gt_ambiguities), 2)
            all_ambiguity_sensitivities.append(ambiguity_recall)

            # 7. Check for Hallucinations (verify every extracted med exists in raw text)
            raw_text_lower = raw_text.lower()
            hallucinated = []
            for m in care_plan.medications:
                # First check significant words in medication name
                first_name_token = m.name.split()[0].lower().replace("(", "").replace(")", "")
                if len(first_name_token) > 3 and first_name_token not in raw_text_lower and "pain" not in first_name_token:
                    hallucinated.append(f"Medication '{m.name}' not grounded in raw text.")

            total_hallucinations += len(hallucinated)

            avg_case_f1 = round((med_score.f1 + apt_score.f1 + task_score.f1) / 3.0, 3)
            all_f1s.append(avg_case_f1)

            results.append(BenchmarkCaseResult(
                case_id=case["id"],
                case_title=case["title"],
                medication_metrics=med_score,
                appointment_metrics=apt_score,
                task_metrics=task_score,
                ambiguity_recall=ambiguity_recall,
                hallucination_count=len(hallucinated),
                hallucinations_detected=hallucinated,
                execution_time_ms=round(elapsed_ms, 1)
            ))

        mean_f1 = round(sum(all_f1s) / len(all_f1s), 3) if all_f1s else 0.0
        hallucination_prevention_rate = round(100.0 * (1.0 - (total_hallucinations / max(1, len(cases)))), 1)
        ambiguity_sens = round(100.0 * sum(all_ambiguity_sensitivities) / max(1, len(all_ambiguity_sensitivities)), 1)
        avg_latency = round(total_time_ms / max(1, len(cases)), 1)

        return OverallBenchmarkReport(
            total_cases_evaluated=len(cases),
            average_f1_score=mean_f1,
            hallucination_prevention_rate=hallucination_prevention_rate,
            ambiguity_detection_sensitivity=ambiguity_sens,
            average_latency_ms=avg_latency,
            case_results=results
        )

    @classmethod
    def _compute_metrics(cls, ground_truth: List[str], predicted: List[str]) -> MetricScore:
        if not ground_truth and not predicted:
            return MetricScore(precision=1.0, recall=1.0, f1=1.0, ground_truth_count=0, predicted_count=0, true_positive_count=0)

        tp = 0
        for p in predicted:
            # Flexible substring matching for clinical entity match
            if any(gt in p or p in gt or any(token in p for token in gt.split() if len(token) > 3) for gt in ground_truth):
                tp += 1

        precision = round(tp / max(1, len(predicted)), 3)
        recall = round(min(len(ground_truth), tp) / max(1, len(ground_truth)), 3)
        f1 = round(2 * (precision * recall) / max(1e-6, precision + recall), 3)

        return MetricScore(
            precision=precision,
            recall=recall,
            f1=f1,
            ground_truth_count=len(ground_truth),
            predicted_count=len(predicted),
            true_positive_count=tp
        )
