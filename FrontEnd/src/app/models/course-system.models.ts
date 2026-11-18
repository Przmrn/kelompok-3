// ============================================================================
// KARSA — Offline Course Registration System
// TypeScript Models Aligned 100% with the dbdiagram.io ERD (10 Tables)
// ============================================================================

export type UserRole = 'Admin' | 'Student' | 'Instructor';

/**
 * 1. Tabel Users
 * Id (long), FullName (varchar(150) NN), Email (varchar(255) NN Unique),
 * PasswordHash (varchar(255) NN), Role (varchar(30) NN)
 */
export interface User {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

/**
 * 2. Tabel Students (One-to-One ke Users melalui UserId)
 * Id (long), UserId (long NN Unique), FullName (varchar(150) NN),
 * PhoneNumber (varchar(20)), Address (text), City (varchar(100)),
 * Province (varchar(100)), Country (varchar(100)),
 * EducationLevel (varchar(50)), Occupation (varchar(100))
 */
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

/**
 * 3. Tabel CourseCategories
 * Id (long), Name (varchar(100) NN Unique), Description (text)
 */
export interface CourseCategory {
  id: number;
  name: string;
  description: string;
}

/**
 * 4. Tabel Locations
 * Id (long), Name (varchar(150) NN), Address (text NN),
 * City (varchar(100) NN), RoomName (varchar(100))
 */
export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  roomName: string;
}

/**
 * 5. Tabel Courses
 * Id (long), CategoryId (integer NN), Title (varchar(200) NN),
 * Description (text), Syllabus (text), DurationHours (integer NN),
 * BasePrice (decimal(15,2) NN)
 */
export interface Course {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  syllabus: string;
  durationHours: number;
  basePrice: number;
}

/**
 * 6. Tabel CourseBatches
 * Id (long), CourseId (long NN), LocationId (long NN),
 * BatchName (varchar(150) NN), StartDate (date NN), EndDate (date NN),
 * StartTime (time NN), EndTime (time NN), MaxSeats (integer NN),
 * Status (varchar(30) NN: 'Open' | 'Full')
 */
export type BatchStatus = 'Open' | 'Full';

export interface CourseBatch {
  id: number;
  courseId: number;
  locationId: number;
  batchName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  maxSeats: number;  // 30
  status: BatchStatus;
}

/**
 * 7. Tabel Instructors (One-to-One ke Users melalui UserId)
 * Id (long), UserId (long NN Unique), FullName (varchar(150) NN),
 * Expertise (text), Bio (text), Email (varchar(255)), PhoneNumber (varchar(20))
 */
export interface Instructor {
  id: number;
  userId: number;
  fullName: string;
  expertise: string;
  bio: string;
  email: string;
  phoneNumber: string;
}

/**
 * 8. Tabel BatchInstructors (Pivot Many-to-Many)
 * Id (long), BatchId (long NN), InstructorId (long NN)
 */
export interface BatchInstructor {
  id: number;
  batchId: number;
  instructorId: number;
}

export type EarlyBirdTierName = 'Tier 1' | 'Tier 2' | 'Reguler';
export type PaymentMethodType = 'Upfront' | 'Installment';
export type RegistrationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
export type PaymentStatus = 'Pending' | 'PartiallyPaid' | 'Paid' | 'Failed' | 'Overdue';

/**
 * 9. Tabel Registrations
 * Id (long), StudentId (long NN), BatchId (long NN),
 * RegistrationNumber (varchar(50) NN Unique), RegistrationDate (timestamp NN),
 * QueueNumber (integer NN), BasePrice (decimal(15,2) NN),
 * EarlyBirdDiscount (decimal(15,2) NN), TaxRate (decimal(5,2) NN),
 * TaxAmount (decimal(15,2) NN), TotalAmount (decimal(15,2) NN),
 * PaymentMethod (varchar(30) NN), InstallmentTenor (integer nullable),
 * PaymentStatus (varchar(30) NN), RegistrationStatus (varchar(30) NN)
 */
export interface Registration {
  id: number;
  studentId: number;
  batchId: number;
  registrationNumber: string;
  registrationDate: string;
  queueNumber: number;
  basePrice: number;
  earlyBirdDiscount: number;
  taxRate: number; // 11.00
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  installmentTenor: 3 | 6 | 12 | null;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  // Data Pembatalan & Refund (Bab 8)
  cancelledAt?: string;
  daysBeforeBatchStart?: number;
  refundPercentage?: number;
  refundAmount?: number;
  cancellationReason?: string;
}

/**
 * 10. Tabel InstallmentSchedules
 * Id (long), RegistrationId (long NN), InstallmentNumber (integer NN),
 * DueDate (date NN), Amount (decimal(15,2) NN), PaidAt (timestamp nullable),
 * PaidAmount (decimal(15,2) NN), Status (varchar(30) NN: 'Pending' | 'Paid' | 'Overdue')
 */
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
  earlyBirdDiscount: number; // Diskon final
  priceAfterDiscount: number;
  taxRate: number; // 11
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
