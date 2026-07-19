(() => {
  const STORAGE_KEY = 'routine-app-data-v2';
  const OLD_STORAGE_KEY = 'routine-app-data-v1';
  const LAST_NOTIFIED_KEY = 'routine-last-notified-date';
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

    reminderBanner: document.getElementById('reminderBanner'),
    reminderText: document.getElementById('reminderText'),
    reminderDismiss: document.getElementById('reminderDismiss'),

    routineGroups: document.getElementById('routineGroups'),
    emptyRoutines: document.getElementById('emptyRoutines'),
    taskList: document.getElementById('taskList'),
    emptyTasks: document.getElementById('emptyTasks'),
    agendaGroups: document.getElementById('agendaGroups'),
    emptyAgenda: document.getElementById('emptyAgenda'),
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

    apptSheetBackdrop: document.getElementById('apptSheetBackdrop'),
    apptSheetTitle: document.getElementById('apptSheetTitle'),
    apptTitleInput: document.getElementById('apptTitleInput'),
    apptDateInput: document.getElementById('apptDateInput'),
    apptTimeInput: document.getElementById('apptTimeInput'),
    apptNoteInput: document.getElementById('apptNoteInput'),
    apptSaveBtn: document.getElementById('apptSaveBtn'),
    apptCancelBtn: document.getElementById('apptCancelBtn'),
    apptDeleteBtn: document.getElementById('apptDeleteBtn'),

    noteSheetBackdrop: document.getElementById('noteSheetBackdrop'),
    noteSheetTitle: document.getElementById('noteSheetTitle'),
    noteTypeRow: document.getElementById('noteTypeRow'),
    noteTextInput: document.getElementById('noteTextInput'),
    voiceRecorder: document.getElementById('voiceRecorder'),
    recordBtn: document.getElementById('recordBtn'),
    recordTimer: document.getElementById('recordTimer'),
    recordHint: document.getElementById('recordHint'),
    voicePreview: document.getElementById('voicePreview'),
    noteSaveBtn: document.getElementById('noteSaveBtn'),
    noteCancelBtn: document.getElementById('noteCancelBtn'),
    noteDeleteBtn: document.getElementById('noteDeleteBtn'),

    settingsSheetBackdrop: document.getElementById('settingsSheetBackdrop'),
    settingsCloseBtn: document.getElementById('settingsCloseBtn'),
    notifBtn: document.getElementById('notifBtn'),
    notifStatus: document.getElementById('notifStatus'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    clearAllBtn: document.getElementById('clearAllBtn'),

    listenMic: document.getElementById('listenMic'),
    listenMicIcon: document.getElementById('listenMicIcon'),
    listenStatus: document.getElementById('listenStatus'),
    listenHint: document.getElementById('listenHint'),
    assistantBubble: document.getElementById('assistantBubble'),
    assistantText: document.getElementById('assistantText'),
    listenLive: document.getElementById('listenLive'),
    listenLiveText: document.getElementById('listenLiveText'),
    memorySearch: document.getElementById('memorySearch'),
    memoryFeed: document.getElementById('memoryFeed'),
    emptyMemory: document.getElementById('emptyMemory'),
    ambientToast: document.getElementById('ambientToast'),
    ambientToastText: document.getElementById('ambientToastText'),
    ambientToastClose: document.getElementById('ambientToastClose'),
  };

  let data = load();
  let currentView = 'listen';
  let editingRoutineId = null;
  let selectedEmoji = EMOJIS[0];
  let selectedMoment = 'anytime';
  let editingTaskId = null;
  let editingApptId = null;
  let editingNoteId = null;
  let selectedNoteType = 'text';
  let recordedBlob = null;
  let pendingAudioId = null;

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
          appointments: [],
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
      appointments: Array.isArray(d.appointments) ? d.appointments : [],
      notes: Array.isArray(d.notes) ? d.notes : [],
      memory: Array.isArray(d.memory) ? d.memory : [],
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

  // ---------- Audio storage (IndexedDB) ----------

  const AUDIO_DB_NAME = 'routine-audio-db';
  const AUDIO_STORE = 'clips';

  function openAudioDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(AUDIO_DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(AUDIO_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function audioPut(id, blob) {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      tx.objectStore(AUDIO_STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function audioGet(id) {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const req = tx.objectStore(AUDIO_STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function audioDelete(id) {
    const db = await openAudioDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      tx.objectStore(AUDIO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---------- Voice recording ----------

  let mediaRecorder = null;
  let recordingChunks = [];
  let recordingStream = null;
  let recordingStartedAt = 0;
  let recordingTimerHandle = null;

  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  async function startRecording() {
    try {
      recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Impossible d'accéder au micro. Vérifie les autorisations dans les réglages de Safari.");
      return;
    }
    recordingChunks = [];
    const mimeType = ['audio/mp4', 'audio/webm']
      .find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    mediaRecorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size) recordingChunks.push(e.data); };
    mediaRecorder.start();
    recordingStartedAt = Date.now();
    el.recordBtn.classList.add('recording');
    el.recordBtn.textContent = '⏹️';
    el.recordHint.textContent = 'Enregistrement en cours…';
    recordingTimerHandle = setInterval(() => {
      el.recordTimer.textContent = formatTimer((Date.now() - recordingStartedAt) / 1000);
    }, 200);
  }

  function stopRecording() {
    return new Promise((resolve) => {
      if (!mediaRecorder) return resolve(null);
      mediaRecorder.onstop = () => {
        recordingStream.getTracks().forEach(t => t.stop());
        clearInterval(recordingTimerHandle);
        const blob = new Blob(recordingChunks, { type: mediaRecorder.mimeType || 'audio/mp4' });
        resolve(blob);
      };
      mediaRecorder.stop();
    });
  }

  el.recordBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      const blob = await stopRecording();
      el.recordBtn.classList.remove('recording');
      el.recordBtn.textContent = '🎙️';
      el.recordHint.textContent = 'Appuie pour ré-enregistrer';
      if (blob && blob.size) {
        recordedBlob = blob;
        el.voicePreview.src = URL.createObjectURL(blob);
        el.voicePreview.classList.remove('hidden');
      }
    } else {
      el.voicePreview.classList.add('hidden');
      el.recordTimer.textContent = '00:00';
      startRecording();
    }
  });

  function resetRecorderUI() {
    recordedBlob = null;
    pendingAudioId = null;
    el.recordBtn.classList.remove('recording');
    el.recordBtn.textContent = '🎙️';
    el.recordHint.textContent = 'Appuie pour enregistrer';
    el.recordTimer.textContent = '00:00';
    el.voicePreview.classList.add('hidden');
    el.voicePreview.removeAttribute('src');
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
    renderReminderBanner();
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
    renderReminderBanner();
    closeSheet(el.sheetBackdrop);
  }

  function deleteRoutine() {
    data.routines = data.routines.filter(x => x.id !== editingRoutineId);
    save();
    renderRoutines();
    renderStats();
    renderReminderBanner();
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
      const overdue = !t.done && t.dueDate && t.dueDate < todayKey();
      const li = document.createElement('li');
      li.className = 'task-item' + (t.done ? ' done' : '');
      li.innerHTML = `
        <div class="task-info">
          <div class="task-text">${escapeHtml(t.text)}${t.auto ? '<span class="auto-tag">🎧 capté</span>' : ''}</div>
          ${t.dueDate ? `<div class="task-due" style="${overdue ? 'color:var(--danger)' : ''}">📅 ${formatDateShort(t.dueDate)}${overdue ? ' · en retard' : ''}</div>` : ''}
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
        renderReminderBanner();
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
    renderReminderBanner();
    closeSheet(el.taskSheetBackdrop);
  }

  function deleteTask() {
    data.tasks = data.tasks.filter(x => x.id !== editingTaskId);
    save();
    renderTasks();
    renderStats();
    renderReminderBanner();
    closeSheet(el.taskSheetBackdrop);
  }

  el.taskSaveBtn.addEventListener('click', saveTask);
  el.taskCancelBtn.addEventListener('click', () => closeSheet(el.taskSheetBackdrop));
  el.taskDeleteBtn.addEventListener('click', deleteTask);
  el.taskTextInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveTask(); });

  // ---------- Agenda (appointments) ----------

  function formatDateLong(iso) {
    const d = new Date(iso + 'T00:00:00');
    const today = todayKey();
    const tomorrow = todayKey(new Date(Date.now() + 86400000));
    if (iso === today) return "Aujourd'hui";
    if (iso === tomorrow) return 'Demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function renderAppointments() {
    const appts = [...data.appointments].sort((a, b) => {
      return a.date.localeCompare(b.date) || (a.time || '99:99').localeCompare(b.time || '99:99');
    });

    el.agendaGroups.innerHTML = '';
    el.emptyAgenda.classList.toggle('visible', appts.length === 0);

    const today = todayKey();
    let currentGroup = null;
    let ul = null;

    for (const a of appts) {
      if (a.date !== currentGroup) {
        currentGroup = a.date;
        const heading = document.createElement('div');
        heading.className = 'group-title';
        heading.textContent = formatDateLong(a.date);
        el.agendaGroups.appendChild(heading);
        ul = document.createElement('ul');
        ul.className = 'agenda-list';
        el.agendaGroups.appendChild(ul);
      }

      const past = a.date < today;
      const li = document.createElement('li');
      li.className = 'agenda-item' + (past ? ' past' : '');
      li.innerHTML = `
        <div class="agenda-time">${a.time || '—'}</div>
        <div class="agenda-info">
          <div class="agenda-title">${escapeHtml(a.title)}${a.auto ? '<span class="auto-tag">🎧 capté</span>' : ''}</div>
          ${a.note ? `<div class="agenda-note">${escapeHtml(a.note)}</div>` : ''}
        </div>
      `;
      li.addEventListener('click', () => openApptEdit(a));
      ul.appendChild(li);
    }
  }

  function openApptAdd() {
    editingApptId = null;
    el.apptSheetTitle.textContent = 'Nouveau rendez-vous';
    el.apptTitleInput.value = '';
    el.apptDateInput.value = todayKey();
    el.apptTimeInput.value = '';
    el.apptNoteInput.value = '';
    el.apptDeleteBtn.classList.add('hidden');
    openSheet(el.apptSheetBackdrop, el.apptTitleInput);
  }

  function openApptEdit(a) {
    editingApptId = a.id;
    el.apptSheetTitle.textContent = 'Modifier le rendez-vous';
    el.apptTitleInput.value = a.title;
    el.apptDateInput.value = a.date;
    el.apptTimeInput.value = a.time || '';
    el.apptNoteInput.value = a.note || '';
    el.apptDeleteBtn.classList.remove('hidden');
    openSheet(el.apptSheetBackdrop, el.apptTitleInput);
  }

  function saveAppt() {
    const title = el.apptTitleInput.value.trim();
    if (!title) {
      el.apptTitleInput.focus();
      return;
    }
    const date = el.apptDateInput.value || todayKey();
    const time = el.apptTimeInput.value || null;
    const note = el.apptNoteInput.value.trim();

    if (editingApptId) {
      const a = data.appointments.find(x => x.id === editingApptId);
      a.title = title;
      a.date = date;
      a.time = time;
      a.note = note;
    } else {
      data.appointments.push({
        id: genId(),
        title,
        date,
        time,
        note,
        createdAt: todayKey(),
      });
    }
    save();
    renderAppointments();
    renderReminderBanner();
    closeSheet(el.apptSheetBackdrop);
  }

  function deleteAppt() {
    data.appointments = data.appointments.filter(x => x.id !== editingApptId);
    save();
    renderAppointments();
    renderReminderBanner();
    closeSheet(el.apptSheetBackdrop);
  }

  el.apptSaveBtn.addEventListener('click', saveAppt);
  el.apptCancelBtn.addEventListener('click', () => closeSheet(el.apptSheetBackdrop));
  el.apptDeleteBtn.addEventListener('click', deleteAppt);
  el.apptTitleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveAppt(); });

  // ---------- Notes ----------

  const noteAudioUrls = new Map();

  function renderNotes() {
    const notes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    for (const url of noteAudioUrls.values()) URL.revokeObjectURL(url);
    noteAudioUrls.clear();

    el.noteGrid.innerHTML = '';
    el.emptyNotes.classList.toggle('visible', notes.length === 0);

    for (const n of notes) {
      const card = document.createElement('div');
      card.className = 'note-card';
      const d = new Date(n.updatedAt);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      if (n.type === 'voice') {
        card.innerHTML = `
          <div class="note-audio-row">
            <span>🎙️ ${formatTimer(n.duration || 0)}</span>
            <audio controls></audio>
          </div>
          ${n.text ? `<div class="note-text" style="margin-top:8px;">${escapeHtml(n.text)}</div>` : ''}
          <div class="note-date">${dateStr}</div>
        `;
        audioGet(n.audioId).then((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          noteAudioUrls.set(n.id, url);
          const audioEl = card.querySelector('audio');
          if (audioEl) audioEl.src = url;
        });
      } else {
        card.innerHTML = `
          <div class="note-text">${escapeHtml(n.text)}</div>
          <div class="note-date">${dateStr}</div>
        `;
      }
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'AUDIO') return;
        openNoteEdit(n);
      });
      el.noteGrid.appendChild(card);
    }
  }

  function setNoteType(type) {
    selectedNoteType = type;
    [...el.noteTypeRow.children].forEach(btn => btn.classList.toggle('selected', btn.dataset.type === type));
    el.voiceRecorder.classList.toggle('hidden', type !== 'voice');
    el.noteTextInput.placeholder = type === 'voice' ? 'Légende (optionnel)' : "Écris ce que tu as en tête...";
  }

  el.noteTypeRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.note-type-btn');
    if (!btn) return;
    setNoteType(btn.dataset.type);
  });

  function openNoteAdd() {
    editingNoteId = null;
    el.noteSheetTitle.textContent = 'Nouvelle note';
    el.noteTextInput.value = '';
    el.noteDeleteBtn.classList.add('hidden');
    el.noteTypeRow.classList.remove('hidden');
    resetRecorderUI();
    setNoteType('text');
    openSheet(el.noteSheetBackdrop, el.noteTextInput);
  }

  function openNoteEdit(n) {
    editingNoteId = n.id;
    el.noteSheetTitle.textContent = 'Modifier la note';
    el.noteTextInput.value = n.text || '';
    el.noteDeleteBtn.classList.remove('hidden');
    el.noteTypeRow.classList.add('hidden');
    resetRecorderUI();
    setNoteType(n.type === 'voice' ? 'voice' : 'text');
    if (n.type === 'voice') {
      pendingAudioId = n.audioId;
      el.recordHint.textContent = 'Appuie pour ré-enregistrer';
      audioGet(n.audioId).then((blob) => {
        if (!blob) return;
        el.voicePreview.src = URL.createObjectURL(blob);
        el.voicePreview.classList.remove('hidden');
      });
    }
    openSheet(el.noteSheetBackdrop, el.noteTextInput);
  }

  async function saveNote() {
    const text = el.noteTextInput.value.trim();
    const now = new Date().toISOString();

    if (selectedNoteType === 'voice') {
      if (!recordedBlob && !pendingAudioId) {
        alert('Enregistre un message vocal avant de sauvegarder.');
        return;
      }
      let audioId = pendingAudioId;
      let duration = 0;
      if (recordedBlob) {
        audioId = editingNoteId ? pendingAudioId || genId() : genId();
        await audioPut(audioId, recordedBlob);
        duration = Number(el.recordTimer.textContent.split(':').reduce((acc, v) => acc * 60 + Number(v), 0));
      }

      if (editingNoteId) {
        const n = data.notes.find(x => x.id === editingNoteId);
        n.text = text;
        n.audioId = audioId;
        if (recordedBlob) n.duration = duration;
        n.updatedAt = now;
      } else {
        data.notes.push({
          id: genId(),
          type: 'voice',
          text,
          audioId,
          duration,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      if (!text) {
        el.noteTextInput.focus();
        return;
      }
      if (editingNoteId) {
        const n = data.notes.find(x => x.id === editingNoteId);
        n.type = 'text';
        n.text = text;
        n.updatedAt = now;
      } else {
        data.notes.push({
          id: genId(),
          type: 'text',
          text,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    save();
    renderNotes();
    renderStats();
    closeSheet(el.noteSheetBackdrop);
  }

  function deleteNote() {
    const n = data.notes.find(x => x.id === editingNoteId);
    if (n && n.type === 'voice' && n.audioId) audioDelete(n.audioId).catch(() => {});
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

  // ---------- Reminders ----------

  function computeReminders() {
    const today = todayKey();
    const overdueTasks = data.tasks.filter(t => !t.done && t.dueDate && t.dueDate < today).length;
    const unfinishedRoutines = data.routines.filter(r => !isDoneToday(r)).length;
    const apptsToday = data.appointments.filter(a => a.date === today).length;
    return { overdueTasks, unfinishedRoutines, apptsToday };
  }

  function reminderMessage({ overdueTasks, unfinishedRoutines, apptsToday }) {
    const parts = [];
    if (apptsToday > 0) parts.push(`${apptsToday} rendez-vous aujourd'hui`);
    if (overdueTasks > 0) parts.push(`${overdueTasks} tâche${overdueTasks > 1 ? 's' : ''} en retard`);
    if (unfinishedRoutines > 0) parts.push(`${unfinishedRoutines} routine${unfinishedRoutines > 1 ? 's' : ''} pas encore faite${unfinishedRoutines > 1 ? 's' : ''} aujourd'hui`);
    return parts.length ? `⏰ ${parts.join(' · ')}` : '';
  }

  let reminderDismissedForSession = false;

  function renderReminderBanner() {
    if (reminderDismissedForSession) return;
    const counts = computeReminders();
    const msg = reminderMessage(counts);
    if (msg) {
      el.reminderText.textContent = msg;
      el.reminderBanner.classList.remove('hidden');
    } else {
      el.reminderBanner.classList.add('hidden');
    }
  }

  el.reminderDismiss.addEventListener('click', () => {
    reminderDismissedForSession = true;
    el.reminderBanner.classList.add('hidden');
  });

  async function maybeSendNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const counts = computeReminders();
    const msg = reminderMessage(counts);
    if (!msg) return;
    const today = todayKey();
    if (localStorage.getItem(LAST_NOTIFIED_KEY) === today) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Routine', { body: msg.replace('⏰ ', ''), icon: 'icons/icon-192.png' });
      localStorage.setItem(LAST_NOTIFIED_KEY, today);
    } catch {}
  }

  function updateNotifStatus() {
    if (!('Notification' in window)) {
      el.notifStatus.textContent = 'Non supporté sur ce navigateur.';
      el.notifBtn.disabled = true;
      return;
    }
    const status = { granted: 'Activés ✅', denied: 'Refusés — active-les dans les réglages de Safari', default: 'Pas encore activés' };
    el.notifStatus.textContent = status[Notification.permission] || '';
  }

  el.notifBtn.addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    await Notification.requestPermission();
    updateNotifStatus();
    maybeSendNotification();
  });

  // ---------- Sheets ----------

  function openSheet(backdrop, focusEl) {
    backdrop.classList.add('open');
    if (focusEl) setTimeout(() => focusEl.focus(), 250);
  }

  function closeSheet(backdrop) {
    backdrop.classList.remove('open');
    document.activeElement && document.activeElement.blur();
    if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording();
  }

  [el.sheetBackdrop, el.taskSheetBackdrop, el.apptSheetBackdrop, el.noteSheetBackdrop, el.settingsSheetBackdrop].forEach(backdrop => {
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

    const titles = { listen: 'Écoute', routines: 'Routines', tasks: 'Tâches', agenda: 'Agenda', notes: 'Notes', stats: 'Stats' };
    el.viewTitle.textContent = titles[view];
    el.progressRing.style.display = view === 'routines' ? '' : 'none';
    el.addBtn.style.display = (view === 'stats' || view === 'listen') ? 'none' : '';
  }

  el.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  el.addBtn.addEventListener('click', () => {
    if (currentView === 'routines') openRoutineAdd();
    else if (currentView === 'tasks') openTaskAdd();
    else if (currentView === 'agenda') openApptAdd();
    else if (currentView === 'notes') openNoteAdd();
  });

  // ---------- Settings / backup ----------

  el.settingsBtn.addEventListener('click', () => {
    updateNotifStatus();
    openSheet(el.settingsSheetBackdrop);
  });
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
        renderAppointments();
        renderNotes();
        renderStats();
        renderMemory();
        renderReminderBanner();
        closeSheet(el.settingsSheetBackdrop);
      } catch {
        alert('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
    el.importFile.value = '';
  });

  el.clearAllBtn.addEventListener('click', () => {
    if (!confirm('Supprimer définitivement toutes les routines, tâches, rendez-vous, notes et la mémoire ?')) return;
    data = normalize({});
    save();
    renderRoutines();
    renderTasks();
    renderAppointments();
    renderNotes();
    renderStats();
    renderMemory();
    renderReminderBanner();
    closeSheet(el.settingsSheetBackdrop);
  });

  // ---------- Inbox sync (items added by Claude via the GitHub repo) ----------

  const INBOX_URL = 'https://raw.githubusercontent.com/yvesdartoisiss-sudo/routine-/main/inbox.json';
  const IMPORTED_INBOX_KEY = 'routine-imported-inbox-ids';

  function applyInboxItem(item) {
    const now = new Date().toISOString();
    if (item.kind === 'note') {
      data.notes.push({ id: genId(), type: 'text', text: item.text || '', createdAt: now, updatedAt: now });
    } else if (item.kind === 'task') {
      data.tasks.push({ id: genId(), text: item.text || '', dueDate: item.dueDate || null, done: false, createdAt: todayKey() });
    } else if (item.kind === 'appointment') {
      data.appointments.push({ id: genId(), title: item.title || '', date: item.date || todayKey(), time: item.time || null, note: item.note || '', createdAt: todayKey() });
    } else if (item.kind === 'routine') {
      data.routines.push({ id: genId(), name: item.name || '', emoji: item.emoji || EMOJIS[0], moment: item.moment || 'anytime', note: item.note || '', completedDates: [], createdAt: todayKey() });
    }
  }

  async function syncInbox() {
    let items;
    try {
      const res = await fetch(INBOX_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      items = await res.json();
    } catch {
      return;
    }
    if (!Array.isArray(items) || !items.length) return;

    const imported = new Set(JSON.parse(localStorage.getItem(IMPORTED_INBOX_KEY) || '[]'));
    let changed = false;
    for (const item of items) {
      if (!item.id || imported.has(item.id)) continue;
      applyInboxItem(item);
      imported.add(item.id);
      changed = true;
    }
    if (changed) {
      localStorage.setItem(IMPORTED_INBOX_KEY, JSON.stringify([...imported]));
      save();
      renderRoutines();
      renderTasks();
      renderAppointments();
      renderNotes();
      renderStats();
      renderReminderBanner();
    }
  }

  // ---------- Écoute : agent vocal ----------
  //
  // Fonctionne pendant que l'app est ouverte au premier plan (écran allumé).
  // iOS/Safari ne permet PAS d'enregistrer en continu en arrière-plan ou
  // téléphone verrouillé : c'est une limite du système, pas de l'app.
  // La reconnaissance vocale marche le mieux sur Chrome/Android.

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listening = false;
  let wantListening = false;   // intention de l'utilisateur (pour relancer)
  let wakeLock = null;
  let lastAmbientAt = 0;
  let lastAmbientKey = '';

  function normalizeText(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ----- Synthèse vocale (réponses courtes) -----

  function speak(text) {
    try {
      if (!('speechSynthesis' in window) || !text) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch {}
  }

  // ----- Analyse date / heure en français -----

  const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function parseDateFromText(n) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (/\baujourd'?hui\b|\baujourdhui\b/.test(n)) return todayKey(today);
    if (/\bapres[- ]demain\b/.test(n)) { const d = new Date(today); d.setDate(d.getDate() + 2); return todayKey(d); }
    if (/\bdemain\b/.test(n)) { const d = new Date(today); d.setDate(d.getDate() + 1); return todayKey(d); }

    for (let i = 0; i < WEEKDAYS.length; i++) {
      const re = new RegExp('\\b' + WEEKDAYS[i] + '\\b');
      if (re.test(n)) {
        const d = new Date(today);
        let delta = (i - d.getDay() + 7) % 7;
        if (delta === 0) delta = 7;                 // "lundi" quand on est lundi = le prochain
        if (/\bprochain\b/.test(n) && delta < 4) delta += 7; // "prochain" pousse d'une semaine
        d.setDate(d.getDate() + delta);
        return todayKey(d);
      }
    }
    // jj/mm ou "le 25"
    const dm = n.match(/\b(\d{1,2})[\/](\d{1,2})\b/);
    if (dm) {
      const d = new Date(today.getFullYear(), Number(dm[2]) - 1, Number(dm[1]));
      if (!isNaN(d)) return todayKey(d);
    }
    return null;
  }

  function parseTimeFromText(n) {
    if (/\bmidi\b/.test(n)) return '12:00';
    if (/\bminuit\b/.test(n)) return '00:00';
    let m = n.match(/\b(\d{1,2})\s*h(?:eures?)?\s*(\d{2})?\b/);
    if (m) {
      let h = Number(m[1]); const min = m[2] ? Number(m[2]) : 0;
      if (h >= 0 && h < 24 && min < 60) return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
    }
    m = n.match(/\ba\s+(\d{1,2})\s+heures?\b/);
    if (m) { const h = Number(m[1]); if (h < 24) return String(h).padStart(2, '0') + ':00'; }
    return null;
  }

  function dateLabel(iso) {
    return formatDateLong(iso); // "Aujourd'hui" / "Demain" / "samedi 25 juillet"
  }

  // ----- Mémoire (tout ce qui est capté) -----

  function pushMemory(text, kind) {
    data.memory.push({ id: genId(), text, ts: new Date().toISOString(), kind: kind || 'heard' });
    if (data.memory.length > 4000) data.memory = data.memory.slice(-4000);
    save();
    renderMemory();
  }

  function renderMemory() {
    const q = normalizeText(el.memorySearch ? el.memorySearch.value : '');
    let items = [...data.memory].reverse();
    if (q) items = items.filter(m => normalizeText(m.text).includes(q));
    items = items.slice(0, 60);

    el.emptyMemory.classList.toggle('visible', data.memory.length === 0);
    el.memoryFeed.innerHTML = items.map(m => {
      const d = new Date(m.ts);
      const when = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' · ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const badge = m.kind === 'question'
        ? '<span class="memory-badge">❓ question</span>'
        : m.kind === 'answer'
        ? '<span class="memory-badge appt">🤖 réponse</span>'
        : '';
      return `<div class="memory-item ${m.kind === 'question' ? 'q' : ''}">
        <div class="memory-item-text">${escapeHtml(m.text)}</div>
        <div class="memory-item-meta"><span>${when}</span>${badge}</div>
      </div>`;
    }).join('');
  }

  // ----- Extraction automatique (rendez-vous / tâches) -----

  function cleanCapture(text) {
    return text.length > 90 ? text.slice(0, 88) + '…' : text;
  }

  function autoExtract(text) {
    const n = normalizeText(text);
    const date = parseDateFromText(n);
    const time = parseTimeFromText(n);

    const apptTrigger = /\b(rendez[- ]?vous|rdv|reunion|rencontre|consultation|on se voit|on se retrouve|au medecin|au dentiste)\b/.test(n);
    const taskTrigger = /\b(n'?oublie pas|noublie pas|il faut que|faut que|il faut|penser a|pense a|rappelle[- ]?moi|rappelle moi|achete|acheter|reserve|reserver|envoie|envoyer|appelle|appeler|prendre rendez)\b/.test(n);

    if (apptTrigger && date) {
      data.appointments.push({
        id: genId(), title: cleanCapture(text), date, time: time || null,
        note: '', auto: true, createdAt: todayKey(),
      });
      save(); renderAppointments(); renderReminderBanner();
      showAmbientToast('🗓️ Capté : ' + dateLabel(date) + (time ? ' à ' + time : ''), false);
      return true;
    }
    if (taskTrigger) {
      data.tasks.push({
        id: genId(), text: cleanCapture(text), dueDate: date || null,
        done: false, auto: true, createdAt: todayKey(),
      });
      save(); renderTasks(); renderStats(); renderReminderBanner();
      showAmbientToast('✅ Tâche captée' + (date ? ' · ' + dateLabel(date) : ''), false);
      return true;
    }
    return false;
  }

  // ----- Rappels contextuels courts -----

  function ambientCheck(text) {
    const n = normalizeText(text);
    const now = Date.now();

    if (/\b(magasin|courses|supermarche|carrefour|leclerc|lidl|auchan|intermarche|drive|epicerie)\b/.test(n)) {
      if (lastAmbientKey === 'shop' && now - lastAmbientAt < 120000) return;
      const shopping = data.tasks.filter(t => !t.done &&
        /\b(achet|acheter|prendre|lait|pain|courses|pharmacie)\b/.test(normalizeText(t.text)));
      if (shopping.length) {
        const msg = 'Pense à : ' + shopping.slice(0, 3).map(t => t.text.replace(/^.*?(achet\w*|prendre)\s*/i, '')).join(', ');
        lastAmbientAt = now; lastAmbientKey = 'shop';
        showAmbientToast('💡 ' + msg, true);
      }
    }
  }

  function showAmbientToast(msg, doSpeak) {
    el.ambientToastText.textContent = msg.replace(/^💡\s*/, '');
    el.ambientToast.classList.remove('hidden');
    if (doSpeak) speak(msg.replace(/^💡\s*/, ''));
    clearTimeout(showAmbientToast._t);
    showAmbientToast._t = setTimeout(() => el.ambientToast.classList.add('hidden'), 9000);
  }
  el.ambientToastClose.addEventListener('click', () => el.ambientToast.classList.add('hidden'));

  // ----- Moteur de réponse (mot-clé « Claude » + recherche) -----

  const WEATHER_CODES = {
    0: 'ciel dégagé', 1: 'plutôt dégagé', 2: 'partiellement nuageux', 3: 'nuageux',
    45: 'brouillard', 48: 'brouillard givrant', 51: 'bruine', 53: 'bruine', 55: 'bruine',
    61: 'pluie faible', 63: 'pluie', 65: 'forte pluie', 71: 'neige', 73: 'neige', 75: 'forte neige',
    80: 'averses', 81: 'averses', 82: 'fortes averses', 95: 'orage', 96: 'orage', 99: 'orage',
  };

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject();
      navigator.geolocation.getCurrentPosition(
        p => resolve(p.coords), () => reject(), { timeout: 8000, maximumAge: 3600000 });
    });
  }

  async function weatherAnswer(n) {
    let coords;
    try { coords = await getPosition(); }
    catch { return "Je n'ai pas ta position pour la météo. Active la localisation."; }
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
      const res = await fetch(url);
      const j = await res.json();
      const idx = /\bdemain\b/.test(n) ? 1 : 0;
      const day = idx === 1 ? 'Demain' : "Aujourd'hui";
      const tmax = Math.round(j.daily.temperature_2m_max[idx]);
      const tmin = Math.round(j.daily.temperature_2m_min[idx]);
      const desc = WEATHER_CODES[j.daily.weathercode[idx]] || '';
      return `${day} : ${tmax}°, ${desc} (min ${tmin}°).`;
    } catch {
      return "Impossible de récupérer la météo.";
    }
  }

  function recapAnswer() {
    const today = todayKey();
    const appts = data.appointments.filter(a => a.date === today)
      .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    const tasks = data.tasks.filter(t => !t.done && (!t.dueDate || t.dueDate <= today));
    const routinesLeft = data.routines.filter(r => !isDoneToday(r)).length;

    const parts = [];
    if (appts.length) parts.push(appts.map(a => a.title + (a.time ? ' à ' + a.time : '')).join(', '));
    else parts.push('aucun rendez-vous');
    if (tasks.length) parts.push(tasks.length + ' tâche' + (tasks.length > 1 ? 's' : '') + ' à faire');
    if (routinesLeft) parts.push(routinesLeft + ' routine' + (routinesLeft > 1 ? 's' : '') + ' à cocher');
    return { reply: "Aujourd'hui : " + parts.join(' · ') + '.' };
  }

  function dateAnswer(date, original) {
    const appts = data.appointments.filter(a => a.date === date)
      .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    const tasks = data.tasks.filter(t => !t.done && t.dueDate === date);
    const label = dateLabel(date);

    if (!appts.length && !tasks.length) {
      // rien en agenda : on cherche dans la mémoire
      const mem = searchMemory(original);
      if (mem.length) return { reply: label + ', rien en agenda. Mais tu avais dit : « ' + mem[0].text + ' ».' };
      return { reply: label + ' : rien de prévu.' };
    }
    const bits = [];
    if (appts.length) bits.push(appts.map(a => a.title + (a.time ? ' à ' + a.time : '')).join(', '));
    if (tasks.length) bits.push(tasks.map(t => t.text).join(', '));
    return { reply: label + ' : ' + bits.join(' · ') + '.' };
  }

  function searchMemory(q) {
    const stop = new Set(['claude', 'quand', 'quel', 'quelle', 'quels', 'quelles', 'est', 'ce', 'que', 'qu',
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'a', 'as', 'ai', 'tu', 'je', 'on', 'pour', 'avec',
      'qui', 'quoi', 'ou', 'dis', 'moi', 'faut', 'il', 'me', 'mon', 'ma', 'mes', 'prevu', 'cherche', 'trouve']);
    const tokens = normalizeText(q).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !stop.has(w));
    if (!tokens.length) return [];
    const scored = data.memory.map(m => {
      const mn = normalizeText(m.text);
      let score = 0;
      for (const t of tokens) if (mn.includes(t)) score++;
      return { m, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || b.m.ts.localeCompare(a.m.ts));
    return scored.slice(0, 3).map(x => x.m);
  }

  function searchAnswer(q) {
    const found = searchMemory(q);
    if (!found.length) return { reply: "Je n'ai rien trouvé là-dessus dans ce que tu as enregistré." };
    if (found.length === 1) return { reply: 'Tu avais dit : « ' + found[0].text + ' ».' };
    return { reply: found.map((m, i) => (i + 1) + '. ' + m.text).join('\n') };
  }

  async function answerQuery(q) {
    const n = normalizeText(q);
    if (/\b(meteo|temps qu'il|temps qu il|il fera|il va faire|pluie|degres)\b/.test(n)) {
      return { reply: await weatherAnswer(n) };
    }
    if (/(on en est ou|ma journee|resume|recap|quoi de prevu|quoi aujourd|programme du jour|ma journ)/.test(n)) {
      return recapAnswer();
    }
    const date = parseDateFromText(n);
    if (date) return dateAnswer(date, q);
    return searchAnswer(q);
  }

  // ----- Traitement d'un énoncé -----

  const WAKE = /\b(claude|cloud|clode)\b/;

  async function handleUtterance(text) {
    const n = normalizeText(text);
    if (WAKE.test(n)) {
      // Commande adressée à l'assistant
      const command = text.replace(/^[^a-zA-Zéèàù]*/, '').replace(new RegExp(WAKE.source, 'i'), '').replace(/^[\s,\.]+/, '').trim() || text;
      pushMemory(text, 'question');
      const { reply } = await answerQuery(command);
      showAssistant(reply);
      pushMemory(reply, 'answer');
      speak(reply);
      return;
    }
    // Écoute passive : on enregistre tout, on extrait, on rappelle si utile
    pushMemory(text, 'heard');
    autoExtract(text);
    ambientCheck(text);
  }

  function showAssistant(text) {
    el.assistantText.textContent = text;
    el.assistantBubble.classList.remove('hidden');
  }

  // ----- Contrôle micro -----

  async function acquireWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
  async function releaseWakeLock() {
    try { if (wakeLock) { await wakeLock.release(); wakeLock = null; } } catch {}
  }

  function setListenUI(on) {
    el.listenMic.classList.toggle('active', on);
    el.listenMicIcon.textContent = on ? '🎙️' : '🎧';
    el.listenStatus.textContent = on ? 'À l\'écoute…' : 'Écoute désactivée';
    el.listenStatus.classList.toggle('on', on);
    el.listenLive.classList.toggle('hidden', !on);
    if (!on) el.listenLiveText.textContent = '';
    el.listenHint.textContent = on
      ? 'Tout est enregistré. Dis « Claude, … » pour une vraie question.'
      : 'Appuie pour activer. Dis « Claude… » pour poser une question.';
  }

  function startListening() {
    if (!SR) {
      alert("La reconnaissance vocale n'est pas disponible sur ce navigateur.\n\nÀ installer plutôt via Chrome (Android) ou Chrome/Edge sur ordinateur. Sur iPhone, le support Safari est limité.");
      return;
    }
    if (!recognition) {
      recognition = new SR();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            const t = (r[0].transcript || '').trim();
            if (t) handleUtterance(t);
          } else {
            interim += r[0].transcript;
          }
        }
        el.listenLiveText.textContent = interim;
      };
      recognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          wantListening = false; listening = false; setListenUI(false); releaseWakeLock();
          alert("Accès au micro refusé. Autorise-le dans les réglages du navigateur.");
        }
        // 'no-speech' / 'network' / 'aborted' : on laisse onend relancer
      };
      recognition.onend = () => {
        listening = false;
        if (wantListening) {
          try { recognition.start(); listening = true; } catch {}
        } else {
          setListenUI(false);
        }
      };
    }
    wantListening = true;
    try { recognition.start(); listening = true; setListenUI(true); acquireWakeLock(); }
    catch {}
  }

  function stopListening() {
    wantListening = false;
    listening = false;
    try { recognition && recognition.stop(); } catch {}
    setListenUI(false);
    releaseWakeLock();
  }

  el.listenMic.addEventListener('click', () => {
    if (wantListening) stopListening(); else startListening();
  });

  // Recherche / question par le champ texte
  el.memorySearch.addEventListener('input', renderMemory);
  el.memorySearch.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const q = el.memorySearch.value.trim();
    if (!q) return;
    const { reply } = await answerQuery(q);
    showAssistant(reply);
  });

  // Ré-acquérir le wakeLock si l'app revient au premier plan
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wantListening) acquireWakeLock();
  });

  // ---------- Init ----------

  el.todayLabel.textContent = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  renderMemory();

  renderRoutines();
  renderTasks();
  renderAppointments();
  renderNotes();
  renderStats();
  renderReminderBanner();
  updateNotifStatus();
  syncInbox();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(() => maybeSendNotification()).catch(() => {});
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reminderDismissedForSession = false;
      renderReminderBanner();
      maybeSendNotification();
      syncInbox();
    }
  });
})();
