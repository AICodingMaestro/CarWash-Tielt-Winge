import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  user: Schema.Types.ObjectId;
  services: {
    service: Schema.Types.ObjectId;
    quantity: number;
    price: number;
    addons?: Schema.Types.ObjectId[];
  }[];
  scheduledDate: Date;
  timeSlot: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  vehicle: {
    type: 'car' | 'suv' | 'van' | 'motorcycle';
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    licensePlate?: string;
    size?: {
      length: number;
      width: number;
      height: number;
    };
  };
  location: {
    type: 'onsite' | 'pickup' | 'mobile';
    address?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  totalAmount: number;
  discountAmount?: number;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod?: 'card' | 'cash' | 'loyalty_points' | 'bank_transfer';
  paymentIntentId?: string; // Stripe Payment Intent ID
  notes?: string;
  specialRequests?: string;
  estimatedDuration: number; // minutes
  actualStartTime?: Date;
  actualEndTime?: Date;
  rating?: {
    score: number; // 1-5
    comment?: string;
    createdAt: Date;
  };
  staff?: Schema.Types.ObjectId;
  notifications: {
    type: 'booking_confirmed' | 'reminder_24h' | 'reminder_1h' | 'in_progress' | 'completed' | 'cancelled';
    sentAt: Date;
    channel: 'email' | 'push' | 'sms';
  }[];
  cancellation?: {
    reason: string;
    cancelledBy: 'user' | 'admin' | 'system';
    cancelledAt: Date;
    refundAmount?: number;
    refundProcessed?: boolean;
  };
  attachments?: {
    type: 'before' | 'after' | 'damage' | 'other';
    url: string;
    description?: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  calculateTotal(): number;
  canBeCancelled(): boolean;
  getStatusColor(): string;
  getDurationInMinutes(): number;
  isToday(): boolean;
  isPastDue(): boolean;
  sendNotification(type: string, channel: string): void;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    services: [{
      service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      addons: [{
        type: Schema.Types.ObjectId,
        ref: 'Service',
      }],
    }],
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator: function(v: Date) {
          return v >= new Date(Date.now() - 24 * 60 * 60 * 1000); // Can't book more than 24h in the past
        },
        message: 'Booking date cannot be in the past',
      },
    },
    timeSlot: {
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
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },
    vehicle: {
      type: {
        type: String,
        enum: ['car', 'suv', 'van', 'motorcycle'],
        required: true,
      },
      make: { type: String, trim: true },
      model: { type: String, trim: true },
      year: { 
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 1,
      },
      color: { type: String, trim: true },
      licensePlate: { 
        type: String, 
        trim: true,
        uppercase: true,
        validate: {
          validator: function(v: string) {
            return !v || /^[A-Z0-9]{1,8}$/.test(v);
          },
          message: 'Please enter a valid license plate',
        },
      },
      size: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
      },
    },
    location: {
      type: {
        type: String,
        enum: ['onsite', 'pickup', 'mobile'],
        default: 'onsite',
      },
      address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        postalCode: { 
          type: String, 
          trim: true,
          validate: {
            validator: function(v: string) {
              return !v || /^\d{4}$/.test(v);
            },
            message: 'Please enter a valid Belgian postal code',
          },
        },
        country: { type: String, default: 'Belgium' },
        coordinates: {
          latitude: { 
            type: Number,
            min: -90,
            max: 90,
          },
          longitude: { 
            type: Number,
            min: -180,
            max: 180,
          },
        },
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'loyalty_points', 'bank_transfer'],
    },
    paymentIntentId: {
      type: String,
      sparse: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 15,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notifications: [{
      type: {
        type: String,
        enum: ['booking_confirmed', 'reminder_24h', 'reminder_1h', 'in_progress', 'completed', 'cancelled'],
        required: true,
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
      channel: {
        type: String,
        enum: ['email', 'push', 'sms'],
        required: true,
      },
    }],
    cancellation: {
      reason: { type: String, trim: true },
      cancelledBy: {
        type: String,
        enum: ['user', 'admin', 'system'],
      },
      cancelledAt: { type: Date },
      refundAmount: { type: Number, min: 0 },
      refundProcessed: { type: Boolean, default: false },
    },
    attachments: [{
      type: {
        type: String,
        enum: ['before', 'after', 'damage', 'other'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      description: { type: String, trim: true },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
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
bookingSchema.index({ user: 1, scheduledDate: -1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ scheduledDate: 1, 'timeSlot.start': 1 });

// Compound index for availability checking
bookingSchema.index({ 
  scheduledDate: 1, 
  'timeSlot.start': 1, 
  'timeSlot.end': 1, 
  status: 1 
});

// Method to calculate total amount
bookingSchema.methods.calculateTotal = function(): number {
  const subtotal = this.services.reduce((total: number, service: any) => {
    return total + (service.price * service.quantity);
  }, 0);
  
  return subtotal - (this.discountAmount || 0);
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function(): boolean {
  const now = new Date();
  const bookingTime = new Date(this.scheduledDate);
  const timeDiff = bookingTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return this.status === 'pending' || this.status === 'confirmed' && hoursDiff >= 2;
};

// Method to get status color
bookingSchema.methods.getStatusColor = function(): string {
  const colors = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    in_progress: '#3B82F6',
    completed: '#6B7280',
    cancelled: '#EF4444',
    no_show: '#EF4444',
  };
  return colors[this.status as keyof typeof colors] || '#6B7280';
};

// Method to get duration in minutes
bookingSchema.methods.getDurationInMinutes = function(): number {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60));
  }
  return this.estimatedDuration;
};

// Method to check if booking is today
bookingSchema.methods.isToday = function(): boolean {
  const today = new Date();
  const bookingDate = new Date(this.scheduledDate);
  return today.toDateString() === bookingDate.toDateString();
};

// Method to check if booking is past due
bookingSchema.methods.isPastDue = function(): boolean {
  const now = new Date();
  const bookingDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.timeSlot.end.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  
  return now > bookingDateTime && this.status !== 'completed' && this.status !== 'cancelled';
};

// Method to send notification
bookingSchema.methods.sendNotification = function(type: string, channel: string): void {
  this.notifications.push({
    type,
    channel,
    sentAt: new Date(),
  });
};

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;