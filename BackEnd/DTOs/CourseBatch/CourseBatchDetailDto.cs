namespace BackEnd.DTOs.CourseBatch
{
    public class CourseBatchDetailDto : CourseBatchResponseDto
    {
        public string Syllabus { get; set; } = string.Empty;
        public int DurationHours { get; set; }
        public decimal BasePrice { get; set; }

        public string LocationAddress { get; set; } = string.Empty;
        public string LocationCity { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
    }
}