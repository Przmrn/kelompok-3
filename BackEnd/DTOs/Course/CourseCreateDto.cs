using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.DTOs.Course
{
    public class CourseCreateDto
    {
        [Range(1, long.MaxValue)]
        public long CategoryId { get; set; }

        [Required, MinLength(1)]
        public string Syllabus { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "DurationHours harus lebih dari 0")]
        public int DurationHours { get; set; }

        [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
        [Column(TypeName = "decimal(15,2)")]
        public decimal BasePrice { get; set; }
    }
}
