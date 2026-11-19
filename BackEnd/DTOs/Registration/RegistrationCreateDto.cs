using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationCreateDto
    {
        [Range(1, long.MaxValue)]
        public long BatchId { get; set; }

        [Required]
        [MaxLength(30)]
        public string PaymentMethod { get; set; } = string.Empty;

        public int? InstallmentTenor { get; set; }
    }
}
