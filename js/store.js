const DB_NAME = 'habit_pomodoro_db';
const DB_VER = 1;
const HABITS_STORE = 'habits';

function openDb(){
  return new Promise((resolve, reject)=>{
    if(!('indexedDB' in window)){
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(HABITS_STORE)){
        db.createObjectStore(HABITS_STORE);
      }
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}

async function idbGet(key){
  const db = await openDb();
  if(!db) return undefined;
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(HABITS_STORE, 'readonly');
    const store = tx.objectStore(HABITS_STORE);
    const req = store.get(key);
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}

async function idbSet(key, value){
  const db = await openDb();
  if(!db) return;
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(HABITS_STORE, 'readwrite');
    const store = tx.objectStore(HABITS_STORE);
    store.put(value, key);
    tx.oncomplete = ()=>resolve();
    tx.onerror = ()=>reject(tx.error);
  });
}

const LS_KEY = 'habits_v1';

export async function loadHabits(){
  try{
    const fromIdb = await idbGet('habits');
    if(Array.isArray(fromIdb)) return fromIdb;
  }catch(_){/* fallthrough */}

  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(_){
    return [];
  }
}


export async function saveHabits(habits){
  try{ await idbSet('habits', habits); }catch(_){/* ignore */}
  try{ localStorage.setItem(LS_KEY, JSON.stringify(habits)); }catch(_){/* ignore */}
}
