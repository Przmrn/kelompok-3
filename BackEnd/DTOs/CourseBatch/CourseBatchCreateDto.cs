using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.CourseBatch
{
    public class CourseBatchCreateDto
    {
        [Required]
        public long CourseId { get; set; }

        [Required]
        public long LocationId { get; set; }

        [Required]
        [MaxLength(150)]
        public string BatchName { get; set; } = string.Empty;

        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }

        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        [Range(1, 30)]
        public int MaxSeats { get; set; }

        public Models.CourseBatch ToBatch() => new()
        {
            CourseId = CourseId,
            LocationId = LocationId,
            BatchName = BatchName,
            StartDate = StartDate,
            EndDate = EndDate,
            StartTime = StartTime,
            EndTime = EndTime,
            MaxSeats = MaxSeats
        };
    }
}