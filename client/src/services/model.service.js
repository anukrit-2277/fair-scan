import api from './api';

const modelService = {
  upload: (file, name, description, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);

    return api.post('/models', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  connectVertex: (config) => api.post('/models/vertex', config),

  getAll: () => api.get('/models'),

  getById: (id) => api.get(`/models/${id}`),

  remove: (id) => api.delete(`/models/${id}`),
};

export default modelService;
