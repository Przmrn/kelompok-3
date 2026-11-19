namespace BackEnd.DTOs.Course
{
    public class CourseDetailDto : CourseResponseDto
    {
        public string Syllabus { get; set; } = string.Empty;
        public int BatchCount { get; set; }
    }
}
