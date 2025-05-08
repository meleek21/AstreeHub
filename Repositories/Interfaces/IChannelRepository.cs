using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IChannelRepository
    {
        IMongoCollection<Channel> Collection { get; }
        Task<IEnumerable<Channel>> GetAllAsync();
        Task<Channel> GetByIdAsync(string id);
        Task<Channel> GetByDepartmentIdAsync(int departmentId);
        Task<IEnumerable<Channel>> GetGeneralChannelsAsync();
        Task CreateAsync(Channel channel);
        Task UpdateAsync(string id, Channel channel);
        Task DeleteAsync(string id);
        Task<bool> ChannelExistsAsync(string id);
        Task<bool> DepartmentHasChannelAsync(int departmentId);
    }
}
