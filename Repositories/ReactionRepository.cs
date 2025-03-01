using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public class ReactionRepository : IReactionRepository
    {
        private readonly IMongoCollection<Reaction> _reactions;
        
        public ReactionRepository(IMongoDatabase database)
        {
            _reactions = database.GetCollection<Reaction>("Reactions");
        }
        
        public async Task<IEnumerable<Reaction>> GetAllAsync()
        {
            return await _reactions.Find(_ => true).ToListAsync();
        }
        
        public async Task<Reaction> GetByIdAsync(string id)
        {
            return await _reactions.Find(r => r.Id == id).FirstOrDefaultAsync();
        }
        
        public async Task<IEnumerable<Reaction>> GetReactionsByPostAsync(string postId)
        {
            return await _reactions.Find(r => r.PostId == postId).ToListAsync();
        }
        
        public async Task<IEnumerable<Reaction>> GetReactionsByCommentAsync(string commentId)
        {
            return await _reactions.Find(r => r.CommentId == commentId).ToListAsync();
        }
        
        public async Task<IEnumerable<Reaction>> GetReactionsByEmployeeAsync(string employeeId)
        {
            return await _reactions.Find(r => r.EmployeeId == employeeId).ToListAsync();
        }
        
        public async Task<Reaction> GetReactionByEmployeeAndPostAsync(string employeeId, string postId)
        {
            return await _reactions.Find(r => r.EmployeeId == employeeId && r.PostId == postId).FirstOrDefaultAsync();
        }
        
        public async Task<Reaction> GetReactionByEmployeeAndCommentAsync(string employeeId, string commentId)
        {
            return await _reactions.Find(r => r.EmployeeId == employeeId && r.CommentId == commentId).FirstOrDefaultAsync();
        }
        
        public async Task CreateAsync(Reaction reaction)
        {
            await _reactions.InsertOneAsync(reaction);
        }
        
        public async Task UpdateAsync(string id, Reaction reaction)
        {
            await _reactions.ReplaceOneAsync(r => r.Id == id, reaction);
        }
        
        public async Task DeleteAsync(string id)
        {
            await _reactions.DeleteOneAsync(r => r.Id == id);
        }
    }
}