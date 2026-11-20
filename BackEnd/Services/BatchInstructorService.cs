using BackEnd.DTOs.BatchInstructor;
using BackEnd.Models;
using BackEnd.Repositories;

namespace BackEnd.Services
{
    public class BatchInstructorService : IBatchInstructorService
    {
        private readonly IRepository<BatchInstructor> _batchInstructorRepository;
        private readonly IRepository<CourseBatch> _courseBatchRepository;
        private readonly IRepository<Instructor> _instructorRepository;

        public BatchInstructorService(
            IRepository<BatchInstructor> batchInstructorRepository,
            IRepository<CourseBatch> courseBatchRepository,
            IRepository<Instructor> instructorRepository)
        {
            _batchInstructorRepository = batchInstructorRepository;
            _courseBatchRepository = courseBatchRepository;
            _instructorRepository = instructorRepository;
        }

        // GET ALL
        public async Task<IEnumerable<BatchInstructorResponseDto>> GetAllAsync()
        {
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch"
            );

            return assignments.Select(MapToDto);
        }

        // GET BY BATCH ID
        public async Task<IEnumerable<BatchInstructorResponseDto>> GetByBatchIdAsync(
            long batchId)
        {
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch"
            );

            return assignments
                .Where(bi => bi.BatchId == batchId)
                .Select(MapToDto);
        }

        // GET BY INSTRUCTOR ID
        public async Task<IEnumerable<BatchInstructorResponseDto>> GetByInstructorIdAsync(
            long instructorId)
        {
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch"
            );

            return assignments
                .Where(bi => bi.InstructorId == instructorId)
                .Select(MapToDto);
        }

        // ASSIGN INSTRUCTOR
        public async Task<BatchInstructorResponseDto> AssignInstructorAsync(
            BatchInstructorCreateDto dto)
        {
            // 1. Pastikan batch tersedia
            var courseBatch = await _courseBatchRepository.GetByIdAsync(
                dto.BatchId
            );

            if (courseBatch == null)
                throw new BackEnd.Exceptions.AppException(
                    "Batch tidak ditemukan."
                );

            // 2. Pastikan instructor tersedia
            var instructorExists = await _instructorRepository.ExistsAsync(
                i => i.Id == dto.InstructorId
            );

            if (!instructorExists)
                throw new BackEnd.Exceptions.AppException(
                    "Instruktur tidak ditemukan."
                );

            // 3. Periksa duplikasi penugasan
            var alreadyAssigned = await _batchInstructorRepository.ExistsAsync(
                bi => bi.BatchId == dto.BatchId &&
                      bi.InstructorId == dto.InstructorId
            );

            if (alreadyAssigned)
                throw new BackEnd.Exceptions.AppException(
                    "Instruktur sudah ditugaskan ke batch ini."
                );

            // 4. Ambil seluruh penugasan instructor
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "CourseBatch"
            );

            var instructorAssignments = assignments
                .Where(bi => bi.InstructorId == dto.InstructorId);

            // 5. Periksa bentrok jadwal
            foreach (var assignment in instructorAssignments)
            {
                var existingBatch = assignment.CourseBatch;

                bool dateOverlap =
                    existingBatch.StartDate <= courseBatch.EndDate &&
                    existingBatch.EndDate >= courseBatch.StartDate;

                bool timeOverlap =
                    existingBatch.StartTime < courseBatch.EndTime &&
                    existingBatch.EndTime > courseBatch.StartTime;

                if (dateOverlap && timeOverlap)
                {
                    throw new BackEnd.Exceptions.AppException(
                        "Instruktur sudah memiliki jadwal mengajar yang bentrok."
                    );
                }
            }

            // 6. Buat penugasan baru
            var batchInstructor = new BatchInstructor
            {
                BatchId = dto.BatchId,
                InstructorId = dto.InstructorId
            };

            await _batchInstructorRepository.AddAsync(batchInstructor);

            await _batchInstructorRepository.SaveChangesAsync();

            // 7. Ambil kembali data beserta navigation property
            var savedAssignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch"
            );

            var savedAssignment = savedAssignments.First(
                bi => bi.Id == batchInstructor.Id
            );

            return MapToDto(savedAssignment);
        }

        // REMOVE INSTRUCTOR
        public async Task<bool> RemoveInstructorAsync(
            long batchId,
            long instructorId)
        {
            var assignments = await _batchInstructorRepository.FindAsync(
                bi => bi.BatchId == batchId &&
                      bi.InstructorId == instructorId
            );

            var existingAssignment = assignments.FirstOrDefault();

            if (existingAssignment == null)
                return false;

            _batchInstructorRepository.Delete(existingAssignment);

            await _batchInstructorRepository.SaveChangesAsync();

            return true;
        }

        // MAPPING ENTITY TO DTO
        private static BatchInstructorResponseDto MapToDto(
            BatchInstructor entity)
        {
            return new BatchInstructorResponseDto
            {
                Id = entity.Id,

                BatchId = entity.BatchId,

                InstructorId = entity.InstructorId,

                BatchName = entity.CourseBatch.BatchName,

                InstructorName = entity.Instructor.FullName,

                Expertise = entity.Instructor.Expertise,

                Bio = entity.Instructor.Bio
            };
        }
    }
}