using System;
using System.Collections.Generic;
using System.Linq; // Added for LINQ operations
using System.Threading.Tasks;
using ASTREE_PFE.Hubs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;

namespace ASTREE_PFE.Services
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly IFileService _fileService;
        private readonly IReactionRepository _reactionRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly IChannelRepository _channelRepository; // Added dependency
        private readonly IEmployeeRepository _employeeRepository; // Added dependency
        private readonly INotificationService _notificationService; // Added dependency

        public PostService(
            IPostRepository postRepository,
            IFileService fileService,
            IReactionRepository reactionRepository,
            ICommentRepository commentRepository,
            IChannelRepository channelRepository, // Added parameter
            IEmployeeRepository employeeRepository,
            INotificationService notificationService
        ) // Added parameter
        {
            _postRepository = postRepository;
            _fileService = fileService;

            _reactionRepository = reactionRepository;
            _commentRepository = commentRepository;
            _channelRepository = channelRepository; // Assign injected repository
            _employeeRepository = employeeRepository; // Assign injected repository
            _notificationService = notificationService; // Assign injected service
        }

        public async Task UpdateReactionCountAsync(
            string postId,
            ReactionType oldType,
            ReactionType newType
        )
        {
            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return;

            // Only process if types are different
            if (oldType != newType)
            {
                // Remove old reaction count
                if (oldType != ReactionType.None)
                {
                    if (post.ReactionCounts.ContainsKey(oldType))
                    {
                        post.ReactionCounts[oldType]--;
                        if (post.ReactionCounts[oldType] <= 0)
                        {
                            post.ReactionCounts.Remove(oldType);
                        }
                    }
                }

                // Add new reaction count
                if (newType != ReactionType.None)
                {
                    post.ReactionCounts[newType] =
                        post.ReactionCounts.GetValueOrDefault(newType, 0) + 1;
                }

                await _postRepository.UpdateAsync(postId, post);
            }
        }

        public async Task IncrementReactionCountAsync(string postId, ReactionType type)
        {
            // First get the post to check if ReactionCounts is properly initialized
            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return;

            // Initialize ReactionCounts if it's null or not properly set up
            if (post.ReactionCounts == null)
            {
                post.ReactionCounts = new Dictionary<ReactionType, int>();
            }

            // Update the reaction count in memory
            post.ReactionCounts[type] = post.ReactionCounts.GetValueOrDefault(type, 0) + 1;

            // Update the post with the new reaction counts
            await _postRepository.UpdateAsync(postId, post);
        }

        public async Task DecrementReactionCountAsync(string postId, ReactionType reactionType)
        {
            var post = await _postRepository.GetByIdAsync(postId);
            if (post?.ReactionCounts?.ContainsKey(reactionType) == true)
            {
                post.ReactionCounts[reactionType]--;
                if (post.ReactionCounts[reactionType] <= 0)
                {
                    post.ReactionCounts.Remove(reactionType);
                }
                await _postRepository.UpdateAsync(postId, post);
            }
        }

        public async Task<(
            IEnumerable<Post> Posts,
            string NextLastItemId,
            bool HasMore
        )> GetAllPostsAsync(string lastItemId = null, int limit = 10)
        {
            return await _postRepository.GetAllAsync(lastItemId, limit);
        }

        public async Task<Post> GetPostByIdAsync(string id)
        {
            return await _postRepository.GetByIdAsync(id);
        }

        public async Task<(
            IEnumerable<Post> Posts,
            string NextLastItemId,
            bool HasMore
        )> GetPostsByAuthorAsync(string authorId, string lastItemId = null, int limit = 10)
        {
            return await _postRepository.GetByAuthorIdAsync(authorId, lastItemId, limit);
        }

        public async Task<Post> CreatePostAsync(Post post)
        {
            await _postRepository.CreateAsync(post);

            // Load file details for the post
            if (post.FileIds != null && post.FileIds.Any())
            {
                post.Files = new List<ASTREE_PFE.Models.File>();
                foreach (var fileId in post.FileIds)
                {
                    var file = await _fileService.GetFileByIdAsync(fileId);
                    if (file != null)
                    {
                        post.Files.Add(file);
                    }
                }
            }

            // Handle Notifications and SignalR broadcasts for channel posts
            if (!string.IsNullOrEmpty(post.ChannelId))
            {
                var channel = await _channelRepository.GetByIdAsync(post.ChannelId);

                if (channel != null)
                {
                    // Create notification for channel post (either department-specific or general)
                    await _notificationService.CreateChannelPostNotificationAsync(
                        post.AuthorId,
                        post.ChannelId,
                        channel.Name, // Assuming channel has a Name property
                        post.Id,
                        post.Content
                    );

                    // SignalR broadcast logic based on channel type
                    if (channel.DepartmentId.HasValue)
                    {
                        // Department-specific channel post
                        string departmentGroupId = channel.DepartmentId.Value.ToString();
                    }
                }
            }

            return post;
        }

        public async Task UpdatePostAsync(string id, Post post)
        {
            await _postRepository.UpdateAsync(id, post);

            // Load file details for the post before broadcasting
            if (post.FileIds != null && post.FileIds.Any())
            {
                post.Files = new List<ASTREE_PFE.Models.File>();
                foreach (var fileId in post.FileIds)
                {
                    var file = await _fileService.GetFileByIdAsync(fileId);
                    if (file != null)
                    {
                        post.Files.Add(file);
                    }
                }
            }
        }

        public async Task DeletePostAsync(string id)
        {
            var post = await _postRepository.GetByIdAsync(id);
            if (post != null)
            {
                // Delete associated files
                foreach (var fileId in post.FileIds)
                {
                    await _fileService.DeleteFileAsync(fileId);
                }

                // Delete associated reactions
                var reactions = await _reactionRepository.GetReactionsByPostAsync(id);
                foreach (var reaction in reactions)
                {
                    await _reactionRepository.DeleteAsync(reaction.Id);
                }

                // Delete associated comments
                var comments = await _commentRepository.GetByPostIdAsync(id);
                foreach (var comment in comments)
                {
                    await _commentRepository.DeleteAsync(comment.Id);
                }

                await _postRepository.DeleteAsync(id);
            }
        }

        public async Task AddCommentAsync(string postId, Comment comment)
        {
            await _postRepository.AddCommentAsync(postId, comment);
        }

        public async Task UpdateReactionsAsync(string postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);
            if (post != null)
            {
                await _postRepository.UpdateAsync(postId, post);
            }
        }
    }
}
