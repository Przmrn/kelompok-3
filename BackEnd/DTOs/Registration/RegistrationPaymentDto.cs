using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationPaymentDto
    {
        [Required]
        [Range(1, double.MaxValue)]
        public decimal Amount { get; set; }
    }
}