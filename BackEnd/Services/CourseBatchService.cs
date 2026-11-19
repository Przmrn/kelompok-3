
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
                "Course,Location");
        }

        public async Task<CourseBatch?> GetByIdAsync(long id)
        {
            var courseBatch = await _batchRepository.GetAllAsync(
                "Course,Location");

            return courseBatch.FirstOrDefault(cb => cb.Id == id);
        }

        public async Task<CourseBatch> CreateAsync(CourseBatch courseBatch)
        {
            // Validasi Course
            var courseExists = await _courseRepository.ExistsAsync(
                c => c.Id == courseBatch.CourseId);

            if (!courseExists)
                throw new Exception("Course tidak ditemukan.");

            // Validasi Location
            var locationExists = await _locationRepository.ExistsAsync(
                l => l.Id == courseBatch.LocationId);

            if (!locationExists)
                throw new Exception("Location tidak ditemukan.");

            // Validasi tanggal
            if (courseBatch.StartDate > courseBatch.EndDate)
                throw new Exception("Tanggal mulai tidak boleh melebihi tanggal selesai.");

            // Validasi waktu
            if (courseBatch.StartTime >= courseBatch.EndTime)
                throw new Exception("Waktu mulai harus lebih awal dari waktu selesai.");

            // Validasi kapasitas
            if (courseBatch.MaxSeats <= 0 || courseBatch.MaxSeats > 30)
                throw new Exception("Kapasitas batch harus antara 1 sampai 30.");

            // Status awal batch
            courseBatch.CourseStatus = CourseBatchStatus.OPEN;

            await _batchRepository.AddAsync(courseBatch);

            return courseBatch;
        }

        public async Task<CourseBatch?> UpdateAsync(
            long id,
            CourseBatch courseBatch)
        {
            var existingBatch = await _batchRepository.GetByIdAsync(id);

            if (existingBatch == null)
                return null;

            // Validasi Course
            var courseExists = await _courseRepository.ExistsAsync(
                c => c.Id == courseBatch.CourseId);

            if (!courseExists)
                throw new Exception("Course tidak ditemukan.");

            // Validasi Location
            var locationExists = await _locationRepository.ExistsAsync(
                l => l.Id == courseBatch.LocationId);

            if (!locationExists)
                throw new Exception("Location tidak ditemukan.");

            if (courseBatch.StartDate > courseBatch.EndDate)
                throw new Exception("Tanggal mulai tidak valid.");

            if (courseBatch.StartTime >= courseBatch.EndTime)
                throw new Exception("Waktu mulai tidak valid.");

            if (courseBatch.MaxSeats <= 0 || courseBatch.MaxSeats > 30)
                throw new Exception("Kapasitas batch harus antara 1 sampai 30.");

            existingBatch.CourseId = courseBatch.CourseId;
            existingBatch.LocationId = courseBatch.LocationId;
            existingBatch.BatchName = courseBatch.BatchName;
            existingBatch.StartDate = courseBatch.StartDate;
            existingBatch.EndDate = courseBatch.EndDate;
            existingBatch.StartTime = courseBatch.StartTime;
            existingBatch.EndTime = courseBatch.EndTime;
            existingBatch.MaxSeats = courseBatch.MaxSeats;

            _batchRepository.Update(existingBatch);

            return existingBatch;
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var courseBatch = await _batchRepository.GetByIdAsync(id);

            if (courseBatch == null)
                return false;

            _batchRepository.Delete(courseBatch);

            return true;
        }
    }
}
