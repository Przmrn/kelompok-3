using BackEnd.DTOs.BatchInstructor;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BatchInstructorController : ControllerBase
    {
        private readonly IBatchInstructorService _batchInstructorService;

        public BatchInstructorController(
            IBatchInstructorService batchInstructorService)
        {
            _batchInstructorService = batchInstructorService;
        }

        // GET: api/BatchInstructor
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _batchInstructorService.GetAllAsync();

            return Ok(result);
        }

        // GET: api/BatchInstructor/batch/1
        [HttpGet("batch/{batchId:long}")]
        public async Task<IActionResult> GetByBatchId(long batchId)
        {
            var result = await _batchInstructorService.GetByBatchIdAsync(
                batchId
            );

            return Ok(result);
        }

        // GET: api/BatchInstructor/instructor/1
        [HttpGet("instructor/{instructorId:long}")]
        public async Task<IActionResult> GetByInstructorId(
            long instructorId)
        {
            var result = await _batchInstructorService.GetByInstructorIdAsync(
                instructorId
            );

            return Ok(result);
        }

        // POST: api/BatchInstructor
        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> AssignInstructor(
            [FromBody] BatchInstructorCreateDto dto)
        {
            var result = await _batchInstructorService.AssignInstructorAsync(
                dto
            );

            return Ok(result);
        }

        // DELETE: api/BatchInstructor?batchId=1&instructorId=2
        [HttpDelete]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> RemoveInstructor(
            [FromQuery] long batchId,
            [FromQuery] long instructorId)
        {
            var isRemoved =
                await _batchInstructorService.RemoveInstructorAsync(
                    batchId,
                    instructorId
                );

            if (!isRemoved)
            {
                return NotFound(new
                {
                    message = "Penugasan instructor tidak ditemukan."
                });
            }

            return Ok(new
            {
                message = "Instructor berhasil dilepaskan dari batch."
            });
        }
    }
}