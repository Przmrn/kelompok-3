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

        [NotMapped] public int UsedSeats => Registrations.Count(r => r.RegistrationStatus == RegistrationStatus.PENDING || r.RegistrationStatus == RegistrationStatus.CONFIRMED);
        [NotMapped] public int NextQueue => Registrations.Select(r => r.QueueNumber).DefaultIfEmpty(0).Max() + 1;

        [System.Text.Json.Serialization.JsonIgnore]
        public Location Location { get; set; } = null!;

        [System.Text.Json.Serialization.JsonIgnore]
        public Course Course { get; set; } = null!;

        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<Registration> Registrations { get; set; } = new List<Registration>();

        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<BatchInstructor> BatchInstructors { get; set; } = new List<BatchInstructor>();
    }
}
