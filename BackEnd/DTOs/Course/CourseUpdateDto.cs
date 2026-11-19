using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.DTOs.Course
{
    public class CourseUpdateDto
    {
        [Required]
        public long CategoryId { get; set; }
        public string Syllabus { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "DurationHours harus lebih dari 0.")]
        public int DurationHours { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal BasePrice { get; set; }

    }
}
