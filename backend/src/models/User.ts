import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  profileImage?: string;
  preferredLanguage: 'nl' | 'fr' | 'en';
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  loyaltyPoints: number;
  totalBookings: number;
  role: 'customer' | 'admin' | 'staff';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  fcmTokens: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  gdprConsent: {
    marketing: boolean;
    analytics: boolean;
    dateConsented?: Date;
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    reminders: {
      beforeBooking: number; // hours before
      afterBooking: boolean;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  addLoyaltyPoints(points: number): void;
  getPublicProfile(): Partial<IUser>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^(\+32|0)[1-9]\d{8}$/.test(v); // Belgian phone number format
        },
        message: 'Please enter a valid Belgian phone number',
      },
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(v: Date) {
          return !v || v < new Date();
        },
        message: 'Date of birth must be in the past',
      },
    },
    profileImage: {
      type: String,
      default: null,
    },
    preferredLanguage: {
      type: String,
      enum: ['nl', 'fr', 'en'],
      default: 'nl',
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      postalCode: { 
        type: String, 
        trim: true,
        validate: {
          validator: function(v: string) {
            return !v || /^\d{4}$/.test(v); // Belgian postal code format
          },
          message: 'Please enter a valid Belgian postal code',
        },
      },
      country: { type: String, default: 'Belgium' },
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      default: 'customer',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fcmTokens: [{
      type: String,
    }],
    lastLoginAt: {
      type: Date,
    },
    gdprConsent: {
      marketing: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      dateConsented: { type: Date },
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      reminders: {
        beforeBooking: { type: Number, default: 24 }, // hours
        afterBooking: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for text search
userSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text' 
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Method to add loyalty points
userSchema.methods.addLoyaltyPoints = function(points: number): void {
  this.loyaltyPoints += points;
};

// Method to get public profile (excluding sensitive data)
userSchema.methods.getPublicProfile = function(): Partial<IUser> {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    profileImage: this.profileImage,
    loyaltyPoints: this.loyaltyPoints,
    totalBookings: this.totalBookings,
    preferredLanguage: this.preferredLanguage,
  };
};

export const User = mongoose.model<IUser>('User', userSchema);
export default User;