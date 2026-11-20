using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.BatchInstructor
{
    public class BatchInstructorCreateDto
    {
        [Required]
        public long BatchId { get; set; }

        [Required]
        public long InstructorId { get; set; }
    }
}