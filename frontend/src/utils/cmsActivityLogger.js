const STORAGE_KEY = "cms_activity_log";

const generarIdActividad = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().slice(0, 8);
  }
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const recordCmsActivity = ({
  titulo,
  categoria = "General",
  editor = "Editor CMS",
  estado = "ELIMINADO",
  timestamp = Date.now(),
  newsId = null,
}) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const existing = Array.isArray(parsed) ? parsed : [];
    const newActivity = {
      id: `act-${Date.now()}-${generarIdActividad()}`,
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
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
