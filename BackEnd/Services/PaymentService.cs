using BackEnd.DTOs.Payment;
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

        public PaymentService(
            IRepository<Registration> registrationRepository,
            IRepository<InstallmentSchedule> installmentRepository,
            IRepository<CourseBatch> batchRepository)
        {
            _registrationRepository = registrationRepository;
            _installmentRepository = installmentRepository;
            _batchRepository = batchRepository;
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

            return ToPaymentResponse(registration);
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
                PaymentMethod = registration.PaymentMethod,
                TotalAmount = registration.TotalAmount,
                PaidAmount = registration.PaidAmount,
                RemainingAmount = Math.Max(0, registration.TotalAmount - registration.PaidAmount),
                PaymentStatus = registration.PaymentStatus,
                RegistrationStatus = registration.RegistrationStatus,
                PaidAt = registration.PaidAt,
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
