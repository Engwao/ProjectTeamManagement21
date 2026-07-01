// ==========================================
// 1. КОНФИГУРАЦИЯ
// ==========================================

const API_BASE = ''; // Пустая строка, так как файлы и API на одном сервере


// ==========================================
// 2. ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
// ==========================================

const navItems = document.querySelectorAll('.nav-item');
const pages = {
    register: document.getElementById('page-register'),
    passport: document.getElementById('page-passport'),
    progress: document.getElementById('page-progress'),
    tracker: document.getElementById('page-tracker'),
};

let currentProjectId = null; // ID выбранного проекта

navItems.forEach(item => {
    item.addEventListener('click', function() {
        // Убираем активный класс у всех пунктов меню
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        // Скрываем все страницы
        Object.values(pages).forEach(page => page.classList.remove('active'));

        // Показываем нужную
        const pageName = this.dataset.page;
        if (pages[pageName]) {
            pages[pageName].classList.add('active');
        }

        // Загружаем данные для страницы
        if (pageName === 'register') {
            loadTeams();
        } else if (pageName === 'passport') {
            loadProjectsForSelect('passport-project-select');
        } else if (pageName === 'progress') {
            loadProjectsForSelect('progress-project-select');
        } else if (pageName === 'tracker') {
            loadProjectsForSelect('tracker-project-select');
        }
    });
});


// ==========================================
// 3. РЕГИСТРАЦИЯ КОМАНДЫ
// ==========================================

document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('team-name').value.trim();
    const direction = document.getElementById('team-direction').value.trim();

    if (!name || !direction) {
        alert('Пожалуйста, заполните все поля');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, direction })
        });

        if (!response.ok) throw new Error('Ошибка при создании команды');

        const data = await response.json();
        alert(`✅ Команда "${data.name}" успешно создана! ID: ${data.id}`);

        // Очищаем форму
        document.getElementById('team-name').value = '';
        document.getElementById('team-direction').value = '';

        // Обновляем список команд
        loadTeams();

    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Не удалось создать команду. Проверьте, запущен ли сервер.');
    }
});


// ==========================================
// 4. ЗАГРУЗКА СПИСКА КОМАНД
// ==========================================

