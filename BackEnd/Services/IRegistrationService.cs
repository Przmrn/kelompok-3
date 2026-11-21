using BackEnd.DTOs.Registration;

namespace BackEnd.Services
{
    public interface IRegistrationService
    {
        Task<RegistrationDetailDto> CreateAsync(
            long userId,
            RegistrationCreateDto dto
        );

        Task<IEnumerable<RegistrationDetailDto>> GetMyRegistrationsAsync(
            long userId
        );

        Task<RegistrationDetailDto> GetByIdAsync(
            long registrationId,
            long userId,
            bool isAdmin
        );

        Task<CancellationPreviewDto> PreviewCancellationAsync(long registrationId, long userId, bool isAdmin);

        Task<bool> CancelAsync(long registrationId, long userId, bool isAdmin);

        Task<IEnumerable<RegistrationDetailDto>> GetAllAsync();

        Task<RegistrationDetailDto> PayAsync(
            long registrationId,
            long userId,
            RegistrationPaymentDto dto
        );
    }
}