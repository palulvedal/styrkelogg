const EXERCISE_CATALOG = {
  bench: { name: 'Benkpress', type: 'weight_reps', defaultSets: 3, target: '3 sett × 6–10 reps' },
  row: { name: 'Sittende roing', type: 'weight_reps', defaultSets: 3, target: '3 sett × 8–12 reps' },
  shoulder: { name: 'Skulderpress', type: 'weight_reps', defaultSets: 2, target: '2 sett × 8–10 reps' },
  pulldown: { name: 'Nedtrekk / pullups', type: 'weight_reps', defaultSets: 2, target: '2 sett × 8–12 reps' },
  lateral: { name: 'Sidehev', type: 'weight_reps', defaultSets: 2, target: '2 sett × 12–15 reps' },
  triceps: { name: 'Triceps pushdown', type: 'weight_reps', defaultSets: 2, target: '2 sett × 10–15 reps' },
  plank: { name: 'Planke', type: 'seconds', defaultSets: 2, target: '2 runder × 30–45 sek' },
  backext: { name: 'Rygghev', type: 'reps', defaultSets: 2, target: '2 sett × 10–15 reps' },
  incline: { name: 'Skrå hantelpress', type: 'weight_reps', defaultSets: 3, target: '3 sett × 8–12 reps' },
  chestrow: { name: 'Bryststøttet roing', type: 'weight_reps', defaultSets: 3, target: '3 sett × 8–12 reps' },
  facepull: { name: 'Face pulls', type: 'weight_reps', defaultSets: 2, target: '2 sett × 12–15 reps' },
  pushups: { name: 'Pushups', type: 'reps', defaultSets: 2, target: '2 sett × 8–12 reps' },
  curls: { name: 'Bicepscurl', type: 'weight_reps', defaultSets: 2, target: '2 sett × 10–15 reps' },
  goblet: { name: 'Goblet squat', type: 'weight_reps', defaultSets: 2, target: '2 sett × 8–12 reps' },
  legraise: { name: 'Hengende beinhev / crunch', type: 'reps', defaultSets: 2, target: '2 sett × 10–15 reps' },
  pallof: { name: 'Pallof press', type: 'reps', defaultSets: 2, target: '2 sett × 10–15 reps per side' },
  // Evening mobility routine. category 'mobility' keeps these out of the strength stats,
  // and defaultValue pre-fills the form so the routine can be logged with one tap.
  catcow: { name: 'Katt–ku', type: 'reps', category: 'mobility', defaultSets: 1, defaultValue: 8, target: '8 rolige repetisjoner (ca. 45 sek)' },
  hiplift9090: { name: '90/90 hip lift mot vegg', type: 'seconds', category: 'mobility', defaultSets: 2, defaultValue: 45, target: '2 runder × 4–5 lange utpust (ca. 45 sek)' },
  deadbug: { name: 'Dead bug', type: 'reps', category: 'mobility', defaultSets: 1, defaultValue: 8, target: '8 per side, korsryggen i gulvet', video: 'https://youtu.be/31MyQr0zSwU' },
  hipflexor: { name: 'Halvknestående hoftebøyerstrekk', type: 'seconds', category: 'mobility', defaultSets: 2, defaultValue: 30, target: '30 sek per side, klem setet og tipp bekkenet bakover', video: 'https://youtu.be/HxlWP5BG2EU' },
  deepsquat: { name: 'Dyp knebøy-hvile', type: 'seconds', category: 'mobility', defaultSets: 1, defaultValue: 45, target: '45 sek, hold deg gjerne i noe' },
};
const WORKOUTS = {
  workout1: {
    name: 'Økt 1',
    day: 'Onsdag morgen',
    subtitle: 'Press, rygg og skuldre',
    pairs: [
      { label: 'Supersett 1', exercises: ['bench', 'row'] },
      { label: 'Supersett 2', exercises: ['shoulder', 'pulldown'] },
      { label: 'Supersett 3', exercises: ['lateral', 'triceps'] },
      { label: 'Supersett 4', exercises: ['plank', 'backext'] },
    ],
  },
  workout2: {
    name: 'Økt 2',
    day: 'Fredag morgen',
    subtitle: 'Rygg, bryst, armer og kjerne',
    pairs: [
      { label: 'Supersett 1', exercises: ['incline', 'chestrow'] },
      { label: 'Supersett 2', exercises: ['facepull', 'pushups'] },
      { label: 'Supersett 3', exercises: ['curls', 'goblet'] },
      { label: 'Supersett 4', exercises: ['legraise', 'pallof'] },
    ],
  },
  kveld: {
    name: 'Kveldsrutine (5 min)',
    day: 'Hver kveld',
    subtitle: 'Hofter, bekken og pust – hver kveld',
    mobility: true,
    pairs: [
      { label: 'Steg 1', exercises: ['catcow'] },
      { label: 'Steg 2', exercises: ['hiplift9090'] },
      { label: 'Steg 3', exercises: ['deadbug'] },
      { label: 'Steg 4', exercises: ['hipflexor'] },
      { label: 'Steg 5', exercises: ['deepsquat'] },
    ],
  },
};
const THEME_KEY = 'strengthlog_theme';
// Weekly plan, keyed by Date.getDay() (0 = søndag): Økt 1 onsdag, Økt 2 fredag.
const WEEK_PLAN = { 3: 'workout1', 5: 'workout2' };
const EVENING_KEY = 'kveld';
const EVENING_FROM_HOUR = 15;
const DAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
// Unsaved form input is kept in localStorage so an Access reload doesn't lose it.
const DRAFT_KEY = 'strengthlog_drafts';
const DRAFT_MAX_AGE_MS = 18 * 60 * 60 * 1000;

