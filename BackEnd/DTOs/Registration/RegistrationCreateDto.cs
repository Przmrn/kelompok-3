using System.ComponentModel.DataAnnotations;
using BackEnd.Models;

namespace BackEnd.DTOs.Registration
{
    public class RegistrationCreateDto
    {
        [Range(1, long.MaxValue)]
        public long BatchId { get; set; }

        [EnumDataType(typeof(PaymentMethods))]
        public PaymentMethods PaymentMethod { get; set; }

        [Range(1, 12)]
        public int? InstallmentTenor { get; set; }
    }
}