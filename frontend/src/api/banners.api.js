import api from "./axiosConfig.js";

export const getBanners = async () => {
  const response = await api.get("/cms/banners");
  return response.data;
};

export const createBanner = async (formData, token) => {
  const response = await api.post("/cms/banners", formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateBanner = async (id, formData, token) => {
  const response = await api.put(`/cms/banners/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteBanner = async (id, token) => {
  const response = await api.delete(`/cms/banners/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};