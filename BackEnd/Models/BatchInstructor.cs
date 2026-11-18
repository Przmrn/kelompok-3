using System.ComponentModel.DataAnnotations;

namespace BackEnd.Models
{
    public class BatchInstructor
    {
        [Key]
        public long Id { get; set; }
        public long BatchId { get; set; }
        public long InstructorId { get; set; }
    }
}
