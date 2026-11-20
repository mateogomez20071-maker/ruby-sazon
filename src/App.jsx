import { useEffect, useMemo, useState } from "react";

import {
  FaCalendarAlt,
  FaUtensils,
  FaWhatsapp,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaEdit,
  FaPlus,
  FaArrowLeft,
  FaBars,
  FaTimes,
  FaClipboardList,
  FaSave,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaStickyNote
} from "react-icons/fa";

import {
  loginUser,
  registerUser,
  logoutUser,
  observeAuth,
  getUserData
} from "./services/auth";

import {
  getMenus,
  saveMenu,
  deleteMenu,
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking
} from "./services/firestore";

import "./App.css";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const APP_CONFIG = {
  businessName: "Sazón Oculta",
  whatsapp:
    import.meta.env.VITE_WHATSAPP_NUMBER || "573001234567"
};

/* =========================================================
   HELPERS
========================================================= */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");

  return `${day}/${month}/${year}`;
}

function formatPrice(price) {
  const number = Number(price || 0);

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(number);
}

function getStatusLabel(status) {
  switch (status) {
    case "confirmada":
      return "Confirmada";

    case "completada":
      return "Completada";

    case "cancelada":
      return "Cancelada";

    case "pendiente":
    case "pending":
    default:
      return "Pendiente";
  }
}

/* =========================================================
   APP PRINCIPAL
========================================================= */

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuth(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const data = await getUserData(firebaseUser.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error obteniendo datos del usuario:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(path);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function handleLogout() {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("No se pudo cerrar la sesión.");
    }
  }

  if (loadingAuth) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  /* =======================================================
     RUTAS PROTEGIDAS
  ======================================================= */

  const protectedRoutes = [
    "/admin",
    "/admin/menu",
    "/admin/reservas"
  ];

  if (protectedRoutes.includes(route) && !user) {
    return (
      <Login
        navigate={navigate}
        onLogin={() => navigate("/admin")}
      />
    );
  }

  /* =======================================================
     ROUTER
  ======================================================= */

  if (route === "/login") {
    return (
      <Login
        navigate={navigate}
        onLogin={() => navigate("/admin")}
      />
    );
  }

  if (route === "/menu") {
    return <DailyMenu navigate={navigate} />;
  }

  if (route === "/reservar") {
    return <Booking navigate={navigate} />;
  }

  if (route === "/admin/menu") {
    return (
      <AdminLayout
        navigate={navigate}
        user={user}
        userData={userData}
        onLogout={handleLogout}
        active="menu"
      >
        <MenuManager ownerId={user.uid} />
      </AdminLayout>
    );
  }

  if (route === "/admin/reservas") {
    return (
      <AdminLayout
        navigate={navigate}
        user={user}
        userData={userData}
        onLogout={handleLogout}
        active="reservas"
      >
        <ReservationManager ownerId={user.uid} />
      </AdminLayout>
    );
  }

  if (route === "/admin") {
    return (
      <AdminLayout
        navigate={navigate}
        user={user}
        userData={userData}
        onLogout={handleLogout}
        active="inicio"
      >
        <AdminHome
          ownerId={user.uid}
          userData={userData}
          navigate={navigate}
        />
      </AdminLayout>
    );
  }

  return <Home navigate={navigate} user={user} />;
}

/* =========================================================
   HEADER
========================================================= */

