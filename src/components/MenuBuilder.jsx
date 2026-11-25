import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaSearch,
  FaWhatsapp
} from "react-icons/fa";

import { APP_CONFIG } from "../services/config";
import {
  CATEGORIES,
  filterOptions,
  normalizeCategories
} from "../utils/menu";

function formatDate(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");

  return `${day}/${month}/${year}`;
}

function formatPrice(price) {
  const number = Number(price || 0);

  if (!number) return "";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(number);
}

function emptySelections() {
  return {
    arroces: [],
    ensaladas: [],
    proteinas: []
  };
}

function emptyQueries() {
  return {
    arroces: "",
    ensaladas: "",
    proteinas: ""
  };
}

export default function MenuBuilder({ menu }) {
  const categories = useMemo(
    () =>
      normalizeCategories(
        menu?.categories,
        menu?.items
      ),
    [menu]
  );

  const [queries, setQueries] = useState(
    emptyQueries
  );

  const [selections, setSelections] = useState(
    emptySelections
  );

  const [note, setNote] = useState("");

  const menuKey = menu?.id || menu?.date || "";

  useEffect(() => {
    setQueries(emptyQueries());
    setSelections(emptySelections());
    setNote("");
  }, [menuKey]);

  function handleQuery(categoryKey, value) {
    setQueries((previous) => ({
      ...previous,
      [categoryKey]: value
    }));
  }

  function toggleOption(categoryKey, option) {
    setSelections((previous) => {
      const current = Array.isArray(
        previous[categoryKey]
      )
        ? previous[categoryKey]
        : [];

      const alreadySelected = current.some(
        (item) => item.id === option.id
      );

      return {
        ...previous,
        [categoryKey]: alreadySelected
          ? current.filter(
              (item) => item.id !== option.id
            )
          : [...current, option]
      };
    });
  }

  const selectedGroups = CATEGORIES.map(
    (category) => ({
      ...category,
      options: Array.isArray(
        selections[category.key]
      )
        ? selections[category.key]
        : []
    })
  ).filter((group) => group.options.length > 0);

  const selectedCount = selectedGroups.reduce(
    (total, group) => total + group.options.length,
    0
  );

  const message = [
    "Hola, quiero hacer un pedido:",
    "",
    `📅 Fecha: ${formatDate(menu?.date)}`,
    "",
    ...selectedGroups.flatMap((group) => [
      `${group.emoji} ${group.label}:`,
      ...group.options.map(
        (option) => `   • ${option.name}`
      ),
      ""
    ]),
    ...(note.trim()
      ? [`📝 Nota: ${note.trim()}`]
      : [])
  ].join("\n");

  function openWhatsApp() {
    const url =
      `https://wa.me/${APP_CONFIG.whatsapp}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section className="menu-builder">
      <div className="builder-heading">
        <span>Personaliza tu pedido</span>
        <h2>Arma tu menú</h2>
        <p>
          Elige tus opciones de cada categoría y envíanos
          tu combinación por WhatsApp.
        </p>
      </div>

      <div className="builder-grid">
        {CATEGORIES.map((category) => {
          const options = categories[category.key];
          const filtered = filterOptions(
            options,
            queries[category.key]
          );

          const availableCount = options.filter(
            (option) => option.available !== false
          ).length;

          return (
            <article
              className="builder-category"
              key={category.key}
            >
              <div className="builder-category-header">
                <span className="builder-category-emoji">
                  {category.emoji}
                </span>

                <div>
                  <h3>{category.label}</h3>
                  <span>
                    {availableCount} opcion
                    {availableCount === 1
                      ? ""
                      : "es"}{" "}
                    disponibles
                  </span>
                </div>
              </div>

              <label className="builder-search">
                <FaSearch />

                <input
                  type="search"
                  value={queries[category.key]}
                  onChange={(event) =>
                    handleQuery(
                      category.key,
                      event.target.value
                    )
                  }
                  placeholder={category.placeholder}
                  aria-label={`Buscar en ${category.label.toLowerCase()}`}
                />
              </label>

              <div className="builder-options">
                {options.length === 0 ? (
                  <p className="builder-empty">
                    Todavía no hay opciones en esta
                    categoría.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="builder-empty">
                    No encontramos opciones con ese
                    nombre.
                  </p>
                ) : (
                  filtered.map((option) => {
                    const available =
                      option.available !== false;

                    const selected = (
                      selections[category.key] || []
                    ).some(
                      (item) => item.id === option.id
                    );

                    const price = formatPrice(
                      option.price
                    );

                    return (
                      <button
                        type="button"
                        className={
                          selected
                            ? "option-card selected"
                            : available
                            ? "option-card"
                            : "option-card unavailable"
                        }
                        key={option.id}
                        disabled={!available}
                        aria-pressed={selected}
                        onClick={() =>
                          toggleOption(
                            category.key,
                            option
                          )
                        }
                      >
                        <span
                          className={
                            selected
                              ? "option-radio selected"
                              : "option-radio"
                          }
                          aria-hidden="true"
                        />

                        <span className="option-info">
                          <strong>{option.name}</strong>

                          {option.description && (
                            <small>
                              {option.description}
                            </small>
                          )}

                          {price && (
                            <span className="option-price">
                              {price}
                            </span>
                          )}
                        </span>

                        {!available && (
                          <span className="option-unavailable">
                            No disponible
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <p className="builder-count">
                {filtered.length} de {options.length}{" "}
                opciones
              </p>
            </article>
          );
        })}
      </div>

      <section className="selection-summary">
        <div className="summary-heading">
          <div className="summary-icon">
            <FaCheckCircle />
          </div>

          <div>
            <span>Tu selección</span>
            <h3>Así queda tu menú</h3>
          </div>
        </div>

        {selectedCount === 0 ? (
          <p className="summary-empty">
            Todavía no elegiste ninguna opción.
          </p>
        ) : (
          <div className="summary-grid">
            {selectedGroups.map((group) => (
              <div
                className="summary-line"
                key={group.key}
              >
                <span>
                  {group.emoji} {group.label}
                </span>

                <div className="summary-options">
                  {group.options.map((option) => (
                    <div
                      className="summary-option"
                      key={option.id}
                    >
                      <strong>{option.name}</strong>

                      {formatPrice(option.price) && (
                        <small>
                          {formatPrice(option.price)}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <label className="summary-note">
          <span>Nota opcional</span>

          <textarea
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            placeholder="Ej. Sin cebolla"
            rows="2"
          />
        </label>

        <div className="summary-action">
          <button
            className="whatsapp-button"
            type="button"
            onClick={openWhatsApp}
            disabled={selectedCount === 0}
          >
            <FaWhatsapp />
            Pedir por WhatsApp
          </button>

          {selectedCount === 0 && (
            <span>
              Elige al menos una opción para pedir.
            </span>
          )}
        </div>
      </section>
    </section>
  );
}
