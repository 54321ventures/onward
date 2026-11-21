// --- State ---
let todos = [];
let statusFilter = 'All';     // All / Active / On Hold / Not Started / Done
let dueFilter = 'All';        // All / Today / Tomorrow
let categoryFilter = 'All';   // All / MSME / Credit Card / Project / Others
let sortBy = 'deadline';      // deadline / priority / created
let searchQuery = '';
let editingId = null;         // id of task being edited, or null when adding
let modalSubtasks = [];       // working copy of sub-tasks while the modal is open
let modalLinks = [];          // working copy of attachment links while the modal is open
let duplicateSourceId = null; // id of task about to be duplicated
let bannerDismissed = false;
const expandedIds = new Set();   // ids whose details panel is currently open

const STORAGE_KEY = 'todo-tracker-items';
const THEME_KEY = 'todo-tracker-theme';
const NOTIFY_KEY = 'todo-tracker-notify';
const LAST_NOTIFIED_KEY = 'todo-tracker-last-notified';

const STATUSES = ['Active', 'On Hold', 'Not Started', 'Done'];
const CATEGORY_COLORS = {
  MSME: '#2d6cdf',
  'Credit Card': '#8e44ad',
  Project: '#17a398',
  Others: '#6b7280'
};
const STATUS_COLORS = {
  'On Hold': '#b45309',
  'Not Started': '#64748b',
  Done: '#16a34a'
};

// Static, trusted icon markup (no user data) - safe to set via innerHTML.
const ICON_EDIT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_DELETE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>';
const ICON_DUPLICATE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const ICON_CHEVRON_DOWN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const ICON_CHEVRON_UP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
const ICON_BELL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
const ICON_BELL_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a1.94 1.94 0 0 1-3.4 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><path d="M1 1l22 22"/></svg>';

// --- DOM refs ---
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const statusFiltersEl = document.getElementById('status-filters');
const dueFiltersEl = document.getElementById('due-filters');
const categoryFilterSelect = document.getElementById('category-filter-select');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');
const openAddBtn = document.getElementById('open-add-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const notifyToggleBtn = document.getElementById('notify-toggle-btn');
const reminderBanner = document.getElementById('reminder-banner');

const exportCsvBtn = document.getElementById('export-csv-btn');

const modal = document.getElementById('task-modal');
const modalHeading = document.getElementById('modal-heading');
const taskForm = document.getElementById('task-form');
const fieldTitle = document.getElementById('field-title');
const fieldDescription = document.getElementById('field-description');
const fieldPriority = document.getElementById('field-priority');
const fieldDeadline = document.getElementById('field-deadline');
const fieldCategory = document.getElementById('field-category');
const fieldPic = document.getElementById('field-pic');
const fieldStatus = document.getElementById('field-status');
const fieldRecurrence = document.getElementById('field-recurrence');
const fieldRemarks = document.getElementById('field-remarks');
const picDatalist = document.getElementById('pic-datalist');
const subtaskInput = document.getElementById('subtask-input');
const subtaskAddBtn = document.getElementById('subtask-add-btn');
const subtaskEditList = document.getElementById('subtask-edit-list');
const linkInput = document.getElementById('link-input');
const linkAddBtn = document.getElementById('link-add-btn');
const linkEditList = document.getElementById('link-edit-list');
const activitySection = document.getElementById('activity-section');
const activityList = document.getElementById('activity-list');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

const duplicateModal = document.getElementById('duplicate-modal');
const duplicateForm = document.getElementById('duplicate-form');
const duplicateDateInput = document.getElementById('duplicate-date-input');
const duplicateCancelBtn = document.getElementById('duplicate-cancel-btn');

// --- Storage ---
function normalizeTodo(item) {
  if (!item || typeof item.id !== 'string' || typeof item.title !== 'string') return null;

  let status = STATUSES.includes(item.status) ? item.status : (item.done ? 'Done' : 'Active');

  let links = [];
  if (Array.isArray(item.links)) {
    links = item.links
      .filter(l => l && typeof l.id === 'string' && typeof l.url === 'string')
      .map(l => ({ id: l.id, url: l.url }));
  } else if (typeof item.link === 'string' && item.link) {
    links = [{ id: makeId(), url: item.link }];
  }

  return {
    id: item.id,
    title: item.title,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : todayStr(),
    description: typeof item.description === 'string' ? item.description : '',
    subtasks: Array.isArray(item.subtasks)
      ? item.subtasks
          .filter(s => s && typeof s.id === 'string' && typeof s.text === 'string')
          .map(s => ({ id: s.id, text: s.text, done: !!s.done }))
      : [],
    priority: ['High', 'Medium', 'Low'].includes(item.priority) ? item.priority : 'Medium',
    deadline: typeof item.deadline === 'string' ? item.deadline : '',
    category: CATEGORY_COLORS.hasOwnProperty(item.category) ? item.category : 'Others',
    pic: typeof item.pic === 'string' ? item.pic : '',
    links,
    remarks: typeof item.remarks === 'string' ? item.remarks : '',
    status,
    recurrence: ['None', 'Weekly', 'Monthly'].includes(item.recurrence) ? item.recurrence : 'None',
    activity: Array.isArray(item.activity)
      ? item.activity
          .filter(a => a && typeof a.ts === 'string' && typeof a.text === 'string')
          .map(a => ({ ts: a.ts, text: a.text }))
      : []
  };
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTodo).filter(Boolean);
  } catch (e) {
    console.warn('Could not read saved to-dos, starting fresh.', e);
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.warn('Could not save to-dos.', e);
  }
}

