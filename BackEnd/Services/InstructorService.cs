using BackEnd.Data;
using BackEnd.DTOs.Instructor;
using BackEnd.Exceptions;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Services
{
    public class InstructorService : IInstructorService
    {
        private readonly CourseDbContext _db;
        private readonly ILogger<InstructorService> _logger;

        public InstructorService(CourseDbContext db, ILogger<InstructorService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<IEnumerable<InstructorResponseDto>> GetAllAsync()
        {
            return await _db.Instructors
                .AsNoTracking()
                .OrderBy(i => i.FullName)
                .Select(i => new InstructorResponseDto
                {
                    Id = i.Id,
                    UserId = i.UserId,
                    FullName = i.FullName,
                    Email = i.Email,
                    PhoneNumber = i.PhoneNumber,
                    Expertise = i.Expertise,
                    Bio = i.Bio
                })
                .ToListAsync();
        }

        public async Task<InstructorResponseDto> GetMyProfileAsync(long userId)
        {
            var instructor = await _db.Instructors.AsNoTracking()
                .FirstOrDefaultAsync(i => i.UserId == userId)
                ?? throw new NotFoundException("Profil pengajar tidak ditemukan.");

            return ToDto(instructor);
        }

        public async Task<InstructorResponseDto> GetByIdAsync(long id)
        {
            var instructor = await _db.Instructors.AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id)
                ?? throw new NotFoundException("Instructor tidak ditemukan.");

            return ToDto(instructor);
        }

        public async Task<InstructorResponseDto> CreateAsync(InstructorCreateDto dto)
        {
            var email = dto.Email.Trim();

            if (await _db.Users.AnyAsync(u => u.Email == email))
                throw new AppException("Email sudah terdaftar.", 409);

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Password = dto.Password,
                Role = Role.INSTRUCTOR
            };

            var instructor = new Instructor
            {
                User = user,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = dto.PhoneNumber,
                Expertise = dto.Expertise,
                Bio = dto.Bio
            };

            // user ikut tersimpan lewat relasi, dalam satu transaksi
            _db.Instructors.Add(instructor);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Instructor {InstructorId} (user {UserId}) dibuat", instructor.Id, user.Id);

            return ToDto(instructor);
        }

        public async Task<InstructorResponseDto> UpdateAsync(long id, InstructorUpdateDto dto)
        {
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id)
                ?? throw new NotFoundException("Instructor tidak ditemukan.");

            var email = dto.Email.Trim();
            if (await _db.Users.AnyAsync(u => u.Email == email && u.Id != instructor.UserId))
                throw new AppException("Email sudah digunakan akun lain.", 409);

            instructor.FullName = dto.FullName.Trim();
            instructor.Email = email;
            instructor.PhoneNumber = dto.PhoneNumber;
            instructor.Expertise = dto.Expertise;
            instructor.Bio = dto.Bio;

            // jaga data akun login tetap sinkron
            instructor.User.FullName = instructor.FullName;
            instructor.User.Email = email;

            await _db.SaveChangesAsync();
            _logger.LogInformation("Instructor {InstructorId} diperbarui", id);

            return ToDto(instructor);
        }

        public async Task DeleteAsync(long id)
        {
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id)
                ?? throw new NotFoundException("Instructor tidak ditemukan.");

            if (await _db.BatchInstructors.AnyAsync(bi => bi.InstructorId == id))
                throw new AppException("Instructor tidak dapat dihapus karena masih memiliki penugasan batch.", 409);

            _db.Instructors.Remove(instructor);
            _db.Users.Remove(instructor.User);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Instructor {InstructorId} dihapus", id);
        }

        private static InstructorResponseDto ToDto(Instructor i) => new()
        {
            Id = i.Id,
            UserId = i.UserId,
            FullName = i.FullName,
            Email = i.Email,
            PhoneNumber = i.PhoneNumber,
            Expertise = i.Expertise,
            Bio = i.Bio
        };
    }
}
