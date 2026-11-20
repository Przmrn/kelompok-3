using BackEnd.DTOs.Payment;
using BackEnd.Extensions;
using BackEnd.Models;
using BackEnd.Repositories;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IRegistrationService _registrationService;
        private readonly IRepository<Student> _students;

        public PaymentController(
            IPaymentService paymentService,
            IRegistrationService registrationService,
            IRepository<Student> students)
        {
            _paymentService = paymentService;
            _registrationService = registrationService;
            _students = students;
        }

        [HttpGet("registration/{registrationId:long}")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<ActionResult<PaymentResponseDto>> GetByRegistration(long registrationId)
        {
            var payment = await _paymentService.GetByRegistrationIdAsync(registrationId);

            if (payment == null)
                return NotFound(new { message = "Pendaftaran tidak ditemukan." });

            if (User.IsInRole("STUDENT"))
            {
                var studentId = await GetCurrentStudentIdAsync();
                var registration = await _registrationService.GetByIdAsync(registrationId);

                if (studentId == null)
                    return Unauthorized();

                if (registration == null || registration.StudentId != studentId.Value)
                    return Forbid();
            }

            return Ok(payment);
        }

        [HttpPost("registration/{registrationId:long}/confirm-upfront")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<PaymentResponseDto>> ConfirmUpfront(
            long registrationId,
            [FromBody] PaymentConfirmationRequestDto? request)
        {
            var payment = await _paymentService.ConfirmUpfrontPaymentAsync(
                registrationId,
                request?.PaidAmount);

            return Ok(payment);
        }

        [HttpPost("installments/{scheduleId:long}/confirm")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<PaymentResponseDto>> ConfirmInstallment(
            long scheduleId,
            [FromBody] PaymentConfirmationRequestDto? request)
        {
            var payment = await _paymentService.ConfirmInstallmentPaymentAsync(
                scheduleId,
                request?.PaidAmount);

            return Ok(payment);
        }

        [HttpPost("process-overdue")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ProcessOverdue()
        {
            await _paymentService.ProcessOverdueRegistrationsAsync();

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
