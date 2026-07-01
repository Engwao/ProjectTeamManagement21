// Глобальное состояние приложения
let state = {
  groups: [],
  activeGroup: null,
  activeGroupId: null,
  activeTab: 'page-register'
};

// Кэш DOM-элементов
const dom = {
  // Элементы навигации
  navItems: document.querySelectorAll('.nav-item'),
  pageViews: document.querySelectorAll('.page-view'),
  sidebarProjectName: document.getElementById('sidebar-project-name'),
  selectProjectTrigger: document.getElementById('select-project-trigger'),

  // Модальные окна
  projectModal: document.getElementById('project-modal'),
  modalProjectSelect: document.getElementById('modal-project-select'),
  projectModalClose: document.getElementById('project-modal-close'),
  projectModalConfirm: document.getElementById('project-modal-confirm'),

  memberModal: document.getElementById('member-modal'),
  addMemberTrigger: document.getElementById('add-member-trigger'),
  memberModalClose: document.getElementById('member-modal-close'),
  memberForm: document.getElementById('member-form'),
  memberFio: document.getElementById('member-fio'),
  memberPhone: document.getElementById('member-phone'),
  memberRole: document.getElementById('member-role'),

  // Вкладка "Регистрация"
  teamForm: document.getElementById('team-form'),
  teamName: document.getElementById('team-name'),
  teamDirection: document.getElementById('team-direction'),
  teamCount: document.getElementById('team-count'),
  teamsList: document.getElementById('teams-list'),
  activeTeamCard: document.getElementById('active-team-card'),
  activeTeamTitle: document.getElementById('active-team-title'),
  activeTeamDir: document.getElementById('active-team-dir'),
  membersCount: document.getElementById('members-count'),
  membersGrid: document.getElementById('members-grid'),

  // Вкладка "Паспорт проекта"
  passportEmptyState: document.getElementById('passport-empty-state'),
  passportForm: document.getElementById('passport-form'),
  passportSaveSuccess: document.getElementById('passport-save-success'),
  passName: document.getElementById('pass-name'),
  passDeadline: document.getElementById('pass-deadline'),
  passCustomer: document.getElementById('pass-customer'),
  passLeader: document.getElementById('pass-leader'),
  passTeam: document.getElementById('pass-team'),
  passGoal: document.getElementById('pass-goal'),
  passTasks: document.getElementById('pass-tasks'),
  passTools: document.getElementById('pass-tools'),
  passBudget: document.getElementById('pass-budget'),
  passRestrictions: document.getElementById('pass-restrictions'),
  passRisks: document.getElementById('pass-risks'),
  passProduct: document.getElementById('pass-product'),
  passKpi: document.getElementById('pass-kpi'),

  // Вкладка "Прогресс"
  progressEmptyState: document.getElementById('progress-empty-state'),
  progressActiveContainer: document.getElementById('progress-active-container'),
  progressPercent: document.getElementById('progress-percent'),
  progressFill: document.getElementById('progress-fill'),
  progressInnerPercent: document.getElementById('progress-inner-percent'),
  completedTasksCount: document.getElementById('completed-tasks-count'),
  totalTasksCount: document.getElementById('total-tasks-count'),
  progressStagesList: document.getElementById('progress-stages-list'),
  progressTeamName: document.getElementById('progress-team-name'),

  // Вкладка "Трекер задач"
  trackerEmptyState: document.getElementById('tracker-empty-state'),
  trackerActiveContainer: document.getElementById('tracker-active-container'),
  stageForm: document.getElementById('stage-form'),
  stageNameInput: document.getElementById('stage-name-input'),
  taskForm: document.getElementById('task-form'),
  taskTitleInput: document.getElementById('task-title-input'),
  taskDescInput: document.getElementById('task-desc-input'),
  taskDeadlineInput: document.getElementById('task-deadline-input'),
  taskStageSelect: document.getElementById('task-stage-select'),
  trackerStagesList: document.getElementById('tracker-stages-list')
};

