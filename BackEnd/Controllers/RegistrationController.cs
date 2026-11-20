﻿using BackEnd.DTOs.Registration;
using BackEnd.DTOs.Payment;
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
                throw new UnauthorizedAccessException("User ID tidak valid.");

            return id;
        }

        [HttpPost]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> Create([FromBody] RegistrationCreateDto dto)
        {
            try
            {
                var result = await _registrationService.CreateAsync(GetUserId(), dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpGet("me")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> GetMyRegistrations()
        {
            try
            {
                return Ok(await _registrationService.GetMyRegistrationsAsync(GetUserId()));
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                return Ok(await _registrationService.GetByIdAsync(id, GetUserId(), User.IsInRole("ADMIN")));
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpGet("{id:long}/payment")]
        [Authorize(Roles = "STUDENT,ADMIN")]
        public async Task<IActionResult> GetPayment(long id)
        {
            try
            {
                await _registrationService.GetByIdAsync(id, GetUserId(), User.IsInRole("ADMIN"));
                var payment = await _paymentService.GetByRegistrationIdAsync(id);
                return payment == null
                    ? NotFound(new { message = "Data payment tidak ditemukan." })
                    : Ok(payment);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                return Ok(await _registrationService.GetAllAsync());
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpPost("{id:long}/payments")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> Pay(long id, [FromBody] RegistrationPaymentDto dto)
        {
            try
            {
                return Ok(await _registrationService.PayAsync(id, GetUserId(), dto));
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
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

        private IActionResult HandleException(Exception ex)
        {
            if (ex is UnauthorizedAccessException)
                return Forbid();

            return BadRequest(new { message = ex.Message });
        }
    }
}