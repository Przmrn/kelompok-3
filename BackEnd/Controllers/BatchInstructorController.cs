
using BackEnd.Models;
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BatchInstructor>>> GetAll()
        {
            var batchInstructors =
                await _batchInstructorService.GetAllAsync();

            return Ok(batchInstructors.Select(a => new {
                a.Id, a.BatchId, a.InstructorId,
                instructor = new { a.Instructor.Id, a.Instructor.UserId, a.Instructor.FullName, a.Instructor.Expertise, a.Instructor.Bio }
            }));
        }

        [HttpGet("batch/{batchId:long}")]
        public async Task<ActionResult<IEnumerable<BatchInstructor>>> GetByBatchId(
            long batchId)
        {
            var batchInstructors =
                await _batchInstructorService.GetByBatchIdAsync(batchId);

            return Ok(batchInstructors.Select(a => new {
                a.Id, a.BatchId, a.InstructorId,
                instructor = new { a.Instructor.Id, a.Instructor.UserId, a.Instructor.FullName, a.Instructor.Expertise, a.Instructor.Bio }
            }));
        }

        [HttpGet("instructor/{instructorId:long}")]
        public async Task<ActionResult<IEnumerable<BatchInstructor>>> GetByInstructorId(
            long instructorId)
        {
            var batchInstructors =
                await _batchInstructorService.GetByInstructorIdAsync(instructorId);

            return Ok(batchInstructors.Select(a => new {
                a.Id, a.BatchId, a.InstructorId,
                instructor = new { a.Instructor.Id, a.Instructor.UserId, a.Instructor.FullName, a.Instructor.Expertise, a.Instructor.Bio }
            }));
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<BatchInstructor>> AssignInstructor(
            [FromQuery] long batchId,
            [FromQuery] long instructorId)
        {
            var batchInstructor =
                await _batchInstructorService.AssignInstructorAsync(
                    batchId,
                    instructorId
                );

            return Ok(new { batchInstructor.Id, batchInstructor.BatchId, batchInstructor.InstructorId });
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
