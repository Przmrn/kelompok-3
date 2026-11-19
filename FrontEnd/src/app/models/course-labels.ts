import type { BatchStatus, PaymentMethodType, PaymentStatus, RegistrationStatus, UserRole } from './course-system.models';

export const courseLabels = {
  role: {
    Admin: 'Admin',
    Student: 'Peserta',
    Instructor: 'Pengajar',
  } satisfies Record<UserRole, string>,
  batch: {
    Open: 'Pendaftaran dibuka',
    Full: 'Kelas penuh',
  } satisfies Record<BatchStatus, string>,
  registration: {
    Pending: 'Menunggu konfirmasi pendaftaran',
    Confirmed: 'Pendaftaran dikonfirmasi',
    Cancelled: 'Pendaftaran dibatalkan',
    Completed: 'Kelas selesai',
  } satisfies Record<RegistrationStatus, string>,
  payment: {
    Pending: 'Belum dibayar',
    PartiallyPaid: 'Dibayar sebagian',
    Paid: 'Lunas',
    Failed: 'Pembayaran gagal',
    Overdue: 'Pembayaran terlambat',
  } satisfies Record<PaymentStatus, string>,
  method: {
    Upfront: 'Sekali bayar',
    Installment: 'Cicilan',
  } satisfies Record<PaymentMethodType, string>,
};
