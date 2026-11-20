using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required, MinLength(1), MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;
    }
}
