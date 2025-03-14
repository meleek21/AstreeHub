using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using ASTREE_PFE.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly IEmployeeService _employeeService;
        private readonly IFileService _fileService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<PostController> _logger;

        public PostController(
            IPostService postService,
            IEmployeeService employeeService,
            IFileService fileService,
            ICloudinaryService cloudinaryService,
            ILogger<PostController> logger)
        {
            _postService = postService ?? throw new ArgumentNullException(nameof(postService));
            _employeeService = employeeService ?? throw new ArgumentNullException(nameof(employeeService));
            _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
            _cloudinaryService = cloudinaryService ?? throw new ArgumentNullException(nameof(cloudinaryService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get all posts with file metadata.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostResponseDTO>>> GetAllPosts()
        {
            var posts = await _postService.GetAllPostsAsync();
            var postDtos = new List<PostResponseDTO>();

            foreach (var post in posts)
            {
                var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId);
                var files = await _fileService.GetFilesByIdsAsync(post.FileIds); // Fetch file metadata

                var postDto = new PostResponseDTO
                {
                    Id = post.Id,
                    Content = post.Content,
                    AuthorId = post.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                    CreatedAt = post.Timestamp,
                    UpdatedAt = post.UpdatedAt,
                    Files = files.Select(f => new FileResponseDTO
                    {
                        Id = f.Id,
                        FileName = f.FileName,
                        FileUrl = f.FileUrl,
                        FileType = f.FileType,
                        FileSize = f.FileSize,
                        UploadedAt = f.UploadedAt
                    }).ToList(),
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

        /// <summary>
        /// Get a post by ID with file metadata.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PostResponseDTO>> GetPost(string id)
        {
            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();

            var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId);
            var files = await _fileService.GetFilesByIdsAsync(post.FileIds); // Fetch file metadata

            var postDto = new PostResponseDTO
            {
                Id = post.Id,
                Content = post.Content,
                AuthorId = post.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                CreatedAt = post.Timestamp,
                UpdatedAt = post.UpdatedAt,
                Files = files.Select(f => new FileResponseDTO
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    FileUrl = f.FileUrl,
                    FileType = f.FileType,
                    FileSize = f.FileSize,
                    UploadedAt = f.UploadedAt
                }).ToList(),
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

            return Ok(postDto);
        }

        /// <summary>
        /// Get posts by author ID with file metadata.
        /// </summary>
        [HttpGet("author/{authorId}")]
        public async Task<ActionResult<IEnumerable<PostResponseDTO>>> GetPostsByAuthor(string authorId)
        {
            var posts = await _postService.GetPostsByAuthorAsync(authorId);
            var postDtos = new List<PostResponseDTO>();

            foreach (var post in posts)
            {
                var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId);
                var files = await _fileService.GetFilesByIdsAsync(post.FileIds); // Fetch file metadata

                var postDto = new PostResponseDTO
                {
                    Id = post.Id,
                    Content = post.Content,
                    AuthorId = post.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                    CreatedAt = post.Timestamp,
                    UpdatedAt = post.UpdatedAt,
                    Files = files.Select(f => new FileResponseDTO
                    {
                        Id = f.Id,
                        FileName = f.FileName,
                        FileUrl = f.FileUrl,
                        FileType = f.FileType,
                        FileSize = f.FileSize,
                        UploadedAt = f.UploadedAt
                    }).ToList(),
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

        /// <summary>
        /// Create a new post with file IDs.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Post>> CreatePost([FromBody] PostRequestDTO postRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var post = new Post
            {
                Content = postRequest.Content,
                AuthorId = postRequest.AuthorId,
                IsPublic = postRequest.IsPublic,
                Tags = postRequest.Tags,
                FileIds = postRequest.FileIds, // Include file IDs
                Timestamp = DateTime.UtcNow
            };

            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
        }

        /// <summary>
        /// Update an existing post with file IDs.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Post>> UpdatePost(string id, [FromBody] PostRequestDTO postRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");

            var existingPost = await _postService.GetPostByIdAsync(id);
            if (existingPost == null)
                return NotFound();

            // Update post fields
            existingPost.Content = postRequest.Content;
            existingPost.IsPublic = postRequest.IsPublic;
            existingPost.Tags = postRequest.Tags;
            existingPost.FileIds = postRequest.FileIds; // Update file IDs
            existingPost.UpdatedAt = DateTime.UtcNow;

            await _postService.UpdatePostAsync(id, existingPost);
            return Ok(existingPost);
        }

        /// <summary>
        /// Upload files for a post.
        /// </summary>
        [HttpPost("upload")]
        public async Task<ActionResult<List<FileResponseDTO>>> UploadFiles(IFormFileCollection files)
        {
            try
            {
                if (files == null || !files.Any())
                    return BadRequest("No files were uploaded.");

                var uploadedFiles = new List<FileResponseDTO>();
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("User ID not found");

                foreach (var file in files)
                {
                    try
                    {
                        if (file.Length == 0)
                            continue;

                        var uploadResult = await _cloudinaryService.UploadFileAsync(file);
                        if (uploadResult == null || string.IsNullOrEmpty(uploadResult.SecureUrl?.ToString()))
                            continue;

                        var fileEntity = new ASTREE_PFE.Models.File
                        {
                            FileName = file.FileName,
                            FileUrl = uploadResult.SecureUrl.ToString(),
                            FileType = file.ContentType,
                            FileSize = file.Length,
                            UploadedAt = DateTime.UtcNow,
                            PublicId = uploadResult.PublicId,
                            UploaderId = userId
                        };

                        var fileId = await _fileService.CreateFileAsync(fileEntity);
                        if (!string.IsNullOrEmpty(fileId))
                        {
                            var savedFile = await _fileService.GetFileByIdAsync(fileId);
                            if (savedFile != null)
                            {
                                uploadedFiles.Add(new FileResponseDTO
                                {
                                    Id = savedFile.Id,
                                    FileName = savedFile.FileName,
                                    FileUrl = savedFile.FileUrl,
                                    FileType = savedFile.FileType,
                                    FileSize = savedFile.FileSize,
                                    UploadedAt = savedFile.UploadedAt
                                });
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log the error but continue processing other files
                        _logger.LogError($"Error processing file {file.FileName}: {ex.Message}");
                    }
                }

                if (!uploadedFiles.Any())
                    return BadRequest("No files were successfully uploaded.");

                return Ok(uploadedFiles);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in UploadFiles: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the files.");
            }
        }

        /// <summary>
        /// Delete a post and its associated files.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");

            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();

            // Delete associated files
            foreach (var fileId in post.FileIds)
            {
                await _fileService.DeleteFileAsync(fileId);
            }

            await _postService.DeletePostAsync(id);
            return NoContent();
        }
    }
}