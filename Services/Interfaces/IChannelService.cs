using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IChannelService
    {
        Task<IEnumerable<Channel>> GetAllChannelsAsync();
        Task<Channel> GetChannelByIdAsync(string id);
        Task<Channel> GetChannelByDepartmentIdAsync(int departmentId);
        Task<IEnumerable<Channel>> GetGeneralChannelsAsync();
        Task<Channel> CreateChannelAsync(Channel channel);
        Task UpdateChannelAsync(string id, Channel channel);
        Task DeleteChannelAsync(string id);
        Task<bool> ChannelExistsAsync(string id);
        Task<bool> DepartmentHasChannelAsync(int departmentId);
        Task<(IEnumerable<Post> Posts, string NextLastItemId, bool HasMore)> GetChannelPostsAsync(string channelId, string lastItemId = null, int limit = 10);
    }
}