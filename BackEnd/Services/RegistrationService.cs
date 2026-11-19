
using BackEnd.Models;
using BackEnd.Repositories;

namespace BackEnd.Services
{
    public class RegistrationService : IRegistrationService
    {
        private readonly IRepository<Registration> _registrationRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<CourseBatch> _batchRepository;
        private readonly IRepository<InstallmentSchedule> _installmentRepository;

        public RegistrationService(
            IRepository<Registration> registrationRepository,
            IRepository<Student> studentRepository,
            IRepository<CourseBatch> batchRepository,
            IRepository<InstallmentSchedule> installmentRepository)
        {
            _registrationRepository = registrationRepository;
            _studentRepository = studentRepository;
            _batchRepository = batchRepository;
            _installmentRepository = installmentRepository;
        }

        public async Task<IEnumerable<Registration>> GetAllAsync()
        {
            return await _registrationRepository.GetAllAsync(
                "Student,Batch,Batch.Course,Batch.Location,InstallmentSchedules"
            );
        }

        public async Task<Registration?> GetByIdAsync(long id)
        {
            var registrations = await _registrationRepository.GetAllAsync(
                "Student,Batch,Batch.Course,Batch.Location,InstallmentSchedules"
            );

            return registrations.FirstOrDefault(r => r.Id == id);
        }

        public async Task<IEnumerable<Registration>> GetByStudentIdAsync(
            long studentId)
        {
            var registrations = await _registrationRepository.GetAllAsync(
                "Student,Batch,Batch.Course,Batch.Location,InstallmentSchedules"
            );

            return registrations.Where(r => r.StudentId == studentId);
        }

        public async Task<Registration> CreateAsync(
            long studentId,
            long batchId,
            string paymentMethod,
            int? installmentTenor)
        {
            var studentExists = await _studentRepository.ExistsAsync(
                s => s.Id == studentId
            );

            if (!studentExists)
                throw new BackEnd.Exceptions.AppException("Student tidak ditemukan.");

            var batches = await _batchRepository.GetAllAsync("Course");

            var batch = batches.FirstOrDefault(b => b.Id == batchId);

            if (batch == null)
                throw new BackEnd.Exceptions.AppException("Batch tidak ditemukan.");

            if (batch.Course == null)
                throw new BackEnd.Exceptions.AppException("Data course pada batch tidak ditemukan.");

            if (batch.MaxSeats <= 0)
                throw new BackEnd.Exceptions.AppException("Kapasitas batch tidak valid.");

            if (string.IsNullOrWhiteSpace(paymentMethod))
                throw new BackEnd.Exceptions.AppException("Payment method wajib diisi.");

            var normalizedPaymentMethod =
                paymentMethod.Trim().ToUpperInvariant();

            if (normalizedPaymentMethod == PaymentMethods.UPFRONT)
            {
                if (installmentTenor.HasValue)
                {
                    throw new BackEnd.Exceptions.AppException(
                        "Upfront Payment tidak menggunakan tenor cicilan."
                    );
                }
            }
            else if (normalizedPaymentMethod == PaymentMethods.INSTALLMENT)
            {
                if (installmentTenor != 3 &&
                    installmentTenor != 6 &&
                    installmentTenor != 12)
                {
                    throw new BackEnd.Exceptions.AppException(
                        "Tenor cicilan hanya tersedia untuk 3, 6, atau 12 bulan."
                    );
                }
            }
            else
            {
                throw new BackEnd.Exceptions.AppException("Metode pembayaran tidak valid.");
            }

            var registrations = (await _registrationRepository.GetAllAsync())
                .ToList();

            var batchRegistrations = registrations
                .Where(r => r.BatchId == batchId)
                .ToList();

            var activeRegistrations = batchRegistrations
                .Where(r =>
                    r.RegistrationStatus == RegistrationStatus.PENDING ||
                    r.RegistrationStatus == RegistrationStatus.CONFIRMED)
                .ToList();

            if (activeRegistrations.Count >= batch.MaxSeats)
            {
                throw new BackEnd.Exceptions.AppException("Kapasitas batch sudah penuh.");
            }

            bool duplicateRegistration = activeRegistrations.Any(
                r => r.StudentId == studentId
            );

            if (duplicateRegistration)
            {
                throw new BackEnd.Exceptions.AppException(
                    "Student sudah memiliki pendaftaran aktif pada batch ini."
                );
            }

            // Nomor antrean tetap mengikuti nomor tertinggi, termasuk pendaftaran yang dibatalkan.
            int queueNumber = batchRegistrations
                .Select(r => r.QueueNumber)
                .DefaultIfEmpty(0)
                .Max() + 1;

            decimal discountPercentage = 0;
            decimal maximumDiscount = 0;

            if (queueNumber >= 1 && queueNumber <= 3)
            {
                discountPercentage = 0.10m;
                maximumDiscount = 150000m;
            }
            else if (queueNumber >= 4 && queueNumber <= 7)
            {
                discountPercentage = 0.05m;
                maximumDiscount = 75000m;
            }

            decimal basePrice = batch.Course.BasePrice;

            if (basePrice <= 0)
                throw new BackEnd.Exceptions.AppException("Harga course tidak valid.");

            decimal earlyBirdDiscount = Math.Min(
                basePrice * discountPercentage,
                maximumDiscount
            );

            decimal taxRate = 11m;

            decimal priceAfterDiscount =
                basePrice - earlyBirdDiscount;

            decimal taxAmount = Math.Round(
                priceAfterDiscount * taxRate / 100m,
                2,
                MidpointRounding.AwayFromZero
            );

            decimal totalAmount = priceAfterDiscount + taxAmount;

            var registrationDate = DateTime.UtcNow;

            var registration = new Registration
            {
                StudentId = studentId,
                BatchId = batchId,

                RegistrationNumber =
                    $"REG-{registrationDate:yyyyMMdd}-{batchId}-{queueNumber:D3}",

                RegistrationDate = registrationDate,
                QueueNumber = queueNumber,

                BasePrice = basePrice,
                EarlyBirdDiscount = earlyBirdDiscount,
                TaxRate = taxRate,
                TaxAmount = taxAmount,
                TotalAmount = totalAmount,

                PaymentMethod = normalizedPaymentMethod,
                InstallmentTenor = installmentTenor,

                PaidAmount = 0,
                PaidAt = null,

                PaymentStatus = PaymentStatus.PENDING,
                RegistrationStatus = RegistrationStatus.PENDING
            };

            if (normalizedPaymentMethod == PaymentMethods.INSTALLMENT)
            {
                int tenor = installmentTenor!.Value;

                decimal regularInstallment =
                    Math.Ceiling((totalAmount / tenor) / 1000m) * 1000m;

                for (int i = 1; i <= tenor; i++)
                {
                    decimal installmentAmount = i == tenor
                        ? totalAmount - (regularInstallment * (tenor - 1))
                        : regularInstallment;

                    var schedule = new InstallmentSchedule
                    {
                        InstallmentNumber = i,

                        DueDate = DateOnly
                            .FromDateTime(registrationDate)
                            .AddMonths(i),

                        Amount = installmentAmount,
                        PaidAmount = 0,
                        PaidAt = null,

                        InstallmentStatus = InstallmentStatus.PENDING
                    };

                    registration.InstallmentSchedules.Add(schedule);
                }
            }

            batch.CourseStatus =
                activeRegistrations.Count + 1 >= batch.MaxSeats
                    ? CourseBatchStatus.FULL
                    : CourseBatchStatus.OPEN;

            _batchRepository.Update(batch);

            await _registrationRepository.AddAsync(registration);

            await _registrationRepository.SaveChangesAsync();

            return registration;
        }

