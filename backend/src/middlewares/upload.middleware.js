import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ==========================================
// 1. CONFIGURACIÓN EN MEMORIA (Para Supabase)
// ==========================================
export const uploadMemory = multer({ storage: multer.memoryStorage() });

// ==========================================
// 2. CONFIGURACIÓN LOCAL (Para Banners en Disco)
// ==========================================
const storageBanners = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'banners-imagenes');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, 'banner_' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadLocalBanner = multer({ storage: storageBanners });