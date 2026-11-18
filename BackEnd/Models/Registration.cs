using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class Registration
    {
        [Key]
        public long Id { get; set; }
        public long StudentId { get; set; }
        public long BatchId { get; set; }

        [MaxLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;
        public DateTime RegistrationDate { get; set; }
        public int QueueNumber { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal BasePrice { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal EarlyBirdDiscount { get; set; } = 0;

        [Column(TypeName = "decimal(5,2)")]
        public decimal TaxRate { get; set; } = 11.00m;

        [Column(TypeName = "decimal(15,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(15,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(30)]
        public string PaymentMethod { get; set; } = string.Empty;
        public int? InstallmentTenor { get; set; }

        [MaxLength(30)]
        public string PaymentStatus { get; set; } = "Pending";
        
        [MaxLength(30)]
        public string RegistrationStatus { get; set; } = "Pending";
        public Student Student { get; set; } = null!;

        public CourseBatch Batch { get; set; } = null!;
    }
}
