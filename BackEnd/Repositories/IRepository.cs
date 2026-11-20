using System.Linq.Expressions;

namespace BackEnd.Repositories
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();

        Task<IEnumerable<T>> GetAllAsync(
            string includeProperties
        );

        Task<T?> GetByIdAsync(long id);

        Task<IEnumerable<T>> FindAsync(
            Expression<Func<T, bool>> predicate
        );

        Task<bool> ExistsAsync(
            Expression<Func<T, bool>> predicate
        );

        Task<int> CountAsync(
            Expression<Func<T, bool>>? predicate = null
        );

        Task AddAsync(T entity);

        Task AddRangeAsync(IEnumerable<T> entities);

        void Update(T entity);

        void UpdateRange(IEnumerable<T> entities);

        void Delete(T entity);

        void DeleteRange(IEnumerable<T> entities);

        Task<int> SaveChangesAsync();
    }
}