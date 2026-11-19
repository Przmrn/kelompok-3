using BackEnd.DTOs.Course;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _service;

        public CourseController(ICourseService service)
        {
            _service = service;
        }

        // GET /api/courses?categoryId=1
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetAll([FromQuery] long? categoryId)
            => Ok(await _service.GetAllAsync(categoryId));

        // GET /api/courses/5
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        public async Task<ActionResult<CourseDetailDto>> GetById(long id)
            => Ok(await _service.GetByIdAsync(id));

        // POST /api/courses
        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<CourseDetailDto>> Create(CourseCreateDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT /api/courses/5
        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<CourseDetailDto>> Update(long id, CourseUpdateDto dto)
            => Ok(await _service.UpdateAsync(id, dto));

        // DELETE /api/courses/5
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
