// ============================================================
//  Habit Tracker — app.js
// ============================================================

const STORAGE_KEY = 'habit_tracker_v1';

const CATEGORY_META = {
  saude:         { label: 'Saúde',         icon: '💪', color: '#22c55e' },
  mente:         { label: 'Mente',          icon: '🧠', color: '#a855f7' },
  produtividade: { label: 'Produtividade',  icon: '📚', color: '#3b82f6' },
  social:        { label: 'Social',         icon: '🤝', color: '#f59e0b' },
  financas:      { label: 'Finanças',       icon: '💰', color: '#10b981' },
  outro:         { label: 'Outro',          icon: '⭐', color: '#6366f1' },
};

// ── State ────────────────────────────────────────────────────
let habits        = [];   // Habit[]
let editingId     = null;
let currentFilter = 'all';

// Habit shape:
// { id, name, description, category, createdAt, completedDates[], streak, bestStreak }

// ── Date helpers ─────────────────────────────────────────────
function dateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

const todayStr     = () => dateStr(0);
const yesterdayStr = () => dateStr(-1);

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isCompletedToday(habit) {
  return habit.completedDates.includes(todayStr());
}

function escapeHTML(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ── Persistence ──────────────────────────────────────────────
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    habits = raw ? JSON.parse(raw) : [];
  } catch {
    habits = [];
  }
}

// ── Streak ───────────────────────────────────────────────────
function recalcStreak(habit) {
  const dates = new Set(habit.completedDates);
  if (dates.size === 0) { habit.streak = 0; return; }

  // Walk back from today (or yesterday if today not done)
  let check  = dates.has(todayStr()) ? todayStr() : yesterdayStr();
  let streak = 0;

  while (dates.has(check)) {
    streak++;
    const d = new Date(check);
    d.setDate(d.getDate() - 1);
    check = d.toISOString().slice(0, 10);
  }

  habit.streak = streak;
  if (streak > (habit.bestStreak || 0)) habit.bestStreak = streak;
}

// ── Actions ───────────────────────────────────────────────────
function addHabit(name, description, category) {
  habits.unshift({
    id:             generateId(),
    name:           name.trim(),
    description:    description.trim(),
    category,
    createdAt:      new Date().toISOString(),
    completedDates: [],
    streak:         0,
    bestStreak:     0,
  });
  save();
  render();
}

function toggleHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  const today = todayStr();
  const idx   = habit.completedDates.indexOf(today);
  if (idx === -1) {
    habit.completedDates.push(today);
  } else {
    habit.completedDates.splice(idx, 1);
  }
  recalcStreak(habit);
  save();
  render();
}

function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  save();
  render();
}

function openEdit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  editingId = id;
  document.getElementById('editNameInput').value     = habit.name;
  document.getElementById('editDescInput').value     = habit.description;
  document.getElementById('editCategorySelect').value = habit.category;
  document.getElementById('editModal').classList.add('active');
}

function saveEdit() {
  const habit = habits.find(h => h.id === editingId);
  if (!habit) return;
  const name = document.getElementById('editNameInput').value.trim();
  if (!name) return;
  habit.name        = name;
  habit.description = document.getElementById('editDescInput').value.trim();
  habit.category    = document.getElementById('editCategorySelect').value;
  editingId = null;
  document.getElementById('editModal').classList.remove('active');
  save();
  render();
}

function closeModal() {
  editingId = null;
  document.getElementById('editModal').classList.remove('active');
}

function clearAll() {
  if (!confirm('Remover TODOS os hábitos? Esta ação não pode ser desfeita.')) return;
  habits = [];
  save();
  render();
}

// Global helpers called from inline onclick
window.toggleHabit   = toggleHabit;
window.openEdit      = openEdit;
window.confirmDelete = (id) => {
  const habit = habits.find(h => h.id === id);
  if (habit && confirm(`Remover "${habit.name}"?`)) deleteHabit(id);
};

