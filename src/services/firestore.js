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
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";
import {
  CATEGORY_KEYS,
  categoriesToItems,
  isCustomCategory,
  normalizeCategories
} from "../utils/menu";

/*
 * Algunos documentos antiguos guardaron los campos
 * generales dentro de "items" como si fuera un mapa, y
 * las categorías como campos sueltos. Se reconstruyen
 * sin borrar nada: los campos generales vuelven al
 * documento y las opciones vuelven a items[].
 */
export function normalizeStoredMenu(data) {
  const source = data || {};
  const rawItems = source.items;

  const nested =
    rawItems &&
    !Array.isArray(rawItems) &&
    typeof rawItems === "object"
      ? rawItems
      : {};

  const base = { ...nested, ...source };

  const legacyCategories = CATEGORY_KEYS.reduce(
    (result, key) => {
      result[key] = source[key];
      return result;
    },
    {}
  );

  const items = Array.isArray(rawItems) ? rawItems : [];

  let categories = normalizeCategories(
    base.categories,
    items
  );

  CATEGORY_KEYS.forEach((key) => {
    if (
      !categories[key].length &&
      Array.isArray(legacyCategories[key])
    ) {
      categories[key] = normalizeCategories({
        [key]: legacyCategories[key]
      })[key];
    }
  });

  const finalItems = items.length
    ? items
    : categoriesToItems(categories);

  const result = { ...base };

  CATEGORY_KEYS.forEach((key) => {
    delete result[key];
  });

  return {
    ...result,
    items: finalItems,
    categories
  };
}

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

  function optionCount(menu) {
    const categories = menu?.categories || {};

    return (
      (Array.isArray(menu?.items) ? menu.items.length : 0) +
      Object.values(categories).reduce(
        (total, list) =>
          total + (Array.isArray(list) ? list.length : 0),
        0
      )
    );
  }

  snapshot.forEach((menuDoc) => {
    const normalized = normalizeStoredMenu(
      menuDoc.data()
    );

    if (!normalized.date) return;

    const candidate = {
      id: menuDoc.id,
      ...normalized
    };

    /*
     * Si existen documentos duplicados para una misma
     * fecha, se conserva el que tiene contenido real.
     */
    const current = menus[normalized.date];

    if (
      !current ||
      optionCount(candidate) > optionCount(current)
    ) {
      menus[normalized.date] = candidate;
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

  const data = normalizeStoredMenu(
    snapshot.data()
  );

  if (data.ownerId !== ownerId) {
    throw new Error(
      "No tienes permiso para ver este menú."
    );
  }

  return {
    id: snapshot.id,
    ...data
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

  /*
   * Un id de otro emprendedor nunca debe poder
   * sobrescribirse. Si el documento tenía la estructura
   * antigua, se recuperan sus datos antes de reescribirlo.
   */
  let recovered = null;

  if (menuData.id) {
    const existing = await getDoc(menuRef);

    if (existing.exists()) {
      recovered = normalizeStoredMenu(existing.data());

      if (recovered.ownerId !== ownerId) {
        throw new Error(
          "No tienes permiso para modificar este menú."
        );
      }
    }
  }

  /*
   * "items" es la fuente de verdad. Las opciones de
   * Arroces/Ensaladas/Proteínas se guardan dentro de
   * items con su category, y "categories" queda como
   * copia legible para compatibilidad con la UI.
   */
  const items =
    Array.isArray(menuData.items) &&
    menuData.items.length
      ? menuData.items
      : Array.isArray(recovered?.items)
      ? recovered.items
      : [];

  const categories = normalizeCategories(
    menuData.categories,
    items
  );

  const value = (key, fallback) =>
    menuData[key] || recovered?.[key] || fallback;

  const legacyItems = items.filter(
    (item) => !isCustomCategory(item)
  );

  const customItems = categoriesToItems(categories);

  /*
   * El PDF nunca se guarda dentro de Firestore,
   * solamente su URL y sus datos.
   */
  const data = {
    ownerId,
    date: menuData.date,
    title: value("title", "Menú del día"),
    subtitle: value("subtitle", ""),
    availableUntil: value(
      "availableUntil",
      "15:00"
    ),
    pdfUrl: value("pdfUrl", ""),
    pdfName: value("pdfName", ""),
    pdfSource: value("pdfSource", ""),
    pdfPublicId: value("pdfPublicId", ""),
    items: [...legacyItems, ...customItems],
    categories,
    images:
      Array.isArray(menuData.images) &&
      menuData.images.length
        ? menuData.images
        : Array.isArray(recovered?.images)
        ? recovered.images
        : [],
    ...(recovered?.createdAt
      ? { createdAt: recovered.createdAt }
      : {}),
    updatedAt: serverTimestamp()
  };

  /*
   * Se reescribe el documento completo (sin merge) para
   * eliminar campos sueltos de la estructura antigua.
   * Todos los datos conocidos se copian antes.
   */
  await setDoc(menuRef, data);

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

/*
 * Acciones puntuales sobre el menú guardado. Se usa
 * updateDoc en vez de saveMenu para no sobrescribir
 * cambios pendientes en el editor.
 */
/*
 * No se hace getDoc previo: las reglas de Firestore
 * validan ownerId en la escritura. Se incluye ownerId
 * en el update para que un dueño no pueda altering
 * el menú de otro aunque las reglas fueran permisivas.
 */
function menuRefFor(ownerId, menuId) {
  if (!ownerId || !menuId) {
    throw new Error(
      "Se necesita ownerId y menuId."
    );
  }

  return doc(db, "dailyMenus", menuId);
}

export async function clearMenuPdf(ownerId, menuId) {
  const menuRef = menuRefFor(ownerId, menuId);

  await updateDoc(menuRef, {
    ownerId,
    pdfUrl: "",
    pdfName: "",
    pdfSource: "",
    pdfPublicId: "",
    updatedAt: serverTimestamp()
  });

  return true;
}

export async function addMenuImage(
  ownerId,
  menuId,
  image
) {
  const menuRef = menuRefFor(ownerId, menuId);

  await updateDoc(menuRef, {
    ownerId,
    images: arrayUnion(image),
    updatedAt: serverTimestamp()
  });

  return image;
}

export async function removeMenuImage(
  ownerId,
  menuId,
  image
) {
  const menuRef = menuRefFor(ownerId, menuId);

  await updateDoc(menuRef, {
    ownerId,
    images: arrayRemove(image),
    updatedAt: serverTimestamp()
  });

  return image;
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