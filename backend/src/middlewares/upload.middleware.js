import multer from 'multer';
export const uploadMemory = multer({ storage: multer.memoryStorage() });