import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Booking } from '../models/Booking';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { authMiddleware, AuthRequest, staffMiddleware } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { sendPushNotification } from '../config/firebase';
import { getStripe } from '../config/stripe';

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - services
 *               - scheduledDate
 *               - timeSlot
 *               - vehicle
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     addons:
 *                       type: array
 *                       items:
 *                         type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                   end:
 *                     type: string
 *               vehicle:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [car, suv, van, motorcycle]
 *                   make:
 *                     type: string
 *                   model:
 *                     type: string
 *                   licensePlate:
 *                     type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error or time slot unavailable
 */
router.post('/', [
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.service').isMongoId().withMessage('Valid service ID required'),
  body('services.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('scheduledDate').isISO8601().withMessage('Valid date required'),
  body('timeSlot.start').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time required'),
  body('timeSlot.end').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time required'),
  body('vehicle.type').isIn(['car', 'suv', 'van', 'motorcycle']).withMessage('Valid vehicle type required'),
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { services, scheduledDate, timeSlot, vehicle, location, notes, specialRequests } = req.body;
  const user = req.user!;

  // Check if time slot is available
  const conflictingBooking = await Booking.findOne({
    scheduledDate: new Date(scheduledDate),
    $or: [
      {
        'timeSlot.start': { $lte: timeSlot.start },
        'timeSlot.end': { $gt: timeSlot.start }
      },
      {
        'timeSlot.start': { $lt: timeSlot.end },
        'timeSlot.end': { $gte: timeSlot.end }
      }
    ],
    status: { $in: ['pending', 'confirmed', 'in_progress'] }
  });

  if (conflictingBooking) {
    throw createError('Time slot is not available', 400);
  }

  // Validate and calculate pricing
  let totalAmount = 0;
  let estimatedDuration = 0;
  let loyaltyPointsEarned = 0;

  const bookingServices = [];
  for (const serviceItem of services) {
    const service = await Service.findById(serviceItem.service);
    if (!service || !service.isActive) {
      throw createError(`Service not found or inactive: ${serviceItem.service}`, 400);
    }

    const currentPrice = service.getCurrentPrice();
    const serviceTotal = currentPrice * serviceItem.quantity;
    
    totalAmount += serviceTotal;
    estimatedDuration += service.duration * serviceItem.quantity;
    loyaltyPointsEarned += service.loyaltyPointsEarned * serviceItem.quantity;

    bookingServices.push({
      service: service._id,
      quantity: serviceItem.quantity,
      price: currentPrice,
      addons: serviceItem.addons || []
    });
  }

  // Create booking
  const booking = new Booking({
    user: user._id,
    services: bookingServices,
    scheduledDate: new Date(scheduledDate),
    timeSlot,
    vehicle,
    location: location || { type: 'onsite' },
    totalAmount,
    estimatedDuration,
    loyaltyPointsEarned,
    notes,
    specialRequests,
    status: 'pending'
  });

  await booking.save();
  await booking.populate('services.service user');

  // Send confirmation notification
  if (user.fcmTokens.length > 0) {
    await sendPushNotification(
      user.fcmTokens,
      'Booking Confirmed',
      `Your booking for ${new Date(scheduledDate).toLocaleDateString()} has been confirmed.`,
      { type: 'booking_confirmed', bookingId: booking._id.toString() }
    );
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking }
  });
}));

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/', [
  query('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { status, page = 1, limit = 10 } = req.query;
  const user = req.user!;

  const filter: any = { user: user._id };
  if (status) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('services.service')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       404:
 *         description: Booking not found
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const user = req.user!;

  const booking = await Booking.findOne({ _id: id, user: user._id })
    .populate('services.service')
    .populate('staff', 'firstName lastName');

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  res.json({
    success: true,
    data: { booking }
  });
}));

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Cannot cancel booking
 *       404:
 *         description: Booking not found
 */
