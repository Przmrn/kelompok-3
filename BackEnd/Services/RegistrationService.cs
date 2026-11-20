using BackEnd.DTOs.Registration;
using BackEnd.Models;
using BackEnd.Repositories;

namespace BackEnd.Services
{
    public class RegistrationService : IRegistrationService
    {
        private readonly IRepository<Registration> _registrationRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly IRepository<CourseBatch> _batchRepository;
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<Location> _locationRepository;
        private readonly IRepository<InstallmentSchedule> _installmentRepository;

        public RegistrationService(
            IRepository<Registration> registrationRepository,
            IRepository<Student> studentRepository,
            IRepository<CourseBatch> batchRepository,
            IRepository<Course> courseRepository,
            IRepository<Location> locationRepository,
            IRepository<InstallmentSchedule> installmentRepository
        )
        {
            _registrationRepository = registrationRepository;
            _studentRepository = studentRepository;
            _batchRepository = batchRepository;
            _courseRepository = courseRepository;
            _locationRepository = locationRepository;
            _installmentRepository = installmentRepository;
        }

        // CREATE REGISTRATION
        public async Task<RegistrationDetailDto> CreateAsync(
            long userId,
            RegistrationCreateDto dto
        )
        {
            // 1. Cari Student berdasarkan UserId dari JWT
            var students = await _studentRepository.FindAsync(
                s => s.UserId == userId
            );

            var student = students.FirstOrDefault()
                ?? throw new Exception("Student tidak ditemukan.");

            // 2. Validasi payment method
            if (dto.PaymentMethod != PaymentMethods.UPFRONT &&
                dto.PaymentMethod != PaymentMethods.INSTALLMENT)
            {
                throw new Exception("Metode pembayaran tidak valid.");
            }

            // 3. Validasi tenor
            if (dto.PaymentMethod == PaymentMethods.INSTALLMENT)
            {
                if (dto.InstallmentTenor != 3 &&
                    dto.InstallmentTenor != 6 &&
                    dto.InstallmentTenor != 12)
                {
                    throw new Exception(
                        "Tenor cicilan harus 3, 6, atau 12 bulan."
                    );
                }
            }
            else if (dto.InstallmentTenor != null)
            {
                throw new Exception(
                    "Pembayaran UPFRONT tidak menggunakan tenor."
                );
            }

            // 4. Cari Batch
            var batch = await _batchRepository.GetByIdAsync(dto.BatchId)
                ?? throw new Exception("Batch tidak ditemukan.");

            // 5. Pastikan batch masih OPEN
            if (batch.CourseStatus != CourseBatchStatus.OPEN)
            {
                throw new Exception("Batch tidak tersedia.");
            }

            // 6. Cari Course
            var course = await _courseRepository.GetByIdAsync(batch.CourseId)
                ?? throw new Exception("Course tidak ditemukan.");

            // 7. Cek registrasi aktif Student pada Batch yang sama
            var existingRegistrations =
                await _registrationRepository.FindAsync(r =>
                    r.StudentId == student.Id &&
                    r.BatchId == batch.Id &&
                    (r.RegistrationStatus == RegistrationStatus.PENDING ||
                     r.RegistrationStatus == RegistrationStatus.CONFIRMED)
                );

            if (existingRegistrations.Any())
            {
                throw new Exception(
                    "Anda sudah terdaftar pada batch ini."
                );
            }

            // 8. Ambil seluruh registrasi pada Batch
            var batchRegistrations =
                await _registrationRepository.FindAsync(
                    r => r.BatchId == batch.Id
                );

            var activeRegistrations = batchRegistrations
                .Where(r =>
                    r.RegistrationStatus == RegistrationStatus.PENDING ||
                    r.RegistrationStatus == RegistrationStatus.CONFIRMED
                )
                .ToList();

            // 9. Validasi kapasitas
            if (activeRegistrations.Count >= batch.MaxSeats)
            {
                batch.CourseStatus = CourseBatchStatus.FULL;

                _batchRepository.Update(batch);
                await _batchRepository.SaveChangesAsync();

                throw new Exception("Kapasitas batch sudah penuh.");
            }

            // 10. Generate Queue Number
            int queueNumber = batchRegistrations
                .Select(r => r.QueueNumber)
                .DefaultIfEmpty(0)
                .Max() + 1;

            // 11. Ambil Base Price dari Course
            decimal basePrice = course.BasePrice;

            // 12. Hitung Early Bird Discount
            decimal discount = CalculateDiscount(
                queueNumber,
                basePrice
            );

            // 13. Hitung pajak 11% setelah diskon
            decimal taxableAmount = basePrice - discount;

            decimal taxRate = 11m;

            decimal taxAmount = Math.Round(
                taxableAmount * taxRate / 100m,
                2,
                MidpointRounding.AwayFromZero
            );

            // 14. Hitung total
            decimal totalAmount = taxableAmount + taxAmount;

            // 15. Buat Registration
            var registrationDate = DateTime.UtcNow;

            var registration = new Registration
            {
                StudentId = student.Id,
                BatchId = batch.Id,

                RegistrationNumber = GenerateRegistrationNumber(),

                RegistrationDate = registrationDate,

                QueueNumber = queueNumber,

                BasePrice = basePrice,

                EarlyBirdDiscount = discount,

                TaxRate = taxRate,

                TaxAmount = taxAmount,

                TotalAmount = totalAmount,

                PaymentMethod = dto.PaymentMethod,

                InstallmentTenor = dto.InstallmentTenor,

                PaymentStatus = PaymentStatus.PENDING,

                RegistrationStatus = RegistrationStatus.PENDING,

                PaidAmount = 0
            };

            await _registrationRepository.AddAsync(registration);
            await _registrationRepository.SaveChangesAsync();

            // 16. Buat jadwal cicilan jika menggunakan INSTALLMENT
            if (dto.PaymentMethod == PaymentMethods.INSTALLMENT)
            {
                var schedules = GenerateInstallmentSchedules(
                    registration.Id,
                    totalAmount,
                    dto.InstallmentTenor!.Value,
                    registrationDate
                );

                await _installmentRepository.AddRangeAsync(schedules);
                await _installmentRepository.SaveChangesAsync();
            }

            // 17. Update status batch jika kapasitas sudah penuh
            if (activeRegistrations.Count + 1 >= batch.MaxSeats)
            {
                batch.CourseStatus = CourseBatchStatus.FULL;

                _batchRepository.Update(batch);
                await _batchRepository.SaveChangesAsync();
            }

            return await BuildDetailAsync(registration);
        }

