using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Student
{
    public class StudentCreateDto
    {
        [Required, MinLength(1), MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Province { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [MaxLength(100)]
        public string EducationalLevel { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Occupation { get; set; } = string.Empty;
    }
}
