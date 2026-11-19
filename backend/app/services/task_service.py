from datetime import datetime
from typing import Dict, Any, List
from ..models.care_plan import CarePlan, TaskStatus, CareTaskItem

class TaskService:
    """
    CareBridge AI Task Management & Adherence Tracker.
    """

    @classmethod
    def update_task_status(cls, care_plan: CarePlan, task_id: str, new_status: TaskStatus, notes: str = None) -> CareTaskItem:
        for task in care_plan.tasks:
            if task.id == task_id:
                task.status = new_status
                if notes:
                    task.completion_notes = notes
                if new_status == TaskStatus.COMPLETED:
                    task.completed_at = datetime.utcnow().isoformat()
                else:
                    task.completed_at = None
                care_plan.updated_at = datetime.utcnow().isoformat()
                return task
        raise ValueError(f"Task with ID {task_id} not found in care plan.")

    @classmethod
    def compute_adherence(cls, care_plan: CarePlan) -> Dict[str, Any]:
        total = len(care_plan.tasks)
        if total == 0:
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0,
                "in_progress_tasks": 0,
                "adherence_rate": 100.0,
                "categories": {}
            }

        completed = sum(1 for t in care_plan.tasks if t.status == TaskStatus.COMPLETED)
        in_progress = sum(1 for t in care_plan.tasks if t.status == TaskStatus.IN_PROGRESS)
        pending = sum(1 for t in care_plan.tasks if t.status == TaskStatus.PENDING)

        adherence_rate = round((completed / total) * 100.0, 1)

        cat_breakdown = {}
        for t in care_plan.tasks:
            cat_name = t.category.value
            if cat_name not in cat_breakdown:
                cat_breakdown[cat_name] = {"total": 0, "completed": 0}
            cat_breakdown[cat_name]["total"] += 1
            if t.status == TaskStatus.COMPLETED:
                cat_breakdown[cat_name]["completed"] += 1

        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "adherence_rate": adherence_rate,
            "categories": cat_breakdown
        }
