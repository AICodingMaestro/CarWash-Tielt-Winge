import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  _id: string;
  name: {
    nl: string;
    fr: string;
    en: string;
  };
  description: {
    nl: string;
    fr: string;
    en: string;
  };
  category: 'basic' | 'premium' | 'deluxe' | 'addon';
  price: number;
  duration: number; // minutes
  features: {
    nl: string[];
    fr: string[];
    en: string[];
  };
  images: string[];
  isActive: boolean;
  sortOrder: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRequired?: number; // For loyalty rewards
  isPopular: boolean;
  isNew: boolean;
  vehicleTypes: ('car' | 'suv' | 'van' | 'motorcycle')[];
  maxVehicleSize?: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  timeSlots: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  }[];
  seasonalPricing?: {
    season: 'winter' | 'spring' | 'summer' | 'autumn';
    priceMultiplier: number;
    startDate: Date;
    endDate: Date;
  }[];
  addons: Schema.Types.ObjectId[];
  requirements?: {
    nl: string[];
    fr: string[];
    en: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  getLocalizedName(language: string): string;
  getLocalizedDescription(language: string): string;
  getLocalizedFeatures(language: string): string[];
  getCurrentPrice(): number;
  isAvailableOnDay(day: string): boolean;
}

const serviceSchema = new Schema<IService>(
  {
    name: {
      nl: { type: String, required: true, trim: true },
      fr: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    description: {
      nl: { type: String, required: true, trim: true },
      fr: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    category: {
      type: String,
      enum: ['basic', 'premium', 'deluxe', 'addon'],
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 15, // minimum 15 minutes
      max: 480, // maximum 8 hours
    },
    features: {
      nl: [{ type: String, trim: true }],
      fr: [{ type: String, trim: true }],
      en: [{ type: String, trim: true }],
    },
    images: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
        },
        message: 'Please provide a valid image URL',
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPointsRequired: {
      type: Number,
      min: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    vehicleTypes: [{
      type: String,
      enum: ['car', 'suv', 'van', 'motorcycle'],
    }],
    maxVehicleSize: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    availability: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: false },
    },
    timeSlots: [{
      start: {
        type: String,
        required: true,
        validate: {
          validator: function(v: string) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: 'Time must be in HH:mm format',
        },
      },
      end: {
        type: String,
        required: true,
        validate: {
          validator: function(v: string) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: 'Time must be in HH:mm format',
        },
      },
    }],
    seasonalPricing: [{
      season: {
        type: String,
        enum: ['winter', 'spring', 'summer', 'autumn'],
      },
      priceMultiplier: {
        type: Number,
        min: 0.1,
        max: 3.0,
        default: 1.0,
      },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    }],
    addons: [{
      type: Schema.Types.ObjectId,
      ref: 'Service',
    }],
    requirements: {
      nl: [{ type: String, trim: true }],
      fr: [{ type: String, trim: true }],
      en: [{ type: String, trim: true }],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ sortOrder: 1 });
serviceSchema.index({ isPopular: 1 });
serviceSchema.index({ price: 1 });

// Text index for search
serviceSchema.index({
  'name.nl': 'text',
  'name.fr': 'text',
  'name.en': 'text',
  'description.nl': 'text',
  'description.fr': 'text',
  'description.en': 'text',
});

// Method to get localized name
serviceSchema.methods.getLocalizedName = function(language: string = 'nl'): string {
  return this.name[language as keyof typeof this.name] || this.name.nl;
};

// Method to get localized description
serviceSchema.methods.getLocalizedDescription = function(language: string = 'nl'): string {
  return this.description[language as keyof typeof this.description] || this.description.nl;
};

// Method to get localized features
serviceSchema.methods.getLocalizedFeatures = function(language: string = 'nl'): string[] {
  return this.features[language as keyof typeof this.features] || this.features.nl;
};

// Method to get current price with seasonal adjustments
serviceSchema.methods.getCurrentPrice = function(): number {
  const now = new Date();
  const currentSeason = this.seasonalPricing?.find((season: any) => 
    now >= season.startDate && now <= season.endDate
  );
  
  return currentSeason ? this.price * currentSeason.priceMultiplier : this.price;
};

// Method to check availability on a specific day
serviceSchema.methods.isAvailableOnDay = function(day: string): boolean {
  const dayLower = day.toLowerCase();
  return this.availability[dayLower as keyof typeof this.availability] || false;
};

export const Service = mongoose.model<IService>('Service', serviceSchema);
export default Service;