using BackEnd.Data;
using BackEnd.DTOs.Auth;
using BackEnd.Exceptions;
using BackEnd.Models;
using BackEnd.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BackEnd.Services
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Student> _studentRepository;
        private readonly CourseDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IRepository<User> userRepository,
            IRepository<Student> studentRepository,
            CourseDbContext context,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<UserResponseDto> RegisterAsync(RegisterRequestDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await _userRepository.ExistsAsync(u => u.Email.ToLower() == email))
                throw new AppException("Email is already registered.", StatusCodes.Status409Conflict);

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Password = dto.Password,
                Role = Role.STUDENT
            };

            var student = new Student
            {
                User = user,
                FullName = dto.FullName.Trim(),
                PhoneNumber = string.Empty
            };

            await _studentRepository.AddAsync(student);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} ({Email}) berhasil mendaftar sebagai STUDENT", user.Id, user.Email);
            return ToUserResponse(user);
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var users = await _userRepository.FindAsync(u => u.Email.ToLower() == email);
            var user = users.FirstOrDefault();

            if (user == null || user.Password != dto.Password)
            {
                _logger.LogWarning("Percobaan login gagal untuk email {Email}", email);
                return null;
            }

            var expiresAt = DateTime.UtcNow.AddMinutes(GetExpiresMinutes());
            var key = _configuration["Jwt:Key"]
                ?? Environment.GetEnvironmentVariable("JWT_KEY")
                ?? throw new InvalidOperationException("JWT key is not configured.");

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var students = await _studentRepository.FindAsync(student => student.UserId == user.Id);
            var student = students.FirstOrDefault();
            if (student != null)
                claims.Add(new Claim("StudentId", student.Id.ToString()));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expiresAt,
                signingCredentials: credentials);

            _logger.LogInformation("User {UserId} ({Role}) berhasil login", user.Id, user.Role);

            return new LoginResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAt = expiresAt,
                User = ToUserResponse(user)
            };
        }

        private int GetExpiresMinutes()
        {
            return int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var minutes) && minutes > 0
                ? minutes
                : 60;
        }

        private static UserResponseDto ToUserResponse(User user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString()
            };
        }
    }
}
