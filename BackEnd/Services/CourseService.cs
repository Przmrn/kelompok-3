using BackEnd.Data;
using BackEnd.DTOs.Course;
using BackEnd.Exceptions;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Services
{
    public class CourseService : ICourseService
    {
        private readonly CourseDbContext _db;
        private readonly ILogger<CourseService> _logger;

        public CourseService(CourseDbContext db, ILogger<CourseService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<IEnumerable<CourseResponseDto>> GetAllAsync(long? categoryId)
        {
            var query = _db.Courses.AsNoTracking().AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(c => c.CategoryId == categoryId.Value);

            return await query
                .OrderBy(c => c.Id)
                .Select(c => new CourseResponseDto
                {
                    Id = c.Id,
                    CategoryId = c.CategoryId,
                    CategoryName = c.CourseCategory.Name,
                    Syllabus = c.Syllabus,
                    DurationHours = c.DurationHours,
                    BasePrice = c.BasePrice
                })
                .ToListAsync();
        }

        public async Task<CourseDetailDto> GetByIdAsync(long id)
        {
            var course = await _db.Courses
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new CourseDetailDto
                {
                    Id = c.Id,
                    CategoryId = c.CategoryId,
                    CategoryName = c.CourseCategory.Name,
                    Syllabus = c.Syllabus,
                    DurationHours = c.DurationHours,
                    BasePrice = c.BasePrice,
                    BatchCount = c.CourseBatches.Count
                })
                .FirstOrDefaultAsync();

            return course ?? throw new NotFoundException("Course tidak ditemukan.");
        }

        public async Task<CourseDetailDto> CreateAsync(CourseCreateDto dto)
        {
            await EnsureCategoryExist(dto.CategoryId);

            var course = new Course
            {
                CategoryId = dto.CategoryId,
                Syllabus = dto.Syllabus,
                DurationHours = dto.DurationHours,
                BasePrice = dto.BasePrice
            };

            _db.Courses.Add(course);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Course {CourseId} dibuat", course.Id);

            return await GetByIdAsync(course.Id);
        }

        public async Task<CourseDetailDto> UpdateAsync(long id, CourseUpdateDto dto)
        {
            var course = await _db.Courses.FindAsync(id)
                ?? throw new NotFoundException("Course tidak ditemukan.");

            await EnsureCategoryExist(dto.CategoryId);

            course.CategoryId = dto.CategoryId;
            course.Syllabus = dto.Syllabus;
            course.DurationHours = dto.DurationHours;
            course.BasePrice = dto.BasePrice;

            await _db.SaveChangesAsync();
            _logger.LogInformation("Course {CourseId} diperbarui", id);

            return await GetByIdAsync(id);
        }

        public async Task DeleteAsync(long id)
        {
            var course = await _db.Courses.FindAsync(id)
                ?? throw new NotFoundException("Course tidak ditemukan");

            if (await _db.CourseBatches.AnyAsync(b => b.CourseId == id))
                throw new AppException("Course tidak bisa dihapus karna sudah aktif di batch.", 409);

            _db.Courses.Remove(course);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Course {courseId} dihapus", id);
        }

        private async Task EnsureCategoryExist(long categoryId)
        {
            if (!await _db.CourseCategories.AnyAsync(c => c.Id == categoryId))
                throw new NotFoundException("Kategori course tidak ditemukan.");
        }
    }
}