// --- Theme ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const switchingTo = theme === 'dark' ? 'light' : 'dark';
  themeToggleBtn.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
  themeToggleBtn.title = `Switch to ${switchingTo} mode`;
  themeToggleBtn.setAttribute('aria-label', `Switch to ${switchingTo} mode`);
}

function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (e) {
    // ignore
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    // ignore
  }
}

// --- Date helpers (plain local YYYY-MM-DD strings, no timezone math) ---
function formatDate(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function todayStr() {
  return formatDate(new Date());
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

function addInterval(dateStr, recurrence) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (recurrence === 'Weekly') dt.setDate(dt.getDate() + 7);
  else if (recurrence === 'Monthly') dt.setMonth(dt.getMonth() + 1);
  return formatDate(dt);
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isSafeHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

// --- Activity log ---
function logActivity(todo, text) {
  todo.activity.push({ ts: new Date().toISOString(), text });
  if (todo.activity.length > 30) todo.activity = todo.activity.slice(-30);
}

// --- Status changes (handles recurrence + logging) ---
function setStatus(todo, newStatus) {
  if (!STATUSES.includes(newStatus) || todo.status === newStatus) return;
  todo.status = newStatus;
  logActivity(todo, `Status changed to ${newStatus}`);

  if (newStatus === 'Done' && todo.recurrence !== 'None' && todo.deadline) {
    const nextTask = {
      ...todo,
      id: makeId(),
      createdAt: todayStr(),
      deadline: addInterval(todo.deadline, todo.recurrence),
      status: 'Active',
      subtasks: todo.subtasks.map(s => ({ ...s, id: makeId(), done: false })),
      links: todo.links.map(l => ({ ...l, id: makeId() })),
      activity: [{ ts: new Date().toISOString(), text: `Created (recurring from "${todo.title}")` }]
    };
    const idx = todos.indexOf(todo);
    todos.splice(idx + 1, 0, nextTask);
  }
}

// --- Toast (transient status messages) ---
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Reminders / notifications ---
function computeDueCounts() {
  const today = todayStr();
  let overdue = 0;
  let dueToday = 0;
  todos.forEach(t => {
    if (t.status === 'Done' || !t.deadline) return;
    if (t.deadline < today) overdue++;
    else if (t.deadline === today) dueToday++;
  });
  return { overdue, dueToday };
}

function renderReminderBanner() {
  const { overdue, dueToday } = computeDueCounts();
  if (bannerDismissed || (overdue === 0 && dueToday === 0)) {
    reminderBanner.hidden = true;
    reminderBanner.innerHTML = '';
    return;
  }
  const parts = [];
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (dueToday > 0) parts.push(`${dueToday} due today`);

  reminderBanner.innerHTML = '';
  const text = document.createElement('span');
  text.textContent = `⚠️ ${parts.join(', ')}`;
  reminderBanner.appendChild(text);

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.textContent = '✕';
  dismissBtn.setAttribute('aria-label', 'Dismiss');
  dismissBtn.addEventListener('click', () => {
    bannerDismissed = true;
    renderReminderBanner();
  });
  reminderBanner.appendChild(dismissBtn);

  reminderBanner.hidden = false;
}

function loadNotifyEnabled() {
  try {
    if (localStorage.getItem(NOTIFY_KEY) !== 'on') return false;
  } catch (e) {
    return false;
  }
  // The saved flag can go stale if permission was revoked outside the app
  // (browser/site settings, OS-level notification settings, etc). Don't
  // keep showing reminders as "on" when they can never actually fire.
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    try {
      localStorage.setItem(NOTIFY_KEY, 'off');
    } catch (e) {
      // ignore
    }
    return false;
  }
  return true;
}

function applyNotifyButton(enabled) {
  notifyToggleBtn.innerHTML = enabled ? ICON_BELL : ICON_BELL_OFF;
  notifyToggleBtn.title = enabled ? 'Disable due-task reminders' : 'Enable due-task reminders';
  notifyToggleBtn.setAttribute('aria-label', notifyToggleBtn.title);
}

function toggleNotify() {
  const currentlyEnabled = loadNotifyEnabled();
  if (currentlyEnabled) {
    try {
      localStorage.setItem(NOTIFY_KEY, 'off');
    } catch (e) {
      // ignore
    }
    applyNotifyButton(false);
    return;
  }

  if (typeof Notification === 'undefined') {
    showToast('Notifications are not supported in this browser.');
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      try {
        localStorage.setItem(NOTIFY_KEY, 'on');
      } catch (e) {
        // ignore
      }
      applyNotifyButton(true);
      showToast('Reminders enabled.');
      maybeSendDailyNotification();
    } else if (permission === 'denied') {
      showToast('Notifications are blocked for this site. Enable them in your browser\'s site settings, then try again.');
    } else {
      showToast('Notification permission was not granted.');
    }
  });
}

