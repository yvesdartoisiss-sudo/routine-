(() => {
  const STORAGE_KEY = 'routine-app-data-v1';
  const EMOJIS = ['✅', '💧', '🏃', '📚', '🧘', '🛌', '🍎', '💊', '✍️', '🧹', '🎯', '🌞'];

  const el = {
    list: document.getElementById('routineList'),
    app: document.querySelector('.app'),
    todayLabel: document.getElementById('todayLabel'),
    ringFill: document.getElementById('ringFill'),
    ringText: document.getElementById('ringText'),
    addBtn: document.getElementById('addBtn'),
    sheetBackdrop: document.getElementById('sheetBackdrop'),
    sheetTitle: document.getElementById('sheetTitle'),
    emojiRow: document.getElementById('emojiRow'),
    nameInput: document.getElementById('routineNameInput'),
    saveBtn: document.getElementById('saveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
  };

  let routines = load();
  let editingId = null;
  let selectedEmoji = EMOJIS[0];

  function todayKey() {
    const d = new Date();
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
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }

  function reconcileStreaks() {
    const today = todayKey();
    let changed = false;
    for (const r of routines) {
      if (!r.lastCompletedDate) continue;
      const gap = daysBetween(r.lastCompletedDate, today);
      if (gap > 1) {
        r.streak = 0;
        changed = true;
      }
    }
    if (changed) save();
  }

  function isDoneToday(r) {
    return r.lastCompletedDate === todayKey();
  }

  function toggleDone(id) {
    const r = routines.find(x => x.id === id);
    if (!r) return;
    const today = todayKey();

    if (isDoneToday(r)) {
      // undo today's completion
      r.streak = Math.max(0, r.streak - 1);
      r.lastCompletedDate = r.previousCompletedDate || null;
    } else {
      const gap = r.lastCompletedDate ? daysBetween(r.lastCompletedDate, today) : null;
      r.previousCompletedDate = r.lastCompletedDate;
      r.streak = gap === 1 ? r.streak + 1 : 1;
      r.lastCompletedDate = today;
    }
    save();
    render();
  }

  function render() {
    el.todayLabel.textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    el.list.innerHTML = '';
    el.app.classList.toggle('is-empty', routines.length === 0);

    let doneCount = 0;

    for (const r of routines) {
      const done = isDoneToday(r);
      if (done) doneCount++;

      const li = document.createElement('li');
      li.className = 'routine-item' + (done ? ' done' : '');
      li.dataset.id = r.id;

      li.innerHTML = `
        <div class="routine-emoji">${r.emoji}</div>
        <div class="routine-info">
          <div class="routine-name">${escapeHtml(r.name)}</div>
          <div class="routine-streak ${r.streak > 0 ? 'active' : ''}">
            ${r.streak > 0 ? `🔥 ${r.streak} jour${r.streak > 1 ? 's' : ''}` : 'Pas encore de série'}
          </div>
        </div>
        <button class="check" aria-label="Marquer comme fait">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      `;

      li.querySelector('.check').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDone(r.id);
      });

      li.querySelector('.routine-info').addEventListener('click', () => openEdit(r));

      el.list.appendChild(li);
    }

    const total = routines.length;
    const circumference = 119.4;
    const ratio = total ? doneCount / total : 0;
    el.ringFill.style.strokeDashoffset = String(circumference * (1 - ratio));
    el.ringText.textContent = `${doneCount}/${total}`;
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function openAdd() {
    editingId = null;
    selectedEmoji = EMOJIS[0];
    el.sheetTitle.textContent = 'Nouvelle routine';
    el.nameInput.value = '';
    el.deleteBtn.classList.add('hidden');
    buildEmojiRow();
    openSheet();
  }

  function openEdit(r) {
    editingId = r.id;
    selectedEmoji = r.emoji;
    el.sheetTitle.textContent = 'Modifier la routine';
    el.nameInput.value = r.name;
    el.deleteBtn.classList.remove('hidden');
    buildEmojiRow();
    openSheet();
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

  function openSheet() {
    el.sheetBackdrop.classList.add('open');
    setTimeout(() => el.nameInput.focus(), 250);
  }

  function closeSheet() {
    el.sheetBackdrop.classList.remove('open');
    el.nameInput.blur();
  }

  function saveRoutine() {
    const name = el.nameInput.value.trim();
    if (!name) {
      el.nameInput.focus();
      return;
    }

    if (editingId) {
      const r = routines.find(x => x.id === editingId);
      r.name = name;
      r.emoji = selectedEmoji;
    } else {
      routines.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name,
        emoji: selectedEmoji,
        streak: 0,
        lastCompletedDate: null,
        previousCompletedDate: null,
        createdAt: todayKey(),
      });
    }
    save();
    render();
    closeSheet();
  }

  function deleteRoutine() {
    routines = routines.filter(x => x.id !== editingId);
    save();
    render();
    closeSheet();
  }

  el.addBtn.addEventListener('click', openAdd);
  el.cancelBtn.addEventListener('click', closeSheet);
  el.saveBtn.addEventListener('click', saveRoutine);
  el.deleteBtn.addEventListener('click', deleteRoutine);
  el.sheetBackdrop.addEventListener('click', (e) => {
    if (e.target === el.sheetBackdrop) closeSheet();
  });
  el.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveRoutine();
  });

  reconcileStreaks();
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