// =========================================================================
// 1. ИНИЦИАЛИЗАЦИЯ И ВОССТАНОВЛЕНИЕ ПРИЛОЖЕНИЯ
// =========================================================================

async function init() {
  setupEventListeners();

  // Восстановление активной вкладки и ID активной группы из localStorage, если они существуют
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab) {
    state.activeTab = savedTab;
    switchTab(savedTab);
  }

  const savedGroupId = localStorage.getItem('activeGroupId');
  if (savedGroupId) {
    state.activeGroupId = parseInt(savedGroupId);
  }

  await refreshData();
}

// Получение списка всех групп и загрузка подробностей выбранной группы
async function refreshData() {
  try {
    const response = await fetch('/groups');
    if (!response.ok) throw new Error('Failed to fetch groups');
    state.groups = await response.json();

    // Автоматический выбор первой группы, если ни одна не активна или если предыдущая была удалена
    if (state.groups.length > 0) {
      if (!state.activeGroupId || !state.groups.some(g => g.id === state.activeGroupId)) {
        state.activeGroupId = state.groups[0].id;
      }
    } else {
      state.activeGroupId = null;
    }

    // Сохранение в localStorage
    if (state.activeGroupId) {
      localStorage.setItem('activeGroupId', state.activeGroupId);
    } else {
      localStorage.removeItem('activeGroupId');
    }

    // Получение полных данных активной группы
    if (state.activeGroupId) {
      const detailResponse = await fetch(`/groups/${state.activeGroupId}`);
      if (detailResponse.ok) {
        state.activeGroup = await detailResponse.json();
      } else {
        state.activeGroup = null;
      }
    } else {
      state.activeGroup = null;
    }

    renderAll();
  } catch (err) {
    console.error('Data refreshing error:', err);
  }
}

// =========================================================================
// 2. ЛОГИКА ОТРИСОВКИ (ОТ СОСТОЯНИЯ К ИНТЕРФЕЙСУ)
// =========================================================================

function renderAll() {
  renderSidebarAndSelectors();
  renderRegistrationTab();
  renderPassportTab();
  renderProgressTab();
  renderTrackerTab();
}

// Обновление состояний селектора активного проекта в сайд-баре и модальных окнах
function renderSidebarAndSelectors() {
  if (state.activeGroup) {
    dom.sidebarProjectName.textContent = state.activeGroup.name;
    dom.sidebarProjectName.classList.remove('text-gray-400');
    dom.sidebarProjectName.classList.add('text-[#323843]');
  } else {
    dom.sidebarProjectName.textContent = 'Проект не выбран';
    dom.sidebarProjectName.classList.remove('text-[#323843]');
    dom.sidebarProjectName.classList.add('text-gray-400');
  }

  // Заполнение опций выбора в модальном окне
  dom.modalProjectSelect.innerHTML = '<option value="">-- Выберите команду --</option>';
  state.groups.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `🚀 ${g.name}`;
    if (g.id === state.activeGroupId) {
      opt.selected = true;
    }
    dom.modalProjectSelect.appendChild(opt);
  });
}