let exerciseCatalog = EXERCISE_CATALOG;
let workouts = WORKOUTS;
let appState = { sessions: [] };
let currentUser = null;

const els = {
  authGate: document.getElementById('authGate'),
  appShell: document.getElementById('appShell'),
  authMessage: document.getElementById('authMessage'),
  reloadBtn: document.getElementById('reloadBtn'),
  accountLabel: document.getElementById('accountLabel'),
  logoutBtn: document.getElementById('logoutBtn'),
  themeToggle: document.getElementById('themeToggle'),
  tabs: [...document.querySelectorAll('.tab')],
  panels: [...document.querySelectorAll('.tab-panel')],
  workoutSelect: document.getElementById('workoutSelect'),
  sessionDate: document.getElementById('sessionDate'),
  exerciseFormArea: document.getElementById('exerciseFormArea'),
  logForm: document.getElementById('logForm'),
  sessionNotes: document.getElementById('sessionNotes'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  historyList: document.getElementById('historyList'),
  exportBtn: document.getElementById('exportBtn'),
  importInput: document.getElementById('importInput'),
  planView: document.getElementById('planView'),
  statSessions: document.getElementById('statSessions'),
  statMonth: document.getElementById('statMonth'),
  statVolume: document.getElementById('statVolume'),
  statEvening: document.getElementById('statEvening'),
  weekView: document.getElementById('weekView'),
  weekSummary: document.getElementById('weekSummary'),
  logTodayBtn: document.getElementById('logTodayBtn'),
  logIntro: document.getElementById('logIntro'),
  guideBtn: document.getElementById('guideBtn'),
  guide: document.getElementById('guide'),
  guideProgress: document.getElementById('guideProgress'),
  guideStep: document.getElementById('guideStep'),
  guideName: document.getElementById('guideName'),
  guideTarget: document.getElementById('guideTarget'),
  guideTimer: document.getElementById('guideTimer'),
  guideMain: document.getElementById('guideMain'),
  guideSkip: document.getElementById('guideSkip'),
  guideClose: document.getElementById('guideClose'),
  statEvening7: document.getElementById('statEvening7'),
  strengthExerciseSelect: document.getElementById('strengthExerciseSelect'),
  volumeExerciseSelect: document.getElementById('volumeExerciseSelect'),
  sessionsChart: document.getElementById('sessionsChart'),
  strengthChart: document.getElementById('strengthChart'),
  volumeChart: document.getElementById('volumeChart'),
  prTable: document.getElementById('prTable'),
};

init();

async function init() {
  applyTheme();
  bindBaseEvents();
  populateWorkoutSelect();
  populateExerciseSelects();
  renderPlan();
  setToday();
  renderWorkoutForm();

  try {
    const me = await api('GET', '/api/me');
    currentUser = mapUser(me);
    await enterApp();
  } catch (error) {
    showAuth();
    showAuthMessage(error.message || 'Kunne ikke koble til serveren.');
  }
}

function bindBaseEvents() {
  els.reloadBtn.addEventListener('click', () => window.location.reload());
  els.logoutBtn.addEventListener('click', handleLogout);

  els.tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  els.workoutSelect.addEventListener('change', () => renderWorkoutForm());
  els.clearFormBtn.addEventListener('click', () => {
    clearDraft(els.workoutSelect.value);
    els.sessionNotes.value = '';
    renderWorkoutForm();
  });
  els.logForm.addEventListener('input', saveDraft);
  els.sessionDate.addEventListener('change', saveDraft);
  els.logTodayBtn.addEventListener('click', () => {
    selectWorkout(pickDefaultWorkout());
    activateTab('log');
  });
  els.guideBtn.addEventListener('click', startGuide);
  els.guideMain.addEventListener('click', onGuideMain);
  els.guideSkip.addEventListener('click', () => nextGuideStep(true));
  els.guideClose.addEventListener('click', () => closeGuide());
  els.logForm.addEventListener('submit', saveSession);
  els.exportBtn.addEventListener('click', exportData);
  els.importInput.addEventListener('change', importData);
  els.strengthExerciseSelect.addEventListener('change', renderDashboard);
  els.volumeExerciseSelect.addEventListener('change', renderDashboard);
  els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
    updateThemeButton();
    renderDashboard();
  });
}

function showAuth() {
  els.authGate.classList.remove('hidden');
  els.appShell.classList.add('hidden');
}

async function enterApp() {
  els.accountLabel.textContent = formatAccountLabel(currentUser);
  await loadSessions();
  els.authGate.classList.add('hidden');
  els.appShell.classList.remove('hidden');
  const hasDraft = Boolean(latestDraft());
  selectWorkout(pickDefaultWorkout());
  if (new URLSearchParams(window.location.search).has('okt') || hasDraft) activateTab('log');
  if (hasDraft) showToast('Fortsetter der du slapp.');
  renderHistory();
  renderDashboard();
}

function formatAccountLabel(user) {
  return `${user.name} · ${user.email}`;
}

function mapUser(user) {
  const email = user?.email || '';
  return {
    email,
    name: email.split('@')[0] || 'Bruker',
  };
}

