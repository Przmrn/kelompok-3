using BackEnd.DTOs.BatchInstructor;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BatchInstructorController : ControllerBase
    {
        private readonly IBatchInstructorService _batchInstructorService;

        public BatchInstructorController(
            IBatchInstructorService batchInstructorService)
        {
            _batchInstructorService = batchInstructorService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _batchInstructorService.GetAllAsync();

            return Ok(result);
        }

        [HttpGet("batch/{batchId:long}")]
        public async Task<IActionResult> GetByBatchId(long batchId)
        {
            var result = await _batchInstructorService.GetByBatchIdAsync(
                batchId
            );

            return Ok(result);
        }

        [HttpGet("instructor/{instructorId:long}")]
        public async Task<IActionResult> GetByInstructorId(
            long instructorId)
        {
            var result = await _batchInstructorService.GetByInstructorIdAsync(
                instructorId
            );

            return Ok(result);
        }

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