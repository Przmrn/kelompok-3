using BackEnd.DTOs.Location;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/locations")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _service;

        public LocationController(ILocationService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LocationResponseDto>>> GetAll([FromQuery] string? city)
            => Ok(await _service.GetAllAsync(city));

        [HttpGet("{id:long}")]
        [AllowAnonymous]
        public async Task<ActionResult<LocationResponseDto>> GetById(long id)
            => Ok(await _service.GetByIdAsync(id));

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<LocationResponseDto>> Create(LocationCreateDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<LocationResponseDto>> Update(long id, LocationUpdateDto dto)
            => Ok(await _service.UpdateAsync(id, dto));

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
