import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import monitorService from '../../services/monitor.service';

export const fetchMonitors = createAsyncThunk('monitors/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await monitorService.getAll();
    return res.data.monitors;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchMonitor = createAsyncThunk('monitors/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await monitorService.getById(id);
    return res.data.monitor;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createMonitor = createAsyncThunk('monitors/create', async ({ auditId, config }, { rejectWithValue }) => {
  try {
    const res = await monitorService.create(auditId, config);
    return res.data.monitor;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const refreshMonitor = createAsyncThunk('monitors/refresh', async (id, { rejectWithValue }) => {
  try {
    const res = await monitorService.refresh(id);
    return res.data.monitor;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const removeMonitor = createAsyncThunk('monitors/remove', async (id, { rejectWithValue }) => {
  try {
    await monitorService.remove(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const monitorSlice = createSlice({
  name: 'monitors',
  initialState: {
    items: [],
    current: null,
    loading: false,
    creating: false,
    error: null,
  },
  reducers: {
    clearCurrentMonitor: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonitors.pending, (state) => { state.loading = true; })
      .addCase(fetchMonitors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMonitors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMonitor.pending, (state) => { state.loading = true; })
      .addCase(fetchMonitor.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchMonitor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createMonitor.pending, (state) => { state.creating = true; })
      .addCase(createMonitor.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
      })
      .addCase(createMonitor.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      .addCase(refreshMonitor.fulfilled, (state, action) => {
        state.current = action.payload;
        const idx = state.items.findIndex((m) => m._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })

      .addCase(removeMonitor.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m._id !== action.payload);
        if (state.current?._id === action.payload) state.current = null;
      });
  },
});

export const { clearCurrentMonitor } = monitorSlice.actions;
export default monitorSlice.reducer;
