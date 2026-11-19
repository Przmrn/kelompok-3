using BackEnd.DTOs.Instructor;

namespace BackEnd.Services
{
    public interface IInstructorService
    {
        Task<IEnumerable<InstructorResponseDto>> GetAllAsync();
        Task<InstructorResponseDto> GetByIdAsync(long id);
        Task<InstructorResponseDto> CreateAsync(InstructorCreateDto dto);
        Task<InstructorResponseDto> UpdateAsync(long id, InstructorUpdateDto dto);
        Task DeleteAsync(long id);
    }
}
