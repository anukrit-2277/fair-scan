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

const datasetSlice = createSlice({
  name: 'datasets',
  initialState: {
    items: [],
    current: null,
    preview: [],
    loading: false,
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
      });
  },
});

export const { clearCurrent, addDataset } = datasetSlice.actions;
export default datasetSlice.reducer;
