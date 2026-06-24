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

    # ----- 3.1 ТАБЛИЦА ГРУПП -----

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            
        )
    ''')

    # ----- 3.2 ТАБЛИЦА УЧАСТНИКОВ -----

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            group_id INTEGER NOT NULL,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
        )
    ''')

    # ----- 3.3 ТАБЛИЦА ЗАДАЧ -----

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',            
            deadline DATE,           
            group_id INTEGER NOT NULL,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
        )
    ''')

    # ----- 3.4 ТАБЛИЦА ЭТАПОВ -----

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            is_done BOOLEAN DEFAULT 0,
            group_id INTEGER NOT NULL,
            FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
        )
    ''')

    # ----- 3.5 СОХРАНЕНИЕ И ЗАКРЫТИЕ -----

    conn.commit()

    conn.close()

    print("База данных и таблицы созданы (или уже существуют).")