function maybeSendDailyNotification() {
  if (!loadNotifyEnabled()) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const today = todayStr();
  let lastNotified = '';
  try {
    lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY) || '';
  } catch (e) {
    // ignore
  }
  if (lastNotified === today) return;

  const { overdue, dueToday } = computeDueCounts();
  if (overdue === 0 && dueToday === 0) return;

  const parts = [];
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (dueToday > 0) parts.push(`${dueToday} due today`);

  new Notification('To-Do Tracker', { body: parts.join(', ') });
  try {
    localStorage.setItem(LAST_NOTIFIED_KEY, today);
  } catch (e) {
    // ignore
  }
}

// --- PIC autocomplete ---
function refreshPicDatalist() {
  const names = Array.from(new Set(todos.map(t => t.pic).filter(Boolean))).sort();
  picDatalist.innerHTML = '';
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    picDatalist.appendChild(opt);
  });
}

// --- Search ---
function matchesSearch(todo, query) {
  if (!query) return true;
  const haystack = [
    todo.title,
    todo.description,
    todo.remarks,
    todo.pic,
    todo.category,
    ...todo.subtasks.map(s => s.text)
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

// --- Rendering ---
function render() {
  list.innerHTML = '';

  const today = todayStr();
  const tomorrow = tomorrowStr();
  const query = searchQuery.trim().toLowerCase();

  let visible = todos.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (dueFilter === 'Today' && t.deadline !== today) return false;
    if (dueFilter === 'Tomorrow' && t.deadline !== tomorrow) return false;
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (!matchesSearch(t, query)) return false;
    return true;
  });

  visible = visible.slice().sort((a, b) => {
    if (sortBy === 'created') {
      const cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
      return cmp !== 0 ? cmp : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    if (sortBy === 'priority') {
      const cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (cmp !== 0) return cmp;
    }
    if (!a.deadline && !b.deadline) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    const cmp = a.deadline.localeCompare(b.deadline);
    return cmp !== 0 ? cmp : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

  emptyState.hidden = visible.length !== 0;
  emptyState.textContent = todos.length === 0
    ? 'Nothing here yet. Click "+ Add Task" to get started!'
    : 'No tasks match your search/filters.';

  visible.forEach(todo => list.appendChild(buildTodoItem(todo, today)));

  renderReminderBanner();
  refreshPicDatalist();
}

function buildTodoItem(todo, today) {
  const li = document.createElement('li');
  li.className = 'todo-item';

  const isOverdue = todo.status !== 'Done' && todo.deadline && todo.deadline < today;
  const isDueToday = todo.status !== 'Done' && todo.deadline === today;
  if (isOverdue) li.classList.add('overdue');
  else if (isDueToday) li.classList.add('due-today');

  const row = document.createElement('div');
  row.className = 'todo-row';

  // Checkbox (Done toggle)
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked = todo.status === 'Done';
  checkbox.addEventListener('change', () => toggleDoneQuick(todo.id));
  row.appendChild(checkbox);

  // Main content
  const main = document.createElement('div');
  main.className = 'todo-main';

  const titleLine = document.createElement('div');
  titleLine.className = 'todo-title-line';

  const titleEl = document.createElement('span');
  titleEl.className = 'todo-title' + (todo.status === 'Done' ? ' done' : '');
  titleEl.textContent = todo.title;
  titleLine.appendChild(titleEl);

  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'badge';
  categoryBadge.style.backgroundColor = CATEGORY_COLORS[todo.category] || CATEGORY_COLORS.Others;
  categoryBadge.textContent = todo.category;
  titleLine.appendChild(categoryBadge);

  const priorityBadge = document.createElement('span');
  priorityBadge.className = 'badge priority-' + todo.priority;
  priorityBadge.textContent = todo.priority;
  titleLine.appendChild(priorityBadge);

  if (STATUS_COLORS[todo.status]) {
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge';
    statusBadge.style.backgroundColor = STATUS_COLORS[todo.status];
    statusBadge.textContent = todo.status;
    titleLine.appendChild(statusBadge);
  }

  if (todo.recurrence !== 'None') {
    const recurBadge = document.createElement('span');
    recurBadge.className = 'badge badge-outline';
    recurBadge.textContent = '⟳ ' + todo.recurrence;
    titleLine.appendChild(recurBadge);
  }

  main.appendChild(titleLine);

  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  if (todo.deadline) {
    const dateEl = document.createElement('span');
    dateEl.textContent = '📅 ' + todo.deadline;
    meta.appendChild(dateEl);
  }

  if (todo.createdAt) {
    const addedEl = document.createElement('span');
    addedEl.textContent = '🕓 Added ' + todo.createdAt;
    meta.appendChild(addedEl);
  }

  if (todo.pic) {
    const picEl = document.createElement('span');
    picEl.textContent = '👤 ' + todo.pic;
    meta.appendChild(picEl);
  }

  if (todo.subtasks.length > 0) {
    const doneCount = todo.subtasks.filter(s => s.done).length;
    const subEl = document.createElement('span');
    subEl.textContent = `☑ ${doneCount}/${todo.subtasks.length} sub-tasks`;
    meta.appendChild(subEl);
  }

  const safeLinks = todo.links.filter(l => isSafeHttpUrl(l.url));
  if (safeLinks.length === 1) {
    const linkEl = document.createElement('a');
    linkEl.href = safeLinks[0].url;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    linkEl.textContent = '🔗 Attachment';
    meta.appendChild(linkEl);
  } else if (safeLinks.length > 1) {
    const linkEl = document.createElement('span');
    linkEl.textContent = `🔗 ${safeLinks.length} links`;
    meta.appendChild(linkEl);
  }

  if (meta.children.length > 0) main.appendChild(meta);
  row.appendChild(main);
  li.appendChild(row);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const detailsBtn = document.createElement('button');
  detailsBtn.type = 'button';
  detailsBtn.className = 'icon-btn';
  const isExpanded = expandedIds.has(todo.id);
  detailsBtn.innerHTML = isExpanded ? ICON_CHEVRON_UP : ICON_CHEVRON_DOWN;
  detailsBtn.title = isExpanded ? 'Hide details' : 'Show details';
  detailsBtn.setAttribute('aria-label', detailsBtn.title);
  detailsBtn.addEventListener('click', () => toggleDetails(todo.id));
  actions.appendChild(detailsBtn);

  const duplicateBtn = document.createElement('button');
  duplicateBtn.type = 'button';
  duplicateBtn.className = 'icon-btn';
  duplicateBtn.innerHTML = ICON_DUPLICATE;
  duplicateBtn.title = 'Duplicate';
  duplicateBtn.setAttribute('aria-label', 'Duplicate');
  duplicateBtn.addEventListener('click', () => openDuplicateModal(todo.id));
  actions.appendChild(duplicateBtn);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'icon-btn';
  editBtn.innerHTML = ICON_EDIT;
  editBtn.title = 'Edit';
  editBtn.setAttribute('aria-label', 'Edit');
  editBtn.addEventListener('click', () => openEditModal(todo.id));
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn icon-btn-danger';
  deleteBtn.innerHTML = ICON_DELETE;
  deleteBtn.title = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete');
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
  actions.appendChild(deleteBtn);

  li.appendChild(actions);

  if (expandedIds.has(todo.id)) {
    li.appendChild(buildDetailsPanel(todo));
  }

  return li;
}

function buildDetailsPanel(todo) {
  const details = document.createElement('div');
  details.className = 'todo-details';

  if (todo.description) {
    const desc = document.createElement('p');
    desc.className = 'todo-description';
    desc.textContent = todo.description;
    details.appendChild(desc);
  }

  if (todo.subtasks.length > 0) {
    const subList = document.createElement('ul');
    subList.className = 'subtask-list';

    todo.subtasks.forEach(sub => {
      const subLi = document.createElement('li');

      const subCheckbox = document.createElement('input');
      subCheckbox.type = 'checkbox';
      subCheckbox.checked = sub.done;
      subCheckbox.addEventListener('change', () => toggleSubtask(todo.id, sub.id));
      subLi.appendChild(subCheckbox);

      const subText = document.createElement('span');
      subText.className = 'subtask-text' + (sub.done ? ' done' : '');
      subText.textContent = sub.text;
      subLi.appendChild(subText);

      subList.appendChild(subLi);
    });

    details.appendChild(subList);
  }

  const safeLinks = todo.links.filter(l => isSafeHttpUrl(l.url));
  if (safeLinks.length > 0) {
    const linksList = document.createElement('ul');
    linksList.className = 'details-link-list';
    safeLinks.forEach(l => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = l.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = l.url;
      li.appendChild(a);
      linksList.appendChild(li);
    });
    details.appendChild(linksList);
  }

  if (todo.remarks) {
    const remarks = document.createElement('p');
    remarks.className = 'todo-remarks';
    const label = document.createElement('strong');
    label.textContent = 'Remarks: ';
    remarks.appendChild(label);
    remarks.appendChild(document.createTextNode(todo.remarks));
    details.appendChild(remarks);
  }

  if (todo.activity.length > 0) {
    const activityHeading = document.createElement('p');
    activityHeading.className = 'details-activity-heading';
    activityHeading.textContent = 'Activity';
    details.appendChild(activityHeading);

    const activityUl = document.createElement('ul');
    activityUl.className = 'activity-list';
    todo.activity
      .slice()
      .reverse()
      .forEach(entry => {
        const li = document.createElement('li');
        const time = document.createElement('span');
        time.className = 'activity-time';
        time.textContent = formatTimestamp(entry.ts);
        li.appendChild(time);
        li.appendChild(document.createTextNode(' – ' + entry.text));
        activityUl.appendChild(li);
      });
    details.appendChild(activityUl);
  }

  return details;
}

// --- Actions on todos ---
function toggleDoneQuick(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  setStatus(todo, todo.status === 'Done' ? 'Active' : 'Done');
  saveTodos();
  render();
}

function toggleSubtask(taskId, subId) {
  const todo = todos.find(t => t.id === taskId);
  if (!todo) return;
  const sub = todo.subtasks.find(s => s.id === subId);
  if (sub) {
    sub.done = !sub.done;
    saveTodos();
    render();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  expandedIds.delete(id);
  saveTodos();
  render();
}

function toggleDetails(id) {
  if (expandedIds.has(id)) expandedIds.delete(id);
  else expandedIds.add(id);
  render();
}

// --- Duplicate naming (Task -> Task v2 -> Task v3 ...) ---
function getDuplicateTitle(sourceTitle) {
  const match = sourceTitle.match(/^(.*) (\d+)$/);
  const baseTitle = match ? match[1] : sourceTitle;
  const escaped = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + escaped + '(?: (\\d+))?$');
  let maxVersion = 1;
  todos.forEach(t => {
    const m = t.title.match(re);
    if (m) {
      const v = m[1] ? parseInt(m[1], 10) : 1;
      if (v > maxVersion) maxVersion = v;
    }
  });
  return `${baseTitle} ${maxVersion + 1}`;
}

// --- Duplicate modal ---
function openDuplicateModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  duplicateSourceId = id;
  duplicateDateInput.value = todo.deadline || '';
  duplicateModal.showModal();
  duplicateDateInput.focus();
}

function closeDuplicateModal() {
  duplicateModal.close();
  duplicateSourceId = null;
}

duplicateForm.addEventListener('submit', e => {
  e.preventDefault();
  const todo = todos.find(t => t.id === duplicateSourceId);
  if (todo) {
    const copy = {
      ...todo,
      id: makeId(),
      createdAt: todayStr(),
      title: getDuplicateTitle(todo.title),
      subtasks: todo.subtasks.map(s => ({ ...s, id: makeId() })),
      links: todo.links.map(l => ({ ...l, id: makeId() })),
      deadline: duplicateDateInput.value,
      status: 'Active',
      activity: [{ ts: new Date().toISOString(), text: `Duplicated from "${todo.title}"` }]
    };
    const index = todos.indexOf(todo);
    todos.splice(index + 1, 0, copy);
    saveTodos();
    render();
  }
  closeDuplicateModal();
});

duplicateCancelBtn.addEventListener('click', closeDuplicateModal);
duplicateModal.addEventListener('cancel', () => {
  duplicateSourceId = null;
});

// --- Modal (add / edit) ---
function openAddModal() {
  editingId = null;
  modalSubtasks = [];
  modalLinks = [];
  modalHeading.textContent = 'Add Task';
  taskForm.reset();
  fieldPriority.value = 'Medium';
  fieldCategory.value = 'Others';
  fieldStatus.value = 'Active';
  fieldRecurrence.value = 'None';
  renderSubtaskEditList();
  renderLinkEditList();
  activitySection.hidden = true;
  activityList.innerHTML = '';
  modal.showModal();
  fieldTitle.focus();
}

function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  editingId = id;
  modalSubtasks = todo.subtasks.map(s => ({ ...s }));
  modalLinks = todo.links.map(l => ({ ...l }));
  modalHeading.textContent = 'Edit Task';

  fieldTitle.value = todo.title;
  fieldDescription.value = todo.description;
  fieldPriority.value = todo.priority;
  fieldDeadline.value = todo.deadline;
  fieldCategory.value = todo.category;
  fieldPic.value = todo.pic;
  fieldStatus.value = todo.status;
  fieldRecurrence.value = todo.recurrence;
  fieldRemarks.value = todo.remarks;

  renderSubtaskEditList();
  renderLinkEditList();

  if (todo.activity.length > 0) {
    activitySection.hidden = false;
    activityList.innerHTML = '';
    todo.activity
      .slice()
      .reverse()
      .forEach(entry => {
        const li = document.createElement('li');
        const time = document.createElement('span');
        time.className = 'activity-time';
        time.textContent = formatTimestamp(entry.ts);
        li.appendChild(time);
        li.appendChild(document.createTextNode(' – ' + entry.text));
        activityList.appendChild(li);
      });
  } else {
    activitySection.hidden = true;
    activityList.innerHTML = '';
  }

  modal.showModal();
  fieldTitle.focus();
}

