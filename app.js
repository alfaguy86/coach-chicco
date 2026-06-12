// ── State ──────────────────────────────────────────────────────────────────
const state = {
  meals: JSON.parse(localStorage.getItem('meals') || '{}'),
  water: parseFloat(localStorage.getItem('water') || '0'),
  steps: parseInt(localStorage.getItem('steps') || '0'),
  stepsConnected: localStorage.getItem('garminConnected') === 'true',
  currentMealType: null,
  photoData: null,
  apiKey: null,
};

const today = () => new Date().toISOString().split('T')[0];
const todayMeals = () => state.meals[today()] || {};

function save() {
  localStorage.setItem('meals', JSON.stringify(state.meals));
  localStorage.setItem('water', state.water);
  localStorage.setItem('steps', state.steps);
}

// ── Navigation ─────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('page-' + tab.dataset.page).classList.add('active');
    if (tab.dataset.page === 'today') renderToday();
    if (tab.dataset.page === 'log') renderLog();
    if (tab.dataset.page === 'notifs') renderNotifs();
  });
});

// ── TODAY ──────────────────────────────────────────────────────────────────
function renderToday() {
  const meals = todayMeals();
  let totalCal = 0, totalPro = 0;
  Object.values(meals).forEach(m => {
    totalCal += m.calories || 0;
    totalPro += m.protein || 0;
  });

  document.getElementById('cal-val').textContent = totalCal.toLocaleString();
  document.getElementById('pro-val').textContent = totalPro + 'g';
  document.getElementById('water-val').textContent = state.water.toFixed(1) + 'L';

  if (state.stepsConnected && state.steps > 0) {
    const goal = 10000;
    const pct = Math.min(100, Math.round(state.steps / goal * 100));
    document.getElementById('step-count').textContent = state.steps.toLocaleString();
    document.getElementById('step-bar').style.width = pct + '%';
    const rem = Math.max(0, goal - state.steps);
    document.getElementById('steps-remaining').textContent =
      rem > 0 ? `${rem.toLocaleString()} more steps — about a ${Math.round(rem / 100)} min walk` : '🎉 Goal reached!';
    document.getElementById('garmin-btn').textContent = '✓ Garmin connected';
    document.getElementById('garmin-btn').classList.add('connected');
  }

  loadDailyTip(totalCal, totalPro, state.water, state.steps);
}

function addWater(ml) {
  state.water = parseFloat((state.water + ml / 1000).toFixed(2));
  save();
  renderToday();
}

async function loadDailyTip(cal, protein, water, steps) {
  const el = document.getElementById('tip-text');
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const prompt = `You are Coach Chicco, a friendly casual diet coach. The user's goals are to lose weight and avoid afternoon energy crashes. 
Today so far: ${cal} calories, ${protein}g protein, ${water}L water, ${steps} steps.
Current time: ${timeOfDay}.
Give ONE short, specific, actionable tip (2-3 sentences max) in a warm casual tone. No bullet points. No intro like "Here's a tip". Just the tip directly. Use 1 emoji max.`;

  el.textContent = 'Loading your tip…';
  try {
    const res = await callClaude(prompt);
    el.textContent = res;
  } catch {
    el.textContent = "Stay consistent today — small choices add up! Try to get some protein at every meal to keep energy levels steady.";
  }
}

// ── GARMIN ─────────────────────────────────────────────────────────────────
function connectGarmin() {
  // Simulate Garmin connection (real implementation uses Garmin Health API OAuth)
  // In production: window.location.href = GARMIN_OAUTH_URL
  const demo = prompt('Demo mode: Enter your step count (or connect real Garmin via OAuth in production):', '7240');
  if (demo !== null && !isNaN(parseInt(demo))) {
    state.steps = parseInt(demo);
    state.stepsConnected = true;
    localStorage.setItem('garminConnected', 'true');
    save();
    renderToday();
  }
}

