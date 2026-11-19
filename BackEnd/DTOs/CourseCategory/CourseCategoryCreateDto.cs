using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.CourseCategory
{
    public class CourseCategoryCreateDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}
