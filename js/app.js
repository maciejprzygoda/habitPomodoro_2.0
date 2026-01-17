import { initState } from './state.js';
import { getRoute, setActiveTab } from './router.js';
import { renderHabits, bindHabits } from './views/habits.js';
import { renderPomodoro, bindPomodoro } from './views/pomodoro.js';
import { renderStats, bindStats } from './views/stats.js';
import { ensureNotificationPermission, scheduleHabitReminders } from './notifications.js';

const appEl = document.getElementById('app');
const offlineBanner = document.getElementById('offlineBanner');
const netStatus = document.getElementById('netStatus');
const btnEnableNotifications = document.getElementById('btnEnableNotifications');
const btnInstall = document.getElementById('btnInstall');

let deferredPrompt = null;

function updateNetworkUI(){
  const online = navigator.onLine;
  if(netStatus) netStatus.textContent = online ? 'Online' : 'Offline';
  if(offlineBanner) offlineBanner.hidden = online;
}

function navigate(route){
 
  const target = `#${route}`;
  if(location.hash === target){
    render();
    return;
  }
  location.hash = target;
}


function render(){
  const route = getRoute();
  setActiveTab();

  let html = '';
  if(route.startsWith('/pomodoro')) html = renderPomodoro();
  else if(route.startsWith('/stats')) html = renderStats();
  else html = renderHabits();

  appEl.innerHTML = html;

  // bind per-view
  if(route.startsWith('/pomodoro')) bindPomodoro(appEl, navigate);
  else if(route.startsWith('/stats')) bindStats(appEl, navigate);
  else bindHabits(appEl, navigate);
}

async function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  try{
    await navigator.serviceWorker.register('./sw.js');
  }catch(_){
    // offline still works in browser cache
  }
}

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
  btnEnableNotifications?.addEventListener('click', async ()=>{
    const res = await ensureNotificationPermission();
    if(!res.ok){
      alert(res.reason);
      return;
    }
    scheduleHabitReminders((await import('./state.js')).state.habits);
    alert('Powiadomienia włączone (działają, gdy aplikacja jest otwarta).');
  });
}

// Boot
(async function main(){
  await initState();
  scheduleHabitReminders((await import('./state.js')).state.habits);

  updateNetworkUI();
  window.addEventListener('online', updateNetworkUI);
  window.addEventListener('offline', updateNetworkUI);

  window.addEventListener('hashchange', render);
  if(!location.hash) location.hash = '#/habits';
  render();

  setupInstallPrompt();
  await registerSW();
  await setupNotifications();
})();
