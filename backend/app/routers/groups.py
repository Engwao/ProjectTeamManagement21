from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from typing import Optional

from .. import crud

# ===== 1. СОЗДАЁМ РОУТЕР =====

router = APIRouter()


# ===== 2. МОДЕЛИ ДАННЫХ (Pydantic) =====

class GroupCreate(BaseModel):
    """
    Модель для создания группы.
    """
    name: str

class UserCreate(BaseModel):
    """
    Модель для создания участника.
    """
    name: str
    role: str
    group_id: int

class TaskCreate(BaseModel):
    """
    Модель для создания задачи.
    """
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    group_id: int

class TaskUpdate(BaseModel):
    """
    Модель для обновления статуса задачи.
    """
    status: str

class StageCreate(BaseModel):
    """
    Модель для создания этапа.
    """
    name: str
    group_id: int

class StageUpdate(BaseModel):
    """
    Модель для обновления статуса этапа.
    """
    is_done: bool


# ===== 3. ЭНДПОИНТЫ (АДРЕСА API) =====

# ----- 3.1 ГРУППЫ -----

@router.get("/groups")
def list_groups():
    """
    GET /groups
    Получить список всех групп.
    """
    return crud.get_all_groups()

@router.post("/groups")
def create_group(group_data: GroupCreate):
    """
    POST /groups
    Создать новую группу.
    """
    return crud.create_group(group_data.name)

@router.get("/groups/{group_id}")
def get_group(group_id: int):
    """
    GET /groups/1
    Получить одну группу со всеми её данными (участники, задачи, этапы).
    """
    group = crud.get_group_by_id(group_id)

    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    return group


# ----- 3.2 УЧАСТНИКИ -----

@router.post("/users")
def create_user(user_data: UserCreate):
    """
    POST /users
    Добавить участника в группу.
    """
    group = crud.get_group_by_id(user_data.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    return crud.add_user(
        user_data.name,
        user_data.role,
        user_data.group_id
    )


# ----- 3.3 ЗАДАЧИ -----

@router.post("/tasks")
def create_task(task_data: TaskCreate):
    """
    POST /tasks
    Создать новую задачу.
    """
    return crud.add_task(
        task_data.title,
        task_data.description,
        task_data.deadline,
        task_data.group_id
    )

@router.patch("/tasks/{task_id}")
def update_task(task_id: int, task_data: TaskUpdate):
    """
    PATCH /tasks/1
    Обновить статус задачи.
    """
    updated_task = crud.update_task_status(task_id, task_data.status)

    if not updated_task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    return updated_task


# ----- 3.4 ЭТАПЫ -----

@router.post("/stages")
def create_stage(stage_data: StageCreate):
    """
    POST /stages
    Создать новый этап.
    """
    return crud.add_stage(stage_data.name, stage_data.group_id)

@router.patch("/stages/{stage_id}")
def update_stage(stage_id: int, stage_data: StageUpdate):
    """
    PATCH /stages/1
    Отметить этап выполненным или невыполненным.
    """
    is_done_int = 1 if stage_data.is_done else 0

    updated_stage = crud.update_stage_status(stage_id, is_done_int)

    if not updated_stage:
        raise HTTPException(status_code=404, detail="Этап не найден")

    return updated_stage


# ----- 3.5 ПРОГРЕСС -----

@router.get("/groups/{group_id}/progress")
def get_group_progress(group_id: int):
    """
    GET /groups/1/progress
    Получить прогресс группы (сколько задач выполнено, сколько всего).
    """
    group = crud.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    return crud.get_progress(group_id)