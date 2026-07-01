import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="ProjectTeamManagement21")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "database.json"


# --- СХЕМЫ ДАННЫХ (Pydantic) ---

class GroupCreate(BaseModel):
    name: str
    direction: str


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    direction: Optional[str] = None
    deadline: Optional[str] = None
    customer: Optional[str] = None
    project_leader: Optional[str] = None
    team: Optional[str] = None
    kpi: Optional[str] = None
    product: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    phone: str
    role: str
    group_id: int


class StageCreate(BaseModel):
    name: str
    group_id: int


class StageUpdate(BaseModel):
    is_done: bool


class TaskCreate(BaseModel):
    title: str
    description: str
    status: str  # 'pending' или 'completed'
    group_id: int
    stage_id: Optional[int] = None


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    stage_id: Optional[int] = None


# --- РАБОТА С БАЗОЙ ДАННЫХ (Файловая БД) ---

def read_db() -> dict:
    if not os.path.exists(DB_FILE):
        # Начальная инициализация демонстрационными данными
        initial_data = {
            "groups": [
                {"id": 1, "name": "Альфа-Разработчики", "direction": "Web-разработка", "deadline": "2026-12-31",
                 "customer": "ООО Спектр", "project_leader": "Иван Иванов", "team": "Команда 1",
                 "kpi": "Завершить в срок", "product": "CRM Система"}
            ],
            "users": [
                {"id": 1, "name": "Алексей Смирнов", "phone": "+7 (999) 111-22-33", "role": "Тимлид / Backend",
                 "group_id": 1},
                {"id": 2, "name": "Мария Петрова", "phone": "+7 (999) 222-33-44", "role": "UI/UX Дизайнер",
                 "group_id": 1}
            ],
            "stages": [
                {"id": 1, "name": "Подготовка и исследования", "is_done": True, "group_id": 1},
                {"id": 2, "name": "Проектирование и дизайн", "is_done": False, "group_id": 1}
            ],
            "tasks": [
                {"id": 1, "title": "Анализ требований заказчика", "description": "Собрать требования от ООО Спектр",
                 "status": "completed", "group_id": 1, "stage_id": 1},
                {"id": 2, "title": "Разработка макетов в Figma", "description": "Подготовить адаптивные макеты",
                 "status": "pending", "group_id": 1, "stage_id": 2}
            ]
        }
        write_db(initial_data)
        return initial_data
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"groups": [], "users": [], "stages": [], "tasks": []}


def write_db(data: dict):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# --- API ЭНДПОИНТЫ ---

# 1. Группы (Команды)
@app.get("/groups")
def get_groups():
    db = read_db()
    # Возвращаем список групп, отсортированный по убыванию ID
    return sorted(db["groups"], key=lambda g: g["id"], reverse=True)


@app.get("/groups/{group_id}")
def get_group_details(group_id: int):
    db = read_db()
    group = next((g for g in db["groups"] if g["id"] == group_id), None)
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    # Собираем связанные данные для вкладки "Паспорт", "Прогресс" и "Трекер"
    members = [u for u in db["users"] if u["group_id"] == group_id]
    stages = [s for s in db["stages"] if s["group_id"] == group_id]
    tasks = [t for t in db["tasks"] if t["group_id"] == group_id]

    return {**group, "members": members, "stages": stages, "tasks": tasks}


@app.post("/groups")
def create_group(group: GroupCreate):
    db = read_db()
    new_id = max([g["id"] for g in db["groups"]], default=0) + 1
    new_group = {
        "id": new_id,
        "name": group.name,
        "direction": group.direction,
        "deadline": "", "customer": "", "project_leader": "",
        "team": "", "kpi": "", "product": ""
    }
    db["groups"].append(new_group)

    # Автоматически создаем стандартные этапы для новой группы
    stages_len = max([s["id"] for s in db["stages"]], default=0)
    default_stages = [
        {"id": stages_len + 1, "name": "Подготовка и исследования", "is_done": False, "group_id": new_id},
        {"id": stages_len + 2, "name": "Проектирование и дизайн", "is_done": False, "group_id": new_id},
        {"id": stages_len + 3, "name": "Разработка функционала", "is_done": False, "group_id": new_id},
        {"id": stages_len + 4, "name": "Тестирование и деплой", "is_done": False, "group_id": new_id}
    ]
    db["stages"].extend(default_stages)

    write_db(db)
    return new_group


