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

En esta versión el comportamiento se simula con `localStorage` para poder desarrollar el frontend sin depender todavía de Firebase.

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
