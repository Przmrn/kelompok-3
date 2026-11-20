using BackEnd.Models;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationDetailDto : RegistrationResponseDto
    {
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
        public int InstallmentNumber { get; set; }

        public DateOnly DueDate { get; set; }

        public decimal Amount { get; set; }

        public decimal PaidAmount { get; set; }

        public DateTime? PaidAt { get; set; }

        public InstallmentStatus InstallmentStatus { get; set; }
    }
}