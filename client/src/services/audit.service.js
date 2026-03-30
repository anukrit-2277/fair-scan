import api from './api';

const auditService = {
  trigger: (datasetId) => api.post('/audits', { datasetId }),

  getAll: () => api.get('/audits'),

  getById: (id) => api.get(`/audits/${id}`),

  getReport: (id) => api.get(`/audits/${id}/report`),

  remove: (id) => api.delete(`/audits/${id}`),

  explainRow: (id, rowIndex) => api.post(`/audits/${id}/explain`, { rowIndex }),

  previewMitigation: (id, strategy, params) =>
    api.post(`/audits/${id}/mitigate/preview`, { strategy, params }),

  applyMitigation: (id, strategy, params) =>
    api.post(`/audits/${id}/mitigate/apply`, { strategy, params }),

  generateReport: (id) => api.get(`/audits/${id}/generate-report`),

  generateModelCard: (id) => api.get(`/audits/${id}/model-card`),
};

export default auditService;
