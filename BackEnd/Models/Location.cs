using System.ComponentModel.DataAnnotations;

namespace BackEnd.Models
{
    public class Location
    {
        [Key]
        public long Id { get; set; }

        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Address { get; set; } = string.Empty;

        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [MaxLength(100)]
        public string RoomName { get; set; } = string.Empty;

        public ICollection<CourseBatch> CourseBatches { get; set; } = new List<CourseBatch>();
    }
}
