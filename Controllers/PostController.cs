using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly IEmployeeService _employeeService;

        public PostController(IPostService postService, IEmployeeService employeeService)
        {
            _postService = postService;
            _employeeService = employeeService;
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
    }
}