import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auditService from '../../services/audit.service';

export const triggerAudit = createAsyncThunk(
  'audits/trigger',
  async (datasetId, { rejectWithValue }) => {
    try {
      const res = await auditService.trigger(datasetId);
      return res.data.audit;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAudits = createAsyncThunk(
  'audits/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await auditService.getAll();
      return res.data.audits;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAudit = createAsyncThunk(
  'audits/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await auditService.getById(id);
      return res.data.audit;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeAudit = createAsyncThunk(
  'audits/remove',
  async (id, { rejectWithValue }) => {
    try {
      await auditService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const auditSlice = createSlice({
  name: 'audits',
  initialState: {
    items: [],
    current: null,
    loading: false,
    triggering: false,
    error: null,
  },
  reducers: {
    clearCurrentAudit: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerAudit.pending, (state) => { state.triggering = true; state.error = null; })
      .addCase(triggerAudit.fulfilled, (state, action) => {
        state.triggering = false;
        state.current = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(triggerAudit.rejected, (state, action) => { state.triggering = false; state.error = action.payload; })
      .addCase(fetchAudits.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAudits.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAudits.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAudit.pending, (state) => { state.loading = true; })
      .addCase(fetchAudit.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchAudit.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(removeAudit.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a._id !== action.payload);
        if (state.current?._id === action.payload) state.current = null;
      });
  },
});

export const { clearCurrentAudit } = auditSlice.actions;
export default auditSlice.reducer;
