using BackEnd.DTOs.CourseBatch;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseBatchController : ControllerBase
    {
        private readonly ICourseBatchService _courseBatchService;

        public CourseBatchController(
            ICourseBatchService courseBatchService)
        {
            _courseBatchService = courseBatchService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseBatchResponseDto>>> GetAll()
        {
            var courseBatches = await _courseBatchService.GetAllAsync();

            return Ok(courseBatches);
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<CourseBatchDetailDto>> GetById(long id)
        {
            var courseBatch = await _courseBatchService.GetByIdAsync(id);

            if (courseBatch == null)
            {
                return NotFound(new
                {
                    message = "Batch kursus tidak ditemukan."
                });
            }

            return Ok(courseBatch);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<CourseBatchResponseDto>> Create(
            [FromBody] CourseBatchCreateDto request)
        {
            var createdCourseBatch =
                await _courseBatchService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdCourseBatch.Id },
                createdCourseBatch
            );
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<CourseBatchResponseDto>> Update(
            long id,
            [FromBody] CourseBatchUpdateDto request)
        {
            var updatedCourseBatch =
                await _courseBatchService.UpdateAsync(id, request);

            if (updatedCourseBatch == null)
            {
                return NotFound(new
                {
                    message = "Batch kursus tidak ditemukan."
                });
            }

            return Ok(updatedCourseBatch);
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {
            var isDeleted = await _courseBatchService.DeleteAsync(id);

            if (!isDeleted)
            {
                return NotFound(new
                {
                    message = "Batch kursus tidak ditemukan."
                });
            }

            return Ok(new
            {
                message = "Batch kursus berhasil dihapus."
            });
        }
    }
}