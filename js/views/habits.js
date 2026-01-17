import { state, setHabits, todayISO } from '../state.js';
import { scheduleHabitReminders, formatTimeFromInput } from '../notifications.js';

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function habitRow(h){
  const today = todayISO();
  const doneToday = Array.isArray(h.doneDates) && h.doneDates.includes(today);
  const reminder = h.reminderEnabled && h.reminderTime ? `⏰ ${h.reminderTime}` : '—';
  const total = Array.isArray(h.doneDates) ? h.doneDates.length : 0;

  return `
    <div class="item" data-id="${h.id}">
      <div class="item__main">
        <button class="check ${doneToday ? 'done' : ''}" data-action="toggle" aria-label="Zmień status nawyku">
          ${doneToday ? '✓' : ''}
        </button>
        <div>
          <div class="item__title">${escapeHtml(h.name)}</div>
          <div class="item__meta">Przypomnienie: ${escapeHtml(reminder)} • Wykonano łącznie: ${total}</div>
        </div>
      </div>

      <div class="row">
        <button class="btn secondary" data-action="details">Statystyki</button>
        <button class="btn danger" data-action="delete">Usuń</button>
      </div>
    </div>
  `;
}

function computeKPIs(){
  const today = todayISO();
  const totalDone = state.habits.reduce((acc, h) => acc + (Array.isArray(h.doneDates) ? h.doneDates.length : 0), 0);
  const level = Math.floor(totalDone / 10);
  const doneToday = state.habits.filter(h => Array.isArray(h.doneDates) && h.doneDates.includes(today)).length;
  return { totalDone, level, doneToday };
}

export function renderHabits(){
  const { totalDone, level, doneToday } = computeKPIs();

  return `
    <div>
      <div class="row" style="justify-content:space-between; margin-bottom:10px">
        <div>
          <div class="h1">Moje cele</div>
          <div class="muted">Twój poziom: <strong>${level}</strong> (łącznie wykonań: ${totalDone})</div>
        </div>
        <div class="pill">Dziś: ${doneToday}/${state.habits.length || 0}</div>
      </div>

      <form id="habitForm" class="card" style="padding:12px; margin-bottom:12px">
        <div class="row">
          <input class="input" name="name" placeholder="Nazwa nawyku…" autocomplete="off" required />
        </div>

        <div class="row" style="margin-top:10px; justify-content:space-between">
          <label class="row" style="gap:10px">
            <input type="checkbox" name="reminderEnabled" />
            <span><strong>Przypomnienie</strong> (Notification API)</span>
          </label>
          <input class="input" style="max-width:160px" type="time" name="reminderTime" value="19:00" />
        </div>

        <div class="row" style="margin-top:10px">
          <button class="btn" type="submit">➕ Dodaj</button>
          <button class="btn secondary" type="button" id="btnClearToday">Odznacz wszystkie dziś</button>
        </div>

        <div class="muted" style="margin-top:8px; font-size:12px">
          Uwaga: bez Web Push powiadomienia „działają pewnie” tylko, gdy aplikacja jest otwarta (wymóg zaliczeniowy: pokazanie użycia API).
        </div>
      </form>

      <div class="list" id="habitsList">
        ${state.habits.length ? state.habits.map(habitRow).join('') : `<div class="muted">Brak nawyków. Dodaj coś!</div>`}
      </div>
    </div>
  `;
}

export function bindHabits(container, navigate){
  const form = container.querySelector('#habitForm');
  const list = container.querySelector('#habitsList');
  const btnClearToday = container.querySelector('#btnClearToday');

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    if(!name) return;

    const reminderEnabled = Boolean(fd.get('reminderEnabled'));
    const reminderTime = reminderEnabled ? formatTimeFromInput(String(fd.get('reminderTime')||'')) : null;

    const newHabit = {
      id: String(Date.now()),
      name,
      doneDates: [],
      reminderEnabled,
      reminderTime,
    };

    await setHabits([...state.habits, newHabit]);
    scheduleHabitReminders(state.habits);
    navigate('/habits');
  });

  btnClearToday?.addEventListener('click', async ()=>{
    const today = todayISO();
    const next = state.habits.map(h => ({
      ...h,
      doneDates: Array.isArray(h.doneDates) ? h.doneDates.filter(d => d !== today) : []
    }));
    await setHabits(next);
    navigate('/habits');
  });

  list?.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const item = btn.closest('.item');
    if(!item) return;
    const id = item.dataset.id;

    if(action === 'toggle'){
      const today = todayISO();
      const next = state.habits.map(h => {
        if(h.id !== id) return h;
        const doneDates = Array.isArray(h.doneDates) ? [...h.doneDates] : [];
        const idx = doneDates.indexOf(today);
        if(idx >= 0) doneDates.splice(idx,1); else doneDates.push(today);
        return { ...h, doneDates };
      });
      await setHabits(next);
      navigate('/habits');
      return;
    }

    if(action === 'delete'){
      const next = state.habits.filter(h => h.id !== id);
      await setHabits(next);
      scheduleHabitReminders(state.habits);
      navigate('/habits');
      return;
    }

    if(action === 'details'){
      navigate(`/stats?habit=${encodeURIComponent(id)}`);
    }
  });
}
