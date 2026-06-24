from .database import get_db_connection

# ===== 1. ФУНКЦИИ ДЛЯ РАБОТЫ С ГРУППАМИ =====

def get_all_groups():
    """
    Возвращает список всех групп из базы данных.
    Сортировка: от новых к старым (ORDER BY id DESC).
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM groups ORDER BY id DESC")

    groups = cursor.fetchall()

    conn.close()

    return [dict(group) for group in groups]


def create_group(name):
    """
    Создаёт новую группу в базе данных.
    Принимает: название группы (name)
    Возвращает: созданную группу с новым id
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO groups (name) VALUES (?)",
        (name,)
    )

    conn.commit()

    new_id = cursor.lastrowid

    cursor.execute("SELECT * FROM groups WHERE id = ?", (new_id,))
    new_group = cursor.fetchone()

    conn.close()

    return dict(new_group)


def get_group_by_id(group_id):
    """
    Возвращает ОДНУ группу со всеми её данными:
    - саму группу
    - список участников
    - список задач
    - список этапов

    Принимает: id группы (group_id)
    Возвращает: словарь с данными группы или None, если группа не найдена
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()

    if not group:
        conn.close()
        return None

    result = dict(group)

    cursor.execute(
        "SELECT id, name, role FROM users WHERE group_id = ?",
        (group_id,)
    )
    users = cursor.fetchall()
    result["members"] = [dict(user) for user in users]

    cursor.execute(
        "SELECT id, title, description, status, deadline FROM tasks WHERE group_id = ?",
        (group_id,)
    )
    tasks = cursor.fetchall()
    result["tasks"] = [dict(task) for task in tasks]

    cursor.execute(
        "SELECT id, name, is_done FROM stages WHERE group_id = ?",
        (group_id,)
    )
    stages = cursor.fetchall()
    result["stages"] = [dict(stage) for stage in stages]

    conn.close()

    return result


# ===== 2. ФУНКЦИИ ДЛЯ РАБОТЫ С УЧАСТНИКАМИ =====

def add_user(name, role, group_id):
    """
    Добавляет нового участника в указанную группу.

    Принимает: имя, роль, id группы
    Возвращает: созданного участника с новым id
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO users (name, role, group_id) VALUES (?, ?, ?)",
        (name, role, group_id)
    )
    conn.commit()

    new_id = cursor.lastrowid

    cursor.execute("SELECT * FROM users WHERE id = ?", (new_id,))
    new_user = cursor.fetchone()
    conn.close()

    return dict(new_user)


# ===== 3. ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАДАЧАМИ =====

def add_task(title, description, deadline, group_id):
    """
    Создаёт новую задачу в указанной группе.

    Принимает: название, описание (может быть None), срок, id группы
    Возвращает: созданную задачу с новым id
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO tasks 
           (title, description, deadline, group_id) 
           VALUES (?, ?, ?, ?)""",
        (title, description, deadline, group_id)
    )
    conn.commit()

    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (new_id,))
    new_task = cursor.fetchone()
    conn.close()

    return dict(new_task)


def update_task_status(task_id, new_status):
    """
    Обновляет статус задачи.

    Принимает: id задачи, новый статус ('pending' или 'completed')
    Возвращает: обновлённую задачу
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE tasks SET status = ? WHERE id = ?",
        (new_status, task_id)
    )
    conn.commit()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    updated_task = cursor.fetchone()

    conn.close()

    if not updated_task:
        return None

    return dict(updated_task)


# ===== 4. ФУНКЦИИ ДЛЯ РАБОТЫ С ЭТАПАМИ =====

def add_stage(name, group_id):
    """
    Создаёт новый этап для указанной группы.

    Принимает: название этапа, id группы
    Возвращает: созданный этап с новым id
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO stages (name, group_id) VALUES (?, ?)",
        (name, group_id)
    )
    conn.commit()

    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM stages WHERE id = ?", (new_id,))
    new_stage = cursor.fetchone()
    conn.close()

    return dict(new_stage)


def update_stage_status(stage_id, is_done):
    """
    Обновляет статус этапа (выполнен/не выполнен).

    Принимает: id этапа, 1 (выполнен) или 0 (не выполнен)
    Возвращает: обновлённый этап
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE stages SET is_done = ? WHERE id = ?",
        (is_done, stage_id)
    )
    conn.commit()

    cursor.execute("SELECT * FROM stages WHERE id = ?", (stage_id,))
    updated_stage = cursor.fetchone()
    conn.close()

    if not updated_stage:
        return None

    return dict(updated_stage)


# ===== 5. ФУНКЦИЯ ДЛЯ ПРОГРЕССА =====

def get_progress(group_id):
    """
    Считает, сколько задач выполнено, а сколько всего.

    Принимает: id группы
    Возвращает: словарь {"total": кол-во_всех, "done": кол-во_выполненных}
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) as total FROM tasks WHERE group_id = ?",
        (group_id,)
    )
    total = cursor.fetchone()["total"]

    cursor.execute(
        "SELECT COUNT(*) as done FROM tasks WHERE group_id = ? AND status = 'completed'",
        (group_id,)
    )
    done = cursor.fetchone()["done"]

    conn.close()

    return {"total": total, "done": done}