using System.ComponentModel.DataAnnotations;
using BackEnd.Models;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationCreateDto
    {
        [Required]
        public long BatchId { get; set; }

        [Required]
        public PaymentMethods PaymentMethod { get; set; }

        public int? InstallmentTenor { get; set; }
    }
}