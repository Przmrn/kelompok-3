using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackEnd.Models
{
    public class Course
    {
        [Key]
        public long Id { get; set; }
        public int CategoryId { get; set; }
        public string Syllabus { get; set; } = string.Empty;
        public int DurationHours { get; set; }

        [Column(TypeName ="decimal(15,2")]
        public decimal BasePrice { get; set; }

    }
}
