
using BackEnd.Models;

namespace BackEnd.Services
{
    public interface ICourseBatchService
    {
        Task<IEnumerable<CourseBatch>> GetAllAsync();

        Task<CourseBatch?> GetByIdAsync(long id);

        Task<CourseBatch> CreateAsync(CourseBatch courseBatch);

        Task<CourseBatch?> UpdateAsync(long id, CourseBatch courseBatch);

        Task<bool> DeleteAsync(long id);
    }
}
