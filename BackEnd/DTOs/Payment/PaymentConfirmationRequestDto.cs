using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Payment
{
    public class PaymentConfirmationRequestDto
    {
        [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
        public decimal? PaidAmount { get; set; }
    }
}