// ── LOG ────────────────────────────────────────────────────────────────────
const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', icon: 'ti-sun', cls: 'breakfast' },
  { key: 'lunch',     label: 'Lunch',     icon: 'ti-sun-high', cls: 'lunch' },
  { key: 'dinner',    label: 'Dinner',    icon: 'ti-moon', cls: 'dinner' },
];

function renderLog() {
  const meals = todayMeals();
  const d = new Date();
  document.getElementById('log-date').textContent =
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const list = document.getElementById('meal-list');
  list.innerHTML = '';

  MEAL_SLOTS.forEach(slot => {
    const meal = meals[slot.key];
    const item = document.createElement('div');
    item.className = 'meal-item';
    item.onclick = () => openLog(slot.key);

    if (meal) {
      item.innerHTML = `
        <div class="meal-icon ${slot.cls}"><i class="ti ${slot.icon}"></i></div>
        <div style="flex:1">
          <div class="meal-name">${meal.name}</div>
          <div class="meal-cals">${meal.calories || '~'} kcal · ${meal.time}</div>
        </div>
        <i class="ti ti-chevron-right meal-action"></i>`;
    } else {
      item.innerHTML = `
        <div class="meal-icon empty"><i class="ti ti-plus"></i></div>
        <div style="flex:1">
          <div class="meal-name" style="color:var(--text-tertiary)">Log ${slot.label.toLowerCase()}</div>
          <div class="meal-cals">not logged yet</div>
        </div>
        <i class="ti ti-chevron-right meal-action"></i>`;
    }
    list.appendChild(item);
  });

  // Snacks
  const snacks = Object.entries(meals).filter(([k]) => k.startsWith('snack'));
  snacks.forEach(([key, meal]) => {
    const item = document.createElement('div');
    item.className = 'meal-item';
    item.innerHTML = `
      <div class="meal-icon snack"><i class="ti ti-apple"></i></div>
      <div style="flex:1">
        <div class="meal-name">${meal.name}</div>
        <div class="meal-cals">${meal.calories || '~'} kcal · ${meal.time}</div>
      </div>
      <i class="ti ti-chevron-right meal-action"></i>`;
    list.appendChild(item);
  });

  // Coach tip for log page
  const logged = Object.keys(meals).length;
  if (logged >= 1) {
    document.getElementById('log-coach-tip').style.display = 'block';
    const totalCal = Object.values(meals).reduce((s, m) => s + (m.calories || 0), 0);
    const totalPro = Object.values(meals).reduce((s, m) => s + (m.protein || 0), 0);
    loadLogTip(totalCal, totalPro, logged);
  }
}

async function loadLogTip(cal, protein, mealCount) {
  const el = document.getElementById('log-tip-text');
  el.textContent = 'Analysing your day…';
  const prompt = `Coach Chicco is a friendly casual diet coach. User goal: lose weight, avoid 2pm energy crash.
Logged today: ${mealCount} meals, ${cal} calories, ${protein}g protein.
Give a 1-2 sentence casual observation about their eating pattern today and one specific suggestion for the next meal. Direct, no intro phrase, 1 emoji max.`;
  try {
    const res = await callClaude(prompt);
    el.textContent = res;
  } catch {
    el.textContent = `You've had ${cal} kcal and ${protein}g protein so far. Make sure dinner has plenty of protein to hit your daily target!`;
  }
}

// ── LOG MODAL ──────────────────────────────────────────────────────────────
function openLog(type) {
  state.currentMealType = type;
  state.photoData = null;
  document.getElementById('modal-title').textContent = 'Log ' + (type.charAt(0).toUpperCase() + type.slice(1));
  document.getElementById('log-food').value = '';
  document.getElementById('log-desc').value = '';
  document.getElementById('photo-label').textContent = 'Tap to add a photo';
  document.getElementById('photo-preview').style.display = 'none';
  document.getElementById('log-modal').classList.add('open');
  setTimeout(() => document.getElementById('log-food').focus(), 300);
}

