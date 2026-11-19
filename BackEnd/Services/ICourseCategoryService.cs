using BackEnd.DTOs.CourseCategory;

namespace BackEnd.Services
{
    public interface ICourseCategoryService
    {
        Task<IEnumerable<CourseCategoryResponseDto>> GetAllAsync();
        Task<CourseCategoryResponseDto?> GetByIdAsync(long id);
        Task<CourseCategoryResponseDto> CreateAsync(CourseCategoryCreateDto dto);
        Task<CourseCategoryResponseDto?> UpdateAsync(long id, CourseCategoryUpdateDto dto);
        Task<bool> DeleteAsync(long id);
    }
}
