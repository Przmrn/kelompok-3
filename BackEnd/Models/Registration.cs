
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class Registration
    {
        [Key]
        public long Id { get; set; }

        [ForeignKey(nameof(Student))]
        public long StudentId { get; set; }

        [ForeignKey(nameof(Batch))]
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
        public PaymentMethods PaymentMethod { get; set; }

        public int? InstallmentTenor { get; set; }

        public PaymentStatus PaymentStatus { get; set; }
            = PaymentStatus.PENDING;

        public RegistrationStatus RegistrationStatus { get; set; }
            = RegistrationStatus.PENDING;

        [System.Text.Json.Serialization.JsonIgnore]
        public Student Student { get; set; } = null!;

        [System.Text.Json.Serialization.JsonIgnore]
        public CourseBatch Batch { get; set; } = null!;

        [Column(TypeName = "decimal(15,2)")]
        public decimal PaidAmount { get; set; } = 0;

        public DateTime? PaidAt { get; set; }

        public ICollection<InstallmentSchedule> InstallmentSchedules
        { get; set; } = new List<InstallmentSchedule>();
    }
}
