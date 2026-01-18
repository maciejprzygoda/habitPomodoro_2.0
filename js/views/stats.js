import { state, todayISO } from '../state.js';

function countInLastNDays(dates, n){
  // liczy ile dat z listy mieści się w ostatnich n dniach 
  const now = new Date();
  now.setHours(0,0,0,0);
  const start = new Date(now);
  start.setDate(now.getDate() - (n - 1));
  return dates.filter(ds => {
    const d = new Date(ds);
    d.setHours(0,0,0,0);
    return d >= start && d <= now;
  }).length;
}

function getQueryHabitId(){
  // wyciaga id nawyku z hasha 
  const m = (location.hash || '').match(/habit=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function renderStats(){
  // podstawowe kpi dla całej aplikacji
  const today = todayISO();
  const totalDone = state.habits.reduce((acc, h) => acc + (Array.isArray(h.doneDates) ? h.doneDates.length : 0), 0);
  const level = Math.floor(totalDone/10);
  const doneToday = state.habits.filter(h => Array.isArray(h.doneDates) && h.doneDates.includes(today)).length;

  // sprawdzam czy wybrano konkretny nawyk w url
  const selectedId = getQueryHabitId();
  const selected = selectedId ? state.habits.find(h => h.id === selectedId) : null;

  const kpi = `
    <div class="grid">
      <div class="kpi">
        <div class="kpi__v">${level}</div>
        <div class="kpi__l">Poziom (co 10 wykonań)</div>
      </div>
      <div class="kpi">
        <div class="kpi__v">${doneToday}/${state.habits.length || 0}</div>
        <div class="kpi__l">Wykonane dziś</div>
      </div>
      <div class="kpi">
        <div class="kpi__v">${totalDone}</div>
        <div class="kpi__l">Wykonania łącznie</div>
      </div>
    </div>
  `;

  let perHabit = '';
  if(selected){
    // statystyki dla wybranego nawyku
    const all = Array.isArray(selected.doneDates) ? selected.doneDates : [];
    const week = countInLastNDays(all, 7);
    const month = countInLastNDays(all, 30);
    perHabit = `
      <div style="margin-top:14px">
        <div class="h1">Statystyki nawyku: ${selected.name}</div>
        <div class="row" style="margin-top:10px">
          <div class="pill">Ostatni tydzień: ${week}/7</div>
          <div class="pill">Ostatni miesiąc: ${month}/30</div>
          <div class="pill">Ogółem: ${all.length}</div>
        </div>
        <div class="muted" style="margin-top:10px; font-size:12px">
          Wybierz inny nawyk poniżej lub wróć do listy.
        </div>
      </div>
    `;
  } else {
    // jak nie ma wybranego nawyku to pokazujemy podpowiedź
    perHabit = `
      <div class="muted" style="margin-top:12px">
        Wybierz nawyk z listy poniżej, żeby zobaczyć statystyki.
      </div>
    `;
  }

  // lista linków do statystyk konkretnych nawyków (id w hash)
  const list = state.habits.map(h => `<a class="tab" href="#/stats?habit=${encodeURIComponent(h.id)}">${h.name}</a>`).join('');

  return `
    <div>
      <div class="h1">Statystyki</div>

      <div style="margin-top:12px">${kpi}</div>
      ${perHabit}
      <div style="margin-top:14px">
        <div class="h1" style="font-size:16px">Wybierz nawyk</div>
        <div class="row" style="margin-top:10px">${list || '<span class="muted">Brak nawyków.</span>'}</div>
      </div>
    </div>
  `;
}

export function bindStats(){ /* brak */ }
