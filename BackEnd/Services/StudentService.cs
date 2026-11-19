using BackEnd.Data;
using BackEnd.DTOs.Student;
using BackEnd.Exceptions;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Services
{
    public class StudentService : IStudentService
    {
        private readonly CourseDbContext _db;
        private readonly ILogger<StudentService> _logger;

        public StudentService(CourseDbContext db, ILogger<StudentService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<StudentResponseDto> GetMyProfileAsync(long userId)
        {
            var student = await _db.Students.AsNoTracking()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId)
                ?? throw new NotFoundException("Profil student belum dilengkapi.");

            return ToDto(student);
        }

        public async Task<StudentResponseDto> CreateMyProfileAsync(long userId, StudentCreateDto dto)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new UnauthorizedException("Akun tidak ditemukan.");

            if (await _db.Students.AnyAsync(s => s.UserId == userId))
                throw new AppException("Profil student sudah ada. Gunakan update.", 409);

            var student = new Student
            {
                UserId = userId,
                User = user,
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,
                City = dto.City,
                Province = dto.Province,
                Country = dto.Country,
                EducationalLevel = dto.EducationalLevel,
                Occupation = dto.Occupation
            };

            _db.Students.Add(student);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Profil student {StudentId} dibuat untuk user {UserId}", student.Id, userId);

            return ToDto(student);
        }

        public async Task<StudentResponseDto> UpdateMyProfileAsync(long userId, StudentUpdateDto dto)
        {
            var student = await _db.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId)
                ?? throw new NotFoundException("Profil student belum dilengkapi.");

            student.FullName = dto.FullName.Trim();
            student.PhoneNumber = dto.PhoneNumber;
            student.Address = dto.Address;
            student.City = dto.City;
            student.Province = dto.Province;
            student.Country = dto.Country;
            student.EducationalLevel = dto.EducationalLevel;
            student.Occupation = dto.Occupation;

            student.User.FullName = student.FullName;

            await _db.SaveChangesAsync();
            _logger.LogInformation("Profil student {StudentId} diperbarui", student.Id);

            return ToDto(student);
        }

        public async Task<IEnumerable<StudentResponseDto>> GetAllAsync()
        {
            var students = await _db.Students.AsNoTracking()
                .Include(s => s.User)
                .OrderBy(s => s.FullName)
                .ToListAsync();

            return students.Select(ToDto);
        }

        public async Task<StudentResponseDto> GetByIdAsync(long id)
        {
            var student = await _db.Students.AsNoTracking()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Student tidak ditemukan.");

            return ToDto(student);
        }

        private static StudentResponseDto ToDto(Student s) => new()
        {
            Id = s.Id,
            UserId = s.UserId,
            Email = s.User.Email,
            FullName = s.FullName,
            PhoneNumber = s.PhoneNumber,
            Address = s.Address,
            City = s.City,
            Province = s.Province,
            Country = s.Country,
            EducationalLevel = s.EducationalLevel,
            Occupation = s.Occupation
        };
    }
}
