using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class InstallmentSchedule
    {
        [Key]
        public long Id { get; set; }
        public long RegistrationId { get; set; }
        public int InstallmentNumber { get; set; }
        public DateOnly DueDate { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal Amount { get; set; }
        public DateTime? PaidAt { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal PaidAmount { get; set; } = 0;

        [MaxLength(30)]
        public string Status { get; set; } = "Pending";
        public Registration Registration { get; set; } = null!;
    }
}
