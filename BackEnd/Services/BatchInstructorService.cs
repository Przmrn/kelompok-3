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

        public async Task<IEnumerable<BatchInstructorResponseDto>> GetAllAsync()
        {
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch"
            );

            return assignments.Select(MapToDto);
        }

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

        public async Task<BatchInstructorResponseDto> AssignInstructorAsync(
            BatchInstructorCreateDto dto)
        {
            var courseBatch = await _courseBatchRepository.GetByIdAsync(
                dto.BatchId
            );

            if (courseBatch == null)
                throw new BackEnd.Exceptions.AppException(
                    "Batch tidak ditemukan."
                );

            var instructorExists = await _instructorRepository.ExistsAsync(
                i => i.Id == dto.InstructorId
            );

            if (!instructorExists)
                throw new BackEnd.Exceptions.AppException(
                    "Instruktur tidak ditemukan."
                );

            var alreadyAssigned = await _batchInstructorRepository.ExistsAsync(
                bi => bi.BatchId == dto.BatchId &&
                      bi.InstructorId == dto.InstructorId
            );

            if (alreadyAssigned)
                throw new BackEnd.Exceptions.AppException(
                    "Instruktur sudah ditugaskan ke batch ini."
                );

            var assignments = await _batchInstructorRepository.GetAllAsync(
                "CourseBatch"
            );

            var instructorAssignments = assignments
                .Where(bi => bi.InstructorId == dto.InstructorId);

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

            var batchInstructor = new BatchInstructor
            {
                BatchId = dto.BatchId,
                InstructorId = dto.InstructorId
            };

            await _batchInstructorRepository.AddAsync(batchInstructor);

            await _batchInstructorRepository.SaveChangesAsync();

            var savedAssignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch"
            );

            var savedAssignment = savedAssignments.First(
                bi => bi.Id == batchInstructor.Id
            );

            return MapToDto(savedAssignment);
        }

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