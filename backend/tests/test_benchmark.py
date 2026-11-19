import pytest
from backend.app.services.benchmark_runner import BenchmarkRunner

def test_benchmark_runner_executes_all_cases():
    report = BenchmarkRunner.run_benchmark()
    assert report.total_cases_evaluated == 5
    assert report.average_f1_score > 0.65
    assert report.hallucination_prevention_rate == 100.0
    assert report.ambiguity_detection_sensitivity == 100.0
    assert len(report.case_results) == 5
    for c in report.case_results:
        assert c.execution_time_ms > 0
        assert c.medication_metrics.f1 > 0
