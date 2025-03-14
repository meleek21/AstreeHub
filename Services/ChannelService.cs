using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services
{
    public class ChannelService : IChannelService
    {
        private readonly IChannelRepository _channelRepository;
        private readonly IPostRepository _postRepository;
        private readonly IDepartmentRepository _departmentRepository;

        public ChannelService(
            IChannelRepository channelRepository,
            IPostRepository postRepository,
            IDepartmentRepository departmentRepository)
        {
            _channelRepository = channelRepository;
            _postRepository = postRepository;
            _departmentRepository = departmentRepository;
        }

        public async Task<IEnumerable<Channel>> GetAllChannelsAsync()
        {
            return await _channelRepository.GetAllAsync();
        }

        public async Task<Channel> GetChannelByIdAsync(string id)
        {
            return await _channelRepository.GetByIdAsync(id);
        }

        public async Task<Channel> GetChannelByDepartmentIdAsync(int departmentId)
        {
            return await _channelRepository.GetByDepartmentIdAsync(departmentId);
        }

        public async Task<IEnumerable<Channel>> GetGeneralChannelsAsync()
        {
            return await _channelRepository.GetGeneralChannelsAsync();
        }

        public async Task<Channel> CreateChannelAsync(Channel channel)
        {
            // Validate business rules
            if (!channel.IsGeneral && channel.DepartmentId.HasValue)
            {
                // Ensure department doesn't already have a channel
                bool hasChannel = await _channelRepository.DepartmentHasChannelAsync(channel.DepartmentId.Value);
                if (hasChannel)
                {
                    throw new InvalidOperationException($"Department with ID {channel.DepartmentId} already has a channel");
                }

                // Verify department exists
                var department = await _departmentRepository.GetByIdAsync(channel.DepartmentId.Value);
                if (department == null)
                {
                    throw new KeyNotFoundException($"Department with ID {channel.DepartmentId} not found");
                }
            }

            await _channelRepository.CreateAsync(channel);

            // If this is a department channel, update the department with the channel reference
            if (!channel.IsGeneral && channel.DepartmentId.HasValue)
            {
                var department = await _departmentRepository.GetByIdAsync(channel.DepartmentId.Value);
                if (department != null)
                {
                    department.ChannelId = channel.Id;
                    await _departmentRepository.UpdateAsync(department.Id, department);
                }
            }

            return channel;
        }

        public async Task UpdateChannelAsync(string id, Channel channel)
        {
            var existingChannel = await _channelRepository.GetByIdAsync(id);
            if (existingChannel == null)
            {
                throw new KeyNotFoundException($"Channel with ID {id} not found");
            }

            // Check if department association is changing
            if (existingChannel.DepartmentId != channel.DepartmentId)
            {
                // If new department is specified, ensure it doesn't already have a channel
                if (channel.DepartmentId.HasValue)
                {
                    bool hasChannel = await _channelRepository.DepartmentHasChannelAsync(channel.DepartmentId.Value);
                    if (hasChannel)
                    {
                        throw new InvalidOperationException($"Department with ID {channel.DepartmentId} already has a channel");
                    }
                }

                // Update old department to remove channel reference if applicable
                if (existingChannel.DepartmentId.HasValue)
                {
                    var oldDepartment = await _departmentRepository.GetByIdAsync(existingChannel.DepartmentId.Value);
                    if (oldDepartment != null && oldDepartment.ChannelId == id)
                    {
                        oldDepartment.ChannelId = null;
                        await _departmentRepository.UpdateAsync(oldDepartment.Id, oldDepartment);
                    }
                }

                // Update new department to add channel reference if applicable
                if (channel.DepartmentId.HasValue)
                {
                    var newDepartment = await _departmentRepository.GetByIdAsync(channel.DepartmentId.Value);
                    if (newDepartment != null)
                    {
                        newDepartment.ChannelId = id;
                        await _departmentRepository.UpdateAsync(newDepartment.Id, newDepartment);
                    }
                }
            }

            channel.UpdatedAt = DateTime.UtcNow;
            await _channelRepository.UpdateAsync(id, channel);
        }

        public async Task DeleteChannelAsync(string id)
        {
            var channel = await _channelRepository.GetByIdAsync(id);
            if (channel == null)
            {
                throw new KeyNotFoundException($"Channel with ID {id} not found");
            }

            // Update department to remove channel reference if applicable
            if (channel.DepartmentId.HasValue)
            {
                var department = await _departmentRepository.GetByIdAsync(channel.DepartmentId.Value);
                if (department != null && department.ChannelId == id)
                {
                    department.ChannelId = null;
                    await _departmentRepository.UpdateAsync(department.Id, department);
                }
            }

            await _channelRepository.DeleteAsync(id);
        }

        public async Task<bool> ChannelExistsAsync(string id)
        {
            return await _channelRepository.ChannelExistsAsync(id);
        }

        public async Task<bool> DepartmentHasChannelAsync(int departmentId)
        {
            return await _channelRepository.DepartmentHasChannelAsync(departmentId);
        }

        public async Task<IEnumerable<Post>> GetChannelPostsAsync(string channelId)
        {
            // Ensure channel exists
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
            {
                throw new KeyNotFoundException($"Channel with ID {channelId} not found");
            }

            // Get all posts for this channel using the repository method
            return await _postRepository.GetPostsByChannelIdAsync(channelId);
        }
    }
}