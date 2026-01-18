import { pad2 } from './state.js';

export function notificationsSupported(){
  // sprawdza czy przeglądarka ogarnia Notification API
  return 'Notification' in window;
}

export async function ensureNotificationPermission(){
  // tu prosimy o zgodę na powiadomienia (albo sprawdzamy czy już jest)
  if(!notificationsSupported()){
    return { ok:false, reason:'Brak wsparcia Notification API w tej przeglądarce.' };
  }
  if(Notification.permission === 'granted') return { ok:true };
  if(Notification.permission === 'denied'){
    return { ok:false, reason:'Powiadomienia są zablokowane w ustawieniach przeglądarki.' };
  }
  const p = await Notification.requestPermission();
  return p === 'granted' ? { ok:true } : { ok:false, reason:'Nie udzielono zgody na powiadomienia.' };
}

export function showNotification(title, body){
  //  pokazanie powiadomienia 
  if(Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png'
  });
}

let intervalId = null;

// klucz do localStorage, żeby nie wysyłać 10 razy tego samego w tej samej minucie
function firedKey(habitId, ymd){
  return `habit_reminder_fired_${habitId}_${ymd}`;
}

// dzisiejsza data w formacie yyyy-mm-dd
function todayYMD(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export function clearAllScheduled(){
  // zatrzymuje watcher jeśli był odpalony
  if(intervalId){
    clearInterval(intervalId);
    intervalId = null;
  }
}

// aktualny czas hh:mm (sekundy nas nie interesują)
function nowHHMM(){
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function scheduleHabitReminders(habits){
  // startuje sprawdzanie przypomnień dla listy nawyków
  clearAllScheduled();
  if(Notification.permission !== 'granted') return;

  // sprawdzanie czasu
  intervalId = setInterval(() => {
    const now = nowHHMM();
    const ymd = todayYMD();

    for(const h of habits){
      if(!h.reminderEnabled || !h.reminderTime) continue;

      // jak czas się zgadza i dziś jeszcze nie było powiadomienia dla tego nawyku
      if(h.reminderTime === now){
        const key = firedKey(h.id, ymd);
        if(localStorage.getItem(key) === '1') continue;

        showNotification('Przypomnienie o nawyku!', `Pora na: ${h.name}`);
        localStorage.setItem(key, '1');
      }
    }
  }, 20000);
}

export function formatTimeFromInput(inputValue){
  // input type=time zwraca hh:mm, tu tylko robimy ładny format
  if(!inputValue) return null;
  const [h,m] = inputValue.split(':');
  return `${pad2(h)}:${pad2(m)}`;
}
