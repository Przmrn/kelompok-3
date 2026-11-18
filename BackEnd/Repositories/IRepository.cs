using System.Linq.Expressions;

namespace BackEnd.Repositories
{
    public interface IRepository<T> where T : class
    {
        // READ
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

        // CREATE
        Task AddAsync(T entity);

        Task AddRangeAsync(IEnumerable<T> entities);


        // UPDATE
        void Update(T entity);

        void UpdateRange(IEnumerable<T> entities);


        // DELETE
        void Delete(T entity);

        void DeleteRange(IEnumerable<T> entities);
    }
}
