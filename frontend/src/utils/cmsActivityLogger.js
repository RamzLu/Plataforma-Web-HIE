const STORAGE_KEY = "cms_activity_log";

export const recordCmsActivity = ({
  titulo,
  categoria = "General",
  editor = "Editor CMS",
  estado = "ELIMINADO",
  timestamp = Date.now(),
  newsId = null,
}) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      titulo,
      categoria,
      editor,
      estado,
      timestamp,
      ...(newsId ? { newsId: String(newsId) } : {}),
    };
    const updated = [newActivity, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent("cms_activity_updated", { detail: newActivity }));
    return newActivity;
  } catch (err) {
    console.error("Error al registrar actividad en CMS:", err);
    return null;
  }
};

export const getCmsActivityLog = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const initialLog = [
        {
          id: "act-sample-delete-1",
          titulo: 'Eliminó noticia: "Comunicado sobre mantenimiento de guardia"',
          categoria: "Noticias",
          editor: "Luana Abigail Ramirez Sistema",
          estado: "ELIMINADO",
          timestamp: Date.now() - 1000 * 60 * 30,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialLog));
      return initialLog;
    }
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
};
