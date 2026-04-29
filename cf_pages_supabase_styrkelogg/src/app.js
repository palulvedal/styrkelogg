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
};
const WORKOUTS = {
  workout1: {
    name: 'Økt 1',
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
    subtitle: 'Rygg, bryst, armer og kjerne',
    pairs: [
      { label: 'Supersett 1', exercises: ['incline', 'chestrow'] },
      { label: 'Supersett 2', exercises: ['facepull', 'pushups'] },
      { label: 'Supersett 3', exercises: ['curls', 'goblet'] },
      { label: 'Supersett 4', exercises: ['legraise', 'pallof'] },
    ],
  },
};
const THEME_KEY = 'strengthlog_theme';
const SESSION_SYNC_KEY = 'strengthlog_sessions_sync';
const SESSION_SYNC_CHANNEL = 'strengthlog_sessions_channel';

let exerciseCatalog = EXERCISE_CATALOG;
let workouts = WORKOUTS;
let appState = { sessions: [] };
let currentUser = null;
let supabaseClient = null;
let authSubscription = null;
let sessionSyncChannel = null;
let refreshInFlight = null;
let lastSyncAt = 0;

const els = {
  authGate: document.getElementById('authGate'),
  appShell: document.getElementById('appShell'),
  authTabs: [...document.querySelectorAll('.auth-tab')],
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  authMessage: document.getElementById('authMessage'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  registerName: document.getElementById('registerName'),
  registerEmail: document.getElementById('registerEmail'),
  registerPassword: document.getElementById('registerPassword'),
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
  setupSessionSync();
  populateWorkoutSelect();
  populateExerciseSelects();
  renderPlan();
  setToday();
  ensureLogFormReady();

  const config = window.STRENGTHLOG_CONFIG || {};
  const missingConfig = !config.supabaseUrl || !config.supabaseAnonKey ||
    String(config.supabaseUrl).includes('YOUR_SUPABASE') ||
    String(config.supabaseAnonKey).includes('YOUR_SUPABASE');

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    showAuth();
    showAuthMessage('Kunne ikke laste Supabase-biblioteket.');
    return;
  }

  if (missingConfig) {
    showAuth();
    showAuthMessage('Appen mangler Supabase-oppsett. Sett SUPABASE_URL og SUPABASE_ANON_KEY før deploy.');
    return;
  }

  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      currentUser = mapUser(session.user);
      if (els.appShell.classList.contains('hidden')) {
        await enterApp();
      } else {
        els.accountLabel.textContent = formatAccountLabel(currentUser);
      }
    } else {
      currentUser = null;
      appState = { sessions: [] };
      showAuth();
      switchAuthTab('login');
    }
  });
  authSubscription = authListener?.subscription || null;

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user) {
      currentUser = mapUser(data.session.user);
      await enterApp();
    } else {
      showAuth();
    }
  } catch (error) {
    showAuth();
    showAuthMessage(error.message || 'Kunne ikke koble til Supabase.');
  }
}

function bindBaseEvents() {
  window.addEventListener('focus', () => { void refreshFromServer({ force: false }); });
  window.addEventListener('pageshow', () => { void refreshFromServer({ force: false }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refreshFromServer({ force: false });
    }
  });

  els.authTabs.forEach(tab => tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab)));
  els.loginForm.addEventListener('submit', handleLogin);
  els.registerForm.addEventListener('submit', handleRegister);
  els.logoutBtn.addEventListener('click', handleLogout);

  els.tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  els.workoutSelect.addEventListener('change', renderWorkoutForm);
  els.clearFormBtn.addEventListener('click', () => {
    els.sessionNotes.value = '';
    renderWorkoutForm();
  });
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

function switchAuthTab(tabName) {
  els.authTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === tabName));
  els.loginForm.classList.toggle('hidden', tabName !== 'login');
  els.registerForm.classList.toggle('hidden', tabName !== 'register');
  showAuthMessage('');
}

function showAuth() {
  els.authGate.classList.remove('hidden');
  els.appShell.classList.add('hidden');
}

async function enterApp() {
  if (!currentUser) return;
  els.accountLabel.textContent = formatAccountLabel(currentUser);
  els.authGate.classList.add('hidden');
  els.appShell.classList.remove('hidden');
  await loadSessions();
  ensureLogFormReady();
  renderHistory();
  renderDashboard();
}

function formatAccountLabel(user) {
  return `${user.name} · ${user.email}`;
}

function mapUser(user) {
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Bruker';
  return {
    id: user.id,
    email: user.email || '',
    name,
  };
}