function Header({ navigate, user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function go(path) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <header className="main-header">
      <div className="header-inner">
        <button
          className="brand-button"
          onClick={() => go("/")}
        >
          <div className="brand-icon">
            <FaUtensils />
          </div>

          <div>
            <strong>{APP_CONFIG.businessName}</strong>
            <span>Catering & Eventos</span>
          </div>
        </button>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <nav className={menuOpen ? "main-nav open" : "main-nav"}>
          <button onClick={() => go("/")}>
            Inicio
          </button>

          <button onClick={() => go("/menu")}>
            <FaUtensils />
            Menú del día
          </button>

          <button onClick={() => go("/reservar")}>
            <FaCalendarAlt />
            Reservar
          </button>

          {user ? (
            <button
              className="nav-admin-button"
              onClick={() => go("/admin")}
            >
              <FaUser />
              Panel
            </button>
          ) : (
            <button
              className="nav-admin-button"
              onClick={() => go("/login")}
            >
              <FaUser />
              Emprendedora
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home({ navigate, user }) {
  return (
    <div className="page">
      <Header navigate={navigate} user={user} />

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-tag">
              Sabor hecho con cariño
            </span>

            <h1>
              Comida que convierte
              <br />
              momentos en recuerdos
            </h1>

            <p>
              Catering, comidas especiales y organización
              de eventos pensados para compartir y disfrutar.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => navigate("/reservar")}
              >
                <FaCalendarAlt />
                Reservar un evento
              </button>

              <button
                className="secondary-button"
                onClick={() => navigate("/menu")}
              >
                <FaUtensils />
                Ver menú del día
              </button>
            </div>
          </div>
        </section>

        <section className="home-info-section">
          <div className="section-heading">
            <span>Lo que hacemos</span>
            <h2>Una experiencia hecha para ti</h2>
            <p>
              Nos encargamos de la comida para que tú puedas
              disfrutar de cada momento.
            </p>
          </div>

          <div className="info-grid">
            <InfoCard
              icon={<FaUtensils />}
              title="Comida especial"
              text="Preparaciones hechas con ingredientes seleccionados y mucho sabor."
            />

            <InfoCard
              icon={<FaCalendarAlt />}
              title="Eventos"
              text="Organizamos la parte gastronómica de tus celebraciones."
            />

            <InfoCard
              icon={<FaClock />}
              title="Reservas fáciles"
              text="Selecciona el día y la hora que necesitas de manera sencilla."
            />
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span>¿Tienes un evento?</span>
            <h2>
              Nosotros nos encargamos de la comida.
            </h2>
            <p>
              Agenda tu fecha y cuéntanos qué necesitas.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/reservar")}
          >
            Reservar ahora
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <article className="info-card">
      <div className="info-card-icon">
        {icon}
      </div>

      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

/* =========================================================
   MENÚ DEL DÍA
========================================================= */

function DailyMenu({ navigate }) {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * Para mostrar el menú público necesitamos saber
   * qué emprendedora lo administra.
   *
   * Se puede configurar desde .env.local:
   *
   * VITE_OWNER_ID=UID_DE_LA_EMPRENDEDORA
   */

  const ownerId =
    import.meta.env.VITE_OWNER_ID || "";

  useEffect(() => {
    async function loadMenu() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        const today = getToday();

        const menus = await getMenus(ownerId);

        setMenu(menus[today] || null);
      } catch (error) {
        console.error(
          "Error cargando menú:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [ownerId]);

  return (
    <div className="page">
      <Header navigate={navigate} />

      <main className="content-page">
        <div className="page-title">
          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            <FaArrowLeft />
            Volver
          </button>

          <span>Disponible hoy</span>

          <h1>Menú del día</h1>

          <p>
            Descubre lo que tenemos preparado para hoy.
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : !ownerId ? (
          <EmptyState
            icon={<FaUtensils />}
            title="Menú no configurado"
            text="El administrador todavía no ha configurado el menú."
          />
        ) : !menu ? (
          <EmptyState
            icon={<FaUtensils />}
            title="Hoy no hay menú disponible"
            text="Puedes volver más tarde o reservar un evento."
            action={
              <button
                className="primary-button"
                onClick={() => navigate("/reservar")}
              >
                Reservar un evento
              </button>
            }
          />
        ) : (
          <section className="menu-public">
            <div className="menu-header-card">
              <div>
                <span>{formatDate(menu.date)}</span>
                <h2>
                  {menu.title || "Menú del día"}
                </h2>

                {menu.subtitle && (
                  <p>{menu.subtitle}</p>
                )}
              </div>

              <div className="menu-hours">
                <FaClock />
                Disponible hasta{" "}
                {menu.availableUntil || "15:00"}
              </div>
            </div>

            <div className="menu-items-grid">
              {(menu.items || []).map(
                (item, index) => (
                  <MenuItem
                    key={index}
                    item={item}
                  />
                )
              )}
            </div>

            <div className="menu-whatsapp">
              <div>
                <h3>¿Quieres pedir este menú?</h3>
                <p>
                  Escríbenos por WhatsApp para
                  realizar tu pedido.
                </p>
              </div>

              <WhatsAppButton
                text="Pedir por WhatsApp"
                message={`Hola, quiero pedir el menú del día de ${APP_CONFIG.businessName}.`}
              />
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function MenuItem({ item }) {
  return (
    <article
      className={
        item.available === false
          ? "menu-item unavailable"
          : "menu-item"
      }
    >
      <div className="menu-item-content">
        <div className="menu-item-top">
          <span className="menu-category">
            {item.category || "Plato"}
          </span>

          {item.available === false && (
            <span className="unavailable-label">
              No disponible
            </span>
          )}
        </div>

        <h3>{item.name}</h3>

        {item.description && (
          <p>{item.description}</p>
        )}

        <strong>
          {formatPrice(item.price)}
        </strong>
      </div>
    </article>
  );
}

/* =========================================================
   RESERVAS CLIENTE
========================================================= */

function Booking({ navigate }) {
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    date: getToday(),
    time: "",
    note: ""
  });

  const [loading, setLoading] = useState(false);

  const ownerId =
    import.meta.env.VITE_OWNER_ID || "";

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.clientName.trim()) {
      alert("Escribe tu nombre.");
      return;
    }

    if (!form.clientPhone.trim()) {
      alert("Escribe tu número de teléfono.");
      return;
    }

    if (!form.date) {
      alert("Selecciona una fecha.");
      return;
    }

    if (!form.time) {
      alert("Selecciona una hora.");
      return;
    }

    if (form.date < getToday()) {
      alert(
        "No puedes reservar una fecha anterior a hoy."
      );
      return;
    }

    if (!ownerId) {
      alert(
        "No se configuró el propietario de la página."
      );
      return;
    }

    setLoading(true);

    try {
      const booking = await createBooking(
        ownerId,
        {
          clientName:
            form.clientName.trim(),

          clientPhone:
            form.clientPhone.trim(),

          date: form.date,

          time: form.time,

          note:
            form.note.trim(),

          status: "pendiente"
        }
      );

      const message = [
        `Hola, quiero hacer una reserva en ${APP_CONFIG.businessName}.`,
        "",
        `Nombre: ${form.clientName}`,
        `Teléfono: ${form.clientPhone}`,
        `Fecha: ${formatDate(form.date)}`,
        `Hora: ${form.time}`,
        form.note
          ? `Nota: ${form.note}`
          : "",
        "",
        `Código de reserva: ${booking.id}`
      ]
        .filter(Boolean)
        .join("\n");

      const whatsappUrl =
        `https://wa.me/${APP_CONFIG.whatsapp}?text=${encodeURIComponent(
          message
        )}`;

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );

      alert(
        "Reserva creada correctamente. Ahora se abrirá WhatsApp."
      );

      setForm({
        clientName: "",
        clientPhone: "",
        date: getToday(),
        time: "",
        note: ""
      });
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "No se pudo crear la reserva."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <Header navigate={navigate} />

      <main className="content-page">
        <div className="page-title">
          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            <FaArrowLeft />
            Volver
          </button>

          <span>Agenda tu fecha</span>

          <h1>Reservar un evento</h1>

          <p>
            Cuéntanos cuándo necesitas nuestro servicio.
          </p>
        </div>

        <div className="booking-layout">
          <section className="booking-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Datos de contacto</h2>

                <div className="form-grid">
                  <FormField
                    label="Nombre completo"
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    icon={<FaUser />}
                    required
                  />

                  <FormField
                    label="Teléfono"
                    name="clientPhone"
                    value={form.clientPhone}
                    onChange={handleChange}
                    placeholder="Ej. 3001234567"
                    icon={<FaPhone />}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Fecha y hora</h2>

                <div className="form-grid">
                  <FormField
                    label="Fecha"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    min={getToday()}
                    icon={<FaCalendarAlt />}
                    required
                  />

                  <FormField
                    label="Hora"
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    icon={<FaClock />}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Información adicional</h2>

                <label className="form-field">
                  <span>Nota opcional</span>

                  <div className="input-wrapper textarea-wrapper">
                    <FaStickyNote />

                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      placeholder="Cuéntanos algún detalle importante..."
                      rows="5"
                    />
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="primary-button full-width"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Guardando reserva...
                  </>
                ) : (
                  <>
                    <FaWhatsapp />
                    Reservar por WhatsApp
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="booking-info">
            <div className="booking-info-icon">
              <FaCalendarAlt />
            </div>

            <h2>¿Cómo funciona?</h2>

            <div className="steps">
              <Step
                number="1"
                title="Elige tu fecha"
                text="Selecciona el día y la hora que necesitas."
              />

              <Step
                number="2"
                title="Déjanos tus datos"
                text="Escribe tu nombre, teléfono y cualquier detalle."
              />

              <Step
                number="3"
                title="Confirma por WhatsApp"
                text="Te enviaremos a WhatsApp para terminar de coordinar."
              />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="step">
      <div className="step-number">
        {number}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  required,
  min
}) {
  return (
    <label className="form-field">
      <span>{label}</span>

      <div className="input-wrapper">
        {icon}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
        />
      </div>
    </label>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ navigate, onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      alert("Escribe tu correo.");
      return;
    }

    if (!password) {
      alert("Escribe tu contraseña.");
      return;
    }

    if (
      mode === "register" &&
      !name.trim()
    ) {
      alert("Escribe tu nombre.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await loginUser(
          email.trim(),
          password
        );
      } else {
        await registerUser(
          name.trim(),
          email.trim(),
          password
        );
      }

      onLogin();
    } catch (error) {
      console.error(error);

      let message =
        "No se pudo completar la operación.";

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        message =
          "El correo o la contraseña son incorrectos.";
      }

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "Este correo ya está registrado.";
      }

      if (
        error.code ===
        "auth/weak-password"
      ) {
        message =
          "La contraseña debe tener al menos 6 caracteres.";
      }

      if (
        error.code ===
        "auth/invalid-email"
      ) {
        message =
          "El correo no es válido.";
      }

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button
          className="auth-back"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft />
          Volver
        </button>

        <div className="auth-logo">
          <FaUtensils />
        </div>

        <span className="auth-tag">
          {APP_CONFIG.businessName}
        </span>

        <h1>
          {mode === "login"
            ? "Bienvenida"
            : "Crear cuenta"}
        </h1>

        <p>
          {mode === "login"
            ? "Ingresa al panel de administración."
            : "Crea la cuenta de la emprendedora."}
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {mode === "register" && (
            <FormField
              label="Nombre"
              name="name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Nombre de la emprendedora"
              icon={<FaUser />}
              required
            />
          )}

          <FormField
            label="Correo electrónico"
            name="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="correo@ejemplo.com"
            icon={<FaEnvelope />}
            required
          />

          <FormField
            label="Contraseña"
            name="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Mínimo 6 caracteres"
            icon={<FaLock />}
            required
          />

          <button
            className="primary-button full-width"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Ingresar"
              : "Crear cuenta"}
          </button>
        </form>

        <button
          className="switch-auth"
          onClick={() =>
            setMode(
              mode === "login"
                ? "register"
                : "login"
            )
          }
        >
          {mode === "login"
            ? "¿Todavía no tienes cuenta? Crear cuenta"
            : "Ya tengo una cuenta. Ingresar"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout({
  children,
  navigate,
  user,
  userData,
  onLogout,
  active
}) {
  const [mobileMenu, setMobileMenu] =
    useState(false);

  function go(path) {
    setMobileMenu(false);
    navigate(path);
  }

  return (
    <div className="admin-page">
      <aside
        className={
          mobileMenu
            ? "admin-sidebar open"
            : "admin-sidebar"
        }
      >
        <div className="admin-brand">
          <div className="brand-icon">
            <FaUtensils />
          </div>

          <div>
            <strong>
              {APP_CONFIG.businessName}
            </strong>
            <span>Administración</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={
              active === "inicio"
                ? "active"
                : ""
            }
            onClick={() => go("/admin")}
          >
            <FaHome />
            Inicio
          </button>

          <button
            className={
              active === "menu"
                ? "active"
                : ""
            }
            onClick={() =>
              go("/admin/menu")
            }
          >
            <FaUtensils />
            Menú del día
          </button>

          <button
            className={
              active === "reservas"
                ? "active"
                : ""
            }
            onClick={() =>
              go("/admin/reservas")
            }
          >
            <FaClipboardList />
            Reservas
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <div className="admin-user-icon">
              <FaUser />
            </div>

            <div>
              <strong>
                {userData?.name ||
                  user?.email ||
                  "Emprendedora"}
              </strong>

              <span>
                {user?.email}
              </span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            className="mobile-admin-menu"
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
          >
            <FaBars />
          </button>

          <div>
            <span>Panel de administración</span>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN HOME
========================================================= */

function AdminHome({
  ownerId,
  userData,
  navigate
}) {
  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadBookings();
  }, [ownerId]);

  async function loadBookings() {
    try {
      setLoading(true);

      const data =
        await getBookings(ownerId);

      setBookings(
        [...data].sort(
          (a, b) =>
            `${a.date} ${a.time}`.localeCompare(
              `${b.date} ${b.time}`
            )
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const today = getToday();

  const pending = bookings.filter(
    (booking) =>
      booking.status === "pendiente" ||
      booking.status === "pending"
  );

  const upcoming = bookings.filter(
    (booking) =>
      booking.date >= today &&
      booking.status !== "completada" &&
      booking.status !== "cancelada"
  );

  const completed = bookings.filter(
    (booking) =>
      booking.status === "completada"
  );

  const todayBookings =
    bookings.filter(
      (booking) =>
        booking.date === today
    );

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span>Resumen</span>
          <h1>
            Hola,{" "}
            {userData?.name ||
              "Emprendedora"}
          </h1>
          <p>
            Aquí puedes controlar tus reservas y
            el menú del día.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/admin/menu")
          }
        >
          <FaUtensils />
          Administrar menú
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<FaCalendarAlt />}
          title="Próximas"
          value={upcoming.length}
        />

        <StatCard
          icon={<FaClock />}
          title="Pendientes"
          value={pending.length}
        />

        <StatCard
          icon={<FaCheckCircle />}
          title="Completadas"
          value={completed.length}
        />

        <StatCard
          icon={<FaCalendarAlt />}
          title="Hoy"
          value={todayBookings.length}
        />
      </div>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <span>Agenda</span>
            <h2>Próximas reservas</h2>
          </div>

          <button
            className="text-button"
            onClick={() =>
              navigate("/admin/reservas")
            }
          >
            Ver todas
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={<FaCalendarAlt />}
            title="No tienes reservas próximas"
            text="Cuando un cliente reserve aparecerá aquí."
          />
        ) : (
          <div className="reservation-preview-list">
            {upcoming
              .slice(0, 5)
              .map((booking) => (
                <ReservationRow
                  key={booking.id}
                  booking={booking}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN MENÚ
========================================================= */

function MenuManager({ ownerId }) {
  const [menus, setMenus] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState(getToday());

  const [editingItem, setEditingItem] =
    useState(null);

  const emptyMenu = {
    title: "Menú del día",
    subtitle: "",
    availableUntil: "15:00",
    items: []
  };

  const [form, setForm] =
    useState(emptyMenu);

  useEffect(() => {
    loadMenus();
  }, [ownerId]);

  async function loadMenus() {
    try {
      setLoading(true);

      const data =
        await getMenus(ownerId);

      setMenus(data);

      const todayMenu =
        data[getToday()];

      if (todayMenu) {
        setForm({
          title:
            todayMenu.title ||
            "Menú del día",

          subtitle:
            todayMenu.subtitle || "",

          availableUntil:
            todayMenu.availableUntil ||
            "15:00",

          items:
            todayMenu.items || []
        });
      }
    } catch (error) {
      console.error(error);

      alert(
        "No se pudieron cargar los menús."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectDate(date) {
    setSelectedDate(date);

    const menu = menus[date];

    if (menu) {
      setForm({
        title:
          menu.title ||
          "Menú del día",

        subtitle:
          menu.subtitle || "",

        availableUntil:
          menu.availableUntil ||
          "15:00",

        items:
          menu.items || []
      });
    } else {
      setForm(emptyMenu);
    }

    setEditingItem(null);
  }

  function handleFormChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function addItem() {
    setEditingItem({
      name: "",
      description: "",
      price: "",
      category: "Plato principal",
      available: true
    });
  }

  function editItem(index) {
    setEditingItem({
      ...form.items[index],
      index
    });
  }

  function deleteItem(index) {
    const confirmed =
      window.confirm(
        "¿Quieres eliminar este producto del menú?"
      );

    if (!confirmed) return;

    setForm((previous) => ({
      ...previous,
      items: previous.items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    }));
  }

  function saveItem() {
    if (
      !editingItem.name ||
      !editingItem.name.trim()
    ) {
      alert("Escribe el nombre del producto.");
      return;
    }

    const item = {
      name:
        editingItem.name.trim(),

      description:
        editingItem.description || "",

      price:
        Number(editingItem.price || 0),

      category:
        editingItem.category ||
        "Plato principal",

      available:
        editingItem.available !== false
    };

    setForm((previous) => {
      const items = [
        ...previous.items
      ];

      if (
        editingItem.index !== undefined
      ) {
        items[editingItem.index] =
          item;
      } else {
        items.push(item);
      }

      return {
        ...previous,
        items
      };
    });

    setEditingItem(null);
  }

  async function handleSaveMenu(event) {
    event.preventDefault();

    if (!selectedDate) {
      alert("Selecciona una fecha.");
      return;
    }

    setSaving(true);

    try {
      await saveMenu(
        ownerId,
        {
          id:
            menus[selectedDate]?.id,

          date:
            selectedDate,

          title:
            form.title ||
            "Menú del día",

          subtitle:
            form.subtitle || "",

          availableUntil:
            form.availableUntil ||
            "15:00",

          items:
            form.items || []
        }
      );

      alert(
        "Menú guardado correctamente."
      );

      await loadMenus();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "No se pudo guardar el menú."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMenu() {
    const menu =
      menus[selectedDate];

    if (!menu?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        "¿Quieres eliminar completamente este menú?"
      );

    if (!confirmed) return;

    try {
      await deleteMenu(
        ownerId,
        menu.id
      );

      alert("Menú eliminado.");

      await loadMenus();

      setForm(emptyMenu);
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "No se pudo eliminar el menú."
      );
    }
  }

  const menuDates = Object.keys(menus)
    .sort()
    .reverse();

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span>Administración</span>
          <h1>Menú del día</h1>
          <p>
            Crea y actualiza el menú que verán
            tus clientes.
          </p>
        </div>
      </div>

      <div className="menu-manager-layout">
        <aside className="menu-date-sidebar">
          <div className="menu-date-header">
            <h3>Fechas</h3>

            <span>
              {menuDates.length} menú
              {menuDates.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          <button
            className={
              selectedDate === getToday()
                ? "date-button active"
                : "date-button"
            }
            onClick={() =>
              selectDate(getToday())
            }
          >
            <FaCalendarAlt />

            <div>
              <strong>Hoy</strong>
              <span>
                {formatDate(getToday())}
              </span>
            </div>
          </button>

          {menuDates
            .filter(
              (date) =>
                date !== getToday()
            )
            .map((date) => (
              <button
                key={date}
                className={
                  selectedDate === date
                    ? "date-button active"
                    : "date-button"
                }
                onClick={() =>
                  selectDate(date)
                }
              >
                <FaCalendarAlt />

                <div>
                  <strong>
                    {formatDate(date)}
                  </strong>

                  <span>
                    {menus[date]?.title ||
                      "Menú"}
                  </span>
                </div>
              </button>
            ))}
        </aside>

        <section className="menu-editor">
          <form onSubmit={handleSaveMenu}>
            <div className="editor-header">
              <div>
                <span>
                  Editando
                </span>

                <h2>
                  {formatDate(
                    selectedDate
                  )}
                </h2>
              </div>

              <div className="editor-actions">
                {menus[selectedDate] && (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={
                      handleDeleteMenu
                    }
                  >
                    <FaTrash />
                    Eliminar
                  </button>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  <FaSave />

                  {saving
                    ? "Guardando..."
                    : "Guardar menú"}
                </button>
              </div>
            </div>

            <div className="editor-card">
              <div className="form-grid">
                <FormField
                  label="Título"
                  name="title"
                  value={form.title}
                  onChange={
                    handleFormChange
                  }
                  placeholder="Menú del día"
                  icon={<FaUtensils />}
                />

                <FormField
                  label="Disponible hasta"
                  name="availableUntil"
                  type="time"
                  value={
                    form.availableUntil
                  }
                  onChange={
                    handleFormChange
                  }
                  icon={<FaClock />}
                />
              </div>

              <label className="form-field">
                <span>Descripción</span>

                <div className="input-wrapper textarea-wrapper">
                  <textarea
                    name="subtitle"
                    value={
                      form.subtitle
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Descripción breve del menú..."
                    rows="3"
                  />
                </div>
              </label>
            </div>

            <div className="editor-card">
              <div className="editor-card-heading">
                <div>
                  <span>
                    Productos
                  </span>

                  <h2>
                    Elementos del menú
                  </h2>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addItem}
                >
                  <FaPlus />
                  Agregar producto
                </button>
              </div>

              {form.items.length ===
              0 ? (
                <EmptyState
                  icon={<FaUtensils />}
                  title="Todavía no hay productos"
                  text="Agrega los platos que estarán disponibles."
                  action={
                    <button
                      type="button"
                      className="primary-button"
                      onClick={addItem}
                    >
                      <FaPlus />
                      Agregar producto
                    </button>
                  }
                />
              ) : (
                <div className="admin-menu-items">
                  {form.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="admin-menu-item"
                        key={index}
                      >
                        <div>
                          <span>
                            {item.category ||
                              "Plato"}
                          </span>

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            {
                              item.description
                            }
                          </p>

                          <strong>
                            {formatPrice(
                              item.price
                            )}
                          </strong>
                        </div>

                        <div className="item-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                              editItem(
                                index
                              )
                            }
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() =>
                              deleteItem(
                                index
                              )
                            }
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </form>
        </section>
      </div>

      {editingItem && (
        <Modal
          title={
            editingItem.index !==
            undefined
              ? "Editar producto"
              : "Agregar producto"
          }
          onClose={() =>
            setEditingItem(null)
          }
        >
          <div className="modal-form">
            <FormField
              label="Nombre del producto"
              name="itemName"
              value={
                editingItem.name
              }
              onChange={(event) =>
                setEditingItem(
                  (previous) => ({
                    ...previous,
                    name:
                      event.target.value
                  })
                )
              }
              placeholder="Ej. Arroz con pollo"
              icon={<FaUtensils />}
              required
            />

            <FormField
              label="Precio"
              name="itemPrice"
              type="number"
              value={
                editingItem.price
              }
              onChange={(event) =>
                setEditingItem(
                  (previous) => ({
                    ...previous,
                    price:
                      event.target.value
                  })
                )
              }
              placeholder="18000"
              icon={<FaSave />}
            />

            <FormField
              label="Categoría"
              name="itemCategory"
              value={
                editingItem.category
              }
              onChange={(event) =>
                setEditingItem(
                  (previous) => ({
                    ...previous,
                    category:
                      event.target.value
                  })
                )
              }
              placeholder="Plato principal"
              icon={<FaUtensils />}
            />

            <label className="form-field">
              <span>Descripción</span>

              <textarea
                value={
                  editingItem.description
                }
                onChange={(event) =>
                  setEditingItem(
                    (previous) => ({
                      ...previous,
                      description:
                        event.target
                          .value
                    })
                  )
                }
                placeholder="Describe el producto..."
                rows="4"
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={
                  editingItem.available !==
                  false
                }
                onChange={(event) =>
                  setEditingItem(
                    (previous) => ({
                      ...previous,
                      available:
                        event.target
                          .checked
                    })
                  )
                }
              />

              <span>
                Producto disponible
              </span>
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setEditingItem(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveItem}
              >
                <FaSave />
                Guardar producto
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   ADMIN RESERVAS
========================================================= */

function ReservationManager({
  ownerId
}) {
  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState("todas");

  useEffect(() => {
    loadBookings();
  }, [ownerId]);

  async function loadBookings() {
    try {
      setLoading(true);

      const data =
        await getBookings(ownerId);

      setBookings(
        [...data].sort(
          (a, b) =>
            `${a.date} ${a.time}`.localeCompare(
              `${b.date} ${b.time}`
            )
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        "No se pudieron cargar las reservas."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    booking,
    status
  ) {
    try {
      await updateBooking(
        ownerId,
        booking.id,
        { status }
      );

      await loadBookings();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "No se pudo actualizar la reserva."
      );
    }
  }

  async function removeBooking(
    booking
  ) {
    const confirmed =
      window.confirm(
        `¿Quieres eliminar la reserva de ${booking.clientName}?`
      );

    if (!confirmed) return;

    try {
      await deleteBooking(
        ownerId,
        booking.id
      );

      await loadBookings();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "No se pudo eliminar la reserva."
      );
    }
  }

  const filteredBookings =
    useMemo(() => {
      if (filter === "todas") {
        return bookings;
      }

      return bookings.filter(
        (booking) =>
          booking.status === filter ||
          (
            filter === "pendiente" &&
            booking.status ===
              "pending"
          )
      );
    }, [bookings, filter]);

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span>Administración</span>
          <h1>Reservas</h1>
          <p>
            Revisa y administra las reservas de
            tus clientes.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadBookings}
        >
          Actualizar
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={
            filter === "todas"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("todas")
          }
        >
          Todas
        </button>

        <button
          className={
            filter === "pendiente"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("pendiente")
          }
        >
          Pendientes
        </button>

        <button
          className={
            filter === "confirmada"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("confirmada")
          }
        >
          Confirmadas
        </button>

        <button
          className={
            filter === "completada"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("completada")
          }
        >
          Completadas
        </button>

        <button
          className={
            filter === "cancelada"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("cancelada")
          }
        >
          Canceladas
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : filteredBookings.length ===
        0 ? (
        <EmptyState
          icon={<FaCalendarAlt />}
          title="No hay reservas"
          text="Las reservas de tus clientes aparecerán aquí."
        />
      ) : (
        <div className="reservations-list">
          {filteredBookings.map(
            (booking) => (
              <ReservationCard
                key={booking.id}
                booking={booking}
                onStatusChange={
                  changeStatus
                }
                onDelete={
                  removeBooking
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function ReservationCard({
  booking,
  onStatusChange,
  onDelete
}) {
  const status =
    booking.status === "pending"
      ? "pendiente"
      : booking.status;

  return (
    <article className="reservation-card">
      <div className="reservation-date">
        <span>
          {formatDate(
            booking.date
          )}
        </span>

        <strong>
          {booking.time}
        </strong>
      </div>

      <div className="reservation-main">
        <div className="reservation-name">
          <div className="reservation-avatar">
            <FaUser />
          </div>

          <div>
            <h3>
              {booking.clientName}
            </h3>

            <p>
              {booking.clientPhone ||
                "Sin teléfono"}
            </p>
          </div>
        </div>

        {booking.note && (
          <div className="reservation-note">
            <FaStickyNote />
            <span>
              {booking.note}
            </span>
          </div>
        )}
      </div>

      <div className="reservation-actions">
        <span
          className={`status-badge ${status}`}
        >
          {getStatusLabel(status)}
        </span>

        <div className="reservation-buttons">
          {status === "pendiente" && (
            <>
              <button
                className="confirm-button"
                onClick={() =>
                  onStatusChange(
                    booking,
                    "confirmada"
                  )
                }
              >
                <FaCheckCircle />
                Confirmar
              </button>

              <button
                className="cancel-button"
                onClick={() =>
                  onStatusChange(
                    booking,
                    "cancelada"
                  )
                }
              >
                <FaTimesCircle />
                Cancelar
              </button>
            </>
          )}

          {status === "confirmada" && (
            <button
              className="confirm-button"
              onClick={() =>
                onStatusChange(
                  booking,
                  "completada"
                )
              }
            >
              <FaCheckCircle />
              Marcar completada
            </button>
          )}

          <button
            className="icon-button danger"
            onClick={() =>
              onDelete(booking)
            }
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   WHATSAPP
========================================================= */

function WhatsAppButton({
  text,
  message
}) {
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
    <button
      className="whatsapp-button"
      onClick={openWhatsApp}
    >
      <FaWhatsapp />
      {text}
    </button>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  children,
  onClose
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ESTADOS
========================================================= */

function Loading() {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Cargando información...</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {icon}
      </div>

      <h2>{title}</h2>

      <p>{text}</p>

      {action && (
        <div className="empty-action">
          {action}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RESERVATION ROW
========================================================= */

function ReservationRow({
  booking
}) {
  const status =
    booking.status === "pending"
      ? "pendiente"
      : booking.status;

  return (
    <div className="reservation-row">
      <div className="reservation-row-date">
        <strong>
          {formatDate(
            booking.date
          )}
        </strong>

        <span>
          {booking.time}
        </span>
      </div>

      <div className="reservation-row-client">
        <div className="reservation-avatar">
          <FaUser />
        </div>

        <div>
          <strong>
            {booking.clientName}
          </strong>

          <span>
            {booking.clientPhone}
          </span>
        </div>
      </div>

      <span
        className={`status-badge ${status}`}
      >
        {getStatusLabel(status)}
      </span>
    </div>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-inner">
        <div>
          <strong>
            {APP_CONFIG.businessName}
          </strong>

          <p>
            Catering & eventos con sabor
            casero.
          </p>
        </div>

        <span>
          © {new Date().getFullYear()}{" "}
          {APP_CONFIG.businessName}
        </span>
      </div>
    </footer>
  );
}