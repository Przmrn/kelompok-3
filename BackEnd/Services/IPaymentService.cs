using BackEnd.DTOs.Payment;

namespace BackEnd.Services
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto?> GetByRegistrationIdAsync(long registrationId);
        Task<PaymentResponseDto> ConfirmUpfrontPaymentAsync(long registrationId, decimal? paidAmount);
        Task<PaymentResponseDto> ConfirmInstallmentPaymentAsync(long scheduleId, decimal? paidAmount);
        Task ProcessOverdueRegistrationsAsync();
        Task<PaymentResponseDto> ConfirmRefundAsync(long registrationId, long userId, string reference);
    }
}
