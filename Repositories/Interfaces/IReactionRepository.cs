using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IReactionRepository
    {
        Task<IEnumerable<Reaction>> GetAllAsync();
        Task<Reaction> GetByIdAsync(string id);
        Task<IEnumerable<Reaction>> GetReactionsByPostAsync(string postId);
        Task<IEnumerable<Reaction>> GetReactionsByCommentAsync(string commentId);
        Task<IEnumerable<Reaction>> GetReactionsByEmployeeAsync(string employeeId);
        Task<Reaction> GetReactionByEmployeeAndPostAsync(string employeeId, string postId);
        Task<Reaction> GetReactionByEmployeeAndCommentAsync(string employeeId, string commentId);
        Task CreateAsync(Reaction reaction);
        Task UpdateAsync(string id, Reaction reaction);
        Task DeleteAsync(string id);
    }
}