import { showNotification } from '../notifications.js';

const POMODORO_TIMES = [10, 15, 25, 45];
const BREAK_TIMES = [3, 5, 10];

let mode = 'work';
let workDuration = 25;
let breakDuration = 5;
let secondsLeft = workDuration * 60;
let isRunning = false;
let timerId = null;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setMode(next) {
  mode = next;
  secondsLeft = (mode === 'work' ? workDuration : breakDuration) * 60;
  stop(); // zapewnia, że interval jest wyczyszczony
}

function tick(navigate) {
  secondsLeft -= 1;

  if (secondsLeft <= 0) {
    stop();
    secondsLeft = 0;

    const title = mode === 'work' ? 'Brawo!' : 'Koniec przerwy';
    const body = mode === 'work' ? 'Czas na przerwę!' : 'Wracaj do pracy!';
    showNotification(title, body);

    // UX: przełącz tryb, ale nie startuj automatycznie
    setMode(mode === 'work' ? 'break' : 'work');

    // prze-renderuj widok raz
    navigate('/pomodoro');
    return;
  }
}

function start(navigate) {
  if (isRunning) return;
  isRunning = true;

  timerId = setInterval(() => {
    tick(navigate);

    // Aktualizacja UI bez konieczności pełnego re-renderu
    const el = document.querySelector('[data-pomo-timer]');
    if (el) el.textContent = formatTime(secondsLeft);
  }, 1000);
}

function stop() {
  isRunning = false;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function reset() {
  stop();
  secondsLeft = (mode === 'work' ? workDuration : breakDuration) * 60;
}

export function renderPomodoro() {
  const header = mode === 'work' ? '⏳ Czas pracy' : '☕ Przerwa';

  const btnsWork = POMODORO_TIMES.map((min) => `
    <button class="btn secondary" data-set="work" data-min="${min}" ${isRunning ? 'disabled' : ''}>${min} min</button>
  `).join('');

  const btnsBreak = BREAK_TIMES.map((min) => `
    <button class="btn secondary" data-set="break" data-min="${min}" ${isRunning ? 'disabled' : ''}>${min} min</button>
  `).join('');

  return `
    <div>
      <div class="h1">${header}</div>
      <div class="muted">Wybierz czasy przed startem, potem uruchom timer.</div>

      <div class="row" style="margin-top:12px">
        <span class="pill">Czas pracy</span>
        ${btnsWork}
      </div>

      <div class="row" style="margin-top:10px">
        <span class="pill">Przerwa</span>
        ${btnsBreak}
      </div>

      <div class="timer" data-pomo-timer>${formatTime(secondsLeft)}</div>

      <div class="row" style="justify-content:space-between">
        <button class="btn" data-action="toggle">${isRunning ? 'Pauza' : 'Start'}</button>
        <button class="btn secondary" data-action="reset">Reset</button>
        <button class="btn secondary" data-action="switch">${mode === 'work' ? 'Zacznij przerwę' : 'Zacznij Pomodoro'}</button>
      </div>

      <div class="muted" style="margin-top:12px; font-size:12px">
        Na koniec sesji pokażę powiadomienie (jeśli są włączone).
      </div>
    </div>
  `;
}

export function bindPomodoro(container, navigate) {
  // ✅ KLUCZOWA POPRAWKA:
  // Nie doklejaj kolejnego listenera, jeśli ten widok był już zbindowany.
  if (container.dataset.pomodoroBound === '1') return;
  container.dataset.pomodoroBound = '1';

  container.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;

    const set = b.dataset.set;
    if (set && !isRunning) {
      const min = Number(b.dataset.min);

      if (set === 'work') {
        workDuration = min;
        if (mode === 'work') reset();
      } else {
        breakDuration = min;
        if (mode === 'break') reset();
      }

      navigate('/pomodoro');
      return;
    }

    const action = b.dataset.action;

    if (action === 'toggle') {
      if (isRunning) stop();
      else start(navigate);

      navigate('/pomodoro');
      return;
    }

    if (action === 'reset') {
      reset();
      navigate('/pomodoro');
      return;
    }

    if (action === 'switch') {
      setMode(mode === 'work' ? 'break' : 'work');
      navigate('/pomodoro');
      return;
    }
  });
}
