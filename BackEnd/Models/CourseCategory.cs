using System.ComponentModel.DataAnnotations;

namespace BackEnd.Models
{
    public class CourseCategory
    {
        [Key]
        public long Id { get; set; }

        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ICollection<Course> Courses { get; set; } = new List<Course>();
    }
}
