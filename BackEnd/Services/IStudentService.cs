using BackEnd.DTOs.Student;

namespace BackEnd.Services
{
    public interface IStudentService
    {
        Task<StudentResponseDto> GetMyProfileAsync(long userId);
        Task<StudentResponseDto> CreateMyProfileAsync(long userId, StudentCreateDto dto);
        Task<StudentResponseDto> UpdateMyProfileAsync(long userId, StudentUpdateDto dto);
        Task<IEnumerable<StudentResponseDto>> GetAllAsync();
        Task<StudentResponseDto> GetByIdAsync(long id);
    }
}
