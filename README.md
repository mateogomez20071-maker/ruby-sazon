# Sazón Oculta — React + Vite + Tailwind + Firebase

Frontend completo para una cocina oculta, catering y organización de eventos.

## Cambio principal: Menú del día

La carta ya no está pensada como un catálogo fijo.

El cliente tiene un botón **Menú del día** y allí puede consultar la carta que la emprendedora haya publicado para una fecha concreta.

La emprendedora tiene en su panel:

1. Menú del día.
2. Selección de fecha.
3. Edición del título del día.
4. Hora límite de pedidos.
5. Agregar productos.
6. Editar nombre, descripción, precio y categoría.
7. Mostrar/ocultar productos.
8. Eliminar productos.
9. Guardar el menú.

Los menús y las reservas se guardan en Cloud Firestore. El menú público se consulta con `VITE_OWNER_ID` y la fecha elegida.

## Stack

- React
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Cloudinary preparado para imágenes
- Netlify

## Ejecutar

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Firebase

Crear `.env.local` a partir de `.env.example`.

Variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

El archivo `src/services/firebase.js` deja preparado `Firebase Auth` y `Firestore`.

## Estructura recomendada en Firestore

### users

```text
users/{uid}
  name
  email
  role: "owner"
```

### dailyMenus

```text
dailyMenus/{menuId}
  ownerId
  date: "2026-11-20"
  title
  availableUntil
  items: [
    {
      id
      name
      description
      price
      category
      available
      imageUrl
    }
  ]
  updatedAt
```

### bookings

```text
bookings/{bookingId}
  ownerId
  clientName
  clientPhone
  date
  time
  note
  status
  createdAt
```

## Seguridad

El frontend nunca debe ser la única barrera de seguridad.

En Firestore deben crear reglas para que:

- un cliente pueda crear una reserva;
- la emprendedora solo pueda leer/modificar reservas donde `ownerId == request.auth.uid`;
- solo la emprendedora pueda crear/editar sus menús;
- los datos de un negocio no se mezclen con los de otro.

## Cloudinary

Cloudinary puede usarse para guardar las fotos de los platos. En frontend solo se necesita el `cloud name` y un `upload preset` unsigned.

**Nunca subir un API Secret a React, GitHub o `.env` público.**

## Netlify

Build command:

```text
npm run build
```

Publish directory:

```text
dist
```

Agregar las variables de `.env.example` en las variables de entorno de Netlify.

El archivo `public/_redirects` permite que las rutas de React funcionen al refrescar la página.

## Menú en PDF y categorías

La emprendedora puede, para cada fecha:

- Editar título, descripción y hora límite (como antes).
- Elegir la fecha con el campo “Fecha del menú”.
- Subir un PDF a Cloudinary o pegar un enlace externo.
- Reemplazar o quitar el PDF cuando lo necesite.
- Administrar opciones en **Arroces**, **Ensaladas** y **Proteínas**:
  agregar, editar, eliminar y activar/desactivar.

El cliente ve el botón **Ver menú completo** (si hay PDF) y la sección
**Arma tu menú** con buscador en tiempo real, selección por categoría,
resumen y envío por WhatsApp con la fecha y las opciones elegidas.
Los menús antiguos que usaban `items` siguen mostrándose como “Platos incluidos”.

### Nuevas variables de entorno

```text
VITE_OWNER_ID=UID_DE_LA_EMPRENDEDORA
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

El `upload preset` debe ser **unsigned** y con la opción **Overwrite** activada
para poder reemplazar PDFs con el mismo `public_id`. Nunca usar el API Secret
en el frontend.

La subida es directa desde el navegador: solo se envían `file`, `upload_preset`,
`folder` y (si aplica) `public_id`. No se envían parámetros firmados.

**Importante para planes Free de Cloudinary:** activar
*Settings → Security → Allow delivery of PDF and ZIP files*. Sin esa opción la
subida funciona y se guarda la URL, pero al abrir el PDF Cloudinary responde
401 “deny or ACL failure”.

`VITE_CLOUDINARY_IMAGE_UPLOAD_PRESET` es opcional: si se deja vacío se usa el
mismo preset de menús. Las imágenes se guardan en `sazon-oculta/images`.

### Acceso al panel

El botón **Panel** de la navegación siempre lleva a `/login` si no hay sesión
de Firebase Auth y a `/admin` si la hay. Las rutas `/admin`, `/admin/menu` y
`/admin/reservas` redirigen a `/login` cuando no existe sesión válida.

### Estructura ampliada de `dailyMenus/{menuId}`

```text
ownerId
date
title
subtitle
availableUntil
items              <- se conserva para menús antiguos
pdfUrl
pdfName
pdfSource          <- "cloudinary" | "external" | ""
pdfPublicId
categories:
  arroces:    [{ id, name, description, price, available }]
  ensaladas:  [{ id, name, description, price, available }]
  proteinas:  [{ id, name, description, price, available }]
updatedAt
```

El PDF se guarda en Cloudinary (carpetas `sazon-oculta/menus` y
`sazon-oculta/images`), nunca dentro de Firestore.

### Reglas de Firestore

`firestore.rules` permite lectura pública de `dailyMenus` (necesario para el
menú del cliente) y restringe escrituras a `ownerId == request.auth.uid`.
Se pueden aplicar con Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

### Imágenes

`src/services/cloudinary.js` incluye `uploadImage()` preparado para las
imágenes reales que se integrarán más adelante. No se ha agregado ninguna
imagen inventada.
