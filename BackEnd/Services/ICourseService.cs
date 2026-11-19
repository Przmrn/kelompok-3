using BackEnd.DTOs.Course;

namespace BackEnd.Services
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseResponseDto>> GetAllAsync(long? categoryId);
        Task<CourseDetailDto> GetByIdAsync(long id);
        Task<CourseDetailDto> CreateAsync(CourseCreateDto dto);
        Task<CourseDetailDto> UpdateAsync(long id, CourseUpdateDto dto);
        Task DeleteAsync(long id);
    }
}
