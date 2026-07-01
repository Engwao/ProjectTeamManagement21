from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import groups


# ===== 1. СОЗДАЁМ ПРИЛОЖЕНИЕ FASTAPI =====

app = FastAPI(
    title="ProjectTeamManagement21",
    version="1.0"
)


# ===== 2. НАСТРАИВАЕМ CORS =====

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 3. ИНИЦИАЛИЗИРУЕМ БАЗУ ДАННЫХ =====

init_db()


# ===== 4. ПОДКЛЮЧАЕМ РОУТЕРЫ (ЭНДПОИНТЫ) =====

app.include_router(groups.router)


# ===== 5. ПОДКЛЮЧАЕМ СТАТИЧЕСКИЕ ФАЙЛЫ =====

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")


# ===== 6. ЗАПУСК СЕРВЕРА =====

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )