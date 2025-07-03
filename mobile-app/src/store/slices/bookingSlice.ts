import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { bookingService } from '../../services/bookingService';

// Types
export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price?: number;
}

export interface BookingService {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  category: 'basic' | 'premium' | 'deluxe';
}

export interface Booking {
  id: string;
  userId: string;
  service: BookingService;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  vehicleInfo: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    licensePlate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BookingState {
  bookings: Booking[];
  currentBooking: Partial<Booking> | null;
  availableSlots: { [date: string]: TimeSlot[] };
  services: BookingService[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedService: BookingService | null;
}

// Initial state
const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  availableSlots: {},
  services: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  selectedDate: null,
  selectedTime: null,
  selectedService: null,
};

// Async thunks
export const fetchUserBookings = createAsyncThunk(
  'booking/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getUserBookings();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchServices = createAsyncThunk(
  'booking/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getServices();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch services');
    }
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'booking/fetchAvailableSlots',
  async ({ date, serviceId }: { date: string; serviceId: string }, { rejectWithValue }) => {
    try {
      const response = await bookingService.getAvailableSlots(date, serviceId);
      return { date, slots: response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch available slots');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData: Partial<Booking>, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create booking');
    }
  }
);

export const updateBooking = createAsyncThunk(
  'booking/updateBooking',
  async ({ id, data }: { id: string; data: Partial<Booking> }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBooking(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await bookingService.cancelBooking(bookingId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel booking');
    }
  }
);

// Booking slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
      state.selectedTime = null; // Reset time when date changes
    },
    setSelectedTime: (state, action: PayloadAction<string>) => {
      state.selectedTime = action.payload;
    },
    setSelectedService: (state, action: PayloadAction<BookingService>) => {
      state.selectedService = action.payload;
      // Reset time and slots when service changes
      state.selectedTime = null;
      state.availableSlots = {};
    },
    clearSelection: (state) => {
      state.selectedDate = null;
      state.selectedTime = null;
      state.selectedService = null;
      state.currentBooking = null;
      state.availableSlots = {};
    },
    setCurrentBooking: (state, action: PayloadAction<Partial<Booking>>) => {
      state.currentBooking = action.payload;
    },
    updateCurrentBooking: (state, action: PayloadAction<Partial<Booking>>) => {
      if (state.currentBooking) {
        state.currentBooking = { ...state.currentBooking, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch user bookings
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch services
    builder
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.services = action.payload;
        state.error = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch available slots
    builder
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots[action.payload.date] = action.payload.slots;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.bookings.unshift(action.payload);
        state.currentBooking = null;
        state.selectedDate = null;
        state.selectedTime = null;
        state.selectedService = null;
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Update booking
    builder
      .addCase(updateBooking.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.bookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.bookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedDate,
  setSelectedTime,
  setSelectedService,
  clearSelection,
  setCurrentBooking,
  updateCurrentBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;