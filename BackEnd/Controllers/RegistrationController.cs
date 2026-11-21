﻿using BackEnd.DTOs.Registration;
using BackEnd.DTOs.Payment;
using BackEnd.Exceptions;
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
        private readonly IPaymentService _paymentService;

        public RegistrationController(
            IRegistrationService registrationService,
            IPaymentService paymentService)
        {
            _registrationService = registrationService;
            _paymentService = paymentService;
        }

        private long GetUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (!long.TryParse(userId, out var id))
                throw new UnauthorizedException("User ID tidak valid.");

            return id;
        }

        [HttpPost]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> Create([FromBody] RegistrationCreateDto dto)
        {
            var result = await _registrationService.CreateAsync(GetUserId(), dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpGet("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> GetMyRegistrations()
        {
            return Ok(await _registrationService.GetMyRegistrationsAsync(GetUserId()));
        }

        [HttpGet("{id:long}")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<IActionResult> GetById(long id)
        {
            return Ok(await _registrationService.GetByIdAsync(id, GetUserId(), User.IsInRole("ADMIN")));
        }

        [HttpGet("{id:long}/payment")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<IActionResult> GetPayment(long id)
        {
            await _registrationService.GetByIdAsync(id, GetUserId(), User.IsInRole("ADMIN"));
            var payment = await _paymentService.GetByRegistrationIdAsync(id);
            return payment == null
                ? NotFound(new { message = "Data payment tidak ditemukan." })
                : Ok(payment);
        }

        [HttpGet("{id:long}/cancellation-preview")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<IActionResult> CancellationPreview(long id)
        {
            return Ok(await _registrationService.PreviewCancellationAsync(id, GetUserId(), User.IsInRole("ADMIN")));
        }

        [HttpPost("{id:long}/confirm-refund")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ConfirmRefund(long id, [FromBody] RefundConfirmationDto request)
        {
            return Ok(await _paymentService.ConfirmRefundAsync(id, GetUserId(), request.Reference));
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<IActionResult> Cancel(long id)
        {
            var cancelled = await _registrationService.CancelAsync(id, GetUserId(), User.IsInRole("ADMIN"));
            return cancelled
                ? Ok(new { message = "Pendaftaran dibatalkan." })
                : Conflict(new { message = "Pendaftaran sudah dibatalkan." });
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _registrationService.GetAllAsync());
        }

        [HttpPost("{id:long}/payments")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> Pay(long id, [FromBody] RegistrationPaymentDto dto)
        {
            return Ok(await _registrationService.PayAsync(id, GetUserId(), dto));
        }

        [HttpPost("{id:long}/confirm-upfront")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ConfirmUpfrontPayment(
            long id,
            [FromBody] PaymentConfirmationRequestDto? request = null)
        {
            var payment = await _paymentService.ConfirmUpfrontPaymentAsync(id, request?.PaidAmount);
            return Ok(new { message = "Pembayaran Upfront berhasil dikonfirmasi.", payment });
        }

        [HttpPost("installments/{scheduleId:long}/confirm")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ConfirmInstallmentPayment(
            long scheduleId,
            [FromBody] PaymentConfirmationRequestDto? request = null)
        {
            var payment = await _paymentService.ConfirmInstallmentPaymentAsync(scheduleId, request?.PaidAmount);
            return Ok(new { message = "Pembayaran cicilan berhasil dikonfirmasi.", payment });
        }

        [HttpPost("process-overdue")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ProcessOverdueRegistrations()
        {
            await _paymentService.ProcessOverdueRegistrationsAsync();
            return Ok(new { message = "Pemeriksaan keterlambatan pembayaran berhasil dijalankan." });
        }

    }
}