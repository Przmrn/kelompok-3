
using BackEnd.Models;

namespace BackEnd.Services
{
    public interface IRegistrationService
    {
        // Mengambil seluruh pendaftaran
        Task<IEnumerable<Registration>> GetAllAsync();

        // Mengambil pendaftaran berdasarkan ID
        Task<Registration?> GetByIdAsync(long id);

        // Mengambil pendaftaran berdasarkan Student
        Task<IEnumerable<Registration>> GetByStudentIdAsync(long studentId);

        // Membuat pendaftaran kursus
        Task<Registration> CreateAsync(
            long studentId,
            long batchId,
            string paymentMethod,
            int? installmentTenor);

        // Mengonfirmasi pembayaran Upfront
        Task<bool> ConfirmUpfrontPaymentAsync(long registrationId);

        // Mengonfirmasi pembayaran cicilan
        Task<bool> ConfirmInstallmentPaymentAsync(long installmentScheduleId);

        // Membatalkan pendaftaran
        Task<bool> CancelAsync(long id);

        // Memproses pendaftaran dengan cicilan yang terlambat
        Task ProcessOverdueRegistrationsAsync();
    }
}
