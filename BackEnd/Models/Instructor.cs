using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class Instructor
    {
        [Key]
        public long Id { get; set; }

        [ForeignKey(nameof(User))]
        public long UserId { get; set; }

        [MaxLength(255)]
        public string FullName { get; set; } = string.Empty;
        public string Expertise { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;

        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        public User User { get; set; } = null!;

        public ICollection<BatchInstructor> BatchInstructors { get; set; } = new List<BatchInstructor>();
    }
}
