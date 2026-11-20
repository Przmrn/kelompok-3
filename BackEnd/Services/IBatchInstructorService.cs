using BackEnd.DTOs.BatchInstructor;

namespace BackEnd.Services
{
    public interface IBatchInstructorService
    {
        Task<IEnumerable<BatchInstructorResponseDto>> GetAllAsync();

        Task<IEnumerable<BatchInstructorResponseDto>> GetByBatchIdAsync(
            long batchId
        );

        Task<IEnumerable<BatchInstructorResponseDto>> GetByInstructorIdAsync(
            long instructorId
        );

        Task<BatchInstructorResponseDto> AssignInstructorAsync(
            BatchInstructorCreateDto dto
        );

        Task<bool> RemoveInstructorAsync(
            long batchId,
            long instructorId
        );
    }
}