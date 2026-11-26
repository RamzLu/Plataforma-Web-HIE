import axios from "axios";
import keycloak from "../config/keycloak";

const TIMEOUT_NORMAL = 15000;
// Guardar con archivos (imágenes, documentos, videos) tarda más: cada archivo se sube y se registra aparte.
const TIMEOUT_CON_ARCHIVOS = 120000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: TIMEOUT_NORMAL,
});

// Toda llamada a /cms/... (panel CMS y Admin) lleva el token de Keycloak, renovado si está por vencer.
// Las del portal público (/portal/...) van sin token.
const esRutaDelPanel = (config) => /^\/?cms\//.test(config.url || "");
const esRutaPublicaPortal = (url) => /^\/?portal\//.test(url || "");

// Caché ligera en memoria + sessionStorage (stale-while-revalidate) exclusiva para GET /portal/...
// Evita esperas repetidas al navegar entre secciones del portal sin afectar nunca a /cms/...
const PORTAL_CACHE_PREFIX = "hie_portal_get_cache_v1:";
const PORTAL_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos
const PORTAL_REVALIDATE_AFTER_MS = 25 * 1000; // refresco silencioso tras 25s
const portalMemoryCache = new Map();
const portalInFlight = new Map();

const buildPortalCacheKey = (url, config) => {
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${url || ""}?${params}`;
};

const readPortalCache = (key) => {
  const now = Date.now();
  const mem = portalMemoryCache.get(key);
  if (mem && now - mem.ts < PORTAL_CACHE_TTL_MS) {
    return mem;
  }
  try {
    const raw = sessionStorage.getItem(`${PORTAL_CACHE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && now - parsed.ts < PORTAL_CACHE_TTL_MS) {
        portalMemoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
  return null;
};

const writePortalCache = (key, data) => {
  const entry = { ts: Date.now(), data };
  portalMemoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`${PORTAL_CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignorar cuota excedida o modo privado
  }
};

export const clearPortalCache = () => {
  portalMemoryCache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PORTAL_CACHE_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // Ignorar
  }
};

const rawGet = api.get.bind(api);

api.get = (url, config) => {
  if (!esRutaPublicaPortal(url) || config?.skipCache || (config?.responseType && config.responseType !== "json")) {
    return rawGet(url, config);
  }

  const key = buildPortalCacheKey(url, config);
  const cached = readPortalCache(key);

  const fetchFresh = () => {
    if (portalInFlight.has(key)) {
      return portalInFlight.get(key);
    }
    const req = rawGet(url, config)
      .then((res) => {
        if (res && res.status >= 200 && res.status < 300) {
          writePortalCache(key, res.data);
        }
        return res;
      })
      .finally(() => {
        portalInFlight.delete(key);
      });
    portalInFlight.set(key, req);
    return req;
  };

  if (cached) {
    // Refresco silencioso en segundo plano si pasaron más de 25s
    if (Date.now() - cached.ts > PORTAL_REVALIDATE_AFTER_MS) {
      fetchFresh().catch(() => {});
    }
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: "OK (cache)",
      headers: {},
      config: config || { url },
    });
  }

  return fetchFresh();
};

api.interceptors.request.use(
  async (config) => {
    const method = String(config.method || "get").toLowerCase();
    if (method !== "get" && method !== "head" && method !== "options") {
      // Si se guarda/edita/elimina algo en CMS o Admin, invalidamos la caché pública.
      clearPortalCache();
    }

    if (typeof FormData !== "undefined" && config.data instanceof FormData && (!config.timeout || config.timeout <= TIMEOUT_NORMAL)) {
      config.timeout = TIMEOUT_CON_ARCHIVOS;
    }
    if (esRutaDelPanel(config) && keycloak.token) {
      const hasAuth =
        Boolean(config.headers?.Authorization) ||
        Boolean(config.headers?.authorization) ||
        (typeof config.headers?.has === "function" && config.headers.has("Authorization"));

      if (!hasAuth) {
        try {
          await keycloak.updateToken(10);
        } catch {
          // Si no se pudo renovar se usa el token actual; si vencio, el backend responde 401.
        }
        if (typeof config.headers?.set === "function") {
          config.headers.set("Authorization", `Bearer ${keycloak.token}`);
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${keycloak.token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
