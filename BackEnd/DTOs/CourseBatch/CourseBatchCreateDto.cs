namespace BackEnd.DTOs.CourseBatch
{
    public class CourseBatchCreateDto
    {
        public long CourseId { get; set; }
        public long LocationId { get; set; }
        [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MaxLength(150)]
        public string BatchName { get; set; } = string.Empty;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public int MaxSeats { get; set; }
        public Models.CourseBatch ToBatch() => new()
        {
            CourseId = CourseId, LocationId = LocationId, BatchName = BatchName,
            StartDate = StartDate, EndDate = EndDate, StartTime = StartTime,
            EndTime = EndTime, MaxSeats = MaxSeats
        };
    }
}
