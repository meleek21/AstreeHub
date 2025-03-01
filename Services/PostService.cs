using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;  // Add this line
using ASTREE_PFE.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;

        public PostService(IPostRepository postRepository)
        {
            _postRepository = postRepository;
        }

        // Add the missing method
        public async Task UpdateReactionsAsync(string postId)
        {
            // Implementation for updating reactions count
            var post = await _postRepository.GetByIdAsync(postId);
            if (post != null)
            {
                // Update reaction counts logic here
                // This would depend on your Post model structure
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
            return post;
        }

        public async Task UpdatePostAsync(string id, Post post)
        {
            await _postRepository.UpdateAsync(id, post);
        }

        public async Task DeletePostAsync(string id)
        {
            await _postRepository.DeleteAsync(id);
        }

        public async Task AddCommentAsync(string postId, Comment comment)
        {
            await _postRepository.AddCommentAsync(postId, comment);
        }

        public async Task UpdateReactionsCountAsync(string postId, Dictionary<ReactionType, int> reactions)
        {
            await _postRepository.UpdateReactionsAsync(postId, reactions);
        }

        public async Task<IEnumerable<Post>> GetRecentPostsAsync(int count)
        {
            return await _postRepository.GetRecentPostsAsync(count);
        }
    }
}