function closeLog() {
  document.getElementById('log-modal').classList.remove('open');
}

function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    state.photoData = e.target.result;
    document.getElementById('photo-preview').src = e.target.result;
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('photo-label').textContent = '✓ Photo added';
  };
  reader.readAsDataURL(file);
}

async function saveLog() {
  const food = document.getElementById('log-food').value.trim();
  if (!food) { document.getElementById('log-food').focus(); return; }

  const btn = document.getElementById('save-btn');
  btn.textContent = 'Analysing…';
  btn.disabled = true;

  const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const type = state.currentMealType;

  // Estimate nutrition via Claude
  const prompt = `User logged a meal: "${food}". Description: "${document.getElementById('log-desc').value}".
Respond ONLY with a JSON object (no markdown, no explanation):
{"calories": number, "protein": number, "carbs": number, "fat": number, "notes": "one short observation"}
Estimate realistically. Protein and macros in grams.`;

  let nutrition = { calories: 400, protein: 20, carbs: 40, fat: 15, notes: '' };
  try {
    const raw = await callClaude(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    nutrition = JSON.parse(cleaned);
  } catch {}

  const key = type.startsWith('snack') ? 'snack_' + Date.now() : type;
  if (!state.meals[today()]) state.meals[today()] = {};
  state.meals[today()][key] = { name: food, time, ...nutrition };
  save();

  btn.innerHTML = '<i class="ti ti-check"></i> Save & analyse';
  btn.disabled = false;
  closeLog();
  renderLog();
  renderToday();

  // Show coach tab with analysis
  if (nutrition.notes) {
    addCoachMsg(`Got it! Logged your ${type}: **${food}** — about ${nutrition.calories} kcal, ${nutrition.protein}g protein. ${nutrition.notes}`);
    document.querySelector('[data-page="coach"]').click();
  }
}

// ── COACH CHAT ─────────────────────────────────────────────────────────────
const chatHistory = [];

document.getElementById('send-btn').addEventListener('click', sendMsg);
document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
});

async function sendMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await chat(text);
}

async function quickAsk(q) {
  await chat(q);
}