function handleLogout() {
  // Ends the Cloudflare Access session; the next visit asks for a new login code.
  window.location.href = '/cdn-cgi/access/logout';
}

// Calls our own API. A redirect means the Access session has expired,
// so the page is reloaded to let Access show its login screen.
async function api(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      redirect: 'manual',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_) {
    throw new Error('Fikk ikke kontakt med serveren. Sjekk nettet og prøv igjen.');
  }

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    window.location.reload();
    throw new Error('Innloggingen er utløpt. Laster siden på nytt …');
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // non-JSON response
  }
  if (!res.ok) {
    throw new Error(data?.error || `Serverfeil (${res.status}).`);
  }
  return data;
}

async function loadSessions() {
  const data = await api('GET', '/api/sessions');
  appState.sessions = Array.isArray(data?.sessions) ? data.sessions : [];
}

function generateId() {
  return window.crypto?.randomUUID?.() || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function activateTab(tabName) {
  els.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  els.panels.forEach(panel => panel.classList.toggle('active', panel.id === tabName));
}

function populateWorkoutSelect() {
  els.workoutSelect.innerHTML = Object.entries(workouts)
    .map(([key, workout]) => `<option value="${key}">${workout.name}</option>`)
    .join('');
}

// Chooses which workout the log form opens with:
// 1) ?okt=<key> in the URL (used by reminders), 2) an unsaved draft,
// 3) the weekly plan for today, 4) evenings → the evening routine,
// 5) other mornings → whichever strength workout is still missing this week.
function pickDefaultWorkout() {
  const urlKey = new URLSearchParams(window.location.search).get('okt');
  if (urlKey && workouts[urlKey]) return urlKey;
  const draft = latestDraft();
  if (draft && workouts[draft.workoutKey]) return draft.workoutKey;

  const now = new Date();
  const today = localIso(now);
  if (now.getHours() >= EVENING_FROM_HOUR) return EVENING_KEY;
  const doneToday = new Set(appState.sessions.filter(s => s.date === today).map(s => s.workoutKey));
  const planned = WEEK_PLAN[now.getDay()];
  if (planned) return doneToday.has(planned) ? EVENING_KEY : planned;
  const doneThisWeek = new Set(appState.sessions
    .filter(s => weekKey(s.date) === weekKey(today))
    .map(s => s.workoutKey));
  return Object.values(WEEK_PLAN).find(key => !doneThisWeek.has(key)) || EVENING_KEY;
}

function selectWorkout(key) {
  if (!workouts[key]) return;
  els.workoutSelect.value = key;
  renderWorkoutForm();
}

function videoLink(url) {
  return `<a href="${url}" target="_blank" rel="noopener">Se video ▶</a>`;
}

function isMobilitySession(session) {
  return Boolean(workouts[session.workoutKey]?.mobility);
}

function populateExerciseSelects() {
  const options = Object.entries(exerciseCatalog)
    .filter(([, meta]) => meta.type === 'weight_reps')
    .map(([key, meta]) => `<option value="${key}">${meta.name}</option>`)
    .join('');
  els.strengthExerciseSelect.innerHTML = options;
  els.volumeExerciseSelect.innerHTML = options;
  if (document.querySelector('#strengthExerciseSelect option[value="bench"]')) {
    els.strengthExerciseSelect.value = 'bench';
    els.volumeExerciseSelect.value = 'bench';
  }
}

function setToday() {
  els.sessionDate.value = localIso();
}
function renderWorkoutForm() {
  const workoutKey = els.workoutSelect.value;
  const workout = workouts[workoutKey];
  if (!workout) return;
  const exerciseTemplate = document.getElementById('exerciseTemplate');
  els.exerciseFormArea.innerHTML = '';
  els.logIntro.textContent = `${workout.day} · ${workout.subtitle}`;
  els.guideBtn.classList.toggle('hidden', !workout.mobility);

  const draft = getDraft(workoutKey);
  els.sessionNotes.value = draft?.notes || '';
  if (draft?.date) els.sessionDate.value = draft.date;

  workout.pairs.forEach(pair => {
    pair.exercises.forEach(exerciseKey => {
      const meta = exerciseCatalog[exerciseKey];
      const node = exerciseTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.exercise = exerciseKey;
      node.querySelector('.superset-label').textContent = pair.label;
      node.querySelector('.exercise-name').textContent = meta.name;
      node.querySelector('.exercise-target').textContent = meta.target;
      if (meta.video) {
        node.querySelector('.exercise-target').insertAdjacentHTML('beforeend', ` · ${videoLink(meta.video)}`);
      }

      // Strength exercises start from last time's numbers, with a nudge to progress.
      const last = workout.mobility ? null : lastLogFor(exerciseKey);
      if (last) {
        const hint = document.createElement('p');
        hint.className = 'last-hint';
        hint.textContent = `Sist ${shortDate(last.date)}: ${formatSets(meta, last.sets)}.${progressionHint(meta, last.sets)}`;
        node.querySelector('.exercise-target').after(hint);
      }

      const table = node.querySelector('.set-table');
      const initialSets = draft?.exercises?.[exerciseKey] ?? last?.sets ?? null;
      if (initialSets) {
        initialSets.forEach((set, i) => table.appendChild(createSetRow(exerciseKey, i + 1, set)));
      } else {
        for (let i = 0; i < meta.defaultSets; i++) {
          table.appendChild(createSetRow(exerciseKey, i + 1));
        }
      }
      node.querySelector('.add-set-btn').addEventListener('click', () => {
        const rows = table.querySelectorAll('.set-row');
        const previous = rows.length ? readSetRow(rows[rows.length - 1]) : null;
        table.appendChild(createSetRow(exerciseKey, rows.length + 1, previous));
        saveDraft();
      });
      els.exerciseFormArea.appendChild(node);
    });
  });
}

function createSetRow(exerciseKey, number, values = null) {
  const meta = exerciseCatalog[exerciseKey];
  const row = document.getElementById('setRowTemplate').content.firstElementChild.cloneNode(true);
  row.querySelector('.set-label').textContent = number;
  const weight = row.querySelector('.set-weight');
  const reps = row.querySelector('.set-reps');
  const seconds = row.querySelector('.set-seconds');

  if (meta.type === 'seconds') {
    row.classList.add('seconds-mode');
    weight.classList.add('hidden');
    reps.classList.add('hidden');
    seconds.classList.remove('hidden');
  } else if (meta.type === 'reps') {
    weight.classList.add('hidden');
  }
  if (values) {
    if (values.weight > 0) weight.value = values.weight;
    if (values.reps > 0) reps.value = values.reps;
    if (values.seconds > 0) seconds.value = values.seconds;
  } else if (meta.defaultValue) {
    (meta.type === 'seconds' ? seconds : reps).value = meta.defaultValue;
  }

  // Removing every set is allowed: an exercise with no sets is simply not logged.
  row.querySelector('.remove-set-btn').addEventListener('click', () => {
    const table = row.parentElement;
    row.remove();
    [...table.children].forEach((child, idx) => {
      child.querySelector('.set-label').textContent = idx + 1;
    });
    saveDraft();
  });
  return row;
}

async function saveSession(event) {
  event.preventDefault();
  const workoutKey = els.workoutSelect.value;
  const exerciseLogs = [];

  [...els.exerciseFormArea.querySelectorAll('.exercise-card')].forEach(card => {
    const exerciseKey = card.dataset.exercise;
    const meta = exerciseCatalog[exerciseKey];
    const sets = [...card.querySelectorAll('.set-row')]
      .map(readSetRow)
      .filter(set => {
        if (meta.type === 'seconds') return set.seconds > 0;
        if (meta.type === 'reps') return set.reps > 0;
        return set.weight > 0 || set.reps > 0;
      });

    if (sets.length) {
      exerciseLogs.push({ exerciseKey, sets });
    }
  });

  if (!exerciseLogs.length) {
    showToast('Legg inn minst ett sett før du lagrer.');
    return;
  }

  const session = {
    date: els.sessionDate.value,
    workoutKey,
    notes: els.sessionNotes.value.trim(),
    exerciseLogs,
  };

  try {
    const data = await api('POST', '/api/sessions', session);
    appState.sessions.push(data.session);
    appState.sessions.sort((a, b) => a.date.localeCompare(b.date));
    clearDraft(workoutKey);
    renderHistory();
    renderDashboard();
    setToday();
    renderWorkoutForm();
    showToast('Økten ble lagret.');
    activateTab('history');
  } catch (error) {
    showToast(error.message || 'Kunne ikke lagre økten.');
  }
}

function renderHistory() {
  const sessions = [...appState.sessions].sort((a, b) => b.date.localeCompare(a.date));
  if (!sessions.length) {
    els.historyList.className = 'history-list empty-state';
    els.historyList.textContent = 'Ingen økter logget ennå.';
    return;
  }

  els.historyList.className = 'history-list';
  els.historyList.innerHTML = '';

  sessions.forEach(session => {
    const div = document.createElement('article');
    div.className = 'history-item';
    const workout = workouts[session.workoutKey];
    const totalVolume = formatNumber(session.exerciseLogs.reduce((sum, log) => sum + getExerciseVolume(log), 0));

    div.innerHTML = `
      <div class="history-meta">
        <div>
          <h3>${workout?.name || session.workoutKey}</h3>
          <p class="muted">${formatDate(session.date)} · ca. ${totalVolume} kg volum</p>
        </div>
        <button class="ghost-btn delete-session-btn" type="button">Slett</button>
      </div>
      ${session.notes ? `<p>${escapeHtml(session.notes)}</p>` : ''}
      <div class="exercise-badges">
        ${session.exerciseLogs.map(log => `<span class="badge">${exerciseCatalog[log.exerciseKey]?.name || log.exerciseKey}</span>`).join('')}
      </div>
    `;

    div.querySelector('.delete-session-btn').addEventListener('click', async () => {
      if (!confirm('Slette denne økten?')) return;
      try {
        await api('DELETE', `/api/sessions/${encodeURIComponent(session.id)}`);

        appState.sessions = appState.sessions.filter(s => s.id !== session.id);
        renderHistory();
        renderDashboard();
        showToast('Økten ble slettet.');
      } catch (error) {
        showToast(error.message || 'Kunne ikke slette økten.');
      }
    });
    els.historyList.appendChild(div);
  });
}

function renderPlan() {
  els.planView.innerHTML = Object.values(workouts).map(workout => `
    <section class="plan-workout">
      <h3>${workout.name}</h3>
      <p class="muted">${workout.day} · ${workout.subtitle}</p>
      ${workout.pairs.map(pair => `
        <div class="plan-pair">
          <strong>${pair.label}</strong>
          <ul>
            ${pair.exercises.map(key => `<li>${exerciseCatalog[key].name} — ${exerciseCatalog[key].target}${exerciseCatalog[key].video ? ` · ${videoLink(exerciseCatalog[key].video)}` : ''}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </section>
  `).join('');
}

function renderDashboard() {
  const allSessions = [...appState.sessions].sort((a, b) => a.date.localeCompare(b.date));
  renderEveningStreak(allSessions.filter(isMobilitySession));
  renderWeek(allSessions);
  const sessions = allSessions.filter(session => !isMobilitySession(session));
  els.statSessions.textContent = sessions.length;
  els.statMonth.textContent = sessions.filter(s => daysAgo(s.date) <= 30).length;
  els.statVolume.textContent = formatNumber(sessions.reduce((sum, session) => sum + session.exerciseLogs.reduce((acc, log) => acc + getExerciseVolume(log), 0), 0));

  renderWeeklySessionsChart(sessions);
  renderStrengthChart(sessions, els.strengthExerciseSelect.value);
  renderVolumeChart(sessions, els.volumeExerciseSelect.value);
  renderPRTable(sessions);
}

// Counts consecutive days with an evening routine, ending today (or yesterday,
// so the streak isn't shown as broken before tonight's routine is done).
function renderEveningStreak(sessions) {
  const dates = new Set(sessions.map(s => s.date));
  const day = new Date();
  const iso = localIso;
  if (!dates.has(iso(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (dates.has(iso(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  const last7 = sessions.filter(s => daysAgo(s.date) < 7).length;
  els.statEvening.textContent = `${streak}`;
  els.statEvening7.textContent = `${last7}/7`;
}

function renderWeeklySessionsChart(sessions) {
  const weeks = getLastNWeeks(12);
  const byWeek = new Map(weeks.map(w => [w.key, 0]));
  sessions.forEach(session => {
    const key = weekKey(session.date);
    if (byWeek.has(key)) byWeek.set(key, byWeek.get(key) + 1);
  });
  const data = weeks.map(w => ({ label: w.label, value: byWeek.get(w.key) || 0 }));
  els.sessionsChart.innerHTML = createBarChartSvg(data, { valueFormatter: v => `${v} økt${v === 1 ? '' : 'er'}` });
}

function renderStrengthChart(sessions, exerciseKey) {
  const points = sessions
    .map(session => {
      const log = session.exerciseLogs.find(item => item.exerciseKey === exerciseKey);
      if (!log) return null;
      const best = log.sets
        .filter(set => set.weight > 0 && set.reps > 0)
        .reduce((max, set) => Math.max(max, estimate1RM(set.weight, set.reps)), 0);
      return best ? { label: shortDate(session.date), value: best } : null;
    })
    .filter(Boolean);
  els.strengthChart.innerHTML = createLineChartSvg(points, { suffix: ' kg', emptyMessage: 'Logg noen sett med vekt for å se styrketrend.' });
}

function renderVolumeChart(sessions, exerciseKey) {
  const weeks = getLastNWeeks(12);
  const byWeek = new Map(weeks.map(w => [w.key, 0]));
  sessions.forEach(session => {
    const key = weekKey(session.date);
    if (!byWeek.has(key)) return;
    const log = session.exerciseLogs.find(item => item.exerciseKey === exerciseKey);
    if (!log) return;
    byWeek.set(key, byWeek.get(key) + getExerciseVolume(log));
  });
  const data = weeks.map(w => ({ label: w.label, value: byWeek.get(w.key) || 0 }));
  els.volumeChart.innerHTML = createBarChartSvg(data, { valueFormatter: v => `${formatNumber(v)} kg` });
}

function renderPRTable(sessions) {
  const keys = Object.keys(exerciseCatalog).filter(key => exerciseCatalog[key].category !== 'mobility' && ['weight_reps', 'reps', 'seconds'].includes(exerciseCatalog[key].type));
  const rows = keys.map(key => {
    const meta = exerciseCatalog[key];
    let best = 0;
    let detail = '—';
    sessions.forEach(session => {
      const log = session.exerciseLogs.find(item => item.exerciseKey === key);
      if (!log) return;
      if (meta.type === 'weight_reps') {
        log.sets.forEach(set => {
          const value = estimate1RM(set.weight, set.reps);
          if (value > best) {
            best = value;
            detail = `${set.weight} × ${set.reps}`;
          }
        });
      } else if (meta.type === 'reps') {
        log.sets.forEach(set => {
          if (set.reps > best) {
            best = set.reps;
            detail = `${set.reps} reps`;
          }
        });
      } else if (meta.type === 'seconds') {
        log.sets.forEach(set => {
          if (set.seconds > best) {
            best = set.seconds;
            detail = `${set.seconds} sek`;
          }
        });
      }
    });
    return { name: meta.name, best, detail, type: meta.type };
  }).filter(row => row.best > 0).sort((a, b) => a.name.localeCompare(b.name, 'no'));

  if (!rows.length) {
    els.prTable.innerHTML = '<p class="muted">Ingen personlige toppnoteringer ennå.</p>';
    return;
  }

  els.prTable.innerHTML = `
    <div class="pr-row header"><div>Øvelse</div><div>Best</div><div>Notering</div></div>
    ${rows.map(row => `
      <div class="pr-row">
        <div>${row.name}</div>
        <div>${row.type === 'weight_reps' ? `${formatNumber(row.best)} kg` : row.type === 'seconds' ? `${row.best} sek` : `${row.best} reps`}</div>
        <div>${row.detail}</div>
      </div>
    `).join('')}
  `;
}

function createBarChartSvg(data, { valueFormatter } = {}) {
  if (!data.some(d => d.value > 0)) {
    return `<div class="empty-state">Ingen data å vise ennå.</div>`;
  }
  const width = 680;
  const height = 220;
  const pad = { top: 20, right: 10, bottom: 40, left: 32 };
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = (width - pad.left - pad.right) / data.length;
  const textColor = cssVar('--muted');
  const lineColor = cssVar('--line');
  const brand = cssVar('--brand');

  const bars = data.map((d, i) => {
    const valueHeight = ((height - pad.top - pad.bottom) * d.value) / max;
    const x = pad.left + i * barWidth + 8;
    const y = height - pad.bottom - valueHeight;
    return `
      <g>
        <rect x="${x}" y="${y}" width="${Math.max(barWidth - 16, 10)}" height="${valueHeight}" rx="10" fill="${brand}" opacity="0.88"></rect>
        <text x="${x + (Math.max(barWidth - 16, 10) / 2)}" y="${y - 6}" text-anchor="middle" font-size="11" fill="${textColor}">${d.value > 0 ? Math.round(d.value * 10) / 10 : ''}</text>
        <text x="${x + (Math.max(barWidth - 16, 10) / 2)}" y="${height - 16}" text-anchor="middle" font-size="10" fill="${textColor}">${d.label}</text>
        <title>${d.label}: ${valueFormatter ? valueFormatter(d.value) : d.value}</title>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Stolpediagram">
      <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="${lineColor}" stroke-width="1"></line>
      ${bars}
    </svg>
  `;
}

function createLineChartSvg(points, { suffix = '', emptyMessage = 'Ingen data.' } = {}) {
  if (!points.length) {
    return `<div class="empty-state">${emptyMessage}</div>`;
  }
  const width = 680;
  const height = 220;
  const pad = { top: 20, right: 16, bottom: 34, left: 40 };
  const max = Math.max(...points.map(p => p.value));
  const min = Math.min(...points.map(p => p.value));
  const range = Math.max(max - min, 1);
  const lineColor = cssVar('--brand');
  const fillColor = cssVar('--brand-soft');
  const textColor = cssVar('--muted');
  const gridColor = cssVar('--line');

  const coords = points.map((point, index) => {
    const x = pad.left + ((width - pad.left - pad.right) / Math.max(points.length - 1, 1)) * index;
    const y = pad.top + (height - pad.top - pad.bottom) * (1 - (point.value - min) / range);
    return { ...point, x, y };
  });

  const path = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${path} L ${coords[coords.length - 1].x} ${height - pad.bottom} L ${coords[0].x} ${height - pad.bottom} Z`;

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Linjediagram">
      <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="${gridColor}" stroke-width="1"></line>
      <path d="${areaPath}" fill="${fillColor}"></path>
      <path d="${path}" fill="none" stroke="${lineColor}" stroke-width="3" stroke-linecap="round"></path>
      ${coords.map(point => `
        <g>
          <circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${lineColor}"></circle>
          <text x="${point.x}" y="${height - 12}" text-anchor="middle" font-size="10" fill="${textColor}">${point.label}</text>
          <title>${point.label}: ${formatNumber(point.value)}${suffix}</title>
        </g>
      `).join('')}
      <text x="${pad.left}" y="${pad.top - 4}" font-size="11" fill="${textColor}">${formatNumber(max)}${suffix}</text>
      <text x="${pad.left}" y="${height - pad.bottom + 14}" font-size="11" fill="${textColor}">${formatNumber(min)}${suffix}</text>
    </svg>
  `;
}

function applyTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  if (theme === 'dark') document.body.classList.add('dark');
  updateThemeButton();
}

function updateThemeButton() {
  els.themeToggle.textContent = document.body.classList.contains('dark') ? '☀︎' : '☾';
}
async function exportData() {
  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      sessions: [...appState.sessions].sort((a, b) => a.date.localeCompare(b.date)),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `styrkelogg-backup-${localIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast(error.message || 'Eksport feilet.');
  }
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.sessions || !Array.isArray(imported.sessions)) {
        throw new Error('Mangler sessions-array.');
      }
      const sessions = imported.sessions.map(cleanImportedSession);
      if (!sessions.length) {
        throw new Error('Ingen gyldige økter i filen.');
      }
      const result = await api('PUT', '/api/sessions', { sessions });
      await loadSessions();
      renderHistory();
      renderDashboard();
      showToast(`${result.imported} økter ble importert.`);
    } catch (error) {
      showToast(error.message || 'Kunne ikke importere filen.');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

function cleanImportedSession(item) {
  const cleanedLogs = Array.isArray(item.exerciseLogs) ? item.exerciseLogs
    .filter(log => log && typeof log.exerciseKey === 'string' && Array.isArray(log.sets))
    .map(log => ({
      exerciseKey: log.exerciseKey,
      sets: log.sets.map(set => ({
        weight: Number(set.weight || 0),
        reps: Number(set.reps || 0),
        seconds: Number(set.seconds || 0),
      })),
    })) : [];

  if (!item.date || !item.workoutKey || !cleanedLogs.length) {
    throw new Error('En eller flere økter har ugyldig format.');
  }

  return {
    id: String(item.id || generateId()),
    date: String(item.date).slice(0, 10),
    workoutKey: item.workoutKey,
    notes: item.notes ? String(item.notes) : '',
    exerciseLogs: cleanedLogs,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}
function estimate1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

function getExerciseVolume(log) {
  return log.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
}

// ---------- Week overview ----------

function renderWeek(sessions) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const todayIso = localIso(today);
  let strengthDone = 0;
  let eveningsDone = 0;

  const cells = DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = localIso(d);
    const daySessions = sessions.filter(s => s.date === iso);
    const evening = daySessions.some(isMobilitySession);
    const strength = daySessions.filter(s => !isMobilitySession(s));
    const plannedKey = WEEK_PLAN[d.getDay()];
    const isPast = iso < todayIso;
    if (evening) eveningsDone += 1;
    strengthDone += strength.length;

    let strengthMark = '';
    if (strength.length) {
      strengthMark = `<span class="wk-strength done">${strength.map(s => workouts[s.workoutKey]?.name || 'Økt').join(', ')} ✓</span>`;
    } else if (plannedKey) {
      strengthMark = `<span class="wk-strength ${isPast ? 'missed' : 'planned'}">${workouts[plannedKey].name}</span>`;
    }
    const eveningMark = `<span class="wk-evening ${evening ? 'done' : isPast ? 'missed' : ''}" title="Kveldsrutine">${evening ? '●' : '○'}</span>`;
    return `
      <div class="wk-day${iso === todayIso ? ' today' : ''}">
        <span class="wk-name">${name}</span>
        <span class="wk-date">${d.getDate()}.</span>
        ${strengthMark}
        ${eveningMark}
      </div>`;
  });

  els.weekView.innerHTML = cells.join('');
  const strengthGoal = Object.keys(WEEK_PLAN).length;
  els.weekSummary.textContent = `Styrke ${Math.min(strengthDone, 99)}/${strengthGoal} · Kveldsrutine ${eveningsDone}/7 (● = gjort)`;
  els.logTodayBtn.textContent = `Logg ${workouts[pickDefaultWorkout()].name.toLowerCase()} →`;
}

// ---------- Last time's numbers ----------

function lastLogFor(exerciseKey) {
  const sorted = [...appState.sessions].sort((a, b) =>
    b.date.localeCompare(a.date) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  for (const session of sorted) {
    const log = session.exerciseLogs.find(item => item.exerciseKey === exerciseKey);
    if (log?.sets?.length) return { date: session.date, sets: log.sets };
  }
  return null;
}

function formatSets(meta, sets) {
  return sets.map(set => {
    if (meta.type === 'seconds') return `${set.seconds} sek`;
    if (meta.type === 'reps') return `${set.reps}`;
    return `${formatNumber(set.weight)}×${set.reps}`;
  }).join(', ');
}

// Double progression: when every set reached the top of the rep range, add load (or reps).
function progressionHint(meta, sets) {
  const match = meta.target.match(/(\d+)–(\d+)\s*(reps|sek)/);
  if (!match) return '';
  const top = Number(match[2]);
  const key = meta.type === 'seconds' ? 'seconds' : 'reps';
  if (!sets.every(set => set[key] >= top)) return '';
  if (meta.type === 'weight_reps') return ' Alle sett nådde toppen – prøv litt mer vekt i dag.';
  if (meta.type === 'seconds') return ' Du nådde toppen – prøv en tyngre variant.';
  return ' Du nådde toppen – prøv en tyngre variant eller flere reps.';
}

function readSetRow(row) {
  return {
    weight: parseFloat(row.querySelector('.set-weight')?.value) || 0,
    reps: parseInt(row.querySelector('.set-reps')?.value || '0', 10) || 0,
    seconds: parseInt(row.querySelector('.set-seconds')?.value || '0', 10) || 0,
  };
}

// ---------- Drafts ----------

function readDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {};
  } catch (_) {
    return {};
  }
}

function writeDrafts(drafts) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (_) {
    // storage unavailable (private mode etc.) – drafts are a convenience only
  }
}

function getDraft(workoutKey) {
  const draft = readDrafts()[workoutKey];
  return draft && Date.now() - draft.savedAt < DRAFT_MAX_AGE_MS ? draft : null;
}

function latestDraft() {
  return Object.values(readDrafts())
    .filter(draft => Date.now() - draft.savedAt < DRAFT_MAX_AGE_MS)
    .sort((a, b) => b.savedAt - a.savedAt)[0] || null;
}

function saveDraft() {
  const workoutKey = els.workoutSelect.value;
  if (!workouts[workoutKey]) return;
  const exercises = {};
  els.exerciseFormArea.querySelectorAll('.exercise-card').forEach(card => {
    exercises[card.dataset.exercise] = [...card.querySelectorAll('.set-row')].map(readSetRow);
  });
  const drafts = readDrafts();
  drafts[workoutKey] = {
    workoutKey,
    date: els.sessionDate.value,
    notes: els.sessionNotes.value,
    exercises,
    savedAt: Date.now(),
  };
  writeDrafts(drafts);
}

function clearDraft(workoutKey) {
  const drafts = readDrafts();
  delete drafts[workoutKey];
  writeDrafts(drafts);
}

// ---------- Guided routine ----------

let guide = null;

function startGuide() {
  const workout = workouts[els.workoutSelect.value];
  const steps = [];
  workout.pairs.forEach(pair => pair.exercises.forEach(key => {
    const meta = exerciseCatalog[key];
    const rows = [...els.exerciseFormArea.querySelectorAll(`.exercise-card[data-exercise="${key}"] .set-row`)];
    const count = Math.max(rows.length, 1);
    for (let i = 0; i < count; i++) {
      const planned = rows[i] ? readSetRow(rows[i]).seconds : 0;
      steps.push({
        key,
        label: pair.label,
        round: i + 1,
        rounds: count,
        seconds: meta.type === 'seconds' ? (planned || meta.defaultValue || 30) : 0,
      });
    }
  }));

  guide = { steps, index: 0, remaining: 0, endAt: 0, timer: null, done: new Set(), wakeLock: null, audio: null };
  try {
    guide.audio = new (window.AudioContext || window.webkitAudioContext)();
  } catch (_) {
    // no sound
  }
  els.guide.classList.remove('hidden');
  document.body.classList.add('no-scroll');
  requestWakeLock();
  showGuideStep();
}

function showGuideStep() {
  stopGuideTimer();
  const step = guide.steps[guide.index];
  if (!step) {
    finishGuide();
    return;
  }
  const meta = exerciseCatalog[step.key];
  els.guideProgress.textContent = `${guide.index + 1} av ${guide.steps.length}`;
  els.guideStep.textContent = step.rounds > 1 ? `${step.label} · runde ${step.round} av ${step.rounds}` : step.label;
  els.guideName.textContent = meta.name;
  els.guideTarget.innerHTML = escapeHtml(meta.target) + (meta.video ? ` · ${videoLink(meta.video)}` : '');
  guide.remaining = step.seconds;
  if (step.seconds) {
    els.guideTimer.textContent = formatClock(step.seconds);
    els.guideMain.textContent = 'Start';
  } else {
    els.guideTimer.textContent = meta.defaultValue ? `${meta.defaultValue} reps` : '';
    els.guideMain.textContent = 'Ferdig – neste →';
  }
  els.guideSkip.textContent = guide.index === guide.steps.length - 1 ? 'Hopp over og avslutt' : 'Hopp over';
}

function onGuideMain() {
  const step = guide.steps[guide.index];
  if (!step.seconds || guide.remaining <= 0) {
    nextGuideStep(false);
  } else if (guide.timer) {
    stopGuideTimer();
    els.guideMain.textContent = 'Fortsett';
  } else {
    guide.audio?.resume?.();
    guide.endAt = Date.now() + guide.remaining * 1000;
    els.guideMain.textContent = 'Pause';
    guide.timer = setInterval(tickGuide, 250);
  }
}

function tickGuide() {
  guide.remaining = Math.max(0, Math.ceil((guide.endAt - Date.now()) / 1000));
  els.guideTimer.textContent = formatClock(guide.remaining);
  if (guide.remaining > 0) return;
  stopGuideTimer();
  signalDone();
  els.guideMain.textContent = 'Neste →';
  const index = guide.index;
  setTimeout(() => {
    if (guide && guide.index === index) nextGuideStep(false);
  }, 1500);
}

function nextGuideStep(skipped) {
  if (!guide) return;
  if (!skipped) guide.done.add(guide.steps[guide.index].key);
  guide.index += 1;
  showGuideStep();
}

function stopGuideTimer() {
  if (guide?.timer) {
    clearInterval(guide.timer);
    guide.timer = null;
  }
}

function finishGuide() {
  const done = guide.done;
  // Exercises skipped entirely are left out of the log.
  els.exerciseFormArea.querySelectorAll('.exercise-card').forEach(card => {
    if (!done.has(card.dataset.exercise)) card.querySelectorAll('.set-row').forEach(row => row.remove());
  });
  closeGuide();
  if (done.size) {
    els.logForm.requestSubmit();
  } else {
    renderWorkoutForm();
    showToast('Ingenting å lagre.');
  }
}

function closeGuide() {
  if (!guide) return;
  stopGuideTimer();
  guide.wakeLock?.release?.().catch(() => {});
  guide.audio?.close?.().catch(() => {});
  guide = null;
  els.guide.classList.add('hidden');
  document.body.classList.remove('no-scroll');
}

async function requestWakeLock() {
  try {
    if (guide && navigator.wakeLock) guide.wakeLock = await navigator.wakeLock.request('screen');
  } catch (_) {
    // the screen may sleep; the timer still uses wall-clock time
  }
}

function signalDone() {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch (_) {
    // ignore
  }
  const ctx = guide?.audio;
  if (!ctx) return;
  try {
    [0, 0.25].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  } catch (_) {
    // ignore
  }
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Local calendar date as YYYY-MM-DD (toISOString would give the UTC date).
function localIso(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2400);
}

function showAuthMessage(message) {
  els.authMessage.textContent = message || '';
}

function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function formatDate(dateString) {
  return new Date(dateString + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shortDate(dateString) {
  return new Date(dateString + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

function formatNumber(value) {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value);
}

function weekKey(dateString) {
  const d = new Date(dateString + 'T12:00:00');
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getLastNWeeks(count) {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    result.push({ key: weekKey(localIso(d)), label: `U${weekNumber(d)}` });
  }
  return result;
}

function weekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function daysAgo(dateString) {
  const diff = Date.now() - new Date(dateString + 'T12:00:00').getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
