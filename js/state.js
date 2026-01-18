import { loadHabits, saveHabits } from './store.js';

export const state = {
  habits: [],
};

export async function initState(){
  state.habits = await loadHabits();

  state.habits = state.habits.map(h => ({
    id: h.id ?? String(Date.now()),
    name: String(h.name ?? ''),
    doneDates: Array.isArray(h.doneDates) ? h.doneDates : [],
    reminderEnabled: Boolean(h.reminderEnabled),
    reminderTime: h.reminderTime ?? null
  })).filter(h=>h.name.trim().length>0);
  await saveHabits(state.habits);
}

export async function setHabits(next){
  state.habits = next;
  await saveHabits(state.habits);
}

export function todayISO(){
  return new Date().toISOString().slice(0,10);
}

export function pad2(n){
  return String(n).padStart(2,'0');
}