        // HITUNG DISKON EARLY BIRD
        private decimal CalculateDiscount(
            int queueNumber,
            decimal basePrice
        )
        {
            decimal discountRate = 0;
            decimal maxDiscount = 0;

            if (queueNumber >= 1 && queueNumber <= 3)
            {
                discountRate = 10m;
                maxDiscount = 150000m;
            }
            else if (queueNumber >= 4 && queueNumber <= 7)
            {
                discountRate = 5m;
                maxDiscount = 75000m;
            }

            decimal discount = basePrice * discountRate / 100m;

            return Math.Min(discount, maxDiscount);
        }

        // GENERATE REGISTRATION NUMBER
        private string GenerateRegistrationNumber()
        {
            return $"REG-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        }

        // GENERATE INSTALLMENT SCHEDULES
        private List<InstallmentSchedule> GenerateInstallmentSchedules(
            long registrationId,
            decimal totalAmount,
            int tenor,
            DateTime registrationDate
        )
        {
            var schedules = new List<InstallmentSchedule>();

            decimal roundedInstallment =
                Math.Ceiling((totalAmount / tenor) / 1000m) * 1000m;

            decimal remainingAmount = totalAmount;

            for (int i = 1; i <= tenor; i++)
            {
                decimal installmentAmount;

                if (i == tenor)
                {
                    installmentAmount = remainingAmount;
                }
                else
                {
                    installmentAmount = Math.Min(
                        roundedInstallment,
                        remainingAmount
                    );
                }

                remainingAmount -= installmentAmount;

                schedules.Add(new InstallmentSchedule
                {
                    RegistrationId = registrationId,

                    InstallmentNumber = i,

                    DueDate = DateOnly.FromDateTime(
                        registrationDate.AddMonths(i - 1)
                    ),

                    Amount = installmentAmount,

                    PaidAmount = 0,

                    InstallmentStatus = InstallmentStatus.PENDING
                });
            }

            return schedules;
        }

        // GET MY REGISTRATIONS
        public async Task<IEnumerable<RegistrationDetailDto>>
            GetMyRegistrationsAsync(long userId)
        {
            var students = await _studentRepository.FindAsync(
                s => s.UserId == userId
            );

            var student = students.FirstOrDefault();
            if (student == null) return Array.Empty<RegistrationDetailDto>();

            var registrations = await _registrationRepository.FindAsync(
                r => r.StudentId == student.Id
            );

            var results = new List<RegistrationDetailDto>();

            foreach (var registration in registrations)
            {
                results.Add(await BuildDetailAsync(registration));
            }

            return results;
        }

        // GET REGISTRATION BY ID
        public async Task<RegistrationDetailDto> GetByIdAsync(
            long registrationId,
            long userId,
            bool isAdmin
        )
        {
            var registration =
                await _registrationRepository.GetByIdAsync(registrationId)
                ?? throw new Exception("Registration tidak ditemukan.");

            if (!isAdmin)
            {
                var students = await _studentRepository.FindAsync(
                    s => s.UserId == userId
                );

                var student = students.FirstOrDefault()
                    ?? throw new Exception("Student tidak ditemukan.");

                if (registration.StudentId != student.Id)
                {
                    throw new UnauthorizedAccessException(
                        "Anda tidak memiliki akses ke registration ini."
                    );
                }
            }

            return await BuildDetailAsync(registration);
        }

        public async Task<bool> CancelAsync(long registrationId, long userId, bool isAdmin)
        {
            var registration = await _registrationRepository.GetByIdAsync(registrationId)
                ?? throw new Exception("Registration tidak ditemukan.");

            if (!isAdmin)
            {
                var student = (await _studentRepository.FindAsync(s => s.UserId == userId)).FirstOrDefault()
                    ?? throw new Exception("Student tidak ditemukan.");

                if (registration.StudentId != student.Id)
                    throw new UnauthorizedAccessException("Anda tidak memiliki akses ke registration ini.");
            }

            if (registration.RegistrationStatus == RegistrationStatus.CANCELLED)
                return false;

            if (registration.RegistrationStatus == RegistrationStatus.COMPLETED)
                throw new Exception("Registration yang sudah selesai tidak dapat dibatalkan.");

            registration.RegistrationStatus = RegistrationStatus.CANCELLED;
            _registrationRepository.Update(registration);

            var batch = await _batchRepository.GetByIdAsync(registration.BatchId);
            if (batch != null && batch.CourseStatus == CourseBatchStatus.FULL)
            {
                var activeCount = await _registrationRepository.CountAsync(r =>
                    r.BatchId == batch.Id &&
                    (r.RegistrationStatus == RegistrationStatus.PENDING ||
                     r.RegistrationStatus == RegistrationStatus.CONFIRMED));
                if (activeCount < batch.MaxSeats)
                {
                    batch.CourseStatus = CourseBatchStatus.OPEN;
                    _batchRepository.Update(batch);
                }
            }

            await _registrationRepository.SaveChangesAsync();
            return true;
        }

        // GET ALL REGISTRATIONS (ADMIN)
        public async Task<IEnumerable<RegistrationDetailDto>> GetAllAsync()
        {
            var registrations =
                await _registrationRepository.GetAllAsync();

            var results = new List<RegistrationDetailDto>();

            foreach (var registration in registrations)
            {
                results.Add(await BuildDetailAsync(registration));
            }

            return results;
        }

        // BUILD REGISTRATION DETAIL
        private async Task<RegistrationDetailDto> BuildDetailAsync(
            Registration registration
        )
        {
            var batch = await _batchRepository.GetByIdAsync(
                registration.BatchId
            ) ?? throw new Exception("Batch tidak ditemukan.");

            var course = await _courseRepository.GetByIdAsync(
                batch.CourseId
            ) ?? throw new Exception("Course tidak ditemukan.");

            var location = await _locationRepository.GetByIdAsync(
                batch.LocationId
            ) ?? throw new Exception("Location tidak ditemukan.");

            var schedules = await _installmentRepository.FindAsync(
                s => s.RegistrationId == registration.Id
            );

            return new RegistrationDetailDto
            {
                Id = registration.Id,
                StudentId = registration.StudentId,
                PaidAt = registration.PaidAt,

                RegistrationNumber = registration.RegistrationNumber,

                RegistrationDate = registration.RegistrationDate,

                QueueNumber = registration.QueueNumber,

                BatchId = batch.Id,

                BatchName = batch.BatchName,

                BasePrice = registration.BasePrice,

                EarlyBirdDiscount = registration.EarlyBirdDiscount,

                TaxRate = registration.TaxRate,

                TaxAmount = registration.TaxAmount,

                TotalAmount = registration.TotalAmount,

                PaidAmount = registration.PaidAmount,

                PaymentMethod = registration.PaymentMethod,

                InstallmentTenor = registration.InstallmentTenor,

                PaymentStatus = registration.PaymentStatus,

                RegistrationStatus = registration.RegistrationStatus,

                CourseSyllabus = course.Syllabus,

                DurationHours = course.DurationHours,

                StartDate = batch.StartDate,

                EndDate = batch.EndDate,

                StartTime = batch.StartTime,

                EndTime = batch.EndTime,

                LocationName = location.Name,

                LocationAddress = location.Address,

                Installments = schedules
                    .OrderBy(s => s.InstallmentNumber)
                    .Select(s => new InstallmentDetailDto
                    {
                        Id = s.Id,
                        InstallmentNumber = s.InstallmentNumber,
                        DueDate = s.DueDate,
                        Amount = s.Amount,
                        PaidAmount = s.PaidAmount,
                        PaidAt = s.PaidAt,
                        InstallmentStatus = s.InstallmentStatus
                    })
                    .ToList()
            };
        }

        // PAYMENT
        public async Task<RegistrationDetailDto> PayAsync(
            long registrationId,
            long userId,
            RegistrationPaymentDto dto
        )
        {
            var students = await _studentRepository.FindAsync(
                s => s.UserId == userId
            );

            var student = students.FirstOrDefault()
                ?? throw new Exception("Student tidak ditemukan.");

            var registration =
                await _registrationRepository.GetByIdAsync(registrationId)
                ?? throw new Exception("Registration tidak ditemukan.");

            if (registration.StudentId != student.Id)
            {
                throw new UnauthorizedAccessException(
                    "Anda tidak memiliki akses ke registration ini."
                );
            }

            if (registration.RegistrationStatus != RegistrationStatus.PENDING &&
                registration.RegistrationStatus != RegistrationStatus.CONFIRMED)
            {
                throw new Exception("Registration tidak dapat menerima pembayaran.");
            }

            if (dto.Amount <= 0)
            {
                throw new Exception("Nominal pembayaran tidak valid.");
            }

            if (registration.PaymentMethod == PaymentMethods.UPFRONT)
            {
                decimal remaining = registration.TotalAmount - registration.PaidAmount;

                if (dto.Amount != remaining)
                {
                    throw new Exception(
                        $"Pembayaran UPFRONT harus sebesar Rp{remaining:N0}."
                    );
                }

                registration.PaidAmount += dto.Amount;

                registration.PaymentStatus = PaymentStatus.PAID;

                registration.RegistrationStatus = RegistrationStatus.CONFIRMED;

                registration.PaidAt ??= DateTime.UtcNow;
            }
            else if (registration.PaymentMethod == PaymentMethods.INSTALLMENT)
            {
                var schedules = await _installmentRepository.FindAsync(
                    s => s.RegistrationId == registration.Id
                );

                var nextInstallment = schedules
                    .OrderBy(s => s.InstallmentNumber)
                    .FirstOrDefault(s =>
                        s.InstallmentStatus != InstallmentStatus.PAID
                    );

                if (nextInstallment == null)
                {
                    throw new Exception("Semua cicilan sudah dibayar.");
                }

                decimal remainingInstallment =
                    nextInstallment.Amount - nextInstallment.PaidAmount;

                if (dto.Amount != remainingInstallment)
                {
                    throw new Exception(
                        $"Pembayaran cicilan harus sebesar Rp{remainingInstallment:N0}."
                    );
                }

                nextInstallment.PaidAmount += dto.Amount;

                nextInstallment.PaidAt = DateTime.UtcNow;

                nextInstallment.InstallmentStatus = InstallmentStatus.PAID;

                registration.PaidAmount += dto.Amount;

                registration.PaidAt ??= DateTime.UtcNow;

                registration.RegistrationStatus = RegistrationStatus.CONFIRMED;

                bool allPaid = schedules.All(
                    s => s.InstallmentStatus == InstallmentStatus.PAID ||
                         s.Id == nextInstallment.Id
                );

                registration.PaymentStatus = allPaid
                    ? PaymentStatus.PAID
                    : PaymentStatus.PARTIALLY_PAID;

                _installmentRepository.Update(nextInstallment);
            }

            _registrationRepository.Update(registration);

            await _registrationRepository.SaveChangesAsync();

            return await BuildDetailAsync(registration);
        }
    }
}