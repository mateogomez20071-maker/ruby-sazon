import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaImage, FaTimes } from "react-icons/fa";

function imageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  return (
    image.url ||
    image.secureUrl ||
    image.secure_url ||
    image.src ||
    ""
  );
}

function imageName(image, index) {
  if (typeof image === "string") {
    return `Imagen ${index + 1}`;
  }

  return image.name || `Imagen ${index + 1}`;
}

export default function MenuGallery({ images }) {
  const [selected, setSelected] = useState(null);

  const list = Array.isArray(images)
    ? images
        .map((image) => ({
          url: imageUrl(image),
          name: imageName(image, images.indexOf(image))
        }))
        .filter((image) => image.url)
    : [];

  useEffect(() => {
    if (!selected) return;

    function handleKey(event) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [selected]);

  if (list.length === 0) {
    return null;
  }

  return (
    <section className="public-gallery">
      <div className="public-gallery-heading">
        <FaImage />
        <h3>Imágenes del menú</h3>
      </div>

      <div
        className={
          list.length === 1
            ? "gallery-grid single"
            : "gallery-grid"
        }
      >
        {list.map((image, index) => (
          <button
            type="button"
            className="gallery-item"
            key={`${image.url}-${index}`}
            onClick={() => setSelected(image)}
            aria-label={`Ampliar ${image.name}`}
          >
            <img src={image.url} alt={image.name} />
          </button>
        ))}
      </div>

      {selected &&
        createPortal(
          <div
            className="gallery-lightbox"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                setSelected(null);
              }
            }}
          >
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={() => setSelected(null)}
              aria-label="Cerrar imagen"
            >
              <FaTimes />
            </button>

            <img
              src={selected.url}
              alt={selected.name}
            />

            <span>{selected.name}</span>
          </div>,
          document.body
        )}
    </section>
  );
}
