using System.ComponentModel.DataAnnotations;
namespace BackEnd.DTOs.Payment;

public class RefundConfirmationDto
{
    [Required, MaxLength(100)]
    public string Reference { get; set; } = "";
}
