using BackEnd.DTOs.Registration;
using BackEnd.Models;

namespace BackEnd.Services;

public static class RefundPolicy
{
    public static CancellationPreviewDto Calculate(Registration registration, DateOnly start, DateTime now)
    {
        var today = DateOnly.FromDateTime(now.ToUniversalTime());
        var days = start.DayNumber - today.DayNumber;
        var result = new CancellationPreviewDto
        {
            BatchStartDate = start, CancellationDate = today, DaysDifference = days,
            TotalPaid = registration.PaidAmount,
            CanCancel = registration.RegistrationStatus is RegistrationStatus.PENDING or RegistrationStatus.CONFIRMED && days > 0
        };
        if (!result.CanCancel)
        {
            result.TierLabel = "Pembatalan tidak tersedia";
            result.ReasonIfBlocked = days <= 0 ? "Pembatalan hanya dapat diajukan sebelum kelas dimulai." : "Pendaftaran ini sudah final.";
            return result;
        }
        result.RefundPercentage = days >= 14 ? 100 : days >= 7 ? 50 : days >= 3 ? 25 : 0;
        result.FloorAdminFee = days >= 14 ? 25000m : 0m;
        result.EstimatedRefundAmount = Math.Max(0, Math.Round(
            registration.PaidAmount * result.RefundPercentage / 100m - result.FloorAdminFee,
            2, MidpointRounding.AwayFromZero));
        result.TierLabel = days >= 14 ? "100% dikurangi biaya administrasi Rp25.000" : result.RefundPercentage + "% dari jumlah yang sudah dibayar";
        return result;
    }
}
