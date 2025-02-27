using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;

namespace ASTREE_PFE.Services
{
    public interface IPostService
    {
        Task<IEnumerable<Post>> GetAllPostsAsync();
        Task<Post> GetPostByIdAsync(string id);
        Task<IEnumerable<Post>> GetPostsByAuthorAsync(string authorId);
        Task<IEnumerable<Post>> GetPostsByChannelAsync(int channelId);
        Task<Post> CreatePostAsync(Post post);
        Task UpdatePostAsync(string id, Post post);
        Task DeletePostAsync(string id);
        Task AddCommentAsync(string postId, Comment comment);
        Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions);
        Task<IEnumerable<Post>> GetRecentPostsAsync(int count);
    }

    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;

        public PostService(IPostRepository postRepository)
        {
            _postRepository = postRepository;
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
            return await _postRepository.GetPostsByAuthorAsync(authorId);
        }

        public async Task<IEnumerable<Post>> GetPostsByChannelAsync(int channelId)
        {
            return await _postRepository.GetPostsByChannelAsync(channelId);
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

        public async Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions)
        {
            await _postRepository.UpdateReactionsAsync(postId, reactions);
        }

        public async Task<IEnumerable<Post>> GetRecentPostsAsync(int count)
        {
            return await _postRepository.GetRecentPostsAsync(count);
        }
    }
}