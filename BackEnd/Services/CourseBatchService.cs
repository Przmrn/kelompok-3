
using BackEnd.Models;
using BackEnd.Repositories;

namespace BackEnd.Services
{
    public class CourseBatchService : ICourseBatchService
    {
        private readonly IRepository<CourseBatch> _batchRepository;
        private readonly IRepository<Course> _courseRepository;
        private readonly IRepository<Location> _locationRepository;

        public CourseBatchService(
            IRepository<CourseBatch> batchRepository,
            IRepository<Course> courseRepository,
            IRepository<Location> locationRepository)
        {
            _batchRepository = batchRepository;
            _courseRepository = courseRepository;
            _locationRepository = locationRepository;
        }

        public async Task<IEnumerable<CourseBatch>> GetAllAsync()
        {
            return await _batchRepository.GetAllAsync(
                "Registrations");
        }

        public async Task<CourseBatch?> GetByIdAsync(long id)
        {
            var courseBatch = await _batchRepository.GetAllAsync(
                "Registrations");

            return courseBatch.FirstOrDefault(cb => cb.Id == id);
        }

        public async Task<CourseBatch> CreateAsync(CourseBatch courseBatch)
        {
            // Validasi Course
            var courseExists = await _courseRepository.ExistsAsync(
                c => c.Id == courseBatch.CourseId);

            if (!courseExists)
                throw new BackEnd.Exceptions.AppException("Course tidak ditemukan.");

            // Validasi Location
            var locationExists = await _locationRepository.ExistsAsync(
                l => l.Id == courseBatch.LocationId);

            if (!locationExists)
                throw new BackEnd.Exceptions.AppException("Location tidak ditemukan.");

            // Validasi tanggal
            if (courseBatch.StartDate > courseBatch.EndDate)
                throw new BackEnd.Exceptions.AppException("Tanggal mulai tidak boleh melebihi tanggal selesai.");

            // Validasi waktu
            if (courseBatch.StartTime >= courseBatch.EndTime)
                throw new BackEnd.Exceptions.AppException("Waktu mulai harus lebih awal dari waktu selesai.");

            // Validasi kapasitas
            if (courseBatch.MaxSeats <= 0 || courseBatch.MaxSeats > 30)
                throw new BackEnd.Exceptions.AppException("Kapasitas batch harus antara 1 sampai 30.");

            // Status awal batch
            courseBatch.CourseStatus = CourseBatchStatus.OPEN;

            await _batchRepository.AddAsync(courseBatch);
            await _batchRepository.SaveChangesAsync();

            return courseBatch;
        }

        public async Task<CourseBatch?> UpdateAsync(
            long id,
            CourseBatch courseBatch)
        {
            var existingBatch = await GetByIdAsync(id);

            if (existingBatch == null)
                return null;

            // Validasi Course
            var courseExists = await _courseRepository.ExistsAsync(
                c => c.Id == courseBatch.CourseId);

            if (!courseExists)
                throw new BackEnd.Exceptions.AppException("Course tidak ditemukan.");

            // Validasi Location
            var locationExists = await _locationRepository.ExistsAsync(
                l => l.Id == courseBatch.LocationId);

            if (!locationExists)
                throw new BackEnd.Exceptions.AppException("Location tidak ditemukan.");

            if (courseBatch.StartDate > courseBatch.EndDate)
                throw new BackEnd.Exceptions.AppException("Tanggal mulai tidak valid.");

            if (courseBatch.StartTime >= courseBatch.EndTime)
                throw new BackEnd.Exceptions.AppException("Waktu mulai tidak valid.");

            if (courseBatch.MaxSeats <= 0 || courseBatch.MaxSeats > 30)
                throw new BackEnd.Exceptions.AppException("Kapasitas batch harus antara 1 sampai 30.");

            existingBatch.CourseId = courseBatch.CourseId;
            existingBatch.LocationId = courseBatch.LocationId;
            existingBatch.BatchName = courseBatch.BatchName;
            existingBatch.StartDate = courseBatch.StartDate;
            existingBatch.EndDate = courseBatch.EndDate;
            existingBatch.StartTime = courseBatch.StartTime;
            existingBatch.EndTime = courseBatch.EndTime;
            existingBatch.MaxSeats = courseBatch.MaxSeats;

            if (existingBatch.MaxSeats < existingBatch.UsedSeats)
                throw new BackEnd.Exceptions.AppException("Kapasitas kurang dari jumlah peserta terdaftar.");
            existingBatch.CourseStatus = existingBatch.UsedSeats >= existingBatch.MaxSeats ? CourseBatchStatus.FULL : CourseBatchStatus.OPEN;
            _batchRepository.Update(existingBatch);
            await _batchRepository.SaveChangesAsync();

            return existingBatch;
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var courseBatch = await GetByIdAsync(id);

            if (courseBatch == null)
                return false;

            if (courseBatch.Registrations.Count > 0)
                throw new BackEnd.Exceptions.AppException("Jadwal yang memiliki pendaftaran tidak dapat dihapus.", 409);
            _batchRepository.Delete(courseBatch);
            await _batchRepository.SaveChangesAsync();

            return true;
        }
    }
}
