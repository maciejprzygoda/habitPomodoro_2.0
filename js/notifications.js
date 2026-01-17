import { pad2 } from './state.js';

export function notificationsSupported(){
  return 'Notification' in window;
}

export async function ensureNotificationPermission(){
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
  if(Notification.permission !== 'granted') return;
  // w PWA możesz też użyć ServiceWorkerRegistration.showNotification, ale tutaj trzymamy prostą wersję.
  new Notification(title, {
    body,
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png'
  });
}

// Uwaga: bez Web Push / backendu nie da się w pełni niezawodnie „zaplanować” powiadomień,
// gdy aplikacja jest zamknięta. Na zaliczenie często wystarczy pokazanie implementacji API + działanie gdy app jest otwarta.
const timeouts = new Map();

export function clearAllScheduled(){
  for(const t of timeouts.values()) clearTimeout(t);
  timeouts.clear();
}

function nextTriggerMs(timeHHMM){
  const [hh, mm] = String(timeHHMM).split(':').map(Number);
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  if(t <= now) t.setDate(t.getDate()+1);
  return t.getTime() - now.getTime();
}

export function scheduleHabitReminders(habits){
  clearAllScheduled();
  if(Notification.permission !== 'granted') return;

  for(const h of habits){
    if(!h.reminderEnabled || !h.reminderTime) continue;
    const delay = nextTriggerMs(h.reminderTime);
    const id = setTimeout(function fire(){
      showNotification('Przypomnienie o nawyku!', `Pora: ${h.name}`);
      // ponownie za 24h
      const next = setTimeout(fire, 24*60*60*1000);
      timeouts.set(h.id, next);
    }, delay);
    timeouts.set(h.id, id);
  }
}

export function formatTimeFromInput(inputValue){
  // input type=time zwraca HH:MM
  if(!inputValue) return null;
  const [h,m] = inputValue.split(':');
  return `${pad2(h)}:${pad2(m)}`;
}
