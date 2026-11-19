using BackEnd.DTOs.CourseCategory;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/course-categories")]
    public class CourseCategoryController : ControllerBase
    {
        private readonly ICourseCategoryService _service;

        public CourseCategoryController(ICourseCategoryService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CourseCategoryResponseDto>>> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("{id:long}")]
        [AllowAnonymous]
        public async Task<ActionResult<CourseCategoryResponseDto>> GetById(long id)
        {
            var category = await _service.GetByIdAsync(id);
            return category == null ? NotFound() : Ok(category);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<CourseCategoryResponseDto>> Create(CourseCategoryCreateDto dto)
        {
            try
            {
                var category = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new { message = exception.Message });
            }
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<CourseCategoryResponseDto>> Update(long id, CourseCategoryUpdateDto dto)
        {
            try
            {
                var category = await _service.UpdateAsync(id, dto);
                return category == null ? NotFound() : Ok(category);
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new { message = exception.Message });
            }
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                var deleted = await _service.DeleteAsync(id);
                return deleted ? NoContent() : NotFound();
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new { message = exception.Message });
            }
        }
    }
}
