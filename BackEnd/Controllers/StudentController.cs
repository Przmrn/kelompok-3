using BackEnd.DTOs.Student;
using BackEnd.Extensions;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/students")]
    public class StudentController : ControllerBase
    {
        private readonly IStudentService _service;

        public StudentController(IStudentService service)
        {
            _service = service;
        }

        [HttpGet("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<ActionResult<StudentResponseDto>> GetMe()
            => Ok(await _service.GetMyProfileAsync(User.GetUserId()));

        [HttpPost("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<ActionResult<StudentResponseDto>> CreateMe(StudentCreateDto dto)
        {
            var created = await _service.CreateMyProfileAsync(User.GetUserId(), dto);
            return CreatedAtAction(nameof(GetMe), created);
        }

        [HttpPut("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<ActionResult<StudentResponseDto>> UpdateMe(StudentUpdateDto dto)
            => Ok(await _service.UpdateMyProfileAsync(User.GetUserId(), dto));

        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetAll()
            => Ok(await _service.GetAllAsync());

        [HttpGet("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<StudentResponseDto>> GetById(long id)
            => Ok(await _service.GetByIdAsync(id));
    }
}
