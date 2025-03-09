using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using ASTREE_PFE.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Hubs;

namespace ASTREE_PFE.Services
{
    public class PostService : IPostService
    {
        public IMongoCollection<Post> Collection => _postRepository.Collection;
        private readonly IPostRepository _postRepository;
        private readonly IHubContext<FeedHub> _feedHub;

        public PostService(IPostRepository postRepository, IHubContext<FeedHub> feedHub)
        {
            _postRepository = postRepository;
            _feedHub = feedHub;
        }

        public async Task UpdateReactionCountAsync(string postId, ReactionType oldType, ReactionType newType)
        {
            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null) return;

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
                    post.ReactionCounts[newType] = post.ReactionCounts.GetValueOrDefault(newType, 0) + 1;
                }

                await _postRepository.UpdateAsync(postId, post);
            }
        }

        public async Task IncrementReactionCountAsync(string postId, ReactionType type)
        {
            // First get the post to check if ReactionCounts is properly initialized
            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null) return;
            
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

        public async Task<IEnumerable<Post>> GetAllPostsAsync()
        {
            return await _postRepository.GetAllAsync();
        }

        public async Task<Post> GetPostByIdAsync(string id)
        {
            return await _postRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Post>> GetPostsByAuthorAsync(string authorId)
        {
            return await _postRepository.GetByAuthorIdAsync(authorId);
        }

        public async Task<Post> CreatePostAsync(Post post)
        {
            await _postRepository.CreateAsync(post);
            
            // Broadcast the new post to all connected clients
            await _feedHub.Clients.All.SendAsync("ReceiveNewPost", post);
            
            return post;
        }

        public async Task UpdatePostAsync(string id, Post post)
        {
            await _postRepository.UpdateAsync(id, post);
            
            // Broadcast the updated post to all connected clients
            await _feedHub.Clients.All.SendAsync("ReceiveUpdatedPost", post);
        }

        public async Task DeletePostAsync(string id)
        {
            var post = await _postRepository.GetByIdAsync(id);
            if (post != null)
            {
                await _postRepository.DeleteAsync(id);
                
                // Broadcast the deleted post ID to all connected clients
                await _feedHub.Clients.All.SendAsync("ReceiveDeletedPost", id);
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