using System.ComponentModel.DataAnnotations;

namespace BackEnd.Models
{
    public class User
    {
        [Key]
        public long Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Role { get; set; } = string.Empty;

        public Student? Student { get; set; }

        public Instructor? Instructor { get; set; }
    }
}
