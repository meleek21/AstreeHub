using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public class ChannelRepository : IChannelRepository
    {
        private readonly IMongoCollection<Channel> _channels;

        public ChannelRepository(IMongoDatabase database)
        {
            _channels = database.GetCollection<Channel>("Channels");
        }

        public IMongoCollection<Channel> Collection => _channels;

        public async Task<IEnumerable<Channel>> GetAllAsync()
        {
            return await _channels.Find(_ => true).ToListAsync();
        }

        public async Task<Channel> GetByIdAsync(string id)
        {
            return await _channels.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Channel> GetByDepartmentIdAsync(int departmentId)
        {
            return await _channels.Find(c => c.DepartmentId == departmentId).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Channel>> GetGeneralChannelsAsync()
        {
            return await _channels.Find(c => c.IsGeneral == true).ToListAsync();
        }

        public async Task CreateAsync(Channel channel)
        {
            await _channels.InsertOneAsync(channel);
        }

        public async Task UpdateAsync(string id, Channel channel)
        {
            await _channels.ReplaceOneAsync(c => c.Id == id, channel);
        }

        public async Task DeleteAsync(string id)
        {
            await _channels.DeleteOneAsync(c => c.Id == id);
        }

        public async Task<bool> ChannelExistsAsync(string id)
        {
            var count = await _channels.CountDocumentsAsync(c => c.Id == id);
            return count > 0;
        }

        public async Task<bool> DepartmentHasChannelAsync(int departmentId)
        {
            var count = await _channels.CountDocumentsAsync(c => c.DepartmentId == departmentId);
            return count > 0;
        }
    }
}