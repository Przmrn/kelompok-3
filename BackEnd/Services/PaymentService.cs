using BackEnd.DTOs.Payment;
using BackEnd.Data;
using Microsoft.EntityFrameworkCore;
using BackEnd.Exceptions;
using BackEnd.Models;
using BackEnd.Repositories;

namespace BackEnd.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IRepository<Registration> _registrationRepository;
        private readonly IRepository<InstallmentSchedule> _installmentRepository;
        private readonly IRepository<CourseBatch> _batchRepository;
        private readonly ILogger<PaymentService> _logger;
        private readonly CourseDbContext _context;

        public PaymentService(
            IRepository<Registration> registrationRepository,
            IRepository<InstallmentSchedule> installmentRepository,
            IRepository<CourseBatch> batchRepository,
            ILogger<PaymentService> logger,
            CourseDbContext context)
        {
            _registrationRepository = registrationRepository;
            _installmentRepository = installmentRepository;
            _batchRepository = batchRepository;
            _logger = logger;
            _context = context;
        }

        public async Task<PaymentResponseDto?> GetByRegistrationIdAsync(long registrationId)
        {
            var registrations = await _registrationRepository.GetAllAsync("InstallmentSchedules");
            var registration = registrations.FirstOrDefault(r => r.Id == registrationId);
            return registration == null ? null : ToPaymentResponse(registration);
        }

        public async Task<PaymentResponseDto> ConfirmUpfrontPaymentAsync(long registrationId, decimal? paidAmount)
        {
            var registrations = await _registrationRepository.GetAllAsync("InstallmentSchedules");
            var registration = registrations.FirstOrDefault(r => r.Id == registrationId)
                ?? throw new NotFoundException("Pendaftaran tidak ditemukan.");

            if (registration.PaymentMethod != PaymentMethods.UPFRONT)
                throw new AppException("Pendaftaran ini tidak menggunakan pembayaran Upfront.");

            if (registration.RegistrationStatus == RegistrationStatus.CANCELLED)
                throw new AppException("Pendaftaran yang dibatalkan tidak dapat dikonfirmasi pembayarannya.");

            if (registration.PaymentStatus == PaymentStatus.PAID)
                throw new AppException("Pembayaran Upfront sudah dikonfirmasi.");

            decimal amount = paidAmount ?? registration.TotalAmount;
            ValidatePaidAmount(amount, registration.TotalAmount);

            if (amount != registration.TotalAmount)
                throw new AppException("Pembayaran Upfront harus sama dengan total tagihan.");

            registration.PaidAmount = amount;
            registration.PaidAt = DateTime.UtcNow;
            registration.PaymentStatus = PaymentStatus.PAID;
            registration.RegistrationStatus = RegistrationStatus.CONFIRMED;

            _registrationRepository.Update(registration);
            await _registrationRepository.SaveChangesAsync();

            _logger.LogInformation("Pembayaran UPFRONT dikonfirmasi untuk registration {RegistrationId} sebesar {Amount}", registrationId, amount);

            return ToPaymentResponse(registration);
        }

        public async Task<PaymentResponseDto> ConfirmInstallmentPaymentAsync(long scheduleId, decimal? paidAmount)
        {
            var schedules = await _installmentRepository.GetAllAsync("Registration,Registration.InstallmentSchedules");
            var schedule = schedules.FirstOrDefault(s => s.Id == scheduleId)
                ?? throw new NotFoundException("Jadwal cicilan tidak ditemukan.");

            var registration = schedule.Registration
                ?? throw new NotFoundException("Pendaftaran cicilan tidak ditemukan.");

            if (registration.PaymentMethod != PaymentMethods.INSTALLMENT)
                throw new AppException("Pendaftaran ini tidak menggunakan pembayaran cicilan.");

            if (registration.RegistrationStatus == RegistrationStatus.CANCELLED)
                throw new AppException("Pendaftaran yang dibatalkan tidak dapat menerima pembayaran.");

            if (schedule.InstallmentStatus == InstallmentStatus.PAID || schedule.PaidAmount >= schedule.Amount)
                throw new AppException("Cicilan ini sudah dibayar.");

            bool previousInstallmentUnpaid = registration.InstallmentSchedules.Any(s =>
                s.InstallmentNumber < schedule.InstallmentNumber && s.PaidAmount < s.Amount);

            if (previousInstallmentUnpaid)
                throw new AppException("Cicilan sebelumnya harus dibayar terlebih dahulu.");

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (today > schedule.DueDate.AddDays(14))
                throw new AppException("Batas pembayaran cicilan telah terlewati.");

            decimal remainingScheduleAmount = schedule.Amount - schedule.PaidAmount;
            decimal amount = paidAmount ?? remainingScheduleAmount;
            ValidatePaidAmount(amount, remainingScheduleAmount);

            schedule.PaidAmount += amount;
            schedule.PaidAt = DateTime.UtcNow;

            if (schedule.PaidAmount >= schedule.Amount)
            {
                schedule.PaidAmount = schedule.Amount;
                schedule.InstallmentStatus = InstallmentStatus.PAID;
            }

            registration.PaidAmount = registration.InstallmentSchedules.Sum(s => s.PaidAmount);
            registration.PaidAt = DateTime.UtcNow;

            if (registration.PaidAmount > registration.TotalAmount)
                throw new AppException("Total pembayaran melebihi tagihan pendaftaran.");

            bool hasOverdueInstallment = registration.InstallmentSchedules.Any(s =>
                s.InstallmentStatus == InstallmentStatus.OVERDUE && s.PaidAmount < s.Amount);

            registration.RegistrationStatus = RegistrationStatus.CONFIRMED;
            registration.PaymentStatus = registration.PaidAmount == registration.TotalAmount
                ? PaymentStatus.PAID
                : hasOverdueInstallment
                    ? PaymentStatus.OVERDUE
                    : PaymentStatus.PARTIALLY_PAID;

            _installmentRepository.Update(schedule);
            _registrationRepository.Update(registration);
            await _registrationRepository.SaveChangesAsync();

            _logger.LogInformation("Pembayaran cicilan {ScheduleId} (registration {RegistrationId}) dikonfirmasi sebesar {Amount}", scheduleId, registration.Id, amount);

            return ToPaymentResponse(registration);
        }

        public async Task<PaymentResponseDto> ConfirmRefundAsync(long registrationId, long userId, string reference)
        {
            reference = reference.Trim();
            if (reference.Length is < 1 or > 100) throw new AppException("Isi referensi pengembalian dana, maksimal 100 karakter.");
            var updated = await _context.Registrations.Where(r => r.Id == registrationId &&
                    r.RegistrationStatus == RegistrationStatus.CANCELLED && r.RefundAmount > 0 && r.RefundedAt == null)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(r => r.RefundedAt, DateTime.UtcNow)
                    .SetProperty(r => r.RefundedByUserId, userId)
                    .SetProperty(r => r.RefundReference, reference));
            if (updated != 1) throw new AppException("Refund tidak tersedia atau sudah dikonfirmasi.", 409);
            _logger.LogInformation("Refund registration {RegistrationId} dikonfirmasi oleh admin {UserId}", registrationId, userId);
            return (await GetByRegistrationIdAsync(registrationId))!;
        }

        public async Task ProcessOverdueRegistrationsAsync()
        {
            var registrations = await _registrationRepository.GetAllAsync("Batch,InstallmentSchedules");
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var affectedBatchIds = new HashSet<long>();

            foreach (var registration in registrations)
            {
                if (registration.RegistrationStatus == RegistrationStatus.CANCELLED ||
                    registration.RegistrationStatus == RegistrationStatus.COMPLETED ||
                    registration.PaymentMethod != PaymentMethods.INSTALLMENT)
                {
                    continue;
                }

                bool shouldCancel = false;

                foreach (var schedule in registration.InstallmentSchedules)
                {
                    if (schedule.InstallmentStatus == InstallmentStatus.PAID || schedule.PaidAmount >= schedule.Amount)
                        continue;

                    if (today > schedule.DueDate)
                        schedule.InstallmentStatus = InstallmentStatus.OVERDUE;

                    if (today > schedule.DueDate.AddDays(14))
                        shouldCancel = true;
                }

                bool hasOverdueInstallment = registration.InstallmentSchedules.Any(s =>
                    s.InstallmentStatus == InstallmentStatus.OVERDUE && s.PaidAmount < s.Amount);

                if (shouldCancel)
                {
                    registration.RegistrationStatus = RegistrationStatus.CANCELLED;
                    registration.CancelledAt = DateTime.UtcNow;
                    registration.CancellationReason = "Batas pembayaran cicilan terlewati lebih dari 14 hari";
                    registration.RefundAmount = 0;
                    registration.RefundPercentage = 0;
                    registration.PaymentStatus = PaymentStatus.OVERDUE;
                    affectedBatchIds.Add(registration.BatchId);
                }
                else if (hasOverdueInstallment)
                {
                    registration.PaymentStatus = PaymentStatus.OVERDUE;
                }
                else if (registration.PaidAmount >= registration.TotalAmount)
                {
                    registration.PaymentStatus = PaymentStatus.PAID;
                }
                else if (registration.PaidAmount > 0)
                {
                    registration.PaymentStatus = PaymentStatus.PARTIALLY_PAID;
                }
                else
                {
                    registration.PaymentStatus = PaymentStatus.PENDING;
                }

                _registrationRepository.Update(registration);
            }

            await _registrationRepository.SaveChangesAsync();

            foreach (var batchId in affectedBatchIds)
            {
                var batch = await _batchRepository.GetByIdAsync(batchId);

                if (batch == null)
                    continue;

                int activeCount = await _registrationRepository.CountAsync(r =>
                    r.BatchId == batchId &&
                    (r.RegistrationStatus == RegistrationStatus.PENDING ||
                     r.RegistrationStatus == RegistrationStatus.CONFIRMED));

                batch.CourseStatus = activeCount >= batch.MaxSeats
                    ? CourseBatchStatus.FULL
                    : CourseBatchStatus.OPEN;

                _batchRepository.Update(batch);
            }

            await _batchRepository.SaveChangesAsync();
            _logger.LogInformation("Pemeriksaan keterlambatan selesai; {BatchCount} batch diperbarui kapasitasnya", affectedBatchIds.Count);
        }

        private static void ValidatePaidAmount(decimal amount, decimal maximumAmount)
        {
            if (amount <= 0)
                throw new AppException("Jumlah pembayaran harus lebih besar dari nol.");

            if (amount > maximumAmount)
                throw new AppException("Jumlah pembayaran melebihi jumlah tagihan.");
        }

        private static PaymentResponseDto ToPaymentResponse(Registration registration)
        {
            return new PaymentResponseDto
            {
                RegistrationId = registration.Id,
                RegistrationNumber = registration.RegistrationNumber,
                PaymentMethod = registration.PaymentMethod.ToString(),
                TotalAmount = registration.TotalAmount,
                PaidAmount = registration.PaidAmount,
                RemainingAmount = Math.Max(0, registration.TotalAmount - registration.PaidAmount),
                PaymentStatus = registration.PaymentStatus,
                RegistrationStatus = registration.RegistrationStatus,
                PaidAt = registration.PaidAt,
                CancelledAt = registration.CancelledAt,
                DaysBeforeBatchStart = registration.DaysBeforeBatchStart,
                RefundPercentage = registration.RefundPercentage,
                RefundAmount = registration.RefundAmount,
                CancellationReason = registration.CancellationReason,
                RefundedAt = registration.RefundedAt,
                RefundedByUserId = registration.RefundedByUserId,
                RefundReference = registration.RefundReference,

                InstallmentSchedules = registration.InstallmentSchedules
                    .OrderBy(s => s.InstallmentNumber)
                    .Select(s => new InstallmentScheduleDto
                    {
                        Id = s.Id,
                        RegistrationId = s.RegistrationId,
                        InstallmentNumber = s.InstallmentNumber,
                        DueDate = s.DueDate,
                        Amount = s.Amount,
                        PaidAmount = s.PaidAmount,
                        RemainingAmount = Math.Max(0, s.Amount - s.PaidAmount),
                        InstallmentStatus = s.InstallmentStatus,
                        PaidAt = s.PaidAt
                    })
                    .ToList()
            };
        }
    }
}
