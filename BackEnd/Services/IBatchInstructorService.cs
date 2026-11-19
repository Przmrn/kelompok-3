
using BackEnd.Models;

namespace BackEnd.Services
{
    public interface IBatchInstructorService
    {
        Task<IEnumerable<BatchInstructor>> GetAllAsync();

        Task<IEnumerable<BatchInstructor>> GetByBatchIdAsync(long batchId);

        Task<IEnumerable<BatchInstructor>> GetByInstructorIdAsync(long instructorId);

        Task<BatchInstructor> AssignInstructorAsync(long batchId, long instructorId);

        Task<bool> RemoveInstructorAsync(long batchId, long instructorId);
    }
}