// Отрисовка вкладки "Регистрация"
function renderRegistrationTab() {
  dom.teamCount.textContent = state.groups.length;
  dom.teamsList.innerHTML = '';

  if (state.groups.length === 0) {
    dom.teamsList.innerHTML = `
      <div class="text-center py-8 text-gray-400 font-sans text-sm flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-100 rounded-2xl">
        <span>📦</span>
        <span>Нет созданных команд. Зарегистрируйте первую!</span>
      </div>
    `;
    dom.activeTeamCard.classList.add('hidden');
    return;
  }

  state.groups.forEach(g => {
    const item = document.createElement('div');
    item.className = `team-item p-4 ${g.id === state.activeGroupId ? 'active' : ''}`;

    // Быстрый подсчет метаданных
    const mCount = g.id === state.activeGroupId && state.activeGroup ? (state.activeGroup.members?.length || 0) : 0;

    item.innerHTML = `
      <div class="team-item-info flex-1">
        <h4 class="font-display font-bold text-sm text-[#323843]">${g.name}</h4>
        <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">${g.direction || 'Направление не указано'}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="delete-team-btn text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-id="${g.id}">
          🗑️
        </button>
      </div>
    `;

    // Клик по элементу команды выбирает её
    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-team-btn')) return;
      selectGroup(g.id);
    });

    // Логика удаления команды
    item.querySelector('.delete-team-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Вы действительно хотите удалить проектную команду "${g.name}" со всеми ее данными?`)) return;

      try {
        const res = await fetch(`/groups/${g.id}`, { method: 'DELETE' });
        if (res.ok) {
          if (state.activeGroupId === g.id) {
            state.activeGroupId = null;
          }
          await refreshData();
        } else {
          alert('Ошибка при удалении команды');
        }
      } catch (err) {
        console.error(err);
      }
    });

    dom.teamsList.appendChild(item);
  });

  // Отрисовка блока участников, если данные активной команды загружены
  if (state.activeGroup) {
    dom.activeTeamCard.classList.remove('hidden');
    dom.activeTeamTitle.textContent = state.activeGroup.name;
    dom.activeTeamDir.textContent = `📂 Направление: ${state.activeGroup.direction || 'не указано'}`;

    const members = state.activeGroup.members || [];
    dom.membersCount.textContent = members.length;
    dom.membersGrid.innerHTML = '';

    if (members.length === 0) {
      dom.membersGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-gray-400 font-sans text-xs flex flex-col items-center gap-2 border-2 border-dashed border-gray-100 rounded-2xl">
          <span>👥</span>
          <span>В этой команде пока нет участников. Нажмите "+ Добавить участника" выше!</span>
        </div>
      `;
    } else {
      members.forEach(m => {
        const card = document.createElement('div');
        card.className = 'p-4 bg-[#FAFBFD] border-2 border-gray-50 rounded-2xl flex items-start justify-between gap-3 hover:border-gray-150 transition-all duration-150';

        const initials = m.name ? m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'УС';

        card.innerHTML = `
          <div class="flex gap-3">
            <div class="member-avatar">${initials}</div>
            <div>
              <h5 class="font-display font-bold text-xs text-[#323843] line-clamp-1">${m.name}</h5>
              <span class="inline-block text-[9px] font-mono font-bold text-[#C68DFF] uppercase mt-0.5">${m.role || 'Участник'}</span>
              ${m.phone ? `<p class="text-[10px] text-gray-400 font-mono mt-1">📞 ${m.phone}</p>` : ''}
            </div>
          </div>
          <button class="delete-member-btn text-gray-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors" data-id="${m.id}">
            🗑️
          </button>
        `;

        card.querySelector('.delete-member-btn').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(`Вы действительно хотите исключить участника ${m.name} из состава команды?`)) return;

          try {
            const res = await fetch(`/users/${m.id}`, { method: 'DELETE' });
            if (res.ok) {
              await refreshData();
            } else {
              alert('Ошибка при удалении участника');
            }
          } catch (err) {
            console.error(err);
          }
        });

        dom.membersGrid.appendChild(card);
      });
    }
  } else {
    dom.activeTeamCard.classList.add('hidden');
  }
}

// Отрисовка вкладки "Паспорт проекта"
function renderPassportTab() {
  if (!state.activeGroup) {
    dom.passportEmptyState.classList.remove('hidden');
    dom.passportForm.classList.add('hidden');
    return;
  }

  dom.passportEmptyState.classList.add('hidden');
  dom.passportForm.classList.remove('hidden');

  dom.passName.value = state.activeGroup.name || '';
  dom.passDeadline.value = state.activeGroup.deadline || '';
  dom.passCustomer.value = state.activeGroup.customer || '';
  dom.passLeader.value = state.activeGroup.project_leader || '';
  dom.passTeam.value = state.activeGroup.team || '';
  dom.passGoal.value = state.activeGroup.goal_smart || '';
  dom.passTasks.value = state.activeGroup.tasks_text || '';
  dom.passTools.value = state.activeGroup.tools || '';
  dom.passBudget.value = state.activeGroup.budget || '';
  dom.passRestrictions.value = state.activeGroup.restrictions || '';
  dom.passRisks.value = state.activeGroup.risks || '';
  dom.passProduct.value = state.activeGroup.product || '';
  dom.passKpi.value = state.activeGroup.kpi || '';
}

// Отрисовка вкладки "Прогресс"
function renderProgressTab() {
  if (!state.activeGroup) {
    dom.progressEmptyState.classList.remove('hidden');
    dom.progressActiveContainer.classList.add('hidden');
    return;
  }

  dom.progressEmptyState.classList.add('hidden');
  dom.progressActiveContainer.classList.remove('hidden');

  dom.progressTeamName.textContent = state.activeGroup.name;

  const tasks = state.activeGroup.tasks || [];
  const stages = state.activeGroup.stages || [];

  // Вычисления
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Обновление шкалы прогресса
  dom.progressPercent.textContent = `${percent}%`;
  dom.progressFill.style.width = `${percent}%`;
  dom.progressInnerPercent.textContent = `${percent}%`;
  dom.completedTasksCount.textContent = completed;
  dom.totalTasksCount.textContent = total;

  // Отрисовка этапов со списками задач в виде чек-листа
  dom.progressStagesList.innerHTML = '';

  if (stages.length === 0 && tasks.length === 0) {
    dom.progressStagesList.innerHTML = `
      <div class="bg-white p-12 rounded-[32px] border-4 border-dashed border-gray-100 text-center text-gray-400 font-sans text-sm flex flex-col items-center justify-center gap-3">
        <span>✨</span>
        <span>У этого проекта пока нет этапов и задач в трекере.</span>
        <p class="text-xs text-gray-400">Перейдите на вкладку <strong>Трекер</strong>, чтобы наполнить проект задачами!</p>
      </div>
    `;
    return;
  }

  // Перечисление этапов
  stages.forEach(stage => {
    const stageTasks = tasks.filter(t => t.stage_id === stage.id);
    const box = document.createElement('div');
    box.className = 'bg-white p-6 sm:p-8 rounded-[32px] border-4 border-[#323843] shadow-[8px_8px_0px_0px_#323843] flex flex-col gap-4';

    box.innerHTML = `
      <div class="flex items-center justify-between border-b-2 border-gray-100 pb-3">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-[#C68DFF] animate-pulse"></span>
          <h3 class="font-display font-black text-base tracking-wide text-[#323843] uppercase">
            ${stage.name}
          </h3>
        </div>
        <button class="stage-toggle-status-btn text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border-2 border-[#323843] transition-all cursor-pointer ${
          stage.is_done ? 'bg-[#CBE857] text-[#323843]' : 'bg-white hover:bg-gray-50 text-gray-400'
        }" data-id="${stage.id}" data-done="${stage.is_done}">
          ${stage.is_done ? '✅ Выполнен' : '⏳ В процессе'}
        </button>
      </div>
      
      <div class="flex flex-col gap-3 mt-2">
        ${stageTasks.length === 0 
          ? '<p class="text-xs text-gray-400 font-sans italic pl-4">Нет запланированных задач для этого этапа</p>'
          : stageTasks.map(t => `
              <div class="bullet-task-item flex items-start gap-4 p-2.5 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors" data-id="${t.id}">
                <div class="pt-0.5 shrink-0">
                  <div class="task-bullet-circle ${t.status === 'completed' ? 'completed' : ''}"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-display font-bold text-sm text-[#323843] leading-tight ${t.status === 'completed' ? 'line-through text-gray-400' : ''}">
                    ${t.title}
                  </h4>
                  ${t.description ? `<p class="text-xs text-gray-400 font-sans mt-0.5">${t.description}</p>` : ''}
                  ${t.deadline ? `<span class="inline-block text-[10px] font-mono font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md mt-2">📅 Срок: ${t.deadline}</span>` : ''}
                </div>
              </div>
            `).join('')}
      </div>
    `;

    // Обработчик переключения статуса этапа при клике
    box.querySelector('.stage-toggle-status-btn').addEventListener('click', async (e) => {
      const sId = parseInt(e.target.getAttribute('data-id'));
      const isDone = e.target.getAttribute('data-done') === 'true';

      try {
        const res = await fetch(`/stages/${sId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_done: !isDone })
        });
        if (res.ok) await refreshData();
      } catch (err) {
        console.error(err);
      }
    });

    // Обработчик переключения статуса задачи при клике
    box.querySelectorAll('.bullet-task-item').forEach(el => {
      el.addEventListener('click', async () => {
        const tId = parseInt(el.getAttribute('data-id'));
        const taskObj = tasks.find(t => t.id === tId);
        if (!taskObj) return;

        const newStatus = taskObj.status === 'completed' ? 'pending' : 'completed';
        try {
          const res = await fetch(`/tasks/${tId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) await refreshData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    dom.progressStagesList.appendChild(box);
  });

  // Отрисовка общих (непривязанных) задач
  const unassigned = tasks.filter(t => !t.stage_id);
  if (unassigned.length > 0) {
    const box = document.createElement('div');
    box.className = 'bg-white p-6 sm:p-8 rounded-[32px] border-4 border-[#323843] shadow-[8px_8px_0px_0px_#323843] flex flex-col gap-4';

    box.innerHTML = `
      <div class="flex items-center justify-between border-b-2 border-gray-100 pb-3">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-[#CBE857] animate-pulse"></span>
          <h3 class="font-display font-black text-base tracking-wide text-[#323843] uppercase">
            Общие задачи (без этапа)
          </h3>
        </div>
      </div>
      
      <div class="flex flex-col gap-3 mt-2">
        ${unassigned.map(t => `
          <div class="bullet-task-item flex items-start gap-4 p-2.5 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors" data-id="${t.id}">
            <div class="pt-0.5 shrink-0">
              <div class="task-bullet-circle ${t.status === 'completed' ? 'completed' : ''}"></div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-display font-bold text-sm text-[#323843] leading-tight ${t.status === 'completed' ? 'line-through text-gray-400' : ''}">
                ${t.title}
              </h4>
              ${t.description ? `<p class="text-xs text-gray-400 font-sans mt-0.5">${t.description}</p>` : ''}
              ${t.deadline ? `<span class="inline-block text-[10px] font-mono font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md mt-2">📅 Срок: ${t.deadline}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Переключение статуса общих задач при клике
    box.querySelectorAll('.bullet-task-item').forEach(el => {
      el.addEventListener('click', async () => {
        const tId = parseInt(el.getAttribute('data-id'));
        const taskObj = tasks.find(t => t.id === tId);
        if (!taskObj) return;

        const newStatus = taskObj.status === 'completed' ? 'pending' : 'completed';
        try {
          const res = await fetch(`/tasks/${tId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) await refreshData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    dom.progressStagesList.appendChild(box);
  }
}

// Отрисовка вкладки "Трекер задач"
function renderTrackerTab() {
  if (!state.activeGroup) {
    dom.trackerEmptyState.classList.remove('hidden');
    dom.trackerActiveContainer.classList.add('hidden');
    return;
  }

  dom.trackerEmptyState.classList.add('hidden');
  dom.trackerActiveContainer.classList.remove('hidden');

  const tasks = state.activeGroup.tasks || [];
  const stages = state.activeGroup.stages || [];

  // Заполнение списка этапов в селекторе создания задачи
  dom.taskStageSelect.innerHTML = '<option value="">Без этапа</option>';
  stages.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    dom.taskStageSelect.appendChild(opt);
  });

  // Отрисовка колонок этапов/задач
  dom.trackerStagesList.innerHTML = '';

  if (stages.length === 0 && tasks.length === 0) {
    dom.trackerStagesList.innerHTML = `
      <div class="text-center py-16 text-gray-400 font-sans text-sm flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-100 rounded-2xl">
        <span>📋</span>
        <span>Список задач и этапов пуст. Добавьте первый этап или общую задачу в форме слева!</span>
      </div>
    `;
    return;
  }

  // 1. Стадии из списка
  stages.forEach(stage => {
    const stageTasks = tasks.filter(t => t.stage_id === stage.id);
    const box = document.createElement('div');
    box.className = 'border-2 border-gray-100 p-4 rounded-2xl bg-[#FCFDFE]/40 flex flex-col';

    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-gray-150 pb-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-[#C68DFF] font-semibold">📁</span>
          <h4 class="font-display font-extrabold text-xs text-[#323843] uppercase tracking-wider">
            ${stage.name}
          </h4>
          <span class="bg-gray-100 text-gray-500 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
            ${stageTasks.length}
          </span>
        </div>
        <button class="delete-stage-btn text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-id="${stage.id}">
          🗑️
        </button>
      </div>
      
      <div class="flex flex-col gap-2.5">
        ${stageTasks.length === 0 
          ? '<p class="text-[11px] text-gray-400 italic text-center py-2">В этом этапе пока нет задач. Заполните форму слева.</p>'
          : stageTasks.map(t => `
              <div class="p-3.5 bg-white border-2 rounded-xl flex items-start justify-between gap-3 transition-all ${
                t.status === 'completed' ? 'border-[#CBE857]/50 bg-[#CBE857]/5' : 'border-gray-50 shadow-sm hover:border-gray-150'
              }">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <button class="toggle-task-status-btn w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5 transition-all cursor-pointer ${
                    t.status === 'completed' ? 'bg-[#CBE857] border-[#CBE857] text-[#323843]' : 'border-gray-300 hover:border-[#C68DFF]'
                  }" data-id="${t.id}" data-status="${t.status}">
                    ${t.status === 'completed' ? '✓' : ''}
                  </button>
                  <div class="min-w-0">
                    <h5 class="font-sans font-bold text-xs text-[#323843] leading-tight ${t.status === 'completed' ? 'line-through text-gray-400' : ''}">
                      ${t.title}
                    </h5>
                    ${t.description ? `<p class="text-[10px] text-gray-400 mt-0.5 font-sans truncate">${t.description}</p>` : ''}
                    ${t.deadline ? `<span class="inline-flex items-center gap-1 text-[9px] font-mono text-gray-400 mt-1">📅 ${t.deadline}</span>` : ''}
                  </div>
                </div>
                <button class="delete-task-btn text-gray-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors" data-id="${t.id}">
                  🗑️
                </button>
              </div>
            `).join('')}
      </div>
    `;

    // Обработчик удаления этапа
    box.querySelector('.delete-stage-btn').addEventListener('click', async (e) => {
      const sId = parseInt(e.target.getAttribute('data-id'));
      if (!confirm('Вы действительно хотите удалить этот этап? Прикрепленные задачи сохранятся как общие.')) return;

      try {
        const res = await fetch(`/stages/${sId}`, { method: 'DELETE' });
        if (res.ok) await refreshData();
      } catch (err) {
        console.error(err);
      }
    });

    // Обработчик удаления задачи
    box.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tId = parseInt(btn.getAttribute('data-id'));
        if (!confirm('Вы действительно хотите навсегда удалить эту задачу?')) return;

        try {
          const res = await fetch(`/tasks/${tId}`, { method: 'DELETE' });
          if (res.ok) await refreshData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    // Обработчик переключения чекбокса статуса задачи
    box.querySelectorAll('.toggle-task-status-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tId = parseInt(btn.getAttribute('data-id'));
        const status = btn.getAttribute('data-status');
        const newStatus = status === 'completed' ? 'pending' : 'completed';

        try {
          const res = await fetch(`/tasks/${tId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) await refreshData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    dom.trackerStagesList.appendChild(box);
  });

  // 2. Колонка общих (непривязанных) задач
  const unassigned = tasks.filter(t => !t.stage_id);
  if (unassigned.length > 0) {
    const box = document.createElement('div');
    box.className = 'border-2 border-gray-100 p-4 rounded-2xl bg-[#FCFDFE]/40 flex flex-col';

    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-gray-150 pb-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-[#CBE857] font-semibold">📦</span>
          <h4 class="font-display font-extrabold text-xs text-[#323843] uppercase tracking-wider">
            Общие задачи
          </h4>
          <span class="bg-gray-100 text-gray-500 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
            ${unassigned.length}
          </span>
        </div>
      </div>
      
      <div class="flex flex-col gap-2.5">
        ${unassigned.map(t => `
          <div class="p-3.5 bg-white border-2 rounded-xl flex items-start justify-between gap-3 transition-all ${
            t.status === 'completed' ? 'border-[#CBE857]/50 bg-[#CBE857]/5' : 'border-gray-50 shadow-sm hover:border-gray-150'
          }">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <button class="toggle-task-status-btn w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5 transition-all cursor-pointer ${
                t.status === 'completed' ? 'bg-[#CBE857] border-[#CBE857] text-[#323843]' : 'border-gray-300 hover:border-[#C68DFF]'
              }" data-id="${t.id}" data-status="${t.status}">
                ${t.status === 'completed' ? '✓' : ''}
              </button>
              <div class="min-w-0">
                <h5 class="font-sans font-bold text-xs text-[#323843] leading-tight ${t.status === 'completed' ? 'line-through text-gray-400' : ''}">
                  ${t.title}
                </h5>
                ${t.description ? `<p class="text-[10px] text-gray-400 mt-0.5 font-sans truncate">${t.description}</p>` : ''}
                ${t.deadline ? `<span class="inline-flex items-center gap-1 text-[9px] font-mono text-gray-400 mt-1">📅 ${t.deadline}</span>` : ''}
              </div>
            </div>
            <button class="delete-task-btn text-gray-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors" data-id="${t.id}">
              🗑️
            </button>
          </div>
        `).join('')}
      </div>
    `;

    // Удаление задачи из колонки общих задач
    box.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tId = parseInt(btn.getAttribute('data-id'));
        if (!confirm('Вы действительно хотите навсегда удалить эту задачу?')) return;

        try {
          const res = await fetch(`/tasks/${tId}`, { method: 'DELETE' });
          if (res.ok) await refreshData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    // Переключение статуса задачи из колонки общих задач
    box.querySelectorAll('.toggle-task-status-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tId = parseInt(btn.getAttribute('data-id'));
        const status = btn.getAttribute('data-status');
        const newStatus = status === 'completed' ? 'pending' : 'completed';

        try {
          const res = await fetch(`/tasks/${tId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) await refreshData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    dom.trackerStagesList.appendChild(box);
  }
}

// =========================================================================
// 3. НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// =========================================================================

function setupEventListeners() {
  // 3.1 Переключатель вкладок боковой навигации (сайд-бара)
  dom.navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      switchTab(target);
    });
  });

  // 3.2 Открытие/закрытие модальных окон
  dom.selectProjectTrigger.addEventListener('click', () => {
    dom.projectModal.classList.remove('hidden');
  });

  dom.projectModalClose.addEventListener('click', () => {
    dom.projectModal.classList.add('hidden');
  });

  dom.projectModalConfirm.addEventListener('click', () => {
    const selectedVal = dom.modalProjectSelect.value;
    if (selectedVal) {
      selectGroup(parseInt(selectedVal));
    }
    dom.projectModal.classList.add('hidden');
  });

  // Закрытие модальных окон при клике на задний фон
  window.addEventListener('click', (e) => {
    if (e.target === dom.projectModal) {
      dom.projectModal.classList.add('hidden');
    }
    if (e.target === dom.memberModal) {
      dom.memberModal.classList.add('hidden');
    }
  });

  // 3.3 Обработчик отправки формы создания команды
  dom.teamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = dom.teamName.value.trim();
    const direction = dom.teamDirection.value.trim();
    if (!name || !direction) return;

    try {
      const res = await fetch('/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, direction })
      });

      if (res.ok) {
        const newGroup = await res.json();
        dom.teamName.value = '';
        dom.teamDirection.value = '';
        state.activeGroupId = newGroup.id;
        await refreshData();
      } else {
        alert('Ошибка при создании группы');
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 3.4 Форма добавления участника и модальное окно участников
  dom.addMemberTrigger.addEventListener('click', () => {
    if (!state.activeGroupId) return;
    dom.memberModal.classList.remove('hidden');
  });

  dom.memberModalClose.addEventListener('click', () => {
    dom.memberModal.classList.add('hidden');
  });

  dom.memberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.activeGroupId) return;

    const name = dom.memberFio.value.trim();
    const phone = dom.memberPhone.value.trim();
    const role = dom.memberRole.value.trim();

    if (!name || !role) return;

    try {
      const res = await fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone || null,
          role,
          group_id: state.activeGroupId
        })
      });

      if (res.ok) {
        dom.memberFio.value = '';
        dom.memberPhone.value = '';
        dom.memberRole.value = '';
        dom.memberModal.classList.add('hidden');
        await refreshData();
      } else {
        alert('Ошибка при добавлении участника');
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 3.5 Обработчик отправки формы паспорта проекта
  dom.passportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.activeGroupId) return;

    const data = {
      deadline: dom.passDeadline.value || null,
      customer: dom.passCustomer.value.trim() || null,
      project_leader: dom.passLeader.value.trim() || null,
      team: dom.passTeam.value.trim() || null,
      goal_smart: dom.passGoal.value.trim() || null,
      tasks_text: dom.passTasks.value.trim() || null,
      tools: dom.passTools.value.trim() || null,
      budget: dom.passBudget.value.trim() || null,
      restrictions: dom.passRestrictions.value.trim() || null,
      risks: dom.passRisks.value.trim() || null,
      product: dom.passProduct.value.trim() || null,
      kpi: dom.passKpi.value.trim() || null
    };

    try {
      const res = await fetch(`/groups/${state.activeGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        await refreshData();
        // Запуск анимации плавного появления баннера успеха
        dom.passportSaveSuccess.classList.remove('hidden');
        setTimeout(() => {
          dom.passportSaveSuccess.classList.add('hidden');
        }, 3000);
      } else {
        alert('Ошибка при сохранении паспорта');
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 3.6 Обработчик отправки формы создания этапа
  dom.stageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.activeGroupId) return;

    const name = dom.stageNameInput.value.trim();
    if (!name) return;

    try {
      const res = await fetch('/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, group_id: state.activeGroupId })
      });

      if (res.ok) {
        dom.stageNameInput.value = '';
        await refreshData();
      } else {
        alert('Ошибка при создании этапа');
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 3.7 Обработчик отправки формы создания задачи
  dom.taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.activeGroupId) return;

    const title = dom.taskTitleInput.value.trim();
    const description = dom.taskDescInput.value.trim();
    const deadline = dom.taskDeadlineInput.value || null;
    const stageIdVal = dom.taskStageSelect.value;
    const stage_id = stageIdVal ? parseInt(stageIdVal) : null;

    if (!title) return;

    try {
      const res = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          deadline,
          group_id: state.activeGroupId,
          stage_id
        })
      });

      if (res.ok) {
        dom.taskTitleInput.value = '';
        dom.taskDescInput.value = '';
        dom.taskDeadlineInput.value = '';
        dom.taskStageSelect.value = '';
        await refreshData();
      } else {
        alert('Ошибка при создании задачи');
      }
    } catch (err) {
      console.error(err);
    }
  });
}

// Помощник для плавного переключения активных вкладок
function switchTab(targetId) {
  state.activeTab = targetId;
  localStorage.setItem('activeTab', targetId);

  dom.navItems.forEach(btn => {
    if (btn.getAttribute('data-target') === targetId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  dom.pageViews.forEach(view => {
    if (view.id === targetId) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });
}

// Выбор новой группы и перезагрузка компонентов
function selectGroup(id) {
  state.activeGroupId = id;
  localStorage.setItem('activeGroupId', id);
  refreshData();
}

// Запуск приложения при полной загрузке страницы
document.addEventListener('DOMContentLoaded', init);
