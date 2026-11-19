using BackEnd.Data;
using BackEnd.DTOs.Auth;
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

        public AuthService(
            IRepository<User> userRepository,
            IRepository<Student> studentRepository,
            CourseDbContext context,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _context = context;
            _configuration = configuration;
        }

        public async Task<UserResponseDto> RegisterAsync(RegisterRequestDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await _userRepository.ExistsAsync(u => u.Email.ToLower() == email))
                throw new InvalidOperationException("Email is already registered.");

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Password = dto.Password,
                Role = Role.STUDENT
            };

            await _userRepository.AddAsync(user);
            await _context.SaveChangesAsync();

            var student = new Student
            {
                UserId = user.Id,
                FullName = dto.FullName.Trim()
            };

            await _studentRepository.AddAsync(student);
            await _context.SaveChangesAsync();

            return ToUserResponse(user);
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var users = await _userRepository.FindAsync(u => u.Email.ToLower() == email);
            var user = users.FirstOrDefault();

            if (user == null)
                return null;

            if (user.Password != dto.Password)
                return null;

            var expiresAt = DateTime.UtcNow.AddMinutes(GetExpiresMinutes());
            var key = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT key is not configured.");

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expiresAt,
                signingCredentials: credentials);

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
