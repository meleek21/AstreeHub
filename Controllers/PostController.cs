using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;
using System.Security.Claims;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly IEmployeeService _employeeService;
        private readonly IChannelService _channelService;

        public PostController(IPostService postService, IEmployeeService employeeService, IChannelService channelService)
        {
            _postService = postService;
            _employeeService = employeeService;
            _channelService = channelService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostResponseDTO>>> GetAllPosts()
        {
    var posts = await _postService.GetAllPostsAsync();
    var postDtos = new List<PostResponseDTO>();

    foreach (var post in posts)
    {
        var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId);
        var postDto = new PostResponseDTO
        {
            Id = post.Id,
            Content = post.Content,
            AuthorId = post.AuthorId,
            AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
            AuthorProfilePicture = userInfo?.ProfilePictureUrl,
            CreatedAt = post.Timestamp,
            UpdatedAt = post.UpdatedAt,
            Documents = post.Documents,
            Comments = post.Comments?.Select(c => new CommentResponseDTO
            {
                Id = c.Id,
                Content = c.Content,
                AuthorId = c.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                CreatedAt = c.Timestamp,
                UpdatedAt = c.UpdatedAt
            }).ToList(),
            ReactionCounts = post.ReactionCounts,
            UserReaction = post.UserReaction
        };
        postDtos.Add(postDto);
    }

    return Ok(postDtos);
}

        [HttpGet("{id}")]
        public async Task<ActionResult<PostResponseDTO>> GetPost(string id)
        {
            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();

            var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId); // Fetch user info
            var postDto = new PostResponseDTO
            {
                Id = post.Id,
                Content = post.Content,
                AuthorId = post.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}", // Combine first and last name
                AuthorProfilePicture = userInfo?.ProfilePictureUrl, // Add profile picture if available
                CreatedAt = post.Timestamp,
                UpdatedAt = post.UpdatedAt,
                Documents = post.Documents,
                Comments = post.Comments?.Select(c => new CommentResponseDTO
                {
                    Id = c.Id,
                    Content = c.Content,
                    AuthorId = c.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}", // Same for comments
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                    CreatedAt = c.Timestamp,
                    UpdatedAt = c.UpdatedAt
                }).ToList(),
                ReactionCounts = post.ReactionCounts,
                UserReaction = post.UserReaction
            };

            return Ok(postDto);
        }

        [HttpGet("author/{authorId}")]
        public async Task<ActionResult<IEnumerable<PostResponseDTO>>> GetPostsByAuthor(string authorId)
        {
            var posts = await _postService.GetPostsByAuthorAsync(authorId);
            var postDtos = new List<PostResponseDTO>();

            foreach (var post in posts)
            {
                var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId); // Fetch user info
                var postDto = new PostResponseDTO
                {
                    Id = post.Id,
                    Content = post.Content,
                    AuthorId = post.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}", // Combine first and last name
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl, // Add profile picture if available
                    CreatedAt = post.Timestamp,
                    UpdatedAt = post.UpdatedAt,
                    Documents = post.Documents,
                    Comments = post.Comments?.Select(c => new CommentResponseDTO
                    {
                        Id = c.Id,
                        Content = c.Content,
                        AuthorId = c.AuthorId,
                        AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}", // Same for comments
                        AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                        CreatedAt = c.Timestamp,
                        UpdatedAt = c.UpdatedAt
                    }).ToList(),
                    ReactionCounts = post.ReactionCounts,
                    UserReaction = post.UserReaction
                };
                postDtos.Add(postDto);
            }

            return Ok(postDtos);
        }

        [HttpPost]