@app.patch("/groups/{group_id}")
def update_group(group_id: int, payload: GroupUpdate):
    db = read_db()
    group_idx = next((i for i, g in enumerate(db["groups"]) if g["id"] == group_id), None)
    if group_idx is None:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    update_data = payload.dict(exclude_unset=True)
    for key, val in update_data.items():
        db["groups"][group_idx][key] = val

    write_db(db)
    return db["groups"][group_idx]


@app.delete("/groups/{group_id}")
def delete_group(group_id: int):
    db = read_db()
    group_idx = next((i for i, g in enumerate(db["groups"]) if g["id"] == group_id), None)
    if group_idx is None:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    db["groups"].pop(group_idx)
    # Каскадное удаление зависимых записей
    db["users"] = [u for u in db["users"] if u["group_id"] != group_id]
    db["stages"] = [s for s in db["stages"] if s["group_id"] != group_id]
    db["tasks"] = [t for t in db["tasks"] if t["group_id"] != group_id]

    write_db(db)
    return {"status": "success"}


# 2. Участники команд (Пользователи)
@app.post("/users")
def create_user(user: UserCreate):
    db = read_db()
    new_id = max([u["id"] for u in db["users"]], default=0) + 1
    new_user = {
        "id": new_id,
        "name": user.name,
        "phone": user.phone,
        "role": user.role,
        "group_id": user.group_id
    }
    db["users"].append(new_user)
    write_db(db)
    return new_user


@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    db = read_db()
    user_idx = next((i for i, u in enumerate(db["users"]) if u["id"] == user_id), None)
    if user_idx is None:
        raise HTTPException(status_code=404, detail="Участник не найден")

    db["users"].pop(user_idx)
    write_db(db)
    return {"status": "success"}


# 3. Этапы проекта (Стадии)
@app.post("/stages")
def create_stage(stage: StageCreate):
    db = read_db()
    new_id = max([s["id"] for s in db["stages"]], default=0) + 1
    new_stage = {
        "id": new_id,
        "name": stage.name,
        "is_done": False,
        "group_id": stage.group_id
    }
    db["stages"].append(new_stage)
    write_db(db)
    return new_stage


@app.patch("/stages/{stage_id}")
def update_stage(stage_id: int, payload: StageUpdate):
    db = read_db()
    stage_idx = next((i for i, s in enumerate(db["stages"]) if s["id"] == stage_id), None)
    if stage_idx is None:
        raise HTTPException(status_code=404, detail="Этап не найден")

    db["stages"][stage_idx]["is_done"] = payload.is_done
    write_db(db)
    return db["stages"][stage_idx]


@app.delete("/stages/{stage_id}")
def delete_stage(stage_id: int):
    db = read_db()
    stage_idx = next((i for i, s in enumerate(db["stages"]) if s["id"] == stage_id), None)
    if stage_idx is None:
        raise HTTPException(status_code=404, detail="Этап не найден")

    db["stages"].pop(stage_idx)
    # При удалении этапа сбрасываем привязку у относящихся к нему задач
    for task in db["tasks"]:
        if task.get("stage_id") == stage_id:
            task["stage_id"] = None

    write_db(db)
    return {"status": "success"}


# 4. Задачи
@app.post("/tasks")
def create_task(task: TaskCreate):
    db = read_db()
    new_id = max([t["id"] for t in db["tasks"]], default=0) + 1
    new_task = {
        "id": new_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "group_id": task.group_id,
        "stage_id": task.stage_id
    }
    db["tasks"].append(new_task)
    write_db(db)
    return new_task


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate):
    db = read_db()
    task_idx = next((i for i, t in enumerate(db["tasks"]) if t["id"] == task_id), None)
    if task_idx is None:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    update_data = payload.dict(exclude_unset=True)
    for key, val in update_data.items():
        db["tasks"][task_idx][key] = val

    write_db(db)
    return db["tasks"][task_idx]


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    db = read_db()
    task_idx = next((i for i, t in enumerate(db["tasks"]) if t["id"] == task_id), None)
    if task_idx is None:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    db["tasks"].pop(task_idx)
    write_db(db)
    return {"status": "success"}


# --- РАЗДАЧА СТАТИКИ ФРОНТЕНДА ---

# Раздача CSS и JS файлов
@app.get("/frontend/styles.css")
def get_css():
    return FileResponse("styles.css")


@app.get("/frontend/script.js")
def get_js():
    return FileResponse("script.js")


@app.get("/frontend/index.html")
def get_index():
    return FileResponse("index.html")