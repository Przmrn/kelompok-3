using System.ComponentModel.DataAnnotations;
using BackEnd.Models;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationCreateDto
    {
        [Required]
        public long BatchId { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public int? InstallmentTenor { get; set; }
    }
}