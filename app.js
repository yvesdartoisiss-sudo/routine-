(() => {
  const STORAGE_KEY = 'routine-app-data-v2';
  const OLD_STORAGE_KEY = 'routine-app-data-v1';
  const EMOJIS = ['✅', '💧', '🏃', '📚', '🧘', '🛌', '🍎', '💊', '✍️', '🧹', '🎯', '🌞'];
  const MOMENTS = [
    { key: 'morning', label: '🌅 Matin' },
    { key: 'afternoon', label: '☀️ Après-midi' },
    { key: 'evening', label: '🌙 Soir' },
    { key: 'anytime', label: '⏰ Quand tu veux' },
  ];

  const el = {
    app: document.querySelector('.app'),
    todayLabel: document.getElementById('todayLabel'),
    viewTitle: document.getElementById('viewTitle'),
    ringFill: document.getElementById('ringFill'),
    ringText: document.getElementById('ringText'),
    progressRing: document.getElementById('progressRing'),
    settingsBtn: document.getElementById('settingsBtn'),
    addBtn: document.getElementById('addBtn'),
    tabBtns: [...document.querySelectorAll('.tab-btn')],

    routineGroups: document.getElementById('routineGroups'),
    emptyRoutines: document.getElementById('emptyRoutines'),
    taskList: document.getElementById('taskList'),
    emptyTasks: document.getElementById('emptyTasks'),
    noteGrid: document.getElementById('noteGrid'),
    emptyNotes: document.getElementById('emptyNotes'),
    statGrid: document.getElementById('statGrid'),
    heatmap: document.getElementById('heatmap'),

    sheetBackdrop: document.getElementById('sheetBackdrop'),
    sheetTitle: document.getElementById('sheetTitle'),
    emojiRow: document.getElementById('emojiRow'),
    momentRow: document.getElementById('momentRow'),
    nameInput: document.getElementById('routineNameInput'),
    noteInput: document.getElementById('routineNoteInput'),
    saveBtn: document.getElementById('saveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    deleteBtn: document.getElementById('deleteBtn'),

    taskSheetBackdrop: document.getElementById('taskSheetBackdrop'),
    taskSheetTitle: document.getElementById('taskSheetTitle'),
    taskTextInput: document.getElementById('taskTextInput'),
    taskDueInput: document.getElementById('taskDueInput'),
    taskSaveBtn: document.getElementById('taskSaveBtn'),
    taskCancelBtn: document.getElementById('taskCancelBtn'),
    taskDeleteBtn: document.getElementById('taskDeleteBtn'),

    noteSheetBackdrop: document.getElementById('noteSheetBackdrop'),
    noteSheetTitle: document.getElementById('noteSheetTitle'),
    noteTextInput: document.getElementById('noteTextInput'),
    noteSaveBtn: document.getElementById('noteSaveBtn'),
    noteCancelBtn: document.getElementById('noteCancelBtn'),
    noteDeleteBtn: document.getElementById('noteDeleteBtn'),

    settingsSheetBackdrop: document.getElementById('settingsSheetBackdrop'),
    settingsCloseBtn: document.getElementById('settingsCloseBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    clearAllBtn: document.getElementById('clearAllBtn'),
  };

  let data = load();
  let currentView = 'routines';
  let editingRoutineId = null;
  let selectedEmoji = EMOJIS[0];
  let selectedMoment = 'anytime';
  let editingTaskId = null;
  let editingNoteId = null;

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayKey(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function daysBetween(a, b) {
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));

      const old = localStorage.getItem(OLD_STORAGE_KEY);
      if (old) {
        const oldRoutines = JSON.parse(old);
        return normalize({
          routines: oldRoutines.map(r => ({
            id: r.id,
            name: r.name,
            emoji: r.emoji,
            moment: 'anytime',
            note: '',
            completedDates: r.lastCompletedDate ? [r.lastCompletedDate] : [],
            createdAt: r.createdAt || todayKey(),
          })),
          tasks: [],
          notes: [],
        });
      }
    } catch {}
    return normalize({});
  }

  function normalize(d) {
    return {
      routines: Array.isArray(d.routines) ? d.routines : [],
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      notes: Array.isArray(d.notes) ? d.notes : [],
    };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ---------- Routines ----------

  function isDoneToday(r) {
    return r.completedDates.includes(todayKey());
  }

  function computeStreak(completedDates) {
    const set = new Set(completedDates);
    const cursor = new Date();
    if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (set.has(todayKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function toggleRoutineDone(id) {
    const r = data.routines.find(x => x.id === id);
    if (!r) return;
    const today = todayKey();
    const idx = r.completedDates.indexOf(today);
    if (idx >= 0) r.completedDates.splice(idx, 1);
    else r.completedDates.push(today);
    save();
    renderRoutines();
    renderStats();
  }

  function renderRoutines() {
    el.routineGroups.innerHTML = '';
    el.emptyRoutines.classList.toggle('visible', data.routines.length === 0);

    let doneCount = 0;
    const total = data.routines.length;

    for (const moment of MOMENTS) {
      const items = data.routines.filter(r => (r.moment || 'anytime') === moment.key);
      if (items.length === 0) continue;

      const heading = document.createElement('div');
      heading.className = 'group-title';
      heading.textContent = moment.label;
      el.routineGroups.appendChild(heading);

      const ul = document.createElement('ul');
      ul.className = 'routine-list';

      for (const r of items) {
        const done = isDoneToday(r);
        if (done) doneCount++;
        const streak = computeStreak(r.completedDates);

        const li = document.createElement('li');
        li.className = 'routine-item' + (done ? ' done' : '');
        li.innerHTML = `
          <div class="routine-emoji">${r.emoji}</div>
          <div class="routine-info">
            <div class="routine-name">${escapeHtml(r.name)}</div>
            <div class="routine-streak ${streak > 0 ? 'active' : ''}">
              ${streak > 0 ? `🔥 ${streak} jour${streak > 1 ? 's' : ''}` : 'Pas encore de série'}
            </div>
            ${r.note ? `<div class="routine-note">${escapeHtml(r.note)}</div>` : ''}
          </div>
          <button class="check" aria-label="Marquer comme fait">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        `;
        li.querySelector('.check').addEventListener('click', (e) => {
          e.stopPropagation();
          toggleRoutineDone(r.id);
        });
        li.querySelector('.routine-info').addEventListener('click', () => openRoutineEdit(r));
        ul.appendChild(li);
      }
      el.routineGroups.appendChild(ul);
    }

    const circumference = 119.4;
    const ratio = total ? doneCount / total : 0;
    el.ringFill.style.strokeDashoffset = String(circumference * (1 - ratio));
    el.ringText.textContent = `${doneCount}/${total}`;
  }

  function openRoutineAdd() {
    editingRoutineId = null;
    selectedEmoji = EMOJIS[0];
    selectedMoment = 'anytime';
    el.sheetTitle.textContent = 'Nouvelle routine';
    el.nameInput.value = '';
    el.noteInput.value = '';
    el.deleteBtn.classList.add('hidden');
    buildEmojiRow();
    buildMomentRow();
    openSheet(el.sheetBackdrop, el.nameInput);
  }

  function openRoutineEdit(r) {
    editingRoutineId = r.id;
    selectedEmoji = r.emoji;
    selectedMoment = r.moment || 'anytime';
    el.sheetTitle.textContent = 'Modifier la routine';
    el.nameInput.value = r.name;
    el.noteInput.value = r.note || '';
    el.deleteBtn.classList.remove('hidden');
    buildEmojiRow();
    buildMomentRow();
    openSheet(el.sheetBackdrop, el.nameInput);
  }

  function buildEmojiRow() {
    el.emojiRow.innerHTML = '';
    for (const emoji of EMOJIS) {
      const btn = document.createElement('button');
      btn.className = 'emoji-btn' + (emoji === selectedEmoji ? ' selected' : '');
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        selectedEmoji = emoji;
        [...el.emojiRow.children].forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
      });
      el.emojiRow.appendChild(btn);
    }
  }

  function buildMomentRow() {
    [...el.momentRow.children].forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.moment === selectedMoment);
    });
  }

  el.momentRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.moment-btn');
    if (!btn) return;
    selectedMoment = btn.dataset.moment;
    buildMomentRow();
  });

  function saveRoutine() {
    const name = el.nameInput.value.trim();
    if (!name) {
      el.nameInput.focus();
      return;
    }
    const note = el.noteInput.value.trim();

    if (editingRoutineId) {
      const r = data.routines.find(x => x.id === editingRoutineId);
      r.name = name;
      r.emoji = selectedEmoji;
      r.moment = selectedMoment;
      r.note = note;
    } else {
      data.routines.push({
        id: genId(),
        name,
        emoji: selectedEmoji,
        moment: selectedMoment,
        note,
        completedDates: [],
        createdAt: todayKey(),
      });
    }
    save();
    renderRoutines();
    renderStats();
    closeSheet(el.sheetBackdrop);
  }

  function deleteRoutine() {
    data.routines = data.routines.filter(x => x.id !== editingRoutineId);
    save();
    renderRoutines();
    renderStats();
    closeSheet(el.sheetBackdrop);
  }

  el.saveBtn.addEventListener('click', saveRoutine);
  el.cancelBtn.addEventListener('click', () => closeSheet(el.sheetBackdrop));
  el.deleteBtn.addEventListener('click', deleteRoutine);
  el.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveRoutine(); });

  // ---------- Tasks ----------

  function renderTasks() {
    const tasks = [...data.tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.createdAt.localeCompare(b.createdAt);
    });

    el.taskList.innerHTML = '';
    el.emptyTasks.classList.toggle('visible', tasks.length === 0);

    for (const t of tasks) {
      const li = document.createElement('li');
      li.className = 'task-item' + (t.done ? ' done' : '');
      li.innerHTML = `
        <div class="task-info">
          <div class="task-text">${escapeHtml(t.text)}</div>
          ${t.dueDate ? `<div class="task-due">📅 ${formatDateShort(t.dueDate)}</div>` : ''}
        </div>
        <button class="check" aria-label="Marquer comme fait">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      `;
      li.querySelector('.check').addEventListener('click', (e) => {
        e.stopPropagation();
        t.done = !t.done;
        save();
        renderTasks();
        renderStats();
      });
      li.querySelector('.task-info').addEventListener('click', () => openTaskEdit(t));
      el.taskList.appendChild(li);
    }
  }

  function formatDateShort(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  function openTaskAdd() {
    editingTaskId = null;
    el.taskSheetTitle.textContent = 'Nouvelle tâche';
    el.taskTextInput.value = '';
    el.taskDueInput.value = '';
    el.taskDeleteBtn.classList.add('hidden');
    openSheet(el.taskSheetBackdrop, el.taskTextInput);
  }

  function openTaskEdit(t) {
    editingTaskId = t.id;
    el.taskSheetTitle.textContent = 'Modifier la tâche';
    el.taskTextInput.value = t.text;
    el.taskDueInput.value = t.dueDate || '';
    el.taskDeleteBtn.classList.remove('hidden');
    openSheet(el.taskSheetBackdrop, el.taskTextInput);
  }

  function saveTask() {
    const text = el.taskTextInput.value.trim();
    if (!text) {
      el.taskTextInput.focus();
      return;
    }
    const dueDate = el.taskDueInput.value || null;

    if (editingTaskId) {
      const t = data.tasks.find(x => x.id === editingTaskId);
      t.text = text;
      t.dueDate = dueDate;
    } else {
      data.tasks.push({
        id: genId(),
        text,
        dueDate,
        done: false,
        createdAt: todayKey(),
      });
    }
    save();
    renderTasks();
    renderStats();
    closeSheet(el.taskSheetBackdrop);
  }

  function deleteTask() {
    data.tasks = data.tasks.filter(x => x.id !== editingTaskId);
    save();
    renderTasks();
    renderStats();
    closeSheet(el.taskSheetBackdrop);
  }

  el.taskSaveBtn.addEventListener('click', saveTask);
  el.taskCancelBtn.addEventListener('click', () => closeSheet(el.taskSheetBackdrop));
  el.taskDeleteBtn.addEventListener('click', deleteTask);
  el.taskTextInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveTask(); });

  // ---------- Notes ----------

  function renderNotes() {
    const notes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    el.noteGrid.innerHTML = '';
    el.emptyNotes.classList.toggle('visible', notes.length === 0);

    for (const n of notes) {
      const card = document.createElement('div');
      card.className = 'note-card';
      const d = new Date(n.updatedAt);
      card.innerHTML = `
        <div class="note-text">${escapeHtml(n.text)}</div>
        <div class="note-date">${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
      `;
      card.addEventListener('click', () => openNoteEdit(n));
      el.noteGrid.appendChild(card);
    }
  }

  function openNoteAdd() {
    editingNoteId = null;
    el.noteSheetTitle.textContent = 'Nouvelle note';
    el.noteTextInput.value = '';
    el.noteDeleteBtn.classList.add('hidden');
    openSheet(el.noteSheetBackdrop, el.noteTextInput);
  }

  function openNoteEdit(n) {
    editingNoteId = n.id;
    el.noteSheetTitle.textContent = 'Modifier la note';
    el.noteTextInput.value = n.text;
    el.noteDeleteBtn.classList.remove('hidden');
    openSheet(el.noteSheetBackdrop, el.noteTextInput);
  }

  function saveNote() {
    const text = el.noteTextInput.value.trim();
    if (!text) {
      el.noteTextInput.focus();
      return;
    }
    const now = new Date().toISOString();

    if (editingNoteId) {
      const n = data.notes.find(x => x.id === editingNoteId);
      n.text = text;
      n.updatedAt = now;
    } else {
      data.notes.push({
        id: genId(),
        text,
        createdAt: now,
        updatedAt: now,
      });
    }
    save();
    renderNotes();
    renderStats();
    closeSheet(el.noteSheetBackdrop);
  }

  function deleteNote() {
    data.notes = data.notes.filter(x => x.id !== editingNoteId);
    save();
    renderNotes();
    renderStats();
    closeSheet(el.noteSheetBackdrop);
  }

  el.noteSaveBtn.addEventListener('click', saveNote);
  el.noteCancelBtn.addEventListener('click', () => closeSheet(el.noteSheetBackdrop));
  el.noteDeleteBtn.addEventListener('click', deleteNote);

  // ---------- Stats ----------

  function renderStats() {
    let bestStreak = 0;
    let bestRoutine = null;
    let doneToday = 0;
    for (const r of data.routines) {
      const streak = computeStreak(r.completedDates);
      if (streak > bestStreak) {
        bestStreak = streak;
        bestRoutine = r;
      }
      if (isDoneToday(r)) doneToday++;
    }

    const tasksDone = data.tasks.filter(t => t.done).length;

    const tiles = [
      {
        value: bestStreak > 0 ? `🔥 ${bestStreak}` : '—',
        label: bestRoutine ? `Meilleure série · ${bestRoutine.emoji} ${bestRoutine.name}` : 'Meilleure série',
      },
      { value: `${doneToday}/${data.routines.length}`, label: 'Routines aujourd\'hui' },
      { value: `${tasksDone}/${data.tasks.length}`, label: 'Tâches terminées' },
      { value: `${data.notes.length}`, label: 'Notes enregistrées' },
    ];

    el.statGrid.innerHTML = tiles.map(t => `
      <div class="stat-tile">
        <div class="stat-value">${t.value}</div>
        <div class="stat-label">${t.label}</div>
      </div>
    `).join('');

    renderHeatmap();
  }

  function renderHeatmap() {
    const days = 84;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalRoutines = data.routines.length;

    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      let completed = 0;
      for (const r of data.routines) {
        if (r.completedDates.includes(key)) completed++;
      }
      const ratio = totalRoutines ? completed / totalRoutines : 0;
      let level = 0;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else if (ratio > 0) level = 1;
      cells.push({ key, level });
    }

    el.heatmap.innerHTML = cells.map(c => `<div class="hm-cell hm-${c.level}" title="${c.key}"></div>`).join('');
  }

  // ---------- Sheets ----------

  function openSheet(backdrop, focusEl) {
    backdrop.classList.add('open');
    if (focusEl) setTimeout(() => focusEl.focus(), 250);
  }

  function closeSheet(backdrop) {
    backdrop.classList.remove('open');
    document.activeElement && document.activeElement.blur();
  }

  [el.sheetBackdrop, el.taskSheetBackdrop, el.noteSheetBackdrop, el.settingsSheetBackdrop].forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSheet(backdrop);
    });
  });

  // ---------- Tabs ----------

  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    el.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.view === view));

    const titles = { routines: 'Routines', tasks: 'Tâches', notes: 'Notes', stats: 'Stats' };
    el.viewTitle.textContent = titles[view];
    el.progressRing.style.display = view === 'routines' ? '' : 'none';
    el.addBtn.style.display = view === 'stats' ? 'none' : '';
  }

  el.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  el.addBtn.addEventListener('click', () => {
    if (currentView === 'routines') openRoutineAdd();
    else if (currentView === 'tasks') openTaskAdd();
    else if (currentView === 'notes') openNoteAdd();
  });

  // ---------- Settings / backup ----------

  el.settingsBtn.addEventListener('click', () => openSheet(el.settingsSheetBackdrop));
  el.settingsCloseBtn.addEventListener('click', () => closeSheet(el.settingsSheetBackdrop));

  el.exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routine-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  el.importBtn.addEventListener('click', () => el.importFile.click());

  el.importFile.addEventListener('change', () => {
    const file = el.importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        data = normalize(parsed);
        save();
        renderRoutines();
        renderTasks();
        renderNotes();
        renderStats();
        closeSheet(el.settingsSheetBackdrop);
      } catch {
        alert('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
    el.importFile.value = '';
  });

  el.clearAllBtn.addEventListener('click', () => {
    if (!confirm('Supprimer définitivement toutes les routines, tâches et notes ?')) return;
    data = normalize({});
    save();
    renderRoutines();
    renderTasks();
    renderNotes();
    renderStats();
    closeSheet(el.settingsSheetBackdrop);
  });

  // ---------- Init ----------

  el.todayLabel.textContent = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  renderRoutines();
  renderTasks();
  renderNotes();
  renderStats();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
