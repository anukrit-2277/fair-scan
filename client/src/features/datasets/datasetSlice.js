import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import datasetService from '../../services/dataset.service';

export const fetchDatasets = createAsyncThunk(
  'datasets/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await datasetService.getAll();
      return res.data.datasets;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchDataset = createAsyncThunk(
  'datasets/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await datasetService.getById(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeDataset = createAsyncThunk(
  'datasets/remove',
  async (id, { rejectWithValue }) => {
    try {
      await datasetService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const analyzeDataset = createAsyncThunk(
  'datasets/analyze',
  async (id, { rejectWithValue }) => {
    try {
      const res = await datasetService.analyze(id);
      return res.data.dataset;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const confirmDatasetConfig = createAsyncThunk(
  'datasets/confirmConfig',
  async ({ id, config }, { rejectWithValue }) => {
    try {
      const res = await datasetService.confirmConfig(id, config);
      return res.data.dataset;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const datasetSlice = createSlice({
  name: 'datasets',
  initialState: {
    items: [],
    current: null,
    preview: [],
    loading: false,
    analyzing: false,
    confirming: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
      state.preview = [];
    },
    addDataset: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateCurrentColumns: (state, action) => {
      if (state.current?.schemaInfo) {
        state.current.schemaInfo.columns = action.payload;
      }
    },
    updateCurrentAnalysis: (state, action) => {
      if (state.current) {
        state.current.analysis = { ...state.current.analysis, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatasets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDatasets.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchDatasets.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchDataset.pending, (state) => { state.loading = true; })
      .addCase(fetchDataset.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.dataset;
        state.preview = action.payload.preview || [];
      })
      .addCase(fetchDataset.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(removeDataset.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d._id !== action.payload);
      })
      .addCase(analyzeDataset.pending, (state) => { state.analyzing = true; state.error = null; })
      .addCase(analyzeDataset.fulfilled, (state, action) => {
        state.analyzing = false;
        state.current = action.payload;
      })
      .addCase(analyzeDataset.rejected, (state, action) => { state.analyzing = false; state.error = action.payload; })
      .addCase(confirmDatasetConfig.pending, (state) => { state.confirming = true; })
      .addCase(confirmDatasetConfig.fulfilled, (state, action) => {
        state.confirming = false;
        state.current = action.payload;
        const idx = state.items.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(confirmDatasetConfig.rejected, (state, action) => { state.confirming = false; state.error = action.payload; });
  },
});

export const { clearCurrent, addDataset, updateCurrentColumns, updateCurrentAnalysis } = datasetSlice.actions;
export default datasetSlice.reducer;
