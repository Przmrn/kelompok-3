using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class BatchInstructor
    {
        [Key]
        public long Id { get; set; }

        [ForeignKey(nameof(CourseBatch))]
        public long BatchId { get; set; }

        [ForeignKey(nameof(Instructor))]
        public long InstructorId { get; set; }

        public Instructor Instructor { get; set; } = null!;

        public CourseBatch CourseBatch { get; set; } = null!;
    }
}
