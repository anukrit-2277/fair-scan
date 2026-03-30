import api from './api';

const auditService = {
  trigger: (datasetId) => api.post('/audits', { datasetId }),

  getAll: () => api.get('/audits'),

  getById: (id) => api.get(`/audits/${id}`),

  getReport: (id) => api.get(`/audits/${id}/report`),

  remove: (id) => api.delete(`/audits/${id}`),
};

export default auditService;
