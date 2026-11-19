using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.DTOs.Course
{
    public class CourseResponseDto
    {
        public long Id { get; set; }
        public long CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int DurationHours { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal BasePrice { get; set; }
    }
}
