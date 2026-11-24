/* =========================================================
   UTILIDADES PARA EL MENÚ Y SUS CATEGORÍAS
   ========================================================= */

export const CATEGORY_KEYS = ["arroces", "ensaladas", "proteinas"];

export const CATEGORIES = [
  {
    key: "arroces",
    label: "Arroces",
    singular: "Arroz",
    emoji: "🍚",
    placeholder: "Buscar arroz..."
  },
  {
    key: "ensaladas",
    label: "Ensaladas",
    singular: "Ensalada",
    emoji: "🥗",
    placeholder: "Buscar ensalada..."
  },
  {
    key: "proteinas",
    label: "Proteínas",
    singular: "Proteína",
    emoji: "🍗",
    placeholder: "Buscar proteína..."
  }
];

export function emptyCategories() {
  return {
    arroces: [],
    ensaladas: [],
    proteinas: []
  };
}

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `opcion_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function normalizeOption(option) {
  if (!option) return null;

  return {
    id: option.id || makeId(),
    name: String(option.name || ""),
    description: String(option.description || ""),
    price:
      option.price === "" ||
      option.price === null ||
      option.price === undefined
        ? ""
        : Number(option.price),
    available: option.available !== false
  };
}

/* Los productos del editor clásico no son opciones configurables. */
export function isCustomCategory(item) {
  return CATEGORY_KEYS.includes(item?.category);
}

/* Las opciones viven en items con category: arroces | ensaladas | proteinas. */
export function itemsToCategories(items) {
  const source = Array.isArray(items) ? items : [];

  return CATEGORY_KEYS.reduce((result, key) => {
    result[key] = source
      .filter((item) => item?.category === key)
      .map(normalizeOption)
      .filter(Boolean);

    return result;
  }, {});
}

export function categoriesToItems(categories) {
  const source = normalizeCategories(categories);

  return CATEGORY_KEYS.flatMap((key) =>
    source[key].map((option) => ({
      id: option.id,
      name: option.name,
      description: option.description,
      price:
        option.price === "" || !Number(option.price)
          ? 0
          : Number(option.price),
      available: option.available,
      category: key
    }))
  );
}

/*
 * Fuente única: si "items" trae opciones con categoría,
 * se usan esas. Si no, se respeta el mapa "categories"
 * de documentos anteriores.
 */
export function normalizeCategories(categories, items) {
  const fromItems = itemsToCategories(items);
  const source = categories || {};

  return CATEGORY_KEYS.reduce((result, key) => {
    const list = fromItems[key].length
      ? fromItems[key]
      : Array.isArray(source[key])
      ? source[key].map(normalizeOption).filter(Boolean)
      : [];

    result[key] = list;
    return result;
  }, {});
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* Búsqueda en tiempo real por nombre y también por descripción. */
export function filterOptions(options, query) {
  const list = Array.isArray(options) ? options : [];
  const search = normalizeText(query);

  if (!search) return list;

  return list.filter((option) => {
    const name = normalizeText(option?.name);
    const description = normalizeText(option?.description);

    return (
      name.includes(search) ||
      description.includes(search)
    );
  });
}
