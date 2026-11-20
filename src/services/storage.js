import { defaultBookings, defaultMenus } from "./demoData";

const DATA_KEY = "sazon_oculta_v2";
const SESSION_KEY = "sazon_oculta_session";

export function loadStore() {
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) {
    const initial = { menus: defaultMenus, bookings: defaultBookings };
    localStorage.setItem(DATA_KEY, JSON.stringify(initial));
    return structuredClone(initial);
  }
  try {
    return JSON.parse(raw);
  } catch {
    const initial = { menus: defaultMenus, bookings: defaultBookings };
    localStorage.setItem(DATA_KEY, JSON.stringify(initial));
    return structuredClone(initial);
  }
}

export function saveStore(store) {
  localStorage.setItem(DATA_KEY, JSON.stringify(store));
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function loginDemo() {
  const session = {
    uid: "demo-admin",
    name: "Mariana Gómez",
    email: "emprendedora@demo.com",
    role: "owner"
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
