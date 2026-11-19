
export type UserRole = 'Admin' | 'Student' | 'Instructor';

export interface User {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface Student {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  province: string;
  country: string;
  educationLevel: string;
  occupation: string;
}

export interface CourseCategory {
  id: number;
  name: string;
  description: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  roomName: string;
}

export interface Course {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  syllabus: string;
  durationHours: number;
  basePrice: number;
}

export type BatchStatus = 'Open' | 'Full';

export interface CourseBatch {
  id: number;
  courseId: number;
  locationId: number;
  batchName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  status: BatchStatus;
}

export interface Instructor {
  id: number;
  userId: number;
  fullName: string;
  expertise: string;
  bio: string;
  email: string;
  phoneNumber: string;
}

export interface BatchInstructor {
  id: number;
  batchId: number;
  instructorId: number;
}

export type EarlyBirdTierName = 'Tier 1' | 'Tier 2' | 'Reguler';
export type PaymentMethodType = 'Upfront' | 'Installment';
export type RegistrationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
export type PaymentStatus = 'Pending' | 'PartiallyPaid' | 'Paid' | 'Failed' | 'Overdue';

export interface Registration {
  id: number;
  studentId: number;
  batchId: number;
  registrationNumber: string;
  registrationDate: string;
  queueNumber: number;
  basePrice: number;
  earlyBirdDiscount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  installmentTenor: 3 | 6 | 12 | null;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  cancelledAt?: string;
  daysBeforeBatchStart?: number;
  refundPercentage?: number;
  refundAmount?: number;
  cancellationReason?: string;
}

export interface InstallmentSchedule {
  id: number;
  registrationId: number;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAt: string | null;
  paidAmount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export interface PriceCalculationBreakdown {
  queueNumber: number;
  basePrice: number;
  discountTier: EarlyBirdTierName;
  discountPercentage: number;
  discountCap: number | null;
  rawDiscountAmount: number;
  earlyBirdDiscount: number;
  priceAfterDiscount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  installmentPreviews: {
    tenorMonths: 3 | 6 | 12;
    regularMonthlyAmount: number;
    finalMonthAmount: number;
    schedules: {
      installmentNumber: number;
      dueDate: string;
      amount: number;
    }[];
  }[];
}

export interface RefundCalculationResult {
  batchStartDate: string;
  cancellationDate: string;
  daysDifference: number;
  totalPaid: number;
  tierLabel: string;
  refundPercentage: number;
  floorAdminFee: number;
  estimatedRefundAmount: number;
  canCancel: boolean;
  reasonIfBlocked?: string;
}
