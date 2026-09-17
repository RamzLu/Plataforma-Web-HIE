export const generarNombreUnico = (originalName, prefix = 'file') => {
  if (!originalName) return { nombreUnico: null, extension: null };
  
  const extension = originalName.split('.').pop().toLowerCase() || 'png';
  const randomStr = Math.random().toString(36).substring(2, 8);
  const nombreUnico = `${prefix}_${Date.now()}_${randomStr}.${extension}`;
  
  return { nombreUnico, extension };
};