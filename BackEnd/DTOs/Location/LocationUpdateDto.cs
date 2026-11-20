using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs.Location
{
    public class LocationUpdateDto
    {
        [Required, MinLength(1), MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Address { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string City { get; set; } = string.Empty;

        [MaxLength(100)]
        public string RoomName { get; set; } = string.Empty;
    }
}
