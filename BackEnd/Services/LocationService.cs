using BackEnd.Data;
using BackEnd.DTOs.Location;
using BackEnd.Exceptions;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Services
{
    public class LocationService : ILocationService
    {
private readonly CourseDbContext _db;
private readonly ILogger<LocationService> _logger;

public LocationService(CourseDbContext db, ILogger<LocationService> logger)
{
    _db = db;
    _logger = logger;
}

public async Task<IEnumerable<LocationResponseDto>> GetAllAsync(string? city)
{
    var query = _db.Locations.AsNoTracking().AsQueryable();

    if (!string.IsNullOrWhiteSpace(city))
    {
        var keyword = city.Trim().ToLower();
        query = query.Where(l => l.City.ToLower() == keyword);
    }

    return await query
        .OrderBy(l => l.City)
        .ThenBy(l => l.Name)
        .Select(l => new LocationResponseDto
        {
            Id = l.Id,
            Name = l.Name,
            Address = l.Address,
            City = l.City,
            RoomName = l.RoomName
        })
        .ToListAsync();
}

public async Task<LocationResponseDto?> GetByIdAsync(long id)
{
    var location = await _db.Locations.AsNoTracking()
        .FirstOrDefaultAsync(l => l.Id == id);

    return location == null ? null : ToDto(location);
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

    _db.Locations.Add(location);
    await _db.SaveChangesAsync();
    _logger.LogInformation("Lokasi {LocationId} dibuat", location.Id);

    return ToDto(location);
}

public async Task<LocationResponseDto?> UpdateAsync(long id, LocationUpdateDto dto)
{
    var location = await _db.Locations.FindAsync(id);
    if (location == null)
        return null;

    location.Name = dto.Name.Trim();
    location.Address = dto.Address.Trim();
    location.City = dto.City.Trim();
    location.RoomName = dto.RoomName.Trim();

    await _db.SaveChangesAsync();
    _logger.LogInformation("Lokasi {LocationId} diperbarui", id);

    return ToDto(location);
}

public async Task DeleteAsync(long id)
{
    var location = await _db.Locations.FindAsync(id)
        ?? throw new NotFoundException("Lokasi tidak ditemukan.");

    if (await _db.CourseBatches.AnyAsync(b => b.LocationId == id))
        throw new AppException("Lokasi tidak dapat dihapus karena masih digunakan oleh batch.", 409);

    _db.Locations.Remove(location);
    await _db.SaveChangesAsync();
    _logger.LogInformation("Lokasi {LocationId} dihapus", id);
}

private static LocationResponseDto ToDto(Location location) => new()
{
    Id = location.Id,
    Name = location.Name,
    Address = location.Address,
    City = location.City,
    RoomName = location.RoomName
};
    }
}
