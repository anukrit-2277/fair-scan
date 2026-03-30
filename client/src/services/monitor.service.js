import api from './api';

const monitorService = {
  getDashboardStats: () => api.get('/monitors/stats'),
  getAll: () => api.get('/monitors'),
  getById: (id) => api.get(`/monitors/${id}`),
  create: (auditId, config) => api.post('/monitors', { auditId, config }),
  refresh: (id) => api.post(`/monitors/${id}/refresh`),
  toggle: (id) => api.post(`/monitors/${id}/toggle`),
  acknowledgeAlert: (id, alertId) => api.post(`/monitors/${id}/alerts/acknowledge`, { alertId }),
  remove: (id) => api.delete(`/monitors/${id}`),
};

export default monitorService;