function closeModal() {
  modal.close();
  editingId = null;
  modalSubtasks = [];
  modalLinks = [];
}

function renderSubtaskEditList() {
  subtaskEditList.innerHTML = '';
  modalSubtasks.forEach(sub => {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = sub.done;
    checkbox.addEventListener('change', () => {
      sub.done = checkbox.checked;
    });
    li.appendChild(checkbox);

    const text = document.createElement('span');
    text.textContent = sub.text;
    li.appendChild(text);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', 'Remove sub-task');
    removeBtn.addEventListener('click', () => {
      modalSubtasks = modalSubtasks.filter(s => s.id !== sub.id);
      renderSubtaskEditList();
    });
    li.appendChild(removeBtn);

    subtaskEditList.appendChild(li);
  });
}

function addSubtaskFromInput() {
  const text = subtaskInput.value.trim();
  if (!text) return;
  modalSubtasks.push({ id: makeId(), text, done: false });
  subtaskInput.value = '';
  renderSubtaskEditList();
  subtaskInput.focus();
}

function renderLinkEditList() {
  linkEditList.innerHTML = '';
  modalLinks.forEach(link => {
    const li = document.createElement('li');

    const text = document.createElement('span');
    text.textContent = link.url;
    li.appendChild(text);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', 'Remove link');
    removeBtn.addEventListener('click', () => {
      modalLinks = modalLinks.filter(l => l.id !== link.id);
      renderLinkEditList();
    });
    li.appendChild(removeBtn);

    linkEditList.appendChild(li);
  });
}

