import axios, { AxiosResponse } from 'axios';
import Config from 'react-native-config';
import { LoyaltyReward, LoyaltyTransaction, RedeemedReward } from '../store/slices/loyaltySlice';
import { authService } from './authService';

// API Configuration
const API_BASE_URL = Config.API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await authService.getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface LoyaltyData {
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: {
    name: string;
    level: number;
    pointsRequired: number;
    nextTierPoints: number;
    benefits: string[];
    multiplier: number;
  };
}

class LoyaltyServiceClass {
  async getLoyaltyData(): Promise<LoyaltyData> {
    try {
      const response: AxiosResponse<LoyaltyData> = await api.get('/loyalty');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch loyalty data');
    }
  }

  async getTransactions(limit: number = 50, offset: number = 0): Promise<LoyaltyTransaction[]> {
    try {
      const response: AxiosResponse<LoyaltyTransaction[]> = await api.get('/loyalty/transactions', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch loyalty transactions');
    }
  }

  async getAvailableRewards(): Promise<LoyaltyReward[]> {
    try {
      const response: AxiosResponse<LoyaltyReward[]> = await api.get('/loyalty/rewards');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch available rewards');
    }
  }

  async getRedeemedRewards(): Promise<RedeemedReward[]> {
    try {
      const response: AxiosResponse<RedeemedReward[]> = await api.get('/loyalty/redeemed');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch redeemed rewards');
    }
  }

  async redeemReward(rewardId: string): Promise<RedeemedReward> {
    try {
      const response: AxiosResponse<RedeemedReward> = await api.post(`/loyalty/rewards/${rewardId}/redeem`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to redeem reward');
    }
  }

  async earnPoints(bookingId: string, points: number): Promise<{
    points: number;
    transaction: LoyaltyTransaction;
    tierUpdate?: LoyaltyData['tier'];
  }> {
    try {
      const response = await api.post('/loyalty/earn', {
        bookingId,
        points,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to earn points');
    }
  }

  async getTierInfo(): Promise<{
    currentTier: LoyaltyData['tier'];
    nextTier?: LoyaltyData['tier'];
    allTiers: LoyaltyData['tier'][];
  }> {
    try {
      const response = await api.get('/loyalty/tiers');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch tier information');
    }
  }

  async getPointsHistory(startDate?: string, endDate?: string): Promise<{
    earned: LoyaltyTransaction[];
    redeemed: LoyaltyTransaction[];
    expired: LoyaltyTransaction[];
    summary: {
      totalEarned: number;
      totalRedeemed: number;
      totalExpired: number;
      netPoints: number;
    };
  }> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/loyalty/history', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch points history');
    }
  }

  async getRewardDetails(rewardId: string): Promise<LoyaltyReward> {
    try {
      const response: AxiosResponse<LoyaltyReward> = await api.get(`/loyalty/rewards/${rewardId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch reward details');
    }
  }

  async validateRewardCode(code: string): Promise<{
    valid: boolean;
    reward?: RedeemedReward;
    error?: string;
  }> {
    try {
      const response = await api.post('/loyalty/validate-code', { code });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to validate reward code');
    }
  }

  async useReward(redeemedRewardId: string): Promise<RedeemedReward> {
    try {
      const response: AxiosResponse<RedeemedReward> = await api.post(`/loyalty/redeemed/${redeemedRewardId}/use`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to use reward');
    }
  }

  async getExpiringPoints(days: number = 30): Promise<{
    points: number;
    expirationDate: string;
    transactions: LoyaltyTransaction[];
  }> {
    try {
      const response = await api.get('/loyalty/expiring', {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch expiring points');
    }
  }

  async getReferralInfo(): Promise<{
    referralCode: string;
    referralsCount: number;
    pointsEarned: number;
    pendingReferrals: number;
    referralBonus: number;
  }> {
    try {
      const response = await api.get('/loyalty/referral');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch referral information');
    }
  }

  async submitReferral(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await api.post('/loyalty/referral', { email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to submit referral');
    }
  }

  async getLoyaltyStats(): Promise<{
    totalMembers: number;
    averagePoints: number;
    topTierPercentage: number;
    mostPopularReward: LoyaltyReward;
    userRanking: number;
  }> {
    try {
      const response = await api.get('/loyalty/stats');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch loyalty statistics');
    }
  }

  async getBirthdayReward(): Promise<LoyaltyReward | null> {
    try {
      const response = await api.get('/loyalty/birthday-reward');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No birthday reward available
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch birthday reward');
    }
  }

  async claimBirthdayReward(): Promise<RedeemedReward> {
    try {
      const response: AxiosResponse<RedeemedReward> = await api.post('/loyalty/birthday-reward/claim');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to claim birthday reward');
    }
  }
}

export const loyaltyService = new LoyaltyServiceClass();
export default loyaltyService;