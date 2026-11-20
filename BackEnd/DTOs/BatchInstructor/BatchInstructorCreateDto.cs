using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.BatchInstructor
{
    public class BatchInstructorCreateDto
    {
        [Range(1, long.MaxValue)]
        public long BatchId { get; set; }

        [Range(1, long.MaxValue)]
        public long InstructorId { get; set; }
    }
}