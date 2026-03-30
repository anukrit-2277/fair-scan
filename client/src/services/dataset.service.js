import api from './api';

const datasetService = {
  upload: (file, name, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    return api.post('/datasets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  linkSheet: (url, name) => api.post('/datasets/sheets', { url, name }),

  getAll: () => api.get('/datasets'),

  getById: (id) => api.get(`/datasets/${id}`),

  remove: (id) => api.delete(`/datasets/${id}`),

  analyze: (id) => api.post(`/datasets/${id}/analyze`),

  confirmConfig: (id, config) => api.put(`/datasets/${id}/confirm`, config),
};

export default datasetService;
