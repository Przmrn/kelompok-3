using BackEnd.DTOs.Location;

namespace BackEnd.Services
{
    public interface ILocationService
    {
        Task<IEnumerable<LocationResponseDto>> GetAllAsync();
        Task<LocationResponseDto?> GetByIdAsync(long id);
        Task<LocationResponseDto> CreateAsync(LocationCreateDto dto);
        Task<LocationResponseDto?> UpdateAsync(long id, LocationUpdateDto dto);
        Task<bool> DeleteAsync(long id);
    }
}
