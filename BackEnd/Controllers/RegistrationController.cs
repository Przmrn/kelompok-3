using BackEnd.DTOs.Registration;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RegistrationController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;

        public RegistrationController(
            IRegistrationService registrationService
        )
        {
            _registrationService = registrationService;
        }

        // Mengambil UserId dari JWT
        private long GetUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            ) ?? User.FindFirstValue("sub");

            if (!long.TryParse(userId, out long id))
            {
                throw new UnauthorizedAccessException(
                    "User ID tidak valid."
                );
            }

            return id;
        }

        // POST: api/registration
        // Student membuat registration
        [HttpPost]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> Create(
            [FromBody] RegistrationCreateDto dto
        )
        {
            try
            {
                long userId = GetUserId();

                var result = await _registrationService.CreateAsync(
                    userId,
                    dto
                );

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = result.Id },
                    result
                );
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        // GET: api/registration/me
        // Student melihat seluruh registration miliknya
        [HttpGet("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> GetMyRegistrations()
        {
            try
            {
                long userId = GetUserId();

                var result =
                    await _registrationService.GetMyRegistrationsAsync(
                        userId
                    );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        // GET: api/registration/{id}
        // Student melihat registration miliknya
        // Admin dapat melihat semua registration
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                long userId = GetUserId();

                bool isAdmin = User.IsInRole("ADMIN");

                var result = await _registrationService.GetByIdAsync(
                    id,
                    userId,
                    isAdmin
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        // GET: api/registration
        // Admin melihat seluruh registration
        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var result = await _registrationService.GetAllAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        // POST: api/registration/{id}/payments
        // Student melakukan pembayaran
        [HttpPost("{id:long}/payments")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> Pay(
            long id,
            [FromBody] RegistrationPaymentDto dto
        )
        {
            try
            {
                long userId = GetUserId();

                var result = await _registrationService.PayAsync(
                    id,
                    userId,
                    dto
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        private IActionResult HandleException(Exception ex)
        {
            if (ex is UnauthorizedAccessException)
            {
                return Forbid();
            }

            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}