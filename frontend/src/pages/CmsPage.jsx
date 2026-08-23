import React, { useEffect, useState } from "react";
import keycloak from "../config/keycloak";

const CmsPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    keycloak
      .init({ onLoad: "login-required" })
      .then((auth) => {
        setAuthenticated(auth);
        setInitialized(true);
      })
      .catch((error) => {
        console.error("Error al inicializar Keycloak:", error);
        setInitialized(true);
      });
  }, []);

  if (!initialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Verificando credenciales de seguridad...</h2>
      </div>
    );
  }

  if (authenticated) {
    // AQUÍ VERIFICAMOS LOS ROLES DEL USUARIO
    const isAdmin = keycloak.hasRealmRole("admin");
    const isCms = keycloak.hasRealmRole("cms");
    // Función para probar la comunicación segura con el backend
    const testBackendConnection = async () => {
      try {
        // Usamos el token actual de Keycloak
        const token = keycloak.token;

        const response = await fetch("http://localhost:3000/api/roles", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // ¡Aquí ocurre la magia! Adjuntamos el token como un "Bearer"
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos recibidos del backend:", data);
          alert("¡Conexión exitosa! Revisa la consola del navegador.");
        } else {
          console.error("❌ Error del backend. Status:", response.status);
          alert(`Fallo en la conexión segura (Status: ${response.status})`);
        }
      } catch (error) {
        console.error("❌ Error de red:", error);
        alert("Error de red: ¿Está encendido el servidor en el puerto 3000?");
      }
    };

    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        {/* --- MENÚ LATERAL (SIDEBAR) --- */}
        <aside
          style={{
            width: "250px",
            backgroundColor: "#343a40",
            color: "white",
            padding: "2rem 1rem",
          }}
        >
          <h3
            style={{
              borderBottom: "1px solid #4f5962",
              paddingBottom: "1rem",
              marginBottom: "2rem",
            }}
          >
            HIE Panel
          </h3>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {/* Visible para TODOS los que inician sesión */}
            <li style={{ cursor: "pointer" }}>🏠 Inicio</li>

            {/* Visible SOLO para CMD (o Administradores que también publiquen) */}
            {(isCms || isAdmin) && (
              <>
                <li style={{ cursor: "pointer" }}>📝 Redactar Noticia</li>
                <li style={{ cursor: "pointer" }}>📚 Mis Publicaciones</li>
              </>
            )}

            {/* Visible SOLO para ADMIN */}
            {isAdmin && (
              <>
                <li
                  style={{
                    cursor: "pointer",
                    marginTop: "20px",
                    color: "#17a2b8",
                  }}
                >
                  ⚙️ Gestión de Usuarios
                </li>
                <li style={{ cursor: "pointer", color: "#17a2b8" }}>
                  📊 Estadísticas del Hospital
                </li>
                <li style={{ cursor: "pointer", color: "#17a2b8" }}>
                  🛡️ Permisos Globales
                </li>
              </>
            )}
          </ul>
        </aside>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <main style={{ flex: 1, padding: "7rem" }}>
          <h1>Panel de Control</h1>
          <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
            Hola,{" "}
            <strong>
              {keycloak.tokenParsed?.preferred_username || "Usuario"}
            </strong>
            .
          </p>

          {/* Tarjeta de información del rol actual */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3>Tu Nivel de Acceso:</h3>
            {isAdmin ? (
              <p style={{ color: "green" }}>
                👑 Tienes privilegios de Administrador del Sistema.
              </p>
            ) : isCms ? (
              <p style={{ color: "blue" }}>
                ✍️ Tienes privilegios de Redactor de Contenido (CMD).
              </p>
            ) : (
              <p style={{ color: "gray" }}>Usuario sin roles asignados.</p>
            )}
          </div>
          <button
            onClick={testBackendConnection}
            style={{
              marginTop: "3rem",
              marginRight: "10px",
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔌 Probar Conexión al Backend
          </button>
          <button
            onClick={() => keycloak.logout()}
            style={{
              marginTop: "3rem",
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cerrar Sesión Segura
          </button>
        </main>
      </div>
    );
  }

  return null;
};

export default CmsPage;
