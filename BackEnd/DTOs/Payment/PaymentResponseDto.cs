using BackEnd.Models;

namespace BackEnd.DTOs.Payment
{
    public class PaymentResponseDto
    {
        public long RegistrationId { get; set; }
        public string RegistrationNumber { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public RegistrationStatus RegistrationStatus { get; set; }
        public DateTime? PaidAt { get; set; }
        public List<InstallmentScheduleDto> InstallmentSchedules { get; set; } = new();
    }
}
