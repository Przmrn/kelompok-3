using BackEnd.Data;
using BackEnd.DTOs.CourseCategory;
using BackEnd.Exceptions;
using BackEnd.Models;
using BackEnd.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Services
{
    public class CourseCategoryService : ICourseCategoryService
    {
        private readonly IRepository<CourseCategory> _repository;
        private readonly CourseDbContext _context;

        public CourseCategoryService(
            IRepository<CourseCategory> repository,
            CourseDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<IEnumerable<CourseCategoryResponseDto>> GetAllAsync()
        {
            var categories = await _repository.GetAllAsync();
            return categories.Select(ToResponseDto);
        }

        public async Task<CourseCategoryResponseDto?> GetByIdAsync(long id)
        {
            var category = await _repository.GetByIdAsync(id);
            return category == null ? null : ToResponseDto(category);
        }

        public async Task<CourseCategoryResponseDto> CreateAsync(CourseCategoryCreateDto dto)
        {
            var normalizedName = dto.Name.Trim();
            if (await _repository.ExistsAsync(c => c.Name.ToLower() == normalizedName.ToLower()))
                throw new AppException("Course category name already exists.", StatusCodes.Status409Conflict);

            var category = new CourseCategory
            {
                Name = normalizedName,
                Description = dto.Description.Trim()
            };

            await _repository.AddAsync(category);
            await _context.SaveChangesAsync();
            return ToResponseDto(category);
        }

        public async Task<CourseCategoryResponseDto?> UpdateAsync(long id, CourseCategoryUpdateDto dto)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null)
                return null;

            var normalizedName = dto.Name.Trim();
            if (await _repository.ExistsAsync(c => c.Id != id && c.Name.ToLower() == normalizedName.ToLower()))
                throw new AppException("Course category name already exists.", StatusCodes.Status409Conflict);

            category.Name = normalizedName;
            category.Description = dto.Description.Trim();
            _repository.Update(category);
            await _context.SaveChangesAsync();
            return ToResponseDto(category);
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null)
                return false;

            if (await _context.Courses.AnyAsync(c => c.CategoryId == id))
                throw new AppException("Course category cannot be deleted because courses are using it.", StatusCodes.Status409Conflict);

            _repository.Delete(category);
            await _context.SaveChangesAsync();
            return true;
        }

        private static CourseCategoryResponseDto ToResponseDto(CourseCategory category)
        {
            return new CourseCategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description
            };
        }
    }
}
