using BackEnd.Models;

namespace BackEnd.DTOs.CourseBatch
{
    public class CourseBatchResponseDto
    {
        public long Id { get; set; }

        public long CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;

        public long LocationId { get; set; }
        public string LocationName { get; set; } = string.Empty;

        public string BatchName { get; set; } = string.Empty;

        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }

        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public int MaxSeats { get; set; }
        public int UsedSeats { get; set; }
        public int AvailableSeats { get; set; }

        public CourseBatchStatus CourseStatus { get; set; }
    }
}