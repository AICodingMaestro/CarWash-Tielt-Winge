import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loyaltyService } from '../../services/loyaltyService';

// Types
export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  value: number; // monetary value
  type: 'discount' | 'free_service' | 'upgrade' | 'merchandise';
  category: string;
  image: string;
  isActive: boolean;
  expirationDays?: number;
  usageLimit?: number;
  termsAndConditions: string[];
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  description: string;
  reference?: string; // booking ID or reward ID
  createdAt: string;
  expiresAt?: string;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  reward: LoyaltyReward;
  pointsUsed: number;
  status: 'active' | 'used' | 'expired';
  code: string;
  redeemedAt: string;
  expiresAt: string;
  usedAt?: string;
}

interface LoyaltyState {
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: LoyaltyTransaction[];
  availableRewards: LoyaltyReward[];
  redeemedRewards: RedeemedReward[];
  tier: {
    name: string;
    level: number;
    pointsRequired: number;
    nextTierPoints: number;
    benefits: string[];
    multiplier: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: LoyaltyState = {
  points: 0,
  totalEarned: 0,
  totalRedeemed: 0,
  transactions: [],
  availableRewards: [],
  redeemedRewards: [],
  tier: {
    name: 'Bronze',
    level: 1,
    pointsRequired: 0,
    nextTierPoints: 500,
    benefits: ['5% discount on basic wash'],
    multiplier: 1,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchLoyaltyData = createAsyncThunk(
  'loyalty/fetchLoyaltyData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.getLoyaltyData();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch loyalty data');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'loyalty/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.getTransactions();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchAvailableRewards = createAsyncThunk(
  'loyalty/fetchAvailableRewards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.getAvailableRewards();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rewards');
    }
  }
);

export const redeemReward = createAsyncThunk(
  'loyalty/redeemReward',
  async (rewardId: string, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.redeemReward(rewardId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to redeem reward');
    }
  }
);

export const earnPoints = createAsyncThunk(
  'loyalty/earnPoints',
  async ({ bookingId, points }: { bookingId: string; points: number }, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.earnPoints(bookingId, points);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to earn points');
    }
  }
);

// Loyalty slice
const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePoints: (state, action: PayloadAction<number>) => {
      state.points = action.payload;
    },
    addTransaction: (state, action: PayloadAction<LoyaltyTransaction>) => {
      state.transactions.unshift(action.payload);
      
      // Update points based on transaction
      if (action.payload.type === 'earned') {
        state.points += action.payload.points;
        state.totalEarned += action.payload.points;
      } else if (action.payload.type === 'redeemed') {
        state.points -= action.payload.points;
        state.totalRedeemed += action.payload.points;
      }
    },
    updateTier: (state, action: PayloadAction<typeof initialState.tier>) => {
      state.tier = action.payload;
    },
    addRedeemedReward: (state, action: PayloadAction<RedeemedReward>) => {
      state.redeemedRewards.unshift(action.payload);
    },
    updateRedeemedReward: (state, action: PayloadAction<{ id: string; updates: Partial<RedeemedReward> }>) => {
      const index = state.redeemedRewards.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.redeemedRewards[index] = { ...state.redeemedRewards[index], ...action.payload.updates };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch loyalty data
    builder
      .addCase(fetchLoyaltyData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoyaltyData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.points = action.payload.points;
        state.totalEarned = action.payload.totalEarned;
        state.totalRedeemed = action.payload.totalRedeemed;
        state.tier = action.payload.tier;
        state.error = null;
      })
      .addCase(fetchLoyaltyData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch available rewards
    builder
      .addCase(fetchAvailableRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableRewards = action.payload;
        state.error = null;
      })
      .addCase(fetchAvailableRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Redeem reward
    builder
      .addCase(redeemReward.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(redeemReward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.points -= action.payload.pointsUsed;
        state.totalRedeemed += action.payload.pointsUsed;
        state.redeemedRewards.unshift(action.payload);
        
        // Add transaction
        state.transactions.unshift({
          id: `txn_${Date.now()}`,
          userId: action.payload.userId,
          type: 'redeemed',
          points: action.payload.pointsUsed,
          description: `Redeemed: ${action.payload.reward.name}`,
          reference: action.payload.id,
          createdAt: new Date().toISOString(),
        });
        
        state.error = null;
      })
      .addCase(redeemReward.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Earn points
    builder
      .addCase(earnPoints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(earnPoints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.points += action.payload.points;
        state.totalEarned += action.payload.points;
        state.transactions.unshift(action.payload.transaction);
        
        // Check for tier upgrade
        if (state.totalEarned >= state.tier.nextTierPoints) {
          // This would typically be handled by the backend
          // but we can show a local update
        }
        
        state.error = null;
      })
      .addCase(earnPoints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updatePoints,
  addTransaction,
  updateTier,
  addRedeemedReward,
  updateRedeemedReward,
} = loyaltySlice.actions;

export default loyaltySlice.reducer;