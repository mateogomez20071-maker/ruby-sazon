import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCheckCircle,
  FaEdit,
  FaFilePdf,
  FaImage,
  FaLink,
  FaPlus,
  FaSave,
  FaTimes,
  FaTimesCircle,
  FaTrash,
  FaUpload
} from "react-icons/fa";

import {
  canDeleteAssets,
  deleteAsset,
  isCloudinaryConfigured,
  uploadImage,
  uploadPdf
} from "../services/cloudinary";
import {
  CATEGORIES,
  emptyCategories,
  makeId,
  normalizeCategories
} from "../utils/menu";

function newOption() {
  return {
    name: "",
    description: "",
    price: "",
    available: true
  };
}

function formatSize(bytes) {
  const number = Number(bytes || 0);

  if (number < 1024) return `${number} B`;

  if (number < 1024 * 1024) {
    return `${(number / 1024).toFixed(0)} KB`;
  }

  return `${(number / 1024 / 1024).toFixed(1)} MB`;
}

function Modal({ title, children, onClose }) {
  /*
   * Portal al body: el modal queda fuera del <form> del
   * editor, así que Enter en un campo no guarda el menú.
   */
  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminMenuExtras({
  form,
  setForm,
  onClearPdf,
  onAddImage,
  onRemoveImage
}) {
  const [activeCategory, setActiveCategory] =
    useState("arroces");

  const [editingOption, setEditingOption] =
    useState(null);

  const [pdfFile, setPdfFile] = useState(null);

  const [externalUrl, setExternalUrl] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [pdfStatus, setPdfStatus] =
    useState(null);

  const [imageFile, setImageFile] =
    useState(null);

  const [imageStatus, setImageStatus] =
    useState(null);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [removingPdf, setRemovingPdf] =
    useState(false);

  const [pendingImage, setPendingImage] =
    useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  function resourceTypeFromUrl(url) {
    return String(url || "").includes("/raw/")
      ? "raw"
      : "image";
  }

  const cloudReady = isCloudinaryConfigured();
  const images = Array.isArray(form.images)
    ? form.images
    : [];
  const categories = normalizeCategories(
    form.categories,
    form.items
  );
  const options = categories[activeCategory];
  const activeMeta = CATEGORIES.find(
    (category) => category.key === activeCategory
  );

  function updateCategory(key, nextOptions) {
    setForm((previous) => ({
      ...previous,
      categories: {
        ...(normalizeCategories(previous.categories) ||
          emptyCategories()),
        [key]: nextOptions
      }
    }));
  }

  function addOption() {
    setEditingOption(newOption());
  }

  function editOption(index) {
    setEditingOption({
      ...options[index],
      index
    });
  }

  function deleteOption(index) {
    const confirmed = window.confirm(
      "¿Quieres eliminar esta opción?"
    );

    if (!confirmed) return;

    updateCategory(
      activeCategory,
      options.filter(
        (_, optionIndex) =>
          optionIndex !== index
      )
    );
  }

  function toggleOption(index) {
    updateCategory(
      activeCategory,
      options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              available:
                option.available === false
            }
          : option
      )
    );
  }

  function saveOption() {
    if (
      !editingOption.name ||
      !editingOption.name.trim()
    ) {
      alert("Escribe el nombre de la opción.");
      return;
    }

    const option = {
      id: editingOption.id || makeId(),
      name: editingOption.name.trim(),
      description: editingOption.description || "",
      price:
        editingOption.price === "" ||
        editingOption.price === null ||
        editingOption.price === undefined
          ? ""
          : Number(editingOption.price),
      available: editingOption.available !== false
    };

    const nextOptions = [...options];

    if (editingOption.index !== undefined) {
      nextOptions[editingOption.index] = option;
    } else {
      nextOptions.push(option);
    }

    updateCategory(activeCategory, nextOptions);
    setEditingOption(null);
  }

  async function handlePdfUpload() {
    if (!pdfFile) {
      setPdfStatus({
        type: "error",
        message: "Selecciona un archivo PDF."
      });
      return;
    }

    setUploading(true);
    setPdfStatus({
      type: "loading",
      message: "Subiendo menú..."
    });

    try {
      const result = await uploadPdf(pdfFile, {
        publicId: form.pdfPublicId || undefined
      });

      setForm((previous) => ({
        ...previous,
        pdfUrl: result.url,
        pdfName: result.name,
        pdfSource: "cloudinary",
        pdfPublicId: result.publicId
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setPdfFile(null);

      setPdfStatus({
        type: "success",
        message: "Menú subido correctamente.",
        detail: "Guarda el menú para publicarlo."
      });
    } catch (error) {
      setPdfStatus({
        type: "error",
        message:
          "No pudimos subir el menú. Inténtalo nuevamente.",
        detail: error?.message || ""
      });
    } finally {
      setUploading(false);
    }
  }

  function handleExternalLink() {
    const url = externalUrl.trim();

    if (!/^https?:\/\//i.test(url)) {
      setPdfStatus({
        type: "error",
        message:
          "Escribe un enlace válido que empiece por http:// o https://."
      });
      return;
    }

    let name = "Menú externo";

    try {
      const last = decodeURIComponent(
        new URL(url).pathname.split("/").pop() || ""
      );

      if (last) name = last;
    } catch {
      /* El nombre es opcional. */
    }

    setForm((previous) => ({
      ...previous,
      pdfUrl: url,
      pdfName: name,
      pdfSource: "external",
      pdfPublicId: ""
    }));

    setExternalUrl("");

    setPdfStatus({
      type: "success",
      message:
        "Enlace agregado. Guarda el menú para publicarlo."
    });
  }

  async function handleClearPdf() {
    const confirmed = window.confirm(
      "¿Quieres quitar este PDF del menú?"
    );

    if (!confirmed) return;

    setRemovingPdf(true);
    setPdfStatus(null);

    let detail = "";

    if (
      form.pdfSource === "cloudinary" &&
      form.pdfPublicId
    ) {
      if (canDeleteAssets()) {
        try {
          await deleteAsset(
            form.pdfPublicId,
            resourceTypeFromUrl(form.pdfUrl)
          );
        } catch (error) {
          detail =
            "El PDF se quitó del menú, pero no se pudo borrar de Cloudinary.";
        }
      } else {
        detail =
          "Para borrarlo también de Cloudinary configura VITE_CLOUDINARY_DELETE_URL.";
      }
    }

    try {
      if (onClearPdf) {
        await onClearPdf();
      }

      setForm((previous) => ({
        ...previous,
        pdfUrl: "",
        pdfName: "",
        pdfSource: "",
        pdfPublicId: ""
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setPdfFile(null);
      setExternalUrl("");

      setPdfStatus({
        type: "success",
        message: "PDF eliminado del menú.",
        detail
      });
    } catch (error) {
      setPdfStatus({
        type: "error",
        message:
          "No se pudo quitar el PDF. Inténtalo nuevamente.",
        detail: error?.message || ""
      });
    } finally {
      setRemovingPdf(false);
    }
  }

  async function handleImageUpload() {
    if (!imageFile) {
      setImageStatus({
        type: "error",
        message: "Selecciona una imagen."
      });
      return;
    }

    setUploadingImage(true);
    setImageStatus({
      type: "loading",
      message: "Subiendo imagen..."
    });

    try {
      const result = await uploadImage(imageFile);

      const image = {
        id: makeId(),
        url: result.url,
        publicId: result.publicId,
        name: result.name,
        type: "image"
      };

      if (onAddImage) {
        await onAddImage(image);
      } else {
        setForm((previous) => ({
          ...previous,
          images: [...(previous.images || []), image]
        }));
      }

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      setImageFile(null);

      setImageStatus({
        type: "success",
        message: "Imagen subida correctamente.",
        detail: result.url
      });
    } catch (error) {
      setImageStatus({
        type: "error",
        message:
          "No pudimos subir la imagen. Inténtalo nuevamente.",
        detail: error?.message || ""
      });
    } finally {
      setUploadingImage(false);
    }
  }

  async function confirmRemoveImage() {
    if (!pendingImage) return;

    const image = pendingImage;
    setPendingImage(null);

    let detail = "";

    if (image.publicId && canDeleteAssets()) {
      try {
        await deleteAsset(
          image.publicId,
          resourceTypeFromUrl(image.url)
        );
      } catch (error) {
        detail =
          "La imagen se quitó del menú, pero no se pudo borrar de Cloudinary.";
      }
    }

    try {
      if (onRemoveImage) {
        await onRemoveImage(image);
      }

      setImageStatus({
        type: "success",
        message: "Imagen eliminada.",
        detail
      });
    } catch (error) {
      setImageStatus({
        type: "error",
        message:
          "No se pudo eliminar la imagen.",
        detail: error?.message || ""
      });
    }
  }

  return (
    <>
      <div className="editor-card admin-extra-card">
        <div className="editor-card-heading">
          <div>
            <span>Archivo</span>
            <h2>Menú en PDF</h2>
          </div>
        </div>

        <p className="admin-extra-help">
          Sube el menú que ya preparaste o pega el
          enlace de un PDF externo. Firestore solo guarda
          los datos y la URL del archivo.
        </p>

        <p className="admin-extra-hint">
          Si el PDF no abre, activa “Allow delivery of PDF
          and ZIP files” en Cloudinary (Settings →
          Security).
        </p>

        {form.pdfUrl && (
          <div className="pdf-current">
            <FaFilePdf />

            <div className="pdf-current-info">
              <a
                href={form.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver PDF
              </a>

              <span>
                {form.pdfName || "Menú del día"}
              </span>
            </div>

            {form.pdfSource === "cloudinary" && (
              <span className="pdf-badge">
                Cloudinary
              </span>
            )}

            {form.pdfSource === "external" && (
              <span className="pdf-badge external">
                Enlace externo
              </span>
            )}

            <button
              type="button"
              className="danger-button"
              onClick={handleClearPdf}
              disabled={removingPdf}
            >
              {removingPdf
                ? "Quitando..."
                : "Quitar PDF"}
            </button>
          </div>
        )}

        <div className="upload-grid">
          <div className="upload-block">
            <label className="form-field">
              <span>Seleccionar PDF</span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  setPdfFile(
                    event.target.files?.[0] || null
                  );
                  setPdfStatus(null);
                }}
              />
            </label>

            <button
              type="button"
              className="secondary-button"
              onClick={handlePdfUpload}
              disabled={uploading || !cloudReady}
            >
              <FaUpload />
              {uploading
                ? "Subiendo menú..."
                : form.pdfSource === "cloudinary"
                ? "Reemplazar PDF"
                : "Subir PDF"}
            </button>
          </div>

          <div className="upload-block">
            <label className="form-field">
              <span>Seleccionar imagen</span>

              <input
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setImageFile(
                    event.target.files?.[0] || null
                  );
                  setImageStatus(null);
                }}
              />
            </label>

            <button
              type="button"
              className="secondary-button"
              onClick={handleImageUpload}
              disabled={
                uploadingImage || !cloudReady
              }
            >
              <FaImage />
              {uploadingImage
                ? "Subiendo imagen..."
                : "Subir imagen"}
            </button>
          </div>
        </div>

        {pdfFile && (
          <p className="selected-file">
            <FaFilePdf />
            <span>{pdfFile.name}</span>
            <small>{formatSize(pdfFile.size)}</small>
          </p>
        )}

        {imageFile && (
          <p className="selected-file">
            <FaImage />
            <span>{imageFile.name}</span>
            <small>{formatSize(imageFile.size)}</small>
          </p>
        )}

        {!cloudReady && (
          <p className="admin-extra-hint">
            Para subir archivos configura Cloudinary en
            el entorno. Mientras tanto puedes usar un
            enlace externo.
          </p>
        )}

        <div className="pdf-link-row">
          <label className="form-field">
            <span>Enlace a un PDF externo</span>

            <div className="input-wrapper">
              <FaLink />

              <input
                type="url"
                value={externalUrl}
                onChange={(event) =>
                  setExternalUrl(event.target.value)
                }
                placeholder="https://ejemplo.com/menu.pdf"
              />
            </div>
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={handleExternalLink}
          >
            Usar enlace
          </button>
        </div>

        {pdfStatus && (
          <div
            className={`pdf-status ${pdfStatus.type}`}
            role="status"
            aria-live="polite"
          >
            {pdfStatus.type === "loading" && (
              <span className="button-spinner"></span>
            )}

            {pdfStatus.type === "error" && (
              <FaTimesCircle />
            )}

            {pdfStatus.type === "success" && (
              <FaCheckCircle />
            )}

            <span>
              <strong>{pdfStatus.message}</strong>

              {pdfStatus.detail && (
                <small className="pdf-status-detail">
                  {pdfStatus.detail}
                </small>
              )}
            </span>
          </div>
        )}

        {imageStatus && (
          <div
            className={`pdf-status ${imageStatus.type}`}
            role="status"
            aria-live="polite"
          >
            {imageStatus.type === "loading" && (
              <span className="button-spinner"></span>
            )}

            {imageStatus.type === "error" && (
              <FaTimesCircle />
            )}

            {imageStatus.type === "success" && (
              <FaCheckCircle />
            )}

            <span>
              <strong>{imageStatus.message}</strong>

              {imageStatus.detail && (
                <small className="pdf-status-detail">
                  {imageStatus.detail}
                </small>
              )}
            </span>
          </div>
        )}

        {images.length > 0 && (
          <div className="menu-images-section">
            <span>Imágenes del menú</span>

            <div className="image-grid">
              {images.map((image) => (
                <div
                  className="image-card"
                  key={image.id}
                >
                  <div className="image-preview">
                    <img
                      src={image.url}
                      alt={image.name || "Imagen del menú"}
                    />
                  </div>

                  <p>{image.name}</p>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      setPendingImage(image)
                    }
                  >
                    <FaTrash />
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="editor-card admin-extra-card">
        <div className="editor-card-heading">
          <div>
            <span>Personalización</span>
            <h2>Opciones del menú</h2>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addOption}
          >
            <FaPlus />
            Agregar opción
          </button>
        </div>

        <p className="admin-extra-help">
          Estas opciones aparecerán en “Arma tu menú”
          para que el cliente elija una de cada
          categoría.
        </p>

        <div className="category-tabs">
          {CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.key}
              className={
                activeCategory === category.key
                  ? "category-tab active"
                  : "category-tab"
              }
              onClick={() =>
                setActiveCategory(category.key)
              }
            >
              <span>{category.emoji}</span>
              {category.label}
              <strong>
                {categories[category.key].length}
              </strong>
            </button>
          ))}
        </div>

        {options.length === 0 ? (
          <p className="category-empty">
            Todavía no hay opciones en{" "}
            {activeMeta?.label.toLowerCase()}.
            Agrega la primera con el botón “Agregar
            opción”.
          </p>
        ) : (
          <div className="category-options">
            {options.map((option, index) => (
              <div
                className="category-option"
                key={option.id || index}
              >
                <div className="category-option-info">
                  <strong>{option.name}</strong>

                  {option.description && (
                    <small>{option.description}</small>
                  )}

                  {Number(option.price) > 0 && (
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0
                      }).format(Number(option.price))}
                    </span>
                  )}
                </div>

                <span
                  className={
                    option.available === false
                      ? "available-badge off"
                      : "available-badge"
                  }
                >
                  {option.available === false
                    ? "No disponible"
                    : "Disponible"}
                </span>

                <div className="item-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title={
                      option.available === false
                        ? "Activar"
                        : "Desactivar"
                    }
                    onClick={() =>
                      toggleOption(index)
                    }
                  >
                    {option.available === false ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    title="Editar"
                    onClick={() =>
                      editOption(index)
                    }
                  >
                    <FaEdit />
                  </button>

                  <button
                    type="button"
                    className="icon-button danger"
                    title="Eliminar"
                    onClick={() =>
                      deleteOption(index)
                    }
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingOption && (
        <Modal
          title={
            editingOption.index !== undefined
              ? "Editar opción"
              : "Agregar opción"
          }
          onClose={() => setEditingOption(null)}
        >
          <div className="modal-form">
            <span className="option-modal-category">
              {activeMeta?.emoji} {activeMeta?.label}
            </span>

            <label className="form-field">
              <span>Nombre</span>

              <input
                type="text"
                value={editingOption.name}
                onChange={(event) =>
                  setEditingOption((previous) => ({
                    ...previous,
                    name: event.target.value
                  }))
                }
                placeholder="Ej. Arroz especial"
              />
            </label>

            <label className="form-field">
              <span>Descripción (opcional)</span>

              <textarea
                value={editingOption.description}
                onChange={(event) =>
                  setEditingOption((previous) => ({
                    ...previous,
                    description: event.target.value
                  }))
                }
                placeholder="Describe la opción..."
                rows="3"
              />
            </label>

            <label className="form-field">
              <span>Precio (opcional)</span>

              <input
                type="number"
                min="0"
                value={editingOption.price}
                onChange={(event) =>
                  setEditingOption((previous) => ({
                    ...previous,
                    price: event.target.value
                  }))
                }
                placeholder="18000"
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={
                  editingOption.available !== false
                }
                onChange={(event) =>
                  setEditingOption((previous) => ({
                    ...previous,
                    available: event.target.checked
                  }))
                }
              />

              <span>Opción disponible</span>
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setEditingOption(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveOption}
              >
                <FaSave />
                Guardar opción
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pendingImage && (
        <Modal
          title="Eliminar imagen"
          onClose={() => setPendingImage(null)}
        >
          <div className="modal-form">
            <p className="delete-confirm-text">
              ¿Seguro que quieres eliminar esta
              imagen?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setPendingImage(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={confirmRemoveImage}
              >
                <FaTrash />
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
