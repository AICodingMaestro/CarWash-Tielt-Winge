import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { serviceService } from '../../services/serviceService';

// Types
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  duration: number; // additional minutes
  description: string;
  category: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number; // for promotions
  duration: number; // in minutes
  category: ServiceCategory;
  image: string;
  features: string[];
  addons: ServiceAddon[];
  isPopular: boolean;
  isActive: boolean;
  minimumNotice: number; // hours before booking
  maxAdvanceBooking: number; // days ahead
  availableSlots: string[]; // time slots
  restrictions?: string[];
  seasonalPricing?: {
    season: string;
    multiplier: number;
    startDate: string;
    endDate: string;
  }[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  minimumAmount?: number;
  applicableServices: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  code?: string;
}

interface ServiceState {
  services: Service[];
  categories: ServiceCategory[];
  addons: ServiceAddon[];
  promotions: Promotion[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'price' | 'duration' | 'popularity' | 'name';
  sortOrder: 'asc' | 'desc';
}

// Initial state
const initialState: ServiceState = {
  services: [],
  categories: [],
  addons: [],
  promotions: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  sortBy: 'popularity',
  sortOrder: 'desc',
};

// Async thunks
export const fetchServices = createAsyncThunk(
  'service/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceService.getAllServices();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch services');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'service/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceService.getCategories();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchAddons = createAsyncThunk(
  'service/fetchAddons',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceService.getAddons();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch addons');
    }
  }
);

export const fetchPromotions = createAsyncThunk(
  'service/fetchPromotions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceService.getActivePromotions();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch promotions');
    }
  }
);

export const applyPromotion = createAsyncThunk(
  'service/applyPromotion',
  async ({ code, serviceIds }: { code: string; serviceIds: string[] }, { rejectWithValue }) => {
    try {
      const response = await serviceService.validatePromotion(code, serviceIds);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Invalid promotion code');
    }
  }
);

// Service slice
const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'price' | 'duration' | 'popularity' | 'name'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    clearFilters: (state) => {
      state.selectedCategory = null;
      state.searchQuery = '';
      state.sortBy = 'popularity';
      state.sortOrder = 'desc';
    },
  },
  extraReducers: (builder) => {
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

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch addons
    builder
      .addCase(fetchAddons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addons = action.payload;
        state.error = null;
      })
      .addCase(fetchAddons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch promotions
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.promotions = action.payload;
        state.error = null;
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Apply promotion
    builder
      .addCase(applyPromotion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyPromotion.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update services with promotion pricing
        const promotion = action.payload;
        state.services = state.services.map(service => {
          if (promotion.applicableServices.includes(service.id)) {
            let discountedPrice = service.price;
            if (promotion.type === 'percentage') {
              discountedPrice = service.price * (1 - promotion.value / 100);
            } else if (promotion.type === 'fixed') {
              discountedPrice = Math.max(0, service.price - promotion.value);
            }
            return {
              ...service,
              originalPrice: service.price,
              price: discountedPrice,
            };
          }
          return service;
        });
        state.error = null;
      })
      .addCase(applyPromotion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  clearFilters,
} = serviceSlice.actions;

export default serviceSlice.reducer;