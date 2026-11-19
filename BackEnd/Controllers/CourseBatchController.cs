
using BackEnd.Models;
using BackEnd.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseBatchController : ControllerBase
    {
        private readonly ICourseBatchService _courseBatchService;

        public CourseBatchController(ICourseBatchService courseBatchService)
        {
            _courseBatchService = courseBatchService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseBatch>>> GetAll()
        {
            var courseBatches = await _courseBatchService.GetAllAsync();

            return Ok(courseBatches);
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<CourseBatch>> GetById(long id)
        {
            var courseBatch = await _courseBatchService.GetByIdAsync(id);

            if (courseBatch == null)
                return NotFound(new { message = "Batch kursus tidak ditemukan." });

            return Ok(courseBatch);
        }

        [HttpPost]
        public async Task<ActionResult<CourseBatch>> Create(
            [FromBody] CourseBatch courseBatch)
        {
            var createdCourseBatch =
                await _courseBatchService.CreateAsync(courseBatch);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdCourseBatch.Id },
                createdCourseBatch
            );
        }

        [HttpPut("{id:long}")]
        public async Task<ActionResult<CourseBatch>> Update(
            long id,
            [FromBody] CourseBatch courseBatch)
        {
            var updatedCourseBatch =
                await _courseBatchService.UpdateAsync(id, courseBatch);

            if (updatedCourseBatch == null)
                return NotFound(new { message = "Batch kursus tidak ditemukan." });

            return Ok(updatedCourseBatch);
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var isDeleted = await _courseBatchService.DeleteAsync(id);

            if (!isDeleted)
                return NotFound(new { message = "Batch kursus tidak ditemukan." });

            return Ok(new { message = "Batch kursus berhasil dihapus." });
        }
    }
}
