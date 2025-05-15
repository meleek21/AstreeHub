using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Services
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly IFileService _fileService;
        private readonly IReactionRepository _reactionRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly IChannelRepository _channelRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly INotificationService _notificationService;

        public PostService(
            IPostRepository postRepository,
            IFileService fileService,
            IReactionRepository reactionRepository,
            ICommentRepository commentRepository,
            IChannelRepository channelRepository,
            IEmployeeRepository employeeRepository,
            INotificationService notificationService
        )
        {
            _postRepository = postRepository;
            _fileService = fileService;
            _reactionRepository = reactionRepository;
            _commentRepository = commentRepository;
            _channelRepository = channelRepository;
            _employeeRepository = employeeRepository;
            _notificationService = notificationService;
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetAllPostsAsync(
            string lastItemId = null,
            int limit = 10,
            PostType? postType = null
        )
        {
            return await _postRepository.GetAllAsync(lastItemId, limit, postType);
        }

        public async Task<Post> GetPostByIdAsync(string id)
        {
            var post = await _postRepository.GetByIdAsync(id);
            if (post?.FileIds?.Any() == true)
            {
                post.Files = await _fileService.GetFilesByIdsAsync(post.FileIds);
            }
            return post;
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetPostsByAuthorAsync(
            string authorId,
            string lastItemId = null,
            int limit = 10
        )
        {
            return await _postRepository.GetByAuthorIdAsync(authorId, lastItemId, limit);
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetPostsByChannelIdAsync(
            string channelId,
            string lastItemId = null,
            int limit = 10
        )
        {
            return await _postRepository.GetPostsByChannelIdAsync(channelId, lastItemId, limit);
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetLibraryPostsAsync(
            string lastItemId = null,
            int limit = 10
        )
        {
            return await _postRepository.GetAllAsync(lastItemId, limit, PostType.Library);
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetEventPostsAsync(
            string lastItemId = null,
            int limit = 10
        )
        {
            return await _postRepository.GetAllAsync(lastItemId, limit, PostType.Event);
        }

        public async Task<Post> CreatePostAsync(Post post)
        {
            // Auto-set PostType if not specified
            if (post.PostType == PostType.General && !string.IsNullOrEmpty(post.ChannelId))
            {
                post.PostType = PostType.Channel;
            }

            await _postRepository.CreateAsync(post);

            // Load files if FileIds exist
            if (post.FileIds?.Any() == true)
            {
                post.Files = await _fileService.GetFilesByIdsAsync(post.FileIds);
            }

            // Send notifications for channel posts
            if (post.PostType == PostType.Channel && !string.IsNullOrEmpty(post.ChannelId))
            {
                var channel = await _channelRepository.GetByIdAsync(post.ChannelId);
                if (channel != null)
                {
                    await _notificationService.CreateChannelPostNotificationAsync(
                        post.AuthorId,
                        post.ChannelId,
                        channel.Name,
                        post.Id,
                        post.Content
                    );
                }
            }

            return post;
        }

        public async Task UpdatePostAsync(string id, Post post)
        {
            await _postRepository.UpdateAsync(id, post);

            // Refresh files if updated
            if (post.FileIds?.Any() == true)
            {
                post.Files = await _fileService.GetFilesByIdsAsync(post.FileIds);
            }
        }

        public async Task DeletePostAsync(string id)
        {
            var post = await _postRepository.GetByIdAsync(id);
            if (post == null)
                return;

            // Delete associated files
            foreach (var fileId in post.FileIds)
            {
                await _fileService.DeleteFileAsync(fileId);
            }

            await _postRepository.DeleteAsync(id);
        }
    }
}