async function loadTeams() {
    const container = document.getElementById('teams-list');
    container.innerHTML = 'Загрузка...';

    try {
        const response = await fetch(`${API_BASE}/groups`);
        if (!response.ok) throw new Error('Не удалось загрузить команды');

        const teams = await response.json();

        if (teams.length === 0) {
            container.innerHTML = '<p class="placeholder">Пока нет созданных команд. Создайте первую!</p>';
            return;
        }

        container.innerHTML = teams.map(team => `
            <div class="team-item">
                <div>
                    <div class="team-name">${team.name}</div>
                    <div class="team-direction">${team.direction || 'Направление не указано'}</div>
                </div>
                <div class="team-actions">
                    <button class="btn-select" onclick="selectProject(${team.id}, '${team.name}')">Выбрать</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = '<p class="placeholder">Не удалось загрузить команды. Проверьте сервер.</p>';
    }
}


// ==========================================
// 5. ВЫБОР ПРОЕКТА (ГЛОБАЛЬНЫЙ)
// ==========================================

function selectProject(id, name) {
    currentProjectId = id;
    document.getElementById('current-project-name').textContent = name;
    alert(`✅ Выбран проект: "${name}" (ID: ${id})`);

    // Обновляем все выпадающие списки
    updateAllSelects(id);
}

function updateAllSelects(selectedId) {
    const selects = ['passport-project-select', 'progress-project-select', 'tracker-project-select'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.value = selectedId;
            // Триггерим событие change для загрузки данных
            select.dispatchEvent(new Event('change'));
        }
    });
}


// ==========================================
// 6. ЗАГРУЗКА ПРОЕКТОВ В ВЫПАДАЮЩИЙ СПИСОК
// ==========================================

async function loadProjectsForSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Сохраняем текущее значение (если есть)
    const currentValue = select.value;

    select.innerHTML = '<option value="">-- Выберите проект --</option>';

    try {
        const response = await fetch(`${API_BASE}/groups`);
        if (!response.ok) throw new Error('Не удалось загрузить проекты');

        const projects = await response.json();

        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });

        // Восстанавливаем выбранное значение
        if (currentValue) {
            select.value = currentValue;
        }

    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
    }
}


// ==========================================
// 7. ПАСПОРТ ПРОЕКТА
// ==========================================

document.getElementById('passport-project-select').addEventListener('change', function() {
    const projectId = this.value;
    const container = document.getElementById('passport-form-container');

    if (!projectId) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    loadPassportData(projectId);
});

async function loadPassportData(projectId) {
    try {
        const response = await fetch(`${API_BASE}/groups/${projectId}`);
        if (!response.ok) throw new Error('Не удалось загрузить данные');

        const data = await response.json();

        // Заполняем поля формы
        document.getElementById('p-deadline').value = data.deadline || '';
        document.getElementById('p-customer').value = data.customer || '';
        document.getElementById('p-project-leader').value = data.project_leader || '';
        document.getElementById('p-team').value = data.team || '';
        document.getElementById('p-goal-smart').value = data.goal_smart || '';
        document.getElementById('p-tasks-text').value = data.tasks_text || '';
        document.getElementById('p-tools').value = data.tools || '';
        document.getElementById('p-budget').value = data.budget || '';
        document.getElementById('p-restrictions').value = data.restrictions || '';
        document.getElementById('p-risks').value = data.risks || '';
        document.getElementById('p-product').value = data.product || '';
        document.getElementById('p-kpi').value = data.kpi || '';

    } catch (error) {
        console.error('Ошибка загрузки паспорта:', error);
        alert('Не удалось загрузить данные паспорта');
    }
}

// Сохранение паспорта
document.getElementById('save-passport-btn').addEventListener('click', async function() {
    const projectId = document.getElementById('passport-project-select').value;
    if (!projectId) {
        alert('Сначала выберите проект');
        return;
    }

    const data = {
        deadline: document.getElementById('p-deadline').value || null,
        customer: document.getElementById('p-customer').value || null,
        project_leader: document.getElementById('p-project-leader').value || null,
        team: document.getElementById('p-team').value || null,
        goal_smart: document.getElementById('p-goal-smart').value || null,
        tasks_text: document.getElementById('p-tasks-text').value || null,
        tools: document.getElementById('p-tools').value || null,
        budget: document.getElementById('p-budget').value || null,
        restrictions: document.getElementById('p-restrictions').value || null,
        risks: document.getElementById('p-risks').value || null,
        product: document.getElementById('p-product').value || null,
        kpi: document.getElementById('p-kpi').value || null,
    };

    try {
        const response = await fetch(`${API_BASE}/groups/${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Ошибка при сохранении');

        alert('✅ Паспорт проекта успешно сохранён!');

    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Не удалось сохранить паспорт');
    }
});


// ==========================================
// 8. ПРОГРЕСС
// ==========================================

document.getElementById('progress-project-select').addEventListener('change', function() {
    const projectId = this.value;
    const container = document.getElementById('progress-container');

    if (!projectId) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    loadProgress(projectId);
});

async function loadProgress(projectId) {
    try {
        // Получаем прогресс в процентах
        const progressResponse = await fetch(`${API_BASE}/groups/${projectId}/progress`);
        if (!progressResponse.ok) throw new Error('Не удалось загрузить прогресс');
        const progress = await progressResponse.json();

        // Получаем полную информацию о группе (этапы и задачи)
        const groupResponse = await fetch(`${API_BASE}/groups/${projectId}`);
        if (!groupResponse.ok) throw new Error('Не удалось загрузить данные группы');
        const group = await groupResponse.json();

        // Обновляем круговой индикатор
        const percent = progress.percent || 0;
        updateProgressCircle(percent);
        document.getElementById('progress-done').textContent = progress.done || 0;
        document.getElementById('progress-total').textContent = progress.total || 0;

        // Отображаем этапы и задачи
        renderProgressTasks(group);

    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить прогресс');
    }
}

function updateProgressCircle(percent) {
    const circle = document.getElementById('progress-circle');
    const text = document.getElementById('progress-percent');

    // Ограничиваем процент
    const clampedPercent = Math.min(100, Math.max(0, percent));
    text.textContent = `${clampedPercent}%`;

    // Рисуем круг с помощью conic-gradient
    circle.style.background = `conic-gradient(#C68DFF 0% ${clampedPercent}%, #E0E0E0 ${clampedPercent}% 100%)`;
}

function renderProgressTasks(group) {
    const container = document.getElementById('progress-tasks-container');

    if (!group.stages || group.stages.length === 0) {
        container.innerHTML = '<p class="placeholder">У этого проекта пока нет этапов</p>';
        return;
    }

    // Группируем задачи по этапам (если есть связь, но пока просто показываем все)
    let html = '';

    group.stages.forEach(stage => {
        html += `
            <div class="stage-title">
                📌 ${stage.name}
                <span class="stage-status">${stage.is_done ? '✅ Выполнен' : '⏳ В процессе'}</span>
            </div>
        `;

        // Показываем задачи, связанные с этим этапом (если есть поле stage_id, но пока просто все задачи)
        if (group.tasks && group.tasks.length > 0) {
            // Временно показываем все задачи под каждым этапом (в реальности нужна связь)
            group.tasks.forEach(task => {
                html += `
                    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
                        <input type="checkbox" class="task-checkbox" 
                               ${task.status === 'completed' ? 'checked' : ''}
                               onchange="toggleTaskStatus(${task.id}, this.checked)">
                        <span class="task-title">${task.title}</span>
                        ${task.deadline ? `<span class="task-deadline">📅 ${task.deadline}</span>` : ''}
                    </div>
                `;
            });
        } else {
            html += `<p class="placeholder">Нет задач</p>`;
        }
    });

    container.innerHTML = html;
}


// ==========================================
// 9. ТРЕКЕР ЗАДАЧ
// ==========================================

document.getElementById('tracker-project-select').addEventListener('change', function() {
    const projectId = this.value;
    const container = document.getElementById('tracker-container');

    if (!projectId) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    loadTrackerTasks(projectId);
});

async function loadTrackerTasks(projectId) {
    try {
        const response = await fetch(`${API_BASE}/groups/${projectId}`);
        if (!response.ok) throw new Error('Не удалось загрузить задачи');

        const group = await response.json();
        renderTrackerTasks(group);

    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить задачи');
    }
}

function renderTrackerTasks(group) {
    const container = document.getElementById('tracker-tasks-list');

    if (!group.tasks || group.tasks.length === 0) {
        container.innerHTML = '<p class="placeholder">Задач пока нет. Создайте первую!</p>';
        return;
    }

    // Сначала показываем этапы (как заголовки), потом задачи
    let html = '';

    if (group.stages && group.stages.length > 0) {
        group.stages.forEach(stage => {
            html += `
                <div class="stage-title">
                    📌 ${stage.name}
                    <span class="stage-status">${stage.is_done ? '✅ Выполнен' : '⏳ В процессе'}</span>
                </div>
            `;
            // Задачи под этапом
            group.tasks.forEach(task => {
                html += `
                    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
                        <input type="checkbox" class="task-checkbox" 
                               ${task.status === 'completed' ? 'checked' : ''}
                               onchange="toggleTaskStatus(${task.id}, this.checked)">
                        <span class="task-title">${task.title}</span>
                        ${task.deadline ? `<span class="task-deadline">📅 ${task.deadline}</span>` : ''}
                        <button class="task-delete-btn" onclick="deleteTask(${task.id})" title="Удалить задачу">✕</button>
                    </div>
                `;
            });
        });
    } else {
        // Если нет этапов, просто показываем задачи
        group.tasks.forEach(task => {
            html += `
                <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
                    <input type="checkbox" class="task-checkbox" 
                           ${task.status === 'completed' ? 'checked' : ''}
                           onchange="toggleTaskStatus(${task.id}, this.checked)">
                    <span class="task-title">${task.title}</span>
                    ${task.deadline ? `<span class="task-deadline">📅 ${task.deadline}</span>` : ''}
                    <button class="task-delete-btn" onclick="deleteTask(${task.id})" title="Удалить задачу">✕</button>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}


// ==========================================
// 10. ОПЕРАЦИИ С ЗАДАЧАМИ
// ==========================================

// Добавление задачи
document.getElementById('add-task-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const projectId = document.getElementById('tracker-project-select').value;
    if (!projectId) {
        alert('Сначала выберите проект');
        return;
    }

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const deadline = document.getElementById('task-deadline').value;

    if (!title) {
        alert('Введите название задачи');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description: description || null,
                deadline: deadline || null,
                group_id: parseInt(projectId)
            })
        });

        if (!response.ok) throw new Error('Ошибка при создании задачи');

        // Очищаем форму
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-deadline').value = '';

        // Обновляем список задач
        loadTrackerTasks(projectId);
        // Также обновляем прогресс, если он открыт
        if (document.getElementById('progress-project-select').value === projectId) {
            loadProgress(projectId);
        }

    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Не удалось создать задачу');
    }
});

// Переключение статуса задачи
async function toggleTaskStatus(taskId, checked) {
    const status = checked ? 'completed' : 'pending';

    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Ошибка при обновлении задачи');

        // Обновляем текущую страницу
        const projectId = document.getElementById('tracker-project-select').value;
        if (projectId) {
            loadTrackerTasks(projectId);
            // Также обновляем прогресс
            if (document.getElementById('progress-project-select').value === projectId) {
                loadProgress(projectId);
            }
        }

    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Не удалось обновить задачу');
    }
}

// Удаление задачи
async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Ошибка при удалении задачи');

        // Обновляем текущую страницу
        const projectId = document.getElementById('tracker-project-select').value;
        if (projectId) {
            loadTrackerTasks(projectId);
            if (document.getElementById('progress-project-select').value === projectId) {
                loadProgress(projectId);
            }
        }

    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Не удалось удалить задачу');
    }
}


// ==========================================
// 11. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем список команд на главной странице
    loadTeams();

    // Загружаем проекты в выпадающие списки
    loadProjectsForSelect('passport-project-select');
    loadProjectsForSelect('progress-project-select');
    loadProjectsForSelect('tracker-project-select');
});


// ==========================================
// 12. МОДАЛЬНОЕ ОКНО
// ==========================================

function openModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.add('active');
    // Загружаем проекты в модальное окно
    loadProjectsForSelect('modal-project-select');
}

function closeModal() {
    document.getElementById('project-modal').classList.remove('active');
}

function confirmProjectSelect() {
    const select = document.getElementById('modal-project-select');
    const projectId = select.value;
    const projectName = select.options[select.selectedIndex]?.text;

    if (!projectId) {
        alert('Пожалуйста, выберите проект');
        return;
    }

    selectProject(parseInt(projectId), projectName);
    closeModal();
}

// Добавляем обработчик для кнопки "Выбрать" в сайд-баре
document.getElementById('select-project-btn').addEventListener('click', function() {
    openModal();
});