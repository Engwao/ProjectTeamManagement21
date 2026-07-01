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


def create_group(data):
    """
    Создаёт новую группу со всеми полями паспорта.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO groups (
            name, direction, deadline,
            customer, project_leader, team,
            goal_smart, tasks_text,
            tools,
            budget, restrictions, risks,
            product, kpi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'),
        data.get('direction'),
        data.get('deadline'),
        data.get('customer'),
        data.get('project_leader'),
        data.get('team'),
        data.get('goal_smart'),
        data.get('tasks_text'),
        data.get('tools'),
        data.get('budget'),
        data.get('restrictions'),
        data.get('risks'),
        data.get('product'),
        data.get('kpi')
    ))

    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM groups WHERE id = ?", (new_id,))
    new_group = cursor.fetchone()
    conn.close()
    return dict(new_group)


def get_group_by_id(group_id):
    """
    Возвращает группу со всеми данными:
    - паспорт проекта
    - участники
    - задачи
    - этапы
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Сначала получаем саму группу
    cursor.execute("SELECT * FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()

    # Если группы нет — возвращаем None
    if not group:
        conn.close()
        return None

    # Превращаем группу в словарь
    result = dict(group)

    # 2. Получаем участников
    cursor.execute("SELECT id, name, phone, role FROM users WHERE group_id = ?", (group_id,))
    users = cursor.fetchall()
    result["members"] = [dict(user) for user in users]

    # 3. Получаем задачи
    cursor.execute("SELECT id, title, description, status, deadline, stage_id FROM tasks WHERE group_id = ?",
                   (group_id,))
    tasks = cursor.fetchall()
    result["tasks"] = [dict(task) for task in tasks]

    # 4. Получаем этапы
    cursor.execute("SELECT id, name, is_done FROM stages WHERE group_id = ?", (group_id,))
    stages = cursor.fetchall()
    result["stages"] = [dict(stage) for stage in stages]

    conn.close()
    return result


def update_group(group_id, data):
    """
    Обновляет данные группы.
    Принимает словарь с полями, которые нужно обновить.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Список всех полей, которые можно обновлять
    allowed_fields = [
        'name', 'direction', 'deadline',
        'customer', 'project_leader', 'team',
        'goal_smart', 'tasks_text',
        'tools',
        'budget', 'restrictions', 'risks',
        'product', 'kpi'
    ]

    updates = []
    values = []

    for field in allowed_fields:
        if field in data and data[field] is not None:
            updates.append(f"{field} = ?")
            values.append(data[field])

    if not updates:
        conn.close()
        return get_group_by_id(group_id)

    values.append(group_id)
    query = f"UPDATE groups SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, values)
    conn.commit()
    conn.close()

    return get_group_by_id(group_id)


# ===== 2. ФУНКЦИИ ДЛЯ РАБОТЫ С УЧАСТНИКАМИ =====

def add_user(name, phone, role, group_id):
    """Добавляет участника в группу"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO users (name, phone, role, group_id) VALUES (?, ?, ?, ?)",
        (name, phone, role, group_id)
    )
    conn.commit()

    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM users WHERE id = ?", (new_id,))
    new_user = cursor.fetchone()
    conn.close()
    return dict(new_user)


def delete_user(user_id):
    """Удаляет участника"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"message": "Участник удалён"}


# ===== 3. ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАДАЧАМИ =====

def add_task(title, description, deadline, group_id, stage_id=None):
    """Создаёт новую задачу"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO tasks (title, description, deadline, group_id, stage_id) VALUES (?, ?, ?, ?, ?)",
        (title, description, deadline, group_id, stage_id)
    )
    conn.commit()

    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (new_id,))
    new_task = cursor.fetchone()
    conn.close()
    return dict(new_task)


def update_task_status(task_id, new_status):
    """Обновляет статус задачи"""
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


def delete_task(task_id):
    """Удаляет задачу"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Задача удалена"}


# ===== 4. ФУНКЦИИ ДЛЯ РАБОТЫ С ЭТАПАМИ =====

def add_stage(name, group_id):
    """Создаёт новый этап"""
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
    """Обновляет статус этапа"""
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


def delete_stage(stage_id):
    """Удаляет этап"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM stages WHERE id = ?", (stage_id,))
    conn.commit()
    conn.close()
    return {"message": "Этап удалён"}


# ===== 5. ФУНКЦИЯ ДЛЯ ПРОГРЕССА =====

def get_progress(group_id):
    """
    Возвращает прогресс
    total - общее количество задач
    done - количество выполненных задач
    percent - процент выполнения
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

    if total == 0:
        percent = 0
    else:
        percent = int((done / total) * 100)

    return {
        "total": total,
        "done": done,
        "percent": percent
    }