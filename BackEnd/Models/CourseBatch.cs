using System.ComponentModel.DataAnnotations;

namespace BackEnd.Models
{
    public class CourseBatch
    {
        [Key]
        public long Id { get; set; }
        public long CourseId { get; set; }
        public long LocationId { get; set; }

        [MaxLength(150)]
        public string BatchName { get; set; } = string.Empty;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        [MaxLength(30)]
        public int MaxSeats { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = string.Empty;
    }
}