function addLinkFromInput() {
  const url = linkInput.value.trim();
  if (!url) return;
  modalLinks.push({ id: makeId(), url });
  linkInput.value = '';
  renderLinkEditList();
  linkInput.focus();
}

// --- Event listeners ---
openAddBtn.addEventListener('click', openAddModal);
modalCancelBtn.addEventListener('click', closeModal);
themeToggleBtn.addEventListener('click', toggleTheme);
notifyToggleBtn.addEventListener('click', toggleNotify);

modal.addEventListener('cancel', () => {
  editingId = null;
  modalSubtasks = [];
  modalLinks = [];
});

subtaskAddBtn.addEventListener('click', addSubtaskFromInput);
subtaskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addSubtaskFromInput();
  }
});

linkAddBtn.addEventListener('click', addLinkFromInput);
linkInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addLinkFromInput();
  }
});

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = fieldTitle.value.trim();
  if (!title) return;

  const data = {
    title,
    description: fieldDescription.value.trim(),
    subtasks: modalSubtasks.filter(s => s.text.trim()),
    links: modalLinks.filter(l => l.url.trim()),
    priority: fieldPriority.value,
    deadline: fieldDeadline.value,
    category: fieldCategory.value,
    pic: fieldPic.value.trim(),
    recurrence: fieldRecurrence.value,
    remarks: fieldRemarks.value.trim()
  };
  const chosenStatus = fieldStatus.value;

  if (editingId === null) {
    const newTodo = {
      id: makeId(),
      status: 'Active',
      createdAt: todayStr(),
      activity: [{ ts: new Date().toISOString(), text: 'Created' }],
      ...data
    };
    todos.push(newTodo);
    if (chosenStatus !== 'Active') setStatus(newTodo, chosenStatus);
  } else {
    const todo = todos.find(t => t.id === editingId);
    if (todo) {
      Object.assign(todo, data);
      logActivity(todo, 'Edited task');
      if (chosenStatus !== todo.status) setStatus(todo, chosenStatus);
    }
  }

  saveTodos();
  closeModal();
  render();
});

