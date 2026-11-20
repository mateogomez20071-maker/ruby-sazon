import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

/* =========================
   MENÚS
========================= */

export async function getMenus(ownerId) {
  if (!ownerId) {
    throw new Error("No se recibió el ownerId.");
  }

  const menusRef = collection(db, "dailyMenus");

  const q = query(
    menusRef,
    where("ownerId", "==", ownerId)
  );

  const snapshot = await getDocs(q);

  const menus = {};

  snapshot.forEach((menuDoc) => {
    const data = menuDoc.data();

    if (data.date) {
      menus[data.date] = {
        id: menuDoc.id,
        ...data
      };
    }
  });

  return menus;
}

export async function getMenu(ownerId, date) {
  if (!ownerId || !date) {
    throw new Error("Se necesita ownerId y fecha.");
  }

  const menuId = `${ownerId}_${date}`;

  const menuRef = doc(
    db,
    "dailyMenus",
    menuId
  );

  const snapshot = await getDoc(menuRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function saveMenu(ownerId, menuData) {
  if (!ownerId) {
    throw new Error("No se recibió el ownerId.");
  }

  if (!menuData?.date) {
    throw new Error("El menú necesita una fecha.");
  }

  const menuId =
    menuData.id ||
    `${ownerId}_${menuData.date}`;

  const menuRef = doc(
    db,
    "dailyMenus",
    menuId
  );

  const data = {
    ownerId,
    date: menuData.date,
    title: menuData.title || "Menú del día",
    subtitle: menuData.subtitle || "",
    availableUntil:
      menuData.availableUntil || "15:00",
    items: menuData.items || [],
    updatedAt: serverTimestamp()
  };

  await setDoc(menuRef, data, {
    merge: true
  });

  return {
    id: menuId,
    ...data
  };
}

export async function deleteMenu(ownerId, menuId) {
  if (!ownerId || !menuId) {
    throw new Error(
      "Se necesita ownerId y menuId."
    );
  }

  const menuRef = doc(
    db,
    "dailyMenus",
    menuId
  );

  const snapshot = await getDoc(menuRef);

  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data();

  if (data.ownerId !== ownerId) {
    throw new Error(
      "No tienes permiso para eliminar este menú."
    );
  }

  await deleteDoc(menuRef);
}


/* =========================
   RESERVAS
========================= */

export async function getBookings(ownerId) {
  if (!ownerId) {
    throw new Error("No se recibió el ownerId.");
  }

  const bookingsRef = collection(
    db,
    "bookings"
  );

  const q = query(
    bookingsRef,
    where("ownerId", "==", ownerId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    ...bookingDoc.data()
  }));
}

export async function getBooking(
  ownerId,
  bookingId
) {
  if (!ownerId || !bookingId) {
    throw new Error(
      "Se necesita ownerId y bookingId."
    );
  }

  const bookingRef = doc(
    db,
    "bookings",
    bookingId
  );

  const snapshot = await getDoc(bookingRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  if (data.ownerId !== ownerId) {
    throw new Error(
      "No tienes permiso para ver esta reserva."
    );
  }

  return {
    id: snapshot.id,
    ...data
  };
}

export async function createBooking(
  ownerId,
  bookingData
) {
  if (!ownerId) {
    throw new Error("No se recibió el ownerId.");
  }

  if (!bookingData?.clientName) {
    throw new Error(
      "La reserva necesita el nombre del cliente."
    );
  }

  if (!bookingData?.date) {
    throw new Error(
      "La reserva necesita una fecha."
    );
  }

  if (!bookingData?.time) {
    throw new Error(
      "La reserva necesita una hora."
    );
  }

  const data = {
    ownerId,
    clientName: bookingData.clientName,
    clientPhone: bookingData.clientPhone || "",
    date: bookingData.date,
    time: bookingData.time,
    note: bookingData.note || "",
    status: bookingData.status || "pendiente",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const bookingRef = await addDoc(
    collection(db, "bookings"),
    data
  );

  return {
    id: bookingRef.id,
    ...data
  };
}

export async function updateBooking(
  ownerId,
  bookingId,
  changes
) {
  if (!ownerId || !bookingId) {
    throw new Error(
      "Se necesita ownerId y bookingId."
    );
  }

  const bookingRef = doc(
    db,
    "bookings",
    bookingId
  );

  const snapshot = await getDoc(bookingRef);

  if (!snapshot.exists()) {
    throw new Error(
      "La reserva no existe."
    );
  }

  const data = snapshot.data();

  if (data.ownerId !== ownerId) {
    throw new Error(
      "No tienes permiso para modificar esta reserva."
    );
  }

  await updateDoc(bookingRef, {
    ...changes,
    updatedAt: serverTimestamp()
  });

  return {
    id: bookingId,
    ...data,
    ...changes
  };
}

export async function deleteBooking(
  ownerId,
  bookingId
) {
  if (!ownerId || !bookingId) {
    throw new Error(
      "Se necesita ownerId y bookingId."
    );
  }

  const bookingRef = doc(
    db,
    "bookings",
    bookingId
  );

  const snapshot = await getDoc(bookingRef);

  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data();

  if (data.ownerId !== ownerId) {
    throw new Error(
      "No tienes permiso para eliminar esta reserva."
    );
  }

  await deleteDoc(bookingRef);
}