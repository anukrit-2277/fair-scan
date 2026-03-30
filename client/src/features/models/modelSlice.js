import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import modelService from '../../services/model.service';

export const fetchModels = createAsyncThunk(
  'models/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await modelService.getAll();
      return res.data.models;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeModel = createAsyncThunk(
  'models/remove',
  async (id, { rejectWithValue }) => {
    try {
      await modelService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const modelSlice = createSlice({
  name: 'models',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addModel: (state, action) => {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModels.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchModels.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchModels.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(removeModel.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m._id !== action.payload);
      });
  },
});

export const { addModel } = modelSlice.actions;
export default modelSlice.reducer;