statusFiltersEl.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  statusFilter = btn.dataset.filter;
  statusFiltersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
});

dueFiltersEl.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  dueFilter = btn.dataset.due;
  dueFiltersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
});

categoryFilterSelect.addEventListener('change', () => {
  categoryFilter = categoryFilterSelect.value;
  render();
});

sortSelect.addEventListener('change', () => {
  sortBy = sortSelect.value;
  render();
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  render();
});

// --- Export ---
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value == null ? '' : value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

exportCsvBtn.addEventListener('click', () => {
  const header = ['Title', 'Description', 'Priority', 'Deadline', 'Category', 'PIC', 'Status', 'Repeat', 'Remarks', 'Links', 'Sub-tasks'];
  const rows = todos.map(t => [
    t.title,
    t.description,
    t.priority,
    t.deadline,
    t.category,
    t.pic,
    t.status,
    t.recurrence,
    t.remarks,
    t.links.map(l => l.url).join(' | '),
    t.subtasks.map(s => `${s.text} (${s.done ? 'done' : 'open'})`).join(' | ')
  ]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, 'todo-tracker-export.csv');
});

// --- Init ---
applyTheme(loadTheme());
applyNotifyButton(loadNotifyEnabled());
todos = loadTodos();
render();
maybeSendDailyNotification();
