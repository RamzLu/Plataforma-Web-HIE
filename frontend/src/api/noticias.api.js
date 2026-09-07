import api from "./axiosConfig";

export const getNoticias = async (isAdmin = false) => {
  const response = await api.get(`/cms/noticias?admin=${isAdmin}`);
  return response.data;
};

export const createNoticia = async (formData, token) => {
  const response = await api.post("/cms/noticias", formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateNoticia = async (id, formData, token) => {
  const response = await api.put(`/cms/noticias/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteNoticia = async (id, token) => {
  const response = await api.delete(`/cms/noticias/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};