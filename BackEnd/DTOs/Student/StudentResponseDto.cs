namespace BackEnd.DTOs.Student
{
    public class StudentResponseDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string EducationalLevel { get; set; } = string.Empty;
        public string Occupation { get; set; } = string.Empty;
    }
}
