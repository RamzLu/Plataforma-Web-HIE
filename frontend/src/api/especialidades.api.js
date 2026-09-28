import axios from './axiosConfig.js';

export const getEspecialidades = async (isAdmin = false) => {
  const response = await axios.get(`/cms/especialidades?admin=${isAdmin}`);
  return response.data;
};

export const createEspecialidad = async (data, token) => {
  const response = await axios.post('/cms/especialidades', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateEspecialidad = async (id, data, token) => {
  const response = await axios.put(`/cms/especialidades/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteEspecialidad = async (id, token, isServicio) => {
  const response = await axios.delete(`/cms/especialidades/${id}?isServicio=${isServicio}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};