async function handleLogin(event) {
  event.preventDefault();
  if (!supabaseClient) return;
  showAuthMessage('Logger inn …');
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: els.loginEmail.value.trim(),
      password: els.loginPassword.value,
    });
    if (error) throw error;
    currentUser = mapUser(data.user || data.session?.user);
    els.loginForm.reset();
    showAuthMessage('');
    await enterApp();
    showToast('Du er logget inn.');
  } catch (error) {
    showAuthMessage(error.message || 'Innlogging feilet.');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  if (!supabaseClient) return;
  showAuthMessage('Oppretter bruker …');
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value,
      options: {
        data: { name: els.registerName.value.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    els.registerForm.reset();

    if (data.session?.user) {
      currentUser = mapUser(data.session.user);
      showAuthMessage('');
      await enterApp();
      showToast('Brukeren ble opprettet.');
      return;
    }

    showAuthMessage('Brukeren er opprettet. Sjekk e-post hvis prosjektet krever e-postbekreftelse.');
  } catch (error) {
    showAuthMessage(error.message || 'Kunne ikke opprette bruker.');
  }
}

function setupSessionSync() {
  if ('BroadcastChannel' in window) {
    sessionSyncChannel = new BroadcastChannel(SESSION_SYNC_CHANNEL);
    sessionSyncChannel.addEventListener('message', event => {
      if (event?.data?.type === 'sessions-updated') {
        void refreshFromServer({ force: true });
      }
    });
  }

  window.addEventListener('storage', event => {
    if (event.key === SESSION_SYNC_KEY && event.newValue) {
      void refreshFromServer({ force: true });
    }
  });
}

function notifySessionChange() {
  const stamp = String(Date.now());
  try {
    localStorage.setItem(SESSION_SYNC_KEY, stamp);
  } catch (_) {
    // ignore storage write errors
  }
  try {
    sessionSyncChannel?.postMessage({ type: 'sessions-updated', at: stamp });
  } catch (_) {
    // ignore broadcast errors
  }
}

async function refreshFromServer({ force = false } = {}) {
  if (!supabaseClient || !currentUser || els.appShell.classList.contains('hidden')) return;
  const now = Date.now();
  if (!force && now - lastSyncAt < 1500) return;
  if (refreshInFlight) {
    if (!force) return refreshInFlight;
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      await loadSessions();
      lastSyncAt = Date.now();
      renderHistory();
      renderDashboard();
      lastSyncAt = Date.now();
    } catch (_) {
      // ignore background refresh errors
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function handleLogout() {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (_) {
    // ignore
  }
  currentUser = null;
  appState = { sessions: [] };
  showAuth();
  switchAuthTab('login');
  showToast('Du er logget ut.');
  notifySessionChange();
}

async function loadSessions() {
  if (!supabaseClient || !currentUser) return;
  const { data, error } = await supabaseClient
    .from('workout_sessions')
    .select('id, user_id, session_date, workout_key, notes, payload_json, created_at, updated_at')
    .order('session_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  appState.sessions = (data || []).map(mapDbSession);
}

function mapDbSession(row) {
  const payload = row.payload_json || {};
  return {
    id: row.id,
    date: row.session_date,
    workoutKey: row.workout_key,
    notes: row.notes || '',
    exerciseLogs: Array.isArray(payload.exerciseLogs) ? payload.exerciseLogs : [],
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function toDbSession(session) {
  return {
    id: String(session.id || generateId()),
    user_id: currentUser.id,
    session_date: session.date,
    workout_key: session.workoutKey,
    notes: session.notes || '',
    payload_json: { exerciseLogs: session.exerciseLogs || [] },
    created_at: session.createdAt || new Date().toISOString(),
    updated_at: session.updatedAt || new Date().toISOString(),
  };
}

function generateId() {
  return window.crypto?.randomUUID?.() || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function activateTab(tabName) {
  els.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  els.panels.forEach(panel => panel.classList.toggle('active', panel.id === tabName));
  if (tabName === 'log') {
    ensureLogFormReady();
  }
}

function populateWorkoutSelect() {
  const previousValue = els.workoutSelect.value;
  els.workoutSelect.innerHTML = Object.entries(workouts)
    .map(([key, workout]) => `<option value="${key}">${workout.name}</option>`)
    .join('');

  if (previousValue && workouts[previousValue]) {
    els.workoutSelect.value = previousValue;
  } else {
    const firstKey = Object.keys(workouts)[0];
    if (firstKey) els.workoutSelect.value = firstKey;
  }
}

function ensureLogFormReady() {
  const selectedWorkout = els.workoutSelect.value;
  const firstWorkout = Object.keys(workouts)[0] || '';
  if (!selectedWorkout || !workouts[selectedWorkout]) {
    els.workoutSelect.value = firstWorkout;
  }

  const renderedWorkout = els.exerciseFormArea.dataset.renderedWorkout || '';
  const hasCards = els.exerciseFormArea.querySelector('.exercise-card');
  if (!hasCards || renderedWorkout !== els.workoutSelect.value) {
    renderWorkoutForm();
  }
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
  els.sessionDate.value = new Date().toISOString().slice(0, 10);
}
function renderWorkoutForm() {
  const selectedWorkout = els.workoutSelect.value;
  const workout = workouts[selectedWorkout];
  if (!workout) {
    els.exerciseFormArea.innerHTML = '';
    delete els.exerciseFormArea.dataset.renderedWorkout;
    return;
  }
  const exerciseTemplate = document.getElementById('exerciseTemplate');
  els.exerciseFormArea.innerHTML = '';
  els.exerciseFormArea.dataset.renderedWorkout = selectedWorkout;

  workout.pairs.forEach(pair => {
    pair.exercises.forEach(exerciseKey => {
      const meta = exerciseCatalog[exerciseKey];
      const node = exerciseTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.exercise = exerciseKey;
      node.querySelector('.superset-label').textContent = pair.label;
      node.querySelector('.exercise-name').textContent = meta.name;
      node.querySelector('.exercise-target').textContent = meta.target;

      const table = node.querySelector('.set-table');
      for (let i = 0; i < meta.defaultSets; i++) {
        table.appendChild(createSetRow(exerciseKey, i + 1));
      }
      node.querySelector('.add-set-btn').addEventListener('click', () => {
        table.appendChild(createSetRow(exerciseKey, table.children.length + 1));
      });
      els.exerciseFormArea.appendChild(node);
    });
  });
}

function createSetRow(exerciseKey, number) {
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

  row.querySelector('.remove-set-btn').addEventListener('click', () => {
    const table = row.parentElement;
    if (table.children.length > 1) {
      row.remove();
      [...table.children].forEach((child, idx) => {
        child.querySelector('.set-label').textContent = idx + 1;
      });
    }
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
      .map(row => ({
        weight: parseFloat(row.querySelector('.set-weight')?.value) || 0,
        reps: parseInt(row.querySelector('.set-reps')?.value || '0', 10),
        seconds: parseInt(row.querySelector('.set-seconds')?.value || '0', 10),
      }))
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
    if (!supabaseClient || !currentUser) {
      throw new Error('Du må være logget inn for å lagre økter.');
    }
    const row = toDbSession(session);
    const { data, error } = await supabaseClient
      .from('workout_sessions')
      .insert([row])
      .select('id, user_id, session_date, workout_key, notes, payload_json, created_at, updated_at')
      .single();
    if (error) throw error;

    appState.sessions.push(mapDbSession(data));
    appState.sessions.sort((a, b) => a.date.localeCompare(b.date));
    lastSyncAt = Date.now();
    renderHistory();
    renderDashboard();
    els.sessionNotes.value = '';
    renderWorkoutForm();
    showToast('Økten ble lagret.');
    notifySessionChange();
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
        if (!supabaseClient || !currentUser) {
          throw new Error('Du må være logget inn for å slette økter.');
        }
        const { error } = await supabaseClient
          .from('workout_sessions')
          .delete()
          .eq('id', session.id)
          .eq('user_id', currentUser.id);
        if (error) throw error;

        appState.sessions = appState.sessions.filter(s => s.id !== session.id);
        lastSyncAt = Date.now();
        renderHistory();
        renderDashboard();
        showToast('Økten ble slettet.');
        notifySessionChange();
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
      <p class="muted">${workout.subtitle}</p>
      ${workout.pairs.map(pair => `
        <div class="plan-pair">
          <strong>${pair.label}</strong>
          <ul>
            ${pair.exercises.map(key => `<li>${exerciseCatalog[key].name} — ${exerciseCatalog[key].target}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </section>
  `).join('');
}

function renderDashboard() {
  const sessions = [...appState.sessions].sort((a, b) => a.date.localeCompare(b.date));
  els.statSessions.textContent = sessions.length;
  els.statMonth.textContent = sessions.filter(s => daysAgo(s.date) <= 30).length;
  els.statVolume.textContent = formatNumber(sessions.reduce((sum, session) => sum + session.exerciseLogs.reduce((acc, log) => acc + getExerciseVolume(log), 0), 0));

  renderWeeklySessionsChart(sessions);
  renderStrengthChart(sessions, els.strengthExerciseSelect.value);
  renderVolumeChart(sessions, els.volumeExerciseSelect.value);
  renderPRTable(sessions);
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
  const keys = Object.keys(exerciseCatalog).filter(key => ['weight_reps', 'reps', 'seconds'].includes(exerciseCatalog[key].type));
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
    a.download = `styrkelogg-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      const rows = imported.sessions.map(cleanImportedSession).map(toDbSession);
      if (!rows.length) {
        throw new Error('Ingen gyldige økter i filen.');
      }
      const { error } = await supabaseClient
        .from('workout_sessions')
        .upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      await loadSessions();
      lastSyncAt = Date.now();
      renderHistory();
      renderDashboard();
      showToast('Data ble importert til Supabase.');
      notifySessionChange();
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
    result.push({ key: weekKey(d.toISOString().slice(0, 10)), label: `U${weekNumber(d)}` });
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
