import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import uiReducer from './uiSlice';
import datasetReducer from '../features/datasets/datasetSlice';
import modelReducer from '../features/models/modelSlice';
import auditReducer from '../features/audits/auditSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    datasets: datasetReducer,
    models: modelReducer,
    audits: auditReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
