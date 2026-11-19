using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class CourseBatch
    {
        [Key]
        public long Id { get; set; }

        [ForeignKey(nameof(Course))]
        public long CourseId { get; set; }

        [ForeignKey(nameof(Location))]
        public long LocationId { get; set; }

        [MaxLength(150)]
        public string BatchName { get; set; } = string.Empty;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public int MaxSeats { get; set; } = 30;

        public CourseBatchStatus CourseStatus { get; set; } = CourseBatchStatus.OPEN;

        public Location Location { get; set; } = null!;

        public Course Course { get; set; } = null!;

        public ICollection<Registration> Registrations { get; set; } = new List<Registration>();

        public ICollection<BatchInstructor> BatchInstructors { get; set; } = new List<BatchInstructor>();
    }
}