router.post('/:id/cancel', [
  body('reason').trim().isLength({ min: 1 }).withMessage('Cancellation reason is required')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const { reason } = req.body;
  const user = req.user!;

  const booking = await Booking.findOne({ _id: id, user: user._id });
  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (!booking.canBeCancelled()) {
    throw createError('Booking cannot be cancelled at this time', 400);
  }

  booking.status = 'cancelled';
  booking.cancellation = {
    reason,
    cancelledBy: 'user',
    cancelledAt: new Date()
  };

  await booking.save();

  // Process refund if payment was made
  if (booking.paymentStatus === 'paid' && booking.paymentIntentId) {
    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        amount: Math.round(booking.totalAmount * 100), // Convert to cents
      });

      booking.cancellation.refundAmount = booking.totalAmount;
      booking.paymentStatus = 'refunded';
      await booking.save();
    } catch (error) {
      console.error('Refund failed:', error);
      // Don't fail the cancellation if refund fails
    }
  }

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking }
  });
}));

/**
 * @swagger
 * /api/bookings/{id}/rate:
 *   post:
 *     summary: Rate a completed booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *       400:
 *         description: Cannot rate booking
 *       404:
 *         description: Booking not found
 */
router.post('/:id/rate', [
  body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const { score, comment } = req.body;
  const user = req.user!;

  const booking = await Booking.findOne({ _id: id, user: user._id });
  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (booking.status !== 'completed') {
    throw createError('Can only rate completed bookings', 400);
  }

  if (booking.rating) {
    throw createError('Booking already rated', 400);
  }

  booking.rating = {
    score,
    comment,
    createdAt: new Date()
  };

  await booking.save();

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: { booking }
  });
}));

// Staff/Admin routes

/**
 * @swagger
 * /api/bookings/admin/all:
 *   get:
 *     summary: Get all bookings (staff/admin only)
 *     tags: [Bookings, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: All bookings retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/admin/all', staffMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { status, date, page = 1, limit = 20 } = req.query;

  const filter: any = {};
  if (status) filter.status = status;
  if (date) {
    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    filter.scheduledDate = { $gte: startDate, $lt: endDate };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('services.service')
      .populate('staff', 'firstName lastName')
      .sort({ scheduledDate: 1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

/**
 * @swagger
 * /api/bookings/admin/{id}/status:
 *   put:
 *     summary: Update booking status (staff/admin only)
 *     tags: [Bookings, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *               staff:
 *                 type: string
 *               actualStartTime:
 *                 type: string
 *                 format: date-time
 *               actualEndTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       404:
 *         description: Booking not found
 */
router.put('/admin/:id/status', staffMiddleware, [
  body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  body('staff').optional().isMongoId(),
  body('actualStartTime').optional().isISO8601(),
  body('actualEndTime').optional().isISO8601()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const { status, staff, actualStartTime, actualEndTime } = req.body;

  const booking = await Booking.findById(id).populate('user');
  if (!booking) {
    throw createError('Booking not found', 404);
  }

  const oldStatus = booking.status;
  booking.status = status;

  if (staff) booking.staff = staff;
  if (actualStartTime) booking.actualStartTime = new Date(actualStartTime);
  if (actualEndTime) booking.actualEndTime = new Date(actualEndTime);

  // Award loyalty points when booking is completed
  if (status === 'completed' && oldStatus !== 'completed') {
    const user = await User.findById(booking.user);
    if (user) {
      user.addLoyaltyPoints(booking.loyaltyPointsEarned);
      user.totalBookings += 1;
      await user.save();
    }
  }

  await booking.save();

  // Send notification to user
  const user = booking.user as any;
  if (user && user.fcmTokens && user.fcmTokens.length > 0) {
    const statusMessages = {
      confirmed: 'Your booking has been confirmed',
      in_progress: 'Your car wash service has started',
      completed: 'Your car wash service is complete',
      cancelled: 'Your booking has been cancelled',
      no_show: 'You missed your appointment'
    };

    const message = statusMessages[status as keyof typeof statusMessages];
    if (message) {
      await sendPushNotification(
        user.fcmTokens,
        'Booking Update',
        message,
        { type: 'booking_update', bookingId: booking._id.toString(), status }
      );
    }
  }

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: { booking }
  });
}));

export default router;