        public async Task<bool> ConfirmUpfrontPaymentAsync(long registrationId)
        {
            var registration = await GetByIdAsync(registrationId);

            if (registration == null)
                return false;

            if (registration.PaymentMethod != PaymentMethods.UPFRONT)
            {
                throw new BackEnd.Exceptions.AppException(
                    "Pendaftaran ini tidak menggunakan pembayaran Upfront."
                );
            }

            if (registration.RegistrationStatus != RegistrationStatus.PENDING)
                return false;

            if (registration.PaymentStatus == PaymentStatus.PAID)
                return false;

            registration.PaidAmount = registration.TotalAmount;
            registration.PaidAt = DateTime.UtcNow;

            registration.PaymentStatus = PaymentStatus.PAID;
            registration.RegistrationStatus = RegistrationStatus.CONFIRMED;

            _registrationRepository.Update(registration);

            await _registrationRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ConfirmInstallmentPaymentAsync(
            long installmentScheduleId)
        {
            var schedules = await _installmentRepository.GetAllAsync(
                "Registration,Registration.InstallmentSchedules"
            );

            var schedule = schedules.FirstOrDefault(
                s => s.Id == installmentScheduleId
            );

            if (schedule == null)
                return false;

            var registration = schedule.Registration;

            if (registration == null)
                return false;

            if (registration.PaymentMethod != PaymentMethods.INSTALLMENT)
            {
                throw new BackEnd.Exceptions.AppException(
                    "Pendaftaran ini tidak menggunakan pembayaran cicilan."
                );
            }

            if (registration.RegistrationStatus != RegistrationStatus.PENDING &&
                registration.RegistrationStatus != RegistrationStatus.CONFIRMED)
            {
                return false;
            }

            if (schedule.InstallmentStatus == InstallmentStatus.PAID ||
                schedule.PaidAmount >= schedule.Amount)
            {
                return false;
            }

            // Cicilan harus dibayar sesuai urutan.
            bool previousInstallmentUnpaid =
                registration.InstallmentSchedules.Any(s =>
                    s.InstallmentNumber < schedule.InstallmentNumber &&
                    s.PaidAmount < s.Amount
                );

            if (previousInstallmentUnpaid)
            {
                throw new BackEnd.Exceptions.AppException(
                    "Cicilan sebelumnya harus dibayar terlebih dahulu."
                );
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            if (today > schedule.DueDate.AddDays(14))
            {
                throw new BackEnd.Exceptions.AppException(
                    "Batas pembayaran cicilan telah terlewati."
                );
            }

            schedule.PaidAmount = schedule.Amount;
            schedule.PaidAt = DateTime.UtcNow;
            registration.PaidAt = schedule.PaidAt;
            schedule.InstallmentStatus = InstallmentStatus.PAID;

            // Menghitung ulang total pembayaran berdasarkan seluruh jadwal cicilan.
            registration.PaidAmount = registration.InstallmentSchedules
                .Sum(s => s.PaidAmount);

            if (registration.PaidAmount > registration.TotalAmount)
            {
                throw new BackEnd.Exceptions.AppException(
                    "Total pembayaran melebihi tagihan pendaftaran."
                );
            }

            bool hasOverdueInstallment =
                registration.InstallmentSchedules.Any(s =>
                    s.InstallmentStatus == InstallmentStatus.OVERDUE &&
                    s.PaidAmount < s.Amount
                );

            registration.RegistrationStatus = RegistrationStatus.CONFIRMED;

            if (registration.PaidAmount == registration.TotalAmount)
            {
                registration.PaymentStatus = PaymentStatus.PAID;
            }
            else
            {
                registration.PaymentStatus = hasOverdueInstallment
                    ? PaymentStatus.OVERDUE
                    : PaymentStatus.PARTIALLY_PAID;
            }

            _installmentRepository.Update(schedule);
            _registrationRepository.Update(registration);

            await _registrationRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CancelAsync(long id)
        {
            var registration = await GetByIdAsync(id);

            if (registration == null)
                return false;

            if (registration.RegistrationStatus == RegistrationStatus.CANCELLED ||
                registration.RegistrationStatus == RegistrationStatus.COMPLETED)
            {
                return false;
            }

            registration.RegistrationStatus = RegistrationStatus.CANCELLED;

            _registrationRepository.Update(registration);

            // Simpan pembatalan sebelum menghitung ulang kapasitas.
            await _registrationRepository.SaveChangesAsync();

            await UpdateBatchCapacityAsync(registration.BatchId);

            await _registrationRepository.SaveChangesAsync();

            return true;
        }

        public async Task ProcessOverdueRegistrationsAsync()
        {
            var registrations = await _registrationRepository.GetAllAsync(
                "Batch,InstallmentSchedules"
            );

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var affectedBatchIds = new HashSet<long>();

            foreach (var registration in registrations)
            {
                if (registration.RegistrationStatus == RegistrationStatus.CANCELLED ||
                    registration.RegistrationStatus == RegistrationStatus.COMPLETED)
                {
                    continue;
                }

                if (registration.PaymentMethod != PaymentMethods.INSTALLMENT)
                    continue;

                bool shouldCancel = false;

                foreach (var schedule in registration.InstallmentSchedules)
                {
                    if (schedule.InstallmentStatus == InstallmentStatus.PAID ||
                        schedule.PaidAmount >= schedule.Amount)
                    {
                        continue;
                    }

                    if (today > schedule.DueDate)
                    {
                        schedule.InstallmentStatus = InstallmentStatus.OVERDUE;
                    }

                    if (today > schedule.DueDate.AddDays(14))
                    {
                        shouldCancel = true;
                    }
                }

                bool hasOverdueInstallment =
                    registration.InstallmentSchedules.Any(s =>
                        s.InstallmentStatus == InstallmentStatus.OVERDUE &&
                        s.PaidAmount < s.Amount
                    );

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

            // Simpan perubahan status pembayaran dan pendaftaran terlebih dahulu.
            await _registrationRepository.SaveChangesAsync();

            // Hitung ulang kapasitas untuk batch yang pendaftarannya dibatalkan.
            foreach (var batchId in affectedBatchIds)
            {
                await UpdateBatchCapacityAsync(batchId);
            }

            await _registrationRepository.SaveChangesAsync();
        }

        private async Task UpdateBatchCapacityAsync(long batchId)
        {
            var batch = await _batchRepository.GetByIdAsync(batchId);

            if (batch == null)
                return;

            int activeCount = await _registrationRepository.CountAsync(
                r =>
                    r.BatchId == batchId &&
                    (r.RegistrationStatus == RegistrationStatus.PENDING ||
                     r.RegistrationStatus == RegistrationStatus.CONFIRMED)
            );

            batch.CourseStatus = activeCount >= batch.MaxSeats
                ? CourseBatchStatus.FULL
                : CourseBatchStatus.OPEN;

            _batchRepository.Update(batch);
        }
    }
}
