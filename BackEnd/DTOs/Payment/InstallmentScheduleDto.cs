using BackEnd.Models;

namespace BackEnd.DTOs.Payment
{
    public class InstallmentScheduleDto
    {
        public long Id { get; set; }
        public long RegistrationId { get; set; }
        public int InstallmentNumber { get; set; }
        public DateOnly DueDate { get; set; }
        public decimal Amount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public InstallmentStatus InstallmentStatus { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
