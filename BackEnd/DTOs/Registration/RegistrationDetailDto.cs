using BackEnd.Models;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationDetailDto : RegistrationResponseDto
    {
        public long StudentId { get; set; }
        public DateTime? PaidAt { get; set; }

        public DateTime? CancelledAt { get; set; }
        public int? DaysBeforeBatchStart { get; set; }
        public int? RefundPercentage { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? RefundedAt { get; set; }
        public long? RefundedByUserId { get; set; }
        public string? RefundReference { get; set; }


        public string CourseSyllabus { get; set; } = string.Empty;

        public int DurationHours { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public TimeOnly StartTime { get; set; }

        public TimeOnly EndTime { get; set; }

        public string LocationName { get; set; } = string.Empty;

        public string LocationAddress { get; set; } = string.Empty;

        public List<InstallmentDetailDto> Installments { get; set; } = new();
    }

    public class InstallmentDetailDto
    {
        public long Id { get; set; }
        public int InstallmentNumber { get; set; }

        public DateOnly DueDate { get; set; }

        public decimal Amount { get; set; }

        public decimal PaidAmount { get; set; }

        public DateTime? PaidAt { get; set; }

        public InstallmentStatus InstallmentStatus { get; set; }
    }
}