import sqlite3
import os

# ===== 1. НАСТРОЙКА ПУТИ К БАЗЕ ДАННЫХ =====

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "instance", "database.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


# ===== 2. ФУНКЦИЯ ПОДКЛЮЧЕНИЯ К БАЗЕ =====

def get_db_connection():
    """
    Эта функция открывает соединение с базой данных и возвращает его.
    Мы будем вызывать её каждый раз, когда нужно выполнить запрос к БД.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ===== 3. ФУНКЦИЯ СОЗДАНИЯ ТАБЛИЦ =====

def init_db():
    """
    Эта функция создаёт все необходимые таблицы, если их ещё нет.
    Мы запустим её один раз при старте приложения.
    """
    conn = get_db_connection()
    cursor = conn.cursor()


    # ----- 3.1 ТАБЛИЦА КОМАНД И ПАСПОРТ ПРОЕКТА -----

    cursor.execute('''
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                -- Регистрация команды
                name TEXT NOT NULL,                     -- Название команды/проекта
                direction TEXT,                         -- Направление
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                -- ===== ПАСПОРТ ПРОЕКТА =====

                -- 1. ОБЩАЯ ИНФОРМАЦИЯ
                deadline DATE,                          -- Сроки реализации

                -- 2. УЧАСТНИКИ И РОЛИ
                customer TEXT,                          -- Заказчик / Куратор
                project_leader TEXT,                    -- Руководитель проекта
                team TEXT,                              -- Команда проекта

                -- 3. ЦЕЛИ И ЗАДАЧИ
                goal_smart TEXT,                        -- Цель (SMART)
                tasks_text TEXT,                        -- Задачи

                -- 4. ИСПОЛЬЗУЕМЫЕ ИНСТРУМЕНТЫ
                tools TEXT,                             -- Используемые инструменты

                -- 5. РЕСУРСЫ И ОГРАНИЧЕНИЯ
                budget TEXT,                            -- Бюджет
                restrictions TEXT,                      -- Ограничения
                risks TEXT,                             -- Риски

                -- 6. ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
                product TEXT,                           -- Продукт
                kpi TEXT                                -- Показатели (KPI)
            )
        ''')


    # ----- 3.2 ТАБЛИЦА УЧАСТНИКОВ -----

    cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,                     -- ФИО
                phone TEXT,                             -- Телефон
                role TEXT,                              -- Роль в команде
                group_id INTEGER NOT NULL,
                FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
            )
        ''')


    # ----- 3.3 ТАБЛИЦА ЗАДАЧ (ТРЕКЕР)-----

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',              -- 'pending' или 'completed'       
            deadline DATE,           
            group_id INTEGER NOT NULL,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
        )
    ''')


    # ----- 3.4 ТАБЛИЦА ЭТАПОВ (ПРОГРЕСС)-----

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            is_done BOOLEAN DEFAULT 0,                  -- 0 = не выполнен, 1 = выполнен
            group_id INTEGER NOT NULL,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
        )
    ''')


    # ----- 3.5 СОХРАНЕНИЕ И ЗАКРЫТИЕ -----

    conn.commit()
    conn.close()
    print("База данных и таблицы созданы (или уже существуют).")