import { initState } from './state.js';
import { getRoute, setActiveTab } from './router.js';
import { renderHabits, bindHabits } from './views/habits.js';
import { renderPomodoro, bindPomodoro } from './views/pomodoro.js';
import { renderStats, bindStats } from './views/stats.js';
import { ensureNotificationPermission, scheduleHabitReminders } from './notifications.js';

// renderowanie elementow z html
const appEl = document.getElementById('app');
const offlineBanner = document.getElementById('offlineBanner');
const netStatus = document.getElementById('netStatus');
const btnEnableNotifications = document.getElementById('btnEnableNotifications');
const btnInstall = document.getElementById('btnInstall');

//  event do instalacji pwa 
let deferredPrompt = null;

function updateNetworkUI(){
  // weryfikacja czy jest internet, plus baner offline
  const online = navigator.onLine;
  if(netStatus) netStatus.textContent = online ? 'Online' : 'Offline';
  if(offlineBanner) offlineBanner.hidden = online;
}

function navigate(route){
  // zmiana "strony" w spa przez hash
  // jak klikniemy w to samo co już jest, to hashchange się nie odpala, więc robimy render ręcznie
  const target = `#${route}`;
  if(location.hash === target){
    render();
    return;
  }
  location.hash = target;
}

function render(){
  // wybór widoku na podstawie trasy z hasha
  const route = getRoute();
  setActiveTab();

  let html = '';
  if(route.startsWith('/pomodoro')) html = renderPomodoro();
  else if(route.startsWith('/stats')) html = renderStats();
  else html = renderHabits();

  // podmieniamy zawartość app
  appEl.innerHTML = html;

  // po renderze podpinamy eventy dla danego widoku
  if(route.startsWith('/pomodoro')) bindPomodoro(appEl, navigate);
  else if(route.startsWith('/stats')) bindStats(appEl, navigate);
  else bindHabits(appEl, navigate);
}

async function registerSW(){
  // rejestracja service workera żeby działał offline 
  if(!('serviceWorker' in navigator)) return;
  try{
    await navigator.serviceWorker.register('./sw.js');
  }catch(_){
    // jak się nie uda to i tak strona może działać online, po prostu bez offline
  }
}

// obsługa "zainstaluj aplikacje" (pwa)
function setupInstallPrompt(){
    window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.hidden = false;
  });

  btnInstall?.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btnInstall.hidden = true;
  });
}

async function setupNotifications(){
  // przycisk włączenia powiadomień 
  btnEnableNotifications?.addEventListener('click', async ()=>{
    const res = await ensureNotificationPermission();
    if(!res.ok){
      alert(res.reason);
      return;
    }
    // przypomnienia na podstawie  nawyków
    scheduleHabitReminders((await import('./state.js')).state.habits);
    alert('Powiadomienia włączone (działają, gdy aplikacja jest otwarta).');
  });
}

// uruchamianie aplikacji
(async function main(){
  // dane ze storage
  await initState();
  scheduleHabitReminders((await import('./state.js')).state.habits);

  // weryfikacja online/offline
  updateNetworkUI();
  window.addEventListener('online', updateNetworkUI);
  window.addEventListener('offline', updateNetworkUI);

  // routing 
  window.addEventListener('hashchange', render);
  if(!location.hash) location.hash = '#/habits';
  render();

  setupInstallPrompt();
  await registerSW();
  await setupNotifications();
})();
