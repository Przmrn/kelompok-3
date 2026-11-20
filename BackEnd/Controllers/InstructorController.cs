using BackEnd.DTOs.Instructor;
using BackEnd.Services;
using BackEnd.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/instructors")]
    [Authorize]
    public class InstructorController : ControllerBase
    {
        private readonly IInstructorService _service;

        public InstructorController(IInstructorService service)
        {
            _service = service;
        }

        [HttpGet("me")]
        [Authorize(Roles = "INSTRUCTOR")]
        public async Task<ActionResult<InstructorResponseDto>> GetMe()
            => Ok(await _service.GetMyProfileAsync(User.GetUserId()));

        [Authorize(Roles = "ADMIN")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InstructorResponseDto>>> GetAll()
            => Ok(await _service.GetAllAsync());

        [Authorize(Roles = "ADMIN")]
        [HttpGet("{id:long}")]
        public async Task<ActionResult<InstructorResponseDto>> GetById(long id)
            => Ok(await _service.GetByIdAsync(id));

        [Authorize(Roles = "ADMIN")]
        [HttpPost]
        public async Task<ActionResult<InstructorResponseDto>> Create(InstructorCreateDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPut("{id:long}")]
        public async Task<ActionResult<InstructorResponseDto>> Update(long id, InstructorUpdateDto dto)
            => Ok(await _service.UpdateAsync(id, dto));

        [Authorize(Roles = "ADMIN")]
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
