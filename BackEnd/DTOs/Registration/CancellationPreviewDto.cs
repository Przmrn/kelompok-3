namespace BackEnd.DTOs.Registration;

public class CancellationPreviewDto
{
    public DateOnly BatchStartDate { get; set; }
    public DateOnly CancellationDate { get; set; }
    public int DaysDifference { get; set; }
    public decimal TotalPaid { get; set; }
    public string TierLabel { get; set; } = "";
    public int RefundPercentage { get; set; }
    public decimal FloorAdminFee { get; set; }
    public decimal EstimatedRefundAmount { get; set; }
    public bool CanCancel { get; set; }
    public string? ReasonIfBlocked { get; set; }
}