async function chat(userMsg) {
  addUserMsg(userMsg);
  chatHistory.push({ role: 'user', content: userMsg });

  const btn = document.getElementById('send-btn');
  btn.disabled = true;
  showTyping();

  const meals = todayMeals();
  const mealSummary = Object.entries(meals).map(([k, v]) => `${k}: ${v.name} (${v.calories}kcal)`).join(', ') || 'nothing logged yet';

  const systemPrompt = `You are Coach Chicco, a friendly casual diet coach. You speak like a knowledgeable friend — warm, direct, occasionally funny, never preachy.
User goals: lose weight, avoid afternoon energy crashes.
Today's logged meals: ${mealSummary}. Water: ${state.water}L. Steps: ${state.steps}.
Keep replies concise (3-5 sentences max). If asked "can I have X", give a direct yes/no then a quick reason and any tweak that makes it better. Use max 1 emoji per reply.`;

  try {
    const messages = [{ role: 'user', content: systemPrompt + '\n\nUser: ' + userMsg }];
    const reply = await callClaude(systemPrompt + '\n\n' + chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Chicco'}: ${m.content}`).join('\n') + '\nChicco:');
    removeTyping();
    addCoachMsg(reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (e) {
    removeTyping();
    addCoachMsg("I'm having a moment — try again in a sec! 😅");
  }
  btn.disabled = false;
}

function addUserMsg(text) {
  const msgs = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div><div class="msg-time">${timeStr()}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addCoachMsg(text) {
  const msgs = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = 'msg coach';
  div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div><div class="msg-time">${timeStr()}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = 'msg coach'; div.id = 'typing-bubble';
  div.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  document.getElementById('typing-bubble')?.remove();
}

// ── IDEAS ──────────────────────────────────────────────────────────────────
function askAboutMeal(name) {
  document.querySelector('[data-page="coach"]').click();
  setTimeout(() => chat(`Tell me more about ${name} — is it a good choice for my goals?`), 100);
}

document.getElementById('weekly-plan-btn').addEventListener('click', () => {
  document.querySelector('[data-page="coach"]').click();
  setTimeout(() => chat('Can you build me a full weekly meal plan optimized for weight loss and sustained energy? Keep it realistic and easy to make.'), 100);
});

document.getElementById('refresh-ideas').addEventListener('click', async () => {
  const btn = document.getElementById('refresh-ideas');
  btn.textContent = 'Loading…';
  // In a full build, this would fetch AI-generated meal suggestions
  setTimeout(() => { btn.innerHTML = '<i class="ti ti-refresh"></i> Refresh'; }, 1000);
});

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────
const SCHEDULE = [
  { time: '8:00 AM',  label: 'Morning check-in',       dot: 'green' },
  { time: '12:30 PM', label: 'Lunch reminder',          dot: 'green' },
  { time: '2:00 PM',  label: 'Afternoon energy tip',    dot: 'amber' },
  { time: '4:00 PM',  label: 'Step check-in',           dot: 'blue' },
  { time: '7:00 PM',  label: 'Evening walk nudge',      dot: 'blue' },
  { time: '7:30 PM',  label: 'Dinner log reminder',     dot: 'green' },
];

const SAMPLE_NOTIFS = [
  { dot: 'green', title: "Time to log breakfast 🌅", body: "Starting the day with a logged meal keeps you on track. What did you have?", ts: "8:00 AM" },
  { dot: 'amber', title: "Heads up — 2pm coming! ⚡", body: "Have a protein snack before 1pm to avoid the afternoon dip. A handful of nuts works great.", ts: "12:30 PM" },
  { dot: 'blue',  title: "Step check-in 🚶", body: "You're doing great — a short evening walk could close your goal.", ts: "4:00 PM" },
];

function renderNotifs() {
  const sl = document.getElementById('schedule-list');
  sl.innerHTML = SCHEDULE.map(s => `
    <div class="schedule-row">
      <span>${s.label}</span>
      <span class="schedule-time">${s.time}</span>
    </div>`).join('');

  const nl = document.getElementById('notif-history');
  nl.innerHTML = SAMPLE_NOTIFS.map(n => `
    <div class="notif-item">
      <div class="notif-dot ${n.dot}"></div>
      <div>
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        <div class="notif-ts">${n.ts}</div>
      </div>
    </div>`).join('');

  setupNotifPermission();
}

function setupNotifPermission() {
  const btn = document.getElementById('enable-notif-btn');
  const status = document.getElementById('notif-status');

  if (!('Notification' in window)) {
    status.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Push notifications require adding this app to your home screen first.</p>';
    return;
  }

  if (Notification.permission === 'granted') {
    status.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--green);font-size:13px;font-weight:500;"><i class="ti ti-circle-check" style="font-size:20px"></i> Notifications are enabled</div>`;
    scheduleNotifications();
    return;
  }

  btn.addEventListener('click', async () => {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      scheduleNotifications();
      renderNotifs();
    }
  });
}

function scheduleNotifications() {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    // Service worker handles actual scheduling — see sw.js
  }
}

function sendTestNotification() {
  if (Notification.permission === 'granted') {
    new Notification('Coach Chicco 🥗', {
      body: "Hey! Don't forget to log your lunch today.",
      icon: '/icons/icon-192.png',
    });
  }
}

// ── CLAUDE API ─────────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'sk-ant-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',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error('API error');
  const data = await response.json();
  return data.content[0].text.trim();
}

// ── UTILS ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeStr() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── SERVICE WORKER ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── INIT ───────────────────────────────────────────────────────────────────
renderToday();
renderLog();
