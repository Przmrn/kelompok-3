using BackEnd.Models;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationResponseDto
    {
        public long Id { get; set; }

        public string RegistrationNumber { get; set; } = string.Empty;

        public DateTime RegistrationDate { get; set; }

        public int QueueNumber { get; set; }

        public long BatchId { get; set; }

        public string BatchName { get; set; } = string.Empty;

        public decimal BasePrice { get; set; }

        public decimal EarlyBirdDiscount { get; set; }

        public decimal TaxRate { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public decimal PaidAmount { get; set; }

        public decimal RemainingAmount => TotalAmount - PaidAmount;

        public string PaymentMethod { get; set; } = string.Empty;

        public int? InstallmentTenor { get; set; }

        public PaymentStatus PaymentStatus { get; set; }

        public RegistrationStatus RegistrationStatus { get; set; }
    }
}