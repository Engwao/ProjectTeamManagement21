from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from typing import Optional
from .. import crud


# ===== 1. СОЗДАЁМ РОУТЕР =====

router = APIRouter()


# ===== 2. МОДЕЛИ ДАННЫХ (Pydantic) =====

class GroupCreate(BaseModel):
    """Создание группы со всеми полями паспорта"""
    # Регистрация команды
    name: str
    direction: Optional[str] = None

    # 1. Общая информация
    deadline: Optional[date] = None

    # 2. Участники и роли
    customer: Optional[str] = None
    project_leader: Optional[str] = None
    team: Optional[str] = None

    # 3. Цели и задачи
    goal_smart: Optional[str] = None
    tasks_text: Optional[str] = None

    # 4. Используемые инструменты
    tools: Optional[str] = None

    # 5. Ресурсы и ограничения
    budget: Optional[str] = None
    restrictions: Optional[str] = None
    risks: Optional[str] = None

    # 6. Ожидаемый результат
    product: Optional[str] = None
    kpi: Optional[str] = None


class GroupUpdate(BaseModel):
    """Обновление группы (все поля необязательные)"""
    name: Optional[str] = None
    direction: Optional[str] = None
    deadline: Optional[date] = None
    customer: Optional[str] = None
    project_leader: Optional[str] = None
    team: Optional[str] = None
    goal_smart: Optional[str] = None
    tasks_text: Optional[str] = None
    tools: Optional[str] = None
    budget: Optional[str] = None
    restrictions: Optional[str] = None
    risks: Optional[str] = None
    product: Optional[str] = None
    kpi: Optional[str] = None


class UserCreate(BaseModel):
    """Создание участника"""
    name: str
    phone: Optional[str] = None
    role: Optional[str] = None
    group_id: int


class TaskCreate(BaseModel):
    """Создание задачи"""
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    group_id: int
    stage_id: Optional[int] = None


class TaskUpdate(BaseModel):
    """Обновление статуса задачи"""
    status: str  # 'pending' или 'completed'


class StageCreate(BaseModel):
    """Создание этапа"""
    name: str
    group_id: int


class StageUpdate(BaseModel):
    """Обновление статуса этапа"""
    is_done: bool


# ===== 3. ЭНДПОИНТЫ (АДРЕСА API) =====

# ----- 3.1 ГРУППЫ -----

@router.get("/groups")
def list_groups():
    """Получить список всех групп"""
    return crud.get_all_groups()


@router.post("/groups")
def create_group(group_data: GroupCreate):
    """
    Создать группу (команду) со всеми полями паспорта.
    """
    return crud.create_group(group_data.model_dump())


@router.get("/groups/{group_id}")
def get_group(group_id: int):
    """Получить группу с деталями (участники, задачи, этапы)"""
    group = crud.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return group


@router.patch("/groups/{group_id}")
def update_group(group_id: int, group_data: GroupUpdate):
    """
    Обновить данные группы.
    Можно обновлять любые поля, остальные останутся без изменений.
    """
    existing = crud.get_group_by_id(group_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    update_data = {k: v for k, v in group_data.model_dump().items() if v is not None}
    if not update_data:
        return existing

    return crud.update_group(group_id, update_data)


@router.delete("/groups/{group_id}")
def delete_group(group_id: int):
    """Удалить группу (команду) вместе со всеми данными"""
    existing = crud.get_group_by_id(group_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    from ..database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM groups WHERE id = ?", (group_id,))
    conn.commit()
    conn.close()
    return {"message": f"Группа {group_id} удалена"}


# ----- 3.2 УЧАСТНИКИ -----

@router.post("/users")
def create_user(user_data: UserCreate):
    """Добавить участника в группу"""
    group = crud.get_group_by_id(user_data.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    return crud.add_user(
        user_data.name,
        user_data.phone,
        user_data.role,
        user_data.group_id
    )


@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    """Удалить участника"""
    return crud.delete_user(user_id)


# ----- 3.3 ЗАДАЧИ -----

@router.post("/tasks")
def create_task(task_data: TaskCreate):
    """Создать задачу"""
    return crud.add_task(
        task_data.title,
        task_data.description,
        task_data.deadline,
        task_data.group_id,
        task_data.stage_id
    )


@router.patch("/tasks/{task_id}")
def update_task(task_id: int, task_data: TaskUpdate):
    """Обновить статус задачи ('pending' или 'completed')"""
    updated = crud.update_task_status(task_id, task_data.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return updated


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    """Удалить задачу"""
    task = crud.update_task_status(task_id, 'pending')
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return crud.delete_task(task_id)


# ----- 3.4 ЭТАПЫ -----

@router.post("/stages")
def create_stage(stage_data: StageCreate):
    """Создать этап"""
    return crud.add_stage(stage_data.name, stage_data.group_id)


@router.patch("/stages/{stage_id}")
def update_stage(stage_id: int, stage_data: StageUpdate):
    """Обновить статус этапа"""
    is_done_int = 1 if stage_data.is_done else 0
    updated = crud.update_stage_status(stage_id, is_done_int)
    if not updated:
        raise HTTPException(status_code=404, detail="Этап не найден")
    return updated


@router.delete("/stages/{stage_id}")
def delete_stage(stage_id: int):
    """Удалить этап"""
    stage = crud.update_stage_status(stage_id, 0)
    if not stage:
        raise HTTPException(status_code=404, detail="Этап не найден")
    return crud.delete_stage(stage_id)


# ----- 3.5 ПРОГРЕСС -----

@router.get("/groups/{group_id}/progress")
def get_group_progress(group_id: int):
    """Получить прогресс группы"""
    group = crud.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    return crud.get_progress(group_id)