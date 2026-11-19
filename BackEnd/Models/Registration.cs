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

        [ForeignKey(nameof(CourseBatch))]
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

        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.PENDING;
        
        [MaxLength(30)]
        public RegistrationStatus RegistrationStatus { get; set; } = RegistrationStatus.PENDING;
        public Student Student { get; set; } = null!;

        public CourseBatch CourseBatch { get; set; } = null!;

        public ICollection<InstallmentSchedule> InstallmentSchedules { get; set; } = new List<InstallmentSchedule>();
    }
}
