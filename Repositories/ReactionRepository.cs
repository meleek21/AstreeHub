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
            var filter = Builders<Reaction>.Filter.Eq(r => r.PostId, postId);
            return await _reactions.Find(filter).ToListAsync();
        }
        
        public async Task<IEnumerable<Reaction>> GetReactionsByEmployeeAsync(string employeeId)
        {
            var filter = Builders<Reaction>.Filter.Eq(r => r.EmployeeId, employeeId);
            return await _reactions.Find(filter).ToListAsync();
        }
        
        public async Task<Reaction> GetReactionByEmployeeAndPostAsync(string employeeId, string postId)
        {
            var filter = Builders<Reaction>.Filter.And(
                Builders<Reaction>.Filter.Eq(r => r.EmployeeId, employeeId),
                Builders<Reaction>.Filter.Eq(r => r.PostId, postId)
            );
            return await _reactions.Find(filter).FirstOrDefaultAsync();
        }
        
        public async Task CreateAsync(Reaction reaction)
        {
            await _reactions.InsertOneAsync(reaction);
        }
        
        public async Task UpdateAsync(string id, Reaction reaction)
        {
            var filter = Builders<Reaction>.Filter.Eq(r => r.Id, id);
            await _reactions.ReplaceOneAsync(filter, reaction);
        }
        
        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Reaction>.Filter.Eq(r => r.Id, id);
            await _reactions.DeleteOneAsync(filter);
        }
    }
}