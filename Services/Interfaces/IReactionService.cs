using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IReactionService
    {
        Task<IEnumerable<Reaction>> GetAllAsync();
        Task<Reaction> GetReactionByIdAsync(string id);
        Task<IEnumerable<Reaction>> GetReactionsByPostAsync(string postId);
        Task<IEnumerable<Reaction>> GetReactionsByCommentAsync(string commentId);
        Task<IEnumerable<Reaction>> GetReactionsByEmployeeAsync(string employeeId);
        Task<Reaction> GetReactionByEmployeeAndPostAsync(string employeeId, string postId);
        Task<Reaction> GetReactionByEmployeeAndCommentAsync(string employeeId, string commentId);
        Task<Reaction> AddReactionAsync(ReactionRequest request);
        Task DeleteReactionAsync(string id);
        Task<ReactionsSummary> GetReactionsSummaryForPostAsync(string postId);
        Task<ReactionsSummary> GetReactionsSummaryForCommentAsync(string commentId);
    }
}