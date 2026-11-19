using BackEnd.DTOs.Auth;
using BackEnd.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _service;

        public AuthController(IAuthService service)
        {
            _service = service;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserResponseDto>> Register(RegisterRequestDto dto)
        {
            try
            {
                var user = await _service.RegisterAsync(dto);
                return Created($"api/auth/users/{user.Id}", user);
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new { message = exception.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequestDto dto)
        {
            var response = await _service.LoginAsync(dto);
            return response == null
                ? Unauthorized(new { message = "Email or password is invalid." })
                : Ok(response);
        }
    }
}
