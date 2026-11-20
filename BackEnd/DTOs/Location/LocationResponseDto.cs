namespace BackEnd.DTOs.Location
{
    public class LocationResponseDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
    }
}