// ── Render ────────────────────────────────────────────────────
function filteredHabits() {
  const today = todayStr();
  if (currentFilter === 'done')    return habits.filter(h => h.completedDates.includes(today));
  if (currentFilter === 'pending') return habits.filter(h => !h.completedDates.includes(today));
  return habits;
}

function renderStats() {
  const today     = todayStr();
  const total     = habits.length;
  const completed = habits.filter(h => h.completedDates.includes(today)).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);
  const best      = habits.reduce((m, h) => Math.max(m, h.bestStreak || 0), 0);

  document.getElementById('totalHabits').textContent    = total;
  document.getElementById('completedToday').textContent = completed;
  document.getElementById('progressPercent').textContent = `${pct}%`;
  document.getElementById('bestStreak').textContent     = best;
  document.getElementById('progressBar').style.width    = `${pct}%`;
  document.getElementById('progressText').textContent   =
    `${completed} de ${total} hábito${total !== 1 ? 's' : ''} concluído${completed !== 1 ? 's' : ''} hoje`;
}

function renderHabits() {
  const list     = document.getElementById('habitsList');
  const empty    = document.getElementById('emptyState');
  const filtered = filteredHabits();

  if (filtered.length === 0) {
    list.innerHTML      = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = filtered.map(habit => {
    const done  = isCompletedToday(habit);
    const meta  = CATEGORY_META[habit.category] || CATEGORY_META.outro;
    const streak = habit.streak || 0;

    return `
      <div class="habit-card ${done ? 'done' : ''}">
        <button
          class="check-btn ${done ? 'checked' : ''}"
          onclick="toggleHabit('${habit.id}')"
          aria-label="${done ? 'Desmarcar hábito' : 'Marcar hábito como concluído'}"
        >${done ? '✓' : ''}</button>

        <div class="habit-body">
          <div class="habit-header-row">
            <span class="habit-name">${escapeHTML(habit.name)}</span>
            <span
              class="category-badge"
              style="background:${meta.color}20;color:${meta.color};border-color:${meta.color}40"
            >${meta.icon} ${meta.label}</span>
          </div>
          ${habit.description
            ? `<p class="habit-desc">${escapeHTML(habit.description)}</p>`
            : ''}
          <div class="habit-meta">
            <span class="meta-item" title="Sequência atual">
              🔥 ${streak} dia${streak !== 1 ? 's' : ''}
            </span>
            <span class="meta-item" title="Data de criação">
              📅 ${formatDate(habit.createdAt)}
            </span>
            <span class="meta-item" title="Total de conclusões">
              ✅ ${habit.completedDates.length}x
            </span>
          </div>
        </div>

        <div class="habit-actions">
          <button
            class="btn-icon btn-edit"
            onclick="openEdit('${habit.id}')"
            title="Editar"
            aria-label="Editar hábito"
          >✏️</button>
          <button
            class="btn-icon btn-delete"
            onclick="confirmDelete('${habit.id}')"
            title="Excluir"
            aria-label="Excluir hábito"
          >🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function render() {
  renderStats();
  renderHabits();
}

// ── Date header ───────────────────────────────────────────────
function renderDate() {
  document.getElementById('currentDate').textContent =
    new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

// ── Event Listeners ───────────────────────────────────────────
document.getElementById('addHabitForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('habitNameInput').value;
  const desc = document.getElementById('habitDescInput').value;
  const cat  = document.getElementById('habitCategorySelect').value;
  if (!name.trim()) return;
  addHabit(name, desc, cat);
  e.target.reset();
  document.getElementById('habitNameInput').focus();
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });
});

document.getElementById('saveEditBtn').addEventListener('click',   saveEdit);
document.getElementById('cancelEditBtn').addEventListener('click', closeModal);
document.getElementById('clearAllBtn').addEventListener('click',   clearAll);

// Close modal on backdrop click or Escape
document.getElementById('editModal').addEventListener('click', e => {
  if (e.target === document.getElementById('editModal')) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── Init ──────────────────────────────────────────────────────
load();
renderDate();
render();
