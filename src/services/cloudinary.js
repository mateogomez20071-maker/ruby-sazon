/* =========================================================
   CLOUDINARY — SUBIDA DIRECTA DESDE EL FRONTEND
   ---------------------------------------------------------
   Solo se usan datos públicos: cloud name y upload presets
   unsigned. El API Secret NUNCA aparece aquí ni en VITE_*.
   ========================================================= */

const CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const PDF_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

/*
 * Opcional: si más adelante se crea un preset distinto
 * para imágenes, se usa aquí. Si está vacío se reutiliza
 * el preset de menús.
 */
const IMAGE_PRESET =
  import.meta.env.VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET ||
  PDF_PRESET;

const FOLDERS = {
  pdf: "menus",
  image: "images"
};

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/*
 * Endpoint opcional propio (serverless / backend) que
 * ejecuta la eliminación en Cloudinary con el API Secret
 * del servidor. Nunca se llama a la Admin API desde el
 * navegador ni se expone el secreto en VITE_*.
 */
const DELETE_ENDPOINT =
  import.meta.env.VITE_CLOUDINARY_DELETE_URL || "";

export function isCloudinaryConfigured(
  preset = PDF_PRESET
) {
  return Boolean(CLOUD_NAME && preset);
}

export function canDeleteAssets() {
  return Boolean(DELETE_ENDPOINT);
}

export async function deleteAsset(
  publicId,
  resourceType = "image"
) {
  if (!DELETE_ENDPOINT || !publicId) {
    return false;
  }

  const response = await fetch(DELETE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, resourceType })
  });

  if (!response.ok) {
    throw new Error(
      "No se pudo eliminar el archivo de Cloudinary."
    );
  }

  return true;
}

/*
 * Cloudinary solo permite estos parámetros en una subida
 * unsigned. Nunca enviar signature, timestamp, overwrite,
 * access_mode ni ningún otro parámetro firmado.
 */
/*
 * El public_id devuelto por Cloudinary ya incluye la
 * carpeta. Si se vuelve a enviar junto con "folder",
 * Cloudinary duplicaría la ruta al reemplazar.
 */
function relativePublicId(publicId, folder) {
  if (!publicId) return "";

  const prefix = `${folder}/`;

  return publicId.startsWith(prefix)
    ? publicId.slice(prefix.length)
    : publicId;
}

async function send(
  file,
  { preset, resourceType, folder, publicId }
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", folder);

  const id = relativePublicId(publicId, folder);

  if (id) {
    formData.append("public_id", id);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Cloudinary no devolvió una respuesta válida."
    );
  }

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message ||
        "No se pudo completar la subida."
    );
  }

  return {
    url: data.secure_url,
    publicId: data.public_id || "",
    name:
      data.original_filename ||
      data.display_name ||
      file.name,
    resourceType: data.resource_type || resourceType,
    format: data.format || "",
    bytes: data.bytes || file.size || 0
  };
}

async function upload(file, options) {
  const {
    preset,
    resourceTypes,
    folder,
    maxBytes,
    validate,
    publicId
  } = options;

  if (!isCloudinaryConfigured(preset)) {
    throw new Error(
      "Cloudinary no está configurado. Revisa VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  const validationError = validate(file);

  if (validationError) {
    throw new Error(validationError);
  }

  if (file.size > maxBytes) {
    const limit = Math.round(maxBytes / 1024 / 1024);
    throw new Error(
      `El archivo supera el tamaño máximo de ${limit} MB.`
    );
  }

  let lastError;

  /*
   * "auto" funciona con presets de imagen y detecta los
   * PDF como recurso de imagen. "raw" es el respaldo para
   * presets configurados solo para archivos.
   */
  for (const resourceType of resourceTypes) {
    try {
      return await send(file, {
        preset,
        resourceType,
        folder,
        publicId
      });
    } catch (error) {
      lastError = error;

      const message = String(error?.message || "");

      /*
       * Si el preset no permite sobrescribir, se sube una
       * copia con un public_id nuevo para que el reemplazo
       * siempre funcione y se guarda ese id en Firestore.
       */
      if (/already exists|public id/i.test(message)) {
        const freshId = `${publicId || "menu"}-${Date.now()}`;

        for (const retryType of resourceTypes) {
          try {
            return await send(file, {
              preset,
              resourceType: retryType,
              folder,
              publicId: freshId
            });
          } catch (retryError) {
            lastError = retryError;
          }
        }
      }

      if (
        !/resource type|not allowed|invalid format/i.test(
          message
        )
      ) {
        throw error;
      }
    }
  }

  throw lastError || new Error("No se pudo subir el archivo.");
}

export function uploadPdf(file, { publicId } = {}) {
  return upload(file, {
    preset: PDF_PRESET,
    resourceTypes: ["auto", "raw"],
    folder: FOLDERS.pdf,
    publicId,
    maxBytes: MAX_PDF_BYTES,
    validate: (candidate) => {
      if (!candidate) {
        return "Selecciona un archivo PDF.";
      }

      const isPdf =
        candidate.type === "application/pdf" ||
        /\.pdf$/i.test(candidate.name || "");

      return isPdf
        ? null
        : "El archivo debe estar en formato PDF.";
    }
  });
}

/*
 * Preparado para las imágenes reales (logo, platos,
 * eventos, decoración). No se usa todavía en la interfaz.
 */
export function uploadImage(file, { publicId } = {}) {
  return upload(file, {
    preset: IMAGE_PRESET,
    resourceTypes: ["image"],
    folder: FOLDERS.image,
    publicId,
    maxBytes: MAX_IMAGE_BYTES,
    validate: (candidate) => {
      if (!candidate) {
        return "Selecciona una imagen.";
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      const extension = String(candidate.name || "")
        .split(".")
        .pop()
        ?.toLowerCase();

      const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp"
      ];

      const type = String(candidate.type || "");

      const valid =
        allowedExtensions.includes(extension) &&
        (!type || allowedTypes.includes(type));

      return valid
        ? null
        : "La imagen debe ser JPG, JPEG, PNG o WEBP.";
    }
  });
}
