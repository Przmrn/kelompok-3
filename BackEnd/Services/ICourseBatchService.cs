using BackEnd.DTOs.CourseBatch;

namespace BackEnd.Services
{
    public interface ICourseBatchService
    {
        Task<IEnumerable<CourseBatchResponseDto>> GetAllAsync();

        Task<CourseBatchDetailDto?> GetByIdAsync(long id);

        Task<CourseBatchResponseDto> CreateAsync(
            CourseBatchCreateDto dto);

        Task<CourseBatchResponseDto?> UpdateAsync(
            long id,
            CourseBatchUpdateDto dto);

        Task<bool> DeleteAsync(long id);
    }
}