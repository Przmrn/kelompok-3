using BackEnd.DTOs.CourseBatch;
using BackEnd.Exceptions;
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

        // Mengambil seluruh batch
        public async Task<IEnumerable<CourseBatchResponseDto>> GetAllAsync()
        {
            var batches = await _batchRepository.GetAllAsync(
                "Course,Location,Registrations");

            return batches.Select(MapToResponseDto);
        }

        // Mengambil detail satu batch berdasarkan ID
        public async Task<CourseBatchDetailDto?> GetByIdAsync(long id)
        {
            var batch = await GetBatchEntityAsync(id);

            if (batch == null)
                return null;

            return MapToDetailDto(batch);
        }

        // Membuat batch baru
        public async Task<CourseBatchResponseDto> CreateAsync(
            CourseBatchCreateDto dto)
        {
            // Validasi Course
            var courseExists = await _courseRepository.ExistsAsync(
                c => c.Id == dto.CourseId);

            if (!courseExists)
                throw new AppException("Course tidak ditemukan.");

            // Validasi Location
            var locationExists = await _locationRepository.ExistsAsync(
                l => l.Id == dto.LocationId);

            if (!locationExists)
                throw new AppException("Location tidak ditemukan.");

            // Validasi data batch
            ValidateBatchData(
                dto.StartDate,
                dto.EndDate,
                dto.StartTime,
                dto.EndTime,
                dto.MaxSeats);

            // Konversi DTO menjadi Entity
            var courseBatch = dto.ToBatch();

            // Status awal batch
            courseBatch.CourseStatus = CourseBatchStatus.OPEN;

            await _batchRepository.AddAsync(courseBatch);
            await _batchRepository.SaveChangesAsync();

            // Ambil kembali data beserta relasinya
            var createdBatch = await GetBatchEntityAsync(courseBatch.Id);

            if (createdBatch == null)
                throw new AppException("Gagal mengambil data batch yang dibuat.");

            return MapToResponseDto(createdBatch);
        }

        // Mengubah batch
        public async Task<CourseBatchResponseDto?> UpdateAsync(
            long id,
            CourseBatchUpdateDto dto)
        {
            var existingBatch = await GetBatchEntityAsync(id);

            if (existingBatch == null)
                return null;

            // Validasi Course
            var courseExists = await _courseRepository.ExistsAsync(
                c => c.Id == dto.CourseId);

            if (!courseExists)
                throw new AppException("Course tidak ditemukan.");

            // Validasi Location
            var locationExists = await _locationRepository.ExistsAsync(
                l => l.Id == dto.LocationId);

            if (!locationExists)
                throw new AppException("Location tidak ditemukan.");

            // Validasi tanggal, waktu, dan kapasitas
            ValidateBatchData(
                dto.StartDate,
                dto.EndDate,
                dto.StartTime,
                dto.EndTime,
                dto.MaxSeats);

            // Kapasitas tidak boleh lebih kecil dari peserta terdaftar
            if (dto.MaxSeats < existingBatch.UsedSeats)
            {
                throw new AppException(
                    "Kapasitas kurang dari jumlah peserta terdaftar.");
            }

            // Update data batch
            existingBatch.CourseId = dto.CourseId;
            existingBatch.LocationId = dto.LocationId;
            existingBatch.BatchName = dto.BatchName;
            existingBatch.StartDate = dto.StartDate;
            existingBatch.EndDate = dto.EndDate;
            existingBatch.StartTime = dto.StartTime;
            existingBatch.EndTime = dto.EndTime;
            existingBatch.MaxSeats = dto.MaxSeats;

            // Perbarui status berdasarkan kapasitas
            existingBatch.CourseStatus =
                existingBatch.UsedSeats >= existingBatch.MaxSeats
                    ? CourseBatchStatus.FULL
                    : CourseBatchStatus.OPEN;

            _batchRepository.Update(existingBatch);
            await _batchRepository.SaveChangesAsync();

            // Ambil ulang agar navigasi Course dan Location sesuai
            var updatedBatch = await GetBatchEntityAsync(id);

            if (updatedBatch == null)
                throw new AppException("Gagal mengambil data batch yang diperbarui.");

            return MapToResponseDto(updatedBatch);
        }

        // Menghapus batch
        public async Task<bool> DeleteAsync(long id)
        {
            var courseBatch = await GetBatchEntityAsync(id);

            if (courseBatch == null)
                return false;

            // Batch yang sudah memiliki pendaftaran tidak boleh dihapus
            if (courseBatch.Registrations.Count > 0)
            {
                throw new AppException(
                    "Jadwal yang memiliki pendaftaran tidak dapat dihapus.",
                    409);
            }

            _batchRepository.Delete(courseBatch);
            await _batchRepository.SaveChangesAsync();

            return true;
        }

        // Mengambil entity beserta relasi yang dibutuhkan
        private async Task<CourseBatch?> GetBatchEntityAsync(long id)
        {
            var batches = await _batchRepository.GetAllAsync(
                "Course,Location,Registrations");

            return batches.FirstOrDefault(batch => batch.Id == id);
        }

        // Validasi data batch
        private void ValidateBatchData(
            DateOnly startDate,
            DateOnly endDate,
            TimeOnly startTime,
            TimeOnly endTime,
            int maxSeats)
        {
            if (startDate > endDate)
            {
                throw new AppException(
                    "Tanggal mulai tidak boleh melebihi tanggal selesai.");
            }

            if (startTime >= endTime)
            {
                throw new AppException(
                    "Waktu mulai harus lebih awal dari waktu selesai.");
            }

            if (maxSeats <= 0 || maxSeats > 30)
            {
                throw new AppException(
                    "Kapasitas batch harus antara 1 sampai 30.");
            }
        }

        // Mapping Entity menjadi Response DTO
        private CourseBatchResponseDto MapToResponseDto(
            CourseBatch batch)
        {
            return new CourseBatchResponseDto
            {
                Id = batch.Id,

                CourseId = batch.CourseId,

                LocationId = batch.LocationId,
                LocationName = batch.Location.Name,

                BatchName = batch.BatchName,

                StartDate = batch.StartDate,
                EndDate = batch.EndDate,

                StartTime = batch.StartTime,
                EndTime = batch.EndTime,

                MaxSeats = batch.MaxSeats,
                NextQueue = batch.NextQueue,
                UsedSeats = batch.UsedSeats,
                AvailableSeats = batch.MaxSeats - batch.UsedSeats,

                CourseStatus = batch.CourseStatus
            };
        }

        // Mapping Entity menjadi Detail DTO
        private CourseBatchDetailDto MapToDetailDto(
            CourseBatch batch)
        {
            return new CourseBatchDetailDto
            {
                Id = batch.Id,

                CourseId = batch.CourseId,

                LocationId = batch.LocationId,
                LocationName = batch.Location.Name,

                BatchName = batch.BatchName,

                StartDate = batch.StartDate,
                EndDate = batch.EndDate,

                StartTime = batch.StartTime,
                EndTime = batch.EndTime,

                MaxSeats = batch.MaxSeats,
                NextQueue = batch.NextQueue,
                UsedSeats = batch.UsedSeats,
                AvailableSeats = batch.MaxSeats - batch.UsedSeats,

                CourseStatus = batch.CourseStatus,

                Syllabus = batch.Course.Syllabus,
                DurationHours = batch.Course.DurationHours,
                BasePrice = batch.Course.BasePrice,

                LocationAddress = batch.Location.Address,
                LocationCity = batch.Location.City,
                RoomName = batch.Location.RoomName
            };
        }
    }
}