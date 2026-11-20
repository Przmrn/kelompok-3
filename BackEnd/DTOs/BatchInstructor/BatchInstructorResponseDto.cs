namespace BackEnd.DTOs.BatchInstructor
{
    public class BatchInstructorResponseDto
    {
        public long Id { get; set; }

        public long BatchId { get; set; }

        public long InstructorId { get; set; }

        public string BatchName { get; set; } = string.Empty;

        public string InstructorName { get; set; } = string.Empty;

        public string Expertise { get; set; } = string.Empty;

        public string Bio { get; set; } = string.Empty;
    }
}