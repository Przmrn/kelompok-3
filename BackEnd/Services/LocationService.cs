using BackEnd.Data;
using BackEnd.DTOs.Location;
using BackEnd.Models;
using BackEnd.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Services
{
    public class LocationService : ILocationService
    {
        private readonly IRepository<Location> _repository;
        private readonly CourseDbContext _context;

        public LocationService(IRepository<Location> repository, CourseDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<IEnumerable<LocationResponseDto>> GetAllAsync()
        {
            var locations = await _repository.GetAllAsync();
            return locations.Select(ToResponseDto);
        }

        public async Task<LocationResponseDto?> GetByIdAsync(long id)
        {
            var location = await _repository.GetByIdAsync(id);
            return location == null ? null : ToResponseDto(location);
        }

        public async Task<LocationResponseDto> CreateAsync(LocationCreateDto dto)
        {
            var location = new Location
            {
                Name = dto.Name.Trim(),
                Address = dto.Address.Trim(),
                City = dto.City.Trim(),
                RoomName = dto.RoomName.Trim()
            };

            await _repository.AddAsync(location);
            await _context.SaveChangesAsync();
            return ToResponseDto(location);
        }

        public async Task<LocationResponseDto?> UpdateAsync(long id, LocationUpdateDto dto)
        {
            var location = await _repository.GetByIdAsync(id);
            if (location == null)
                return null;

            location.Name = dto.Name.Trim();
            location.Address = dto.Address.Trim();
            location.City = dto.City.Trim();
            location.RoomName = dto.RoomName.Trim();

            _repository.Update(location);
            await _context.SaveChangesAsync();
            return ToResponseDto(location);
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var location = await _repository.GetByIdAsync(id);
            if (location == null)
                return false;

            if (await _context.CourseBatches.AnyAsync(b => b.LocationId == id))
                throw new InvalidOperationException("Location cannot be deleted because course batches are using it.");

            _repository.Delete(location);
            await _context.SaveChangesAsync();
            return true;
        }

        private static LocationResponseDto ToResponseDto(Location location)
        {
            return new LocationResponseDto
            {
                Id = location.Id,
                Name = location.Name,
                Address = location.Address,
                City = location.City,
                RoomName = location.RoomName
            };
        }
    }
}