public async Task<ActionResult<Post>> CreatePost([FromBody] PostRequestDTO postRequest)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    var post = new Post
    {
        Content = postRequest.Content,
        AuthorId = postRequest.AuthorId,
        IsPublic = postRequest.IsPublic,
        Tags = postRequest.Tags,
        Documents = postRequest.Documents,

    };

    var createdPost = await _postService.CreatePostAsync(post);
    return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
}

        [HttpPut("{id}")]
        public async Task<ActionResult<Post>> UpdatePost(string id, [FromBody] Post post)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");

            var existingPost = await _postService.GetPostByIdAsync(id);
            if (existingPost == null)
                return NotFound();

            // Preserve original author and creation timestamp
            post.Id = id;
            post.AuthorId = existingPost.AuthorId;
            post.Timestamp = existingPost.Timestamp;

            await _postService.UpdatePostAsync(id, post);
            return Ok(post);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");

            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();

            await _postService.DeletePostAsync(id);
            return NoContent();
        }

        // GET: api/post/channel/{channelId}
        [HttpGet("channel/{channelId}")]
        public async Task<ActionResult<IEnumerable<Post>>> GetChannelPosts(string channelId)
        {
            try
            {
                var posts = await _channelService.GetChannelPostsAsync(channelId);
                return Ok(posts);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // POST: api/post/channel/{channelId}
        [HttpPost("channel/{channelId}")]
        public async Task<ActionResult<Post>> CreateChannelPost(string channelId, PostRequestDTO postRequest)
        {
            // Get current user
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var employee = await _employeeService.GetEmployeeByIdAsync(userId);

            if (employee == null)
            {
                return Unauthorized();
            }

            // Check if channel exists
            var channel = await _channelService.GetChannelByIdAsync(channelId);
            if (channel == null)
            {
                return NotFound($"Channel with ID {channelId} not found");
            }

            // Check if user is authorized to post in this channel
            // For department channels, only directors of that department can post
            if (!channel.IsGeneral && channel.DepartmentId.HasValue)
            {
                // If it's a department channel, check if user is the director
                if (employee.Role != RoleType.SUPERADMIN && 
                    (employee.Role != RoleType.DIRECTOR || 
                     employee.DepartmentId != channel.DepartmentId))
                {
                    return Forbid();
                }
            }

            // Create post from DTO
            var post = new Post
            {
                Content = postRequest.Content,
                AuthorId = userId, // Use current user ID instead of the one from DTO
                IsPublic = postRequest.IsPublic,
                Tags = postRequest.Tags,
                Documents = postRequest.Documents,
                ChannelId = channelId
            };

            // Create the post
            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
        }

        // DELETE: api/post/channel/{channelId}/posts/{postId}
        [HttpDelete("channel/{channelId}/posts/{postId}")]
        public async Task<IActionResult> DeleteChannelPost(string channelId, string postId)
        {
            // Get current user
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var employee = await _employeeService.GetEmployeeByIdAsync(userId);

            if (employee == null)
            {
                return Unauthorized();
            }

            // Check if channel exists
            var channel = await _channelService.GetChannelByIdAsync(channelId);
            if (channel == null)
            {
                return NotFound($"Channel with ID {channelId} not found");
            }

            // Get the post
            var post = await _postService.GetPostByIdAsync(postId);
            if (post == null)
            {
                return NotFound($"Post with ID {postId} not found");
            }

            // Check if post belongs to the channel
            if (post.ChannelId != channelId)
            {
                return BadRequest("Post does not belong to the specified channel");
            }

            // Check if user is authorized to delete this post
            // SuperAdmin can delete any post
            // Directors can delete posts in their department's channel
            // Users can only delete their own posts
            if (employee.Role != RoleType.SUPERADMIN)
            {
                if (employee.Role == RoleType.DIRECTOR && channel.DepartmentId.HasValue && 
                    employee.DepartmentId == channel.DepartmentId)
                {
                    // Director can delete any post in their department's channel
                }
                else if (post.AuthorId != userId)
                {
                    // Regular users can only delete their own posts
                    return Forbid();
                }
            }

            // Delete the post
            await _postService.DeletePostAsync(postId);
            return NoContent();
        }
    }
}