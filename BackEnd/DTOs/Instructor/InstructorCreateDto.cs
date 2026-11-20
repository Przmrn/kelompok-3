using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Instructor
{
    public class InstructorCreateDto
    {
        [Required, MinLength(1), MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(8), MaxLength(255)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Expertise { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }
}
