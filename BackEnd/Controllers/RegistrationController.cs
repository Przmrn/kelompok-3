
using BackEnd.DTOs;
using BackEnd.DTOs.Registration;
using BackEnd.Models;
using BackEnd.Services;
using BackEnd.Repositories;
using BackEnd.Extensions;
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

        private readonly IRepository<Student> _students;

        public RegistrationController(
            IRegistrationService registrationService, IRepository<Student> students)
        {
            _registrationService = registrationService;
            _students = students;
        }

        // Mengambil seluruh pendaftaran
        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<IEnumerable<Registration>>> GetAll()
        {
            var registrations = await _registrationService.GetAllAsync();

            return Ok(registrations);
        }

        // Mengambil pendaftaran milik student yang sedang login
        [HttpGet("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<ActionResult<IEnumerable<Registration>>> GetMyRegistrations()
        {
            var studentId = await GetCurrentStudentIdAsync();

            if (studentId == null)
                return Ok(Array.Empty<Registration>());

            var registrations =
                await _registrationService.GetByStudentIdAsync(studentId.Value);

            return Ok(registrations);
        }

        // Mengambil detail pendaftaran berdasarkan ID
        [HttpGet("{id:long}")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<ActionResult<Registration>> GetById(long id)
        {
            var registration = await _registrationService.GetByIdAsync(id);

            if (registration == null)
                return NotFound(new
                {
                    message = "Pendaftaran tidak ditemukan."
                });

            if (User.IsInRole("STUDENT"))
            {
                var studentId = await GetCurrentStudentIdAsync();

                if (studentId == null)
                    return Unauthorized();

                if (registration.StudentId != studentId.Value)
                    return Forbid();
            }

            return Ok(registration);
        }

        // Membuat pendaftaran kursus
        [HttpPost]
        [Authorize(Roles = "STUDENT")]
        public async Task<ActionResult<Registration>> Create(
            [FromBody] RegistrationCreateDto request)
        {
            var studentId = await GetCurrentStudentIdAsync();

            if (studentId == null)
                return Unauthorized(new
                {
                    message = "Identitas student tidak ditemukan."
                });

            var registration = await _registrationService.CreateAsync(
                studentId.Value,
                request.BatchId,
                request.PaymentMethod,
                request.InstallmentTenor
            );

            return CreatedAtAction(
                nameof(GetById),
                new { id = registration.Id },
                registration
            );
        }

        // Mengonfirmasi pembayaran Upfront
        [HttpPost("{id:long}/confirm-upfront")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ConfirmUpfrontPayment(long id)
        {
            var result =
                await _registrationService.ConfirmUpfrontPaymentAsync(id);

            if (!result)
                return BadRequest(new
                {
                    message = "Pembayaran Upfront tidak dapat dikonfirmasi."
                });

            return Ok(new
            {
                message = "Pembayaran Upfront berhasil dikonfirmasi."
            });
        }

        // Mengonfirmasi pembayaran cicilan
        [HttpPost("installments/{scheduleId:long}/confirm")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ConfirmInstallmentPayment(
            long scheduleId)
        {
            var result =
                await _registrationService.ConfirmInstallmentPaymentAsync(
                    scheduleId
                );

            if (!result)
                return BadRequest(new
                {
                    message = "Pembayaran cicilan tidak dapat dikonfirmasi."
                });

            return Ok(new
            {
                message = "Pembayaran cicilan berhasil dikonfirmasi."
            });
        }

        // Membatalkan pendaftaran
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<IActionResult> Cancel(long id)
        {
            var registration = await _registrationService.GetByIdAsync(id);

            if (registration == null)
                return NotFound(new
                {
                    message = "Pendaftaran tidak ditemukan."
                });

            if (User.IsInRole("STUDENT"))
            {
                var studentId = await GetCurrentStudentIdAsync();

                if (studentId == null)
                    return Unauthorized();

                if (registration.StudentId != studentId.Value)
                    return Forbid();
            }

            var result = await _registrationService.CancelAsync(id);

            if (!result)
                return BadRequest(new
                {
                    message = "Pendaftaran tidak dapat dibatalkan."
                });

            return Ok(new
            {
                message = "Pendaftaran berhasil dibatalkan."
            });
        }

        // Memproses pendaftaran dengan cicilan yang terlambat
        [HttpPost("process-overdue")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ProcessOverdueRegistrations()
        {
            await _registrationService.ProcessOverdueRegistrationsAsync();

            return Ok(new
            {
                message = "Pemeriksaan keterlambatan pembayaran berhasil dijalankan."
            });
        }

        private async Task<long?> GetCurrentStudentIdAsync()
        {
            var studentIdClaim = User.FindFirst("StudentId")?.Value;

            if (long.TryParse(studentIdClaim, out var studentId))
                return studentId;

            var userId = User.GetUserId();
            var student = (await _students.FindAsync(s => s.UserId == userId)).FirstOrDefault();
            return student?.Id;
        }
    }
}
