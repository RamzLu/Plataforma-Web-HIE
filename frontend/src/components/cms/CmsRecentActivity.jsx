import React, { useState, useEffect } from "react";

const formatActivityDate = (timestamp) => {
  if (!timestamp) return "Reciente";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Reciente";

  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
  ];
  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `${dia} ${mes} ${anio}`;
};

const formatActivityTime = (timestamp) => {
  if (!timestamp) return "Hoy";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Hoy";

  const now = new Date();
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isSameDay) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return "Ayer";
  }

  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
  ];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
};

const resolveEstado = (rawStatus) => {
  if (!rawStatus) return "PUBLICADO";
  const upper = String(rawStatus).toUpperCase().trim();
  if (upper.includes("BORRADOR") || upper === "DRAFT") return "BORRADOR";
  if (upper.includes("ARCHIVADO") || upper === "ARCHIVED") return "ARCHIVADO";
  // Regla de negocio solicitada: siempre como Publicado, salvo que sea Borrador o Archivado
  return "PUBLICADO";
};

const CmsRecentActivity = ({
  newsList = [],
  docsList = [],
  profesionalesList = [],
  userName = "Editor CMS",
}) => {
  const [extraCaps, setExtraCaps] = useState([]);
  const [extraRes, setExtraRes] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch("http://localhost:3000/api/cms/capacitaciones")
        .then((r) => r.json())
        .catch(() => []),
      fetch("http://localhost:3000/api/cms/residencias")
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([caps, res]) => {
      if (isMounted) {
        if (Array.isArray(caps)) setExtraCaps(caps);
        if (Array.isArray(res)) setExtraRes(res);
        setLoadingExtras(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const activities = [];

  // 1. Noticias
  (newsList || []).forEach((n) => {
    const rawDate = n.updatedAt || n.createdAt;
    const estado = resolveEstado(n.estado);
    const isDraft = estado === "BORRADOR";
    const title = n.title || n.titulo || "Sin título";
    activities.push({
      id: `news-${n.id}`,
      titulo: isDraft ? `Creó borrador: "${title}"` : `Publicó noticia "${title}"`,
      categoria: n.category || "Noticias",
      editor: n.editor || n.editedBy || "Luana Ramirez",
      estado: estado,
      timestamp: rawDate ? new Date(rawDate).getTime() : 0,
    });
  });

  // 2. Documentación
  (docsList || []).forEach((d) => {
    const rawDate = d.createdAt || d.updatedAt;
    const estado = resolveEstado(d.status);
    const isDraft = estado === "BORRADOR";
    const title = d.title || d.titulo || "Sin título";
    activities.push({
      id: `doc-${d.id}`,
      titulo: isDraft ? `Creó borrador de documento: "${title}"` : `Subió documento "${title}"`,
      categoria: d.category || "Documentación",
      editor: d.editor || "Stella Bernard",
      estado: estado,
      timestamp: rawDate ? new Date(rawDate).getTime() : 0,
    });
  });

  // 3. Profesionales
  (profesionalesList || []).forEach((p) => {
    const rawDate = p.updatedAt || p.createdAt;
    const estado = p.publicado === false ? "BORRADOR" : "PUBLICADO";
    activities.push({
      id: `prof-${p.id}`,
      titulo: `Añadió al profesional ${p.nombre} ${p.apellido}`,
      categoria: p.especialidadNombre || "Profesionales",
      editor: p.editor || "Editor CMS",
      estado: estado,
      timestamp: rawDate ? new Date(rawDate).getTime() : 0,
    });
  });

  // 4. Capacitaciones
  (extraCaps || []).forEach((c) => {
    const rawDate = c.updatedAt || c.createdAt;
    const estado = resolveEstado(c.estado);
    const isDraft = estado === "BORRADOR";
    const isArchived = estado === "ARCHIVADO";
    const title = c.titulo || "Sin título";
    activities.push({
      id: `cap-${c.id}`,
      titulo: isDraft
        ? `Creó borrador de capacitación: "${title}"`
        : isArchived
        ? `Archivó capacitación "${title}"`
        : `Publicó capacitación "${title}"`,
      categoria: "Capacitaciones",
      editor: c.editor || "Editor CMS",
      estado: estado,
      timestamp: rawDate ? new Date(rawDate).getTime() : 0,
    });
  });

  // 5. Residencias
  (extraRes || []).forEach((r) => {
    const rawDate = r.updatedAt || r.createdAt;
    const estado = resolveEstado(r.estado);
    const isDraft = estado === "BORRADOR";
    const isArchived = estado === "ARCHIVADO";
    const title = r.nombre || "Sin nombre";
    activities.push({
      id: `res-${r.id}`,
      titulo: isDraft
        ? `Creó borrador de residencia: "${title}"`
        : isArchived
        ? `Archivó residencia "${title}"`
        : `Registró residencia "${title}"`,
      categoria: "Residencias",
      editor: r.editor || "Editor CMS",
      estado: estado,
      timestamp: rawDate ? new Date(rawDate).getTime() : 0,
    });
  });

  // Ordenamos cronológicamente: lo más reciente primero
  activities.sort((a, b) => b.timestamp - a.timestamp);
  const recentItems = activities.slice(0, 6);

  return (
    <div className="cms-dashboard-card recent-activity-card">
      <div className="recent-activity-header">
        <h3 className="cms-card-title">Actividad reciente</h3>
        <p className="recent-activity-subtitle">
          Registro de acciones del editor.
        </p>
      </div>

      <div className="recent-activity-table">
        <div className="activity-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-editor">EDITOR</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-fecha">FECHA</div>
        </div>

        <div className="activity-table-body">
          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <div className="activity-row" key={item.id}>
                <div className="col-content">
                  <span className="activity-title">• {item.titulo}</span>
                  <span className="activity-meta">
                    {formatActivityTime(item.timestamp)} | {item.categoria}
                  </span>
                </div>
                <div className="col-editor" data-label="Editor">
                  {item.editor}
                </div>
                <div className="col-estado" data-label="Estado">
                  <span className={`status-badge ${item.estado.toLowerCase()}`}>
                    {item.estado}
                  </span>
                </div>
                <div className="col-fecha" data-label="Fecha">
                  {formatActivityDate(item.timestamp)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
              No hay actividades recientes registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CmsRecentActivity;
