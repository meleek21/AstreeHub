using System.Security.Claims;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

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
        private readonly IFileService _fileService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<PostController> _logger;

        public PostController(
            IPostService postService,
            IEmployeeService employeeService,
            IChannelService channelService,
            IFileService fileService,
            ICloudinaryService cloudinaryService,
            ILogger<PostController> logger
        )
        {
            _postService = postService ?? throw new ArgumentNullException(nameof(postService));
            _employeeService =
                employeeService ?? throw new ArgumentNullException(nameof(employeeService));
            _channelService =
                channelService ?? throw new ArgumentNullException(nameof(channelService));
            _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
            _cloudinaryService =
                cloudinaryService ?? throw new ArgumentNullException(nameof(cloudinaryService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedPostsDTO>> GetAllPosts(
            [FromQuery] string lastItemId = null,
            [FromQuery] int limit = 10
        )
        {
            var (posts, nextLastItemId, hasMore) = await _postService.GetAllPostsAsync(
                lastItemId,
                limit
            );
            var postDtos = new List<PostResponseDTO>();

            // Collect all author IDs and file IDs for batch loading
            var authorIds = posts.Select(p => p.AuthorId).Distinct().ToList();
            var fileIds = posts
                .SelectMany(p => p.FileIds ?? new List<string>())
                .Distinct()
                .ToList();

            // Batch load all user info and files
            var filesDictionary = new Dictionary<string, Models.File>();
            var userInfoDictionary = new Dictionary<string, UserInfoDTO>();

            // Only fetch user info if there are authors
            if (authorIds.Any())
            {
                var userInfos = await _employeeService.GetUserInfoBatchAsync(authorIds.ToList());
                userInfoDictionary = userInfos
                    .GroupBy(u => u.Id)
                    .ToDictionary(g => g.Key, g => g.First());
            }

            // Only fetch files if there are file IDs
            if (fileIds.Any())
            {
                var files = await _fileService.GetFilesByIdsAsync(fileIds);
                foreach (var file in files)
                {
                    filesDictionary[file.Id] = file;
                }
            }

            // Process each post with the pre-loaded data
            foreach (var post in posts)
            {
                userInfoDictionary.TryGetValue(post.AuthorId, out var userInfo);

                var postFiles = post
                    .FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                    .Select(fileId => filesDictionary[fileId])
                    .ToList();

                var postDto = new PostResponseDTO
                {
                    Id = post.Id,
                    Content = post.Content,
                    AuthorId = post.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                    CreatedAt = post.Timestamp,
                    UpdatedAt = post.UpdatedAt,
                    Files = postFiles
                        .Select(f => new FileResponseDTO
                        {
                            Id = f.Id,
                            FileName = f.FileName,
                            FileUrl = f.FileUrl,
                            FileType = f.FileType,
                            FileSize = f.FileSize,
                            UploadedAt = f.UploadedAt,
                        })
                        .ToList(),
                    Comments = post
                        .Comments?.Select(c =>
                        {
                            userInfoDictionary.TryGetValue(c.AuthorId, out var commentUserInfo);
                            return new CommentResponseDTO
                            {
                                Id = c.Id,
                                Content = c.Content,
                                AuthorId = c.AuthorId,
                                AuthorName =
                                    $"{commentUserInfo?.FirstName} {commentUserInfo?.LastName}",
                                AuthorProfilePicture = commentUserInfo?.ProfilePictureUrl,
                                CreatedAt = c.Timestamp,
                                UpdatedAt = c.UpdatedAt,
                            };
                        })
                        .ToList(),
                    ReactionCounts = post.ReactionCounts,
                };
                postDtos.Add(postDto);
            }

            var paginatedResponse = new PaginatedPostsDTO
            {
                Posts = postDtos,
                NextLastItemId = nextLastItemId,
                HasMore = hasMore,
            };

            return Ok(paginatedResponse);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PostResponseDTO>> GetPost(string id)
        {
            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();

            // Collect all author IDs from post and comments for batch loading
            var authorIds = new List<string> { post.AuthorId };
            if (post.Comments != null)
            {
                authorIds.AddRange(post.Comments.Select(c => c.AuthorId));
            }

            // Batch load all user info
            var userInfos = await _employeeService.GetUserInfoBatchAsync(authorIds);
            var userInfoDictionary = userInfos.ToDictionary(u => u.Id);

            // Fetch files in a single batch
            var files = await _fileService.GetFilesByIdsAsync(post.FileIds);

            // Get author info
            userInfoDictionary.TryGetValue(post.AuthorId, out var userInfo);

            var postDto = new PostResponseDTO
            {
                Id = post.Id,
                Content = post.Content,
                AuthorId = post.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                CreatedAt = post.Timestamp,
                UpdatedAt = post.UpdatedAt,
                Files = files
                    .Select(f => new FileResponseDTO
                    {
                        Id = f.Id,
                        FileName = f.FileName,
                        FileUrl = f.FileUrl,
                        FileType = f.FileType,
                        FileSize = f.FileSize,
                        UploadedAt = f.UploadedAt,
                    })
                    .ToList(),
                Comments = post
                    .Comments?.Select(c =>
                    {
                        userInfoDictionary.TryGetValue(c.AuthorId, out var commentUserInfo);
                        return new CommentResponseDTO
                        {
                            Id = c.Id,
                            Content = c.Content,
                            AuthorId = c.AuthorId,
                            AuthorName =
                                $"{commentUserInfo?.FirstName} {commentUserInfo?.LastName}",
                            AuthorProfilePicture = commentUserInfo?.ProfilePictureUrl,
                            CreatedAt = c.Timestamp,
                            UpdatedAt = c.UpdatedAt,
                        };
                    })
                    .ToList(),
                ReactionCounts = post.ReactionCounts,
            };

            return Ok(postDto);
        }

        [HttpGet("author/{authorId}")]
        public async Task<ActionResult<PaginatedPostsDTO>> GetPostsByAuthor(
            string authorId,
            [FromQuery] string lastItemId = null,
            [FromQuery] int limit = 10
        )
        {
            var (posts, nextLastItemId, hasMore) = await _postService.GetPostsByAuthorAsync(
                authorId,
                lastItemId,
                limit
            );
            var postDtos = new List<PostResponseDTO>();

            // Collect all author IDs and file IDs for batch loading
            var authorIds = new HashSet<string>();
            var fileIds = new HashSet<string>();

            foreach (var post in posts)
            {
                authorIds.Add(post.AuthorId);

                if (post.FileIds != null)
                {
                    foreach (var fileId in post.FileIds)
                    {
                        fileIds.Add(fileId);
                    }
                }

                if (post.Comments != null)
                {
                    foreach (var comment in post.Comments)
                    {
                        authorIds.Add(comment.AuthorId);
                    }
                }
            }

            // Batch load all user info and files
            var filesDictionary = new Dictionary<string, Models.File>();
            var userInfoDictionary = new Dictionary<string, UserInfoDTO>();

            // Only fetch user info if there are authors
            if (authorIds.Any())
            {
                var userInfos = await _employeeService.GetUserInfoBatchAsync(authorIds.ToList());
                userInfoDictionary = userInfos
                    .GroupBy(u => u.Id)
                    .ToDictionary(g => g.Key, g => g.First());
            }

            // Only fetch files if there are file IDs
            if (fileIds.Any())
            {
                var files = await _fileService.GetFilesByIdsAsync(fileIds.ToList());
                foreach (var file in files)
                {
                    filesDictionary[file.Id] = file;
                }
            }

            // Process each post with the pre-loaded data
            foreach (var post in posts)
            {
                userInfoDictionary.TryGetValue(post.AuthorId, out var userInfo);

                var postFiles = post
                    .FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                    .Select(fileId => filesDictionary[fileId])
                    .ToList();

                var postDto = new PostResponseDTO
                {
                    Id = post.Id,
                    Content = post.Content,
                    AuthorId = post.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                    CreatedAt = post.Timestamp,
                    UpdatedAt = post.UpdatedAt,
                    Files = postFiles
                        .Select(f => new FileResponseDTO
                        {
                            Id = f.Id,
                            FileName = f.FileName,
                            FileUrl = f.FileUrl,
                            FileType = f.FileType,
                            FileSize = f.FileSize,
                            UploadedAt = f.UploadedAt,
                        })
                        .ToList(),
                    Comments = post
                        .Comments?.Select(c =>
                        {
                            userInfoDictionary.TryGetValue(c.AuthorId, out var commentUserInfo);
                            return new CommentResponseDTO
                            {
                                Id = c.Id,
                                Content = c.Content,
                                AuthorId = c.AuthorId,
                                AuthorName =
                                    $"{commentUserInfo?.FirstName} {commentUserInfo?.LastName}",
                                AuthorProfilePicture = commentUserInfo?.ProfilePictureUrl,
                                CreatedAt = c.Timestamp,
                                UpdatedAt = c.UpdatedAt,
                            };
                        })
                        .ToList(),
                    ReactionCounts = post.ReactionCounts,
                };
                postDtos.Add(postDto);
            }

            var paginatedResponse = new PaginatedPostsDTO
            {
                Posts = postDtos,
                NextLastItemId = nextLastItemId,
                HasMore = hasMore,
            };

            return Ok(paginatedResponse);
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
                FileIds = postRequest.FileIds, // Include file IDs
                Timestamp = DateTime.UtcNow,
                ChannelId = postRequest.ChannelId, // Set the channelId from the request
            };

            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
        }

        /// <summary>
        /// Update an existing post with file IDs.
        /// </summary>
        [HttpPut("channel/{channelId}/post/{postId}")]
        public async Task<ActionResult<Post>> UpdateChannelPost(
            string channelId,
            string postId,
            [FromBody] PostRequestDTO postRequest
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(postId, out _))
                return BadRequest("Invalid post ID format");

            var existingPost = await _postService.GetPostByIdAsync(postId);
            if (existingPost == null)
                return NotFound();

            if (existingPost.ChannelId != channelId)
                return BadRequest("Post does not belong to this channel");

            existingPost.Content = postRequest.Content;
            existingPost.IsPublic = postRequest.IsPublic;
            existingPost.FileIds = postRequest.FileIds;
            existingPost.UpdatedAt = DateTime.UtcNow;

            await _postService.UpdatePostAsync(postId, existingPost);
            return Ok(existingPost);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Post>> UpdatePost(
            string id,
            [FromBody] PostRequestDTO postRequest
        )
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
            existingPost.FileIds = postRequest.FileIds; // Update file IDs
            existingPost.UpdatedAt = DateTime.UtcNow;

            await _postService.UpdatePostAsync(id, existingPost);
            return Ok(existingPost);
        }

        /// <summary>
        /// Upload files for a post.
        /// </summary>
        [HttpPost("upload")]
        public async Task<ActionResult<List<FileResponseDTO>>> UploadFiles(
            IFormFileCollection files
        )
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
                        if (
                            uploadResult == null
                            || string.IsNullOrEmpty(uploadResult.SecureUrl?.ToString())
                        )
                            continue;

                        var fileEntity = new ASTREE_PFE.Models.File
                        {
                            FileName = file.FileName,
                            FileUrl = uploadResult.SecureUrl.ToString(),
                            FileType = file.ContentType,
                            FileSize = file.Length,
                            UploadedAt = DateTime.UtcNow,
                            PublicId = uploadResult.PublicId,
                            UploaderId = userId,
                        };

                        var fileId = await _fileService.CreateFileAsync(fileEntity);
                        if (!string.IsNullOrEmpty(fileId))
                        {
                            var savedFile = await _fileService.GetFileByIdAsync(fileId);
                            if (savedFile != null)
                            {
                                uploadedFiles.Add(
                                    new FileResponseDTO
                                    {
                                        Id = savedFile.Id,
                                        FileName = savedFile.FileName,
                                        FileUrl = savedFile.FileUrl,
                                        FileType = savedFile.FileType,
                                        FileSize = savedFile.FileSize,
                                        UploadedAt = savedFile.UploadedAt,
                                    }
                                );
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

        // GET: api/post/channel/{channelId}
        [HttpGet("channel/{channelId}")]
        public async Task<ActionResult<PaginatedPostsDTO>> GetChannelPosts(
            string channelId,
            [FromQuery] string lastItemId = null,
            [FromQuery] int limit = 10
        )
        {
            try
            {
                var (posts, nextLastItemId, hasMore) = await _channelService.GetChannelPostsAsync(
                    channelId,
                    lastItemId,
                    limit
                );
                var postDtos = new List<PostResponseDTO>();

                foreach (var post in posts)
                {
                    var userInfo = await _employeeService.GetUserInfoAsync(post.AuthorId);
                    var files = await _fileService.GetFilesByIdsAsync(post.FileIds);

                    var postDto = new PostResponseDTO
                    {
                        Id = post.Id,
                        Content = post.Content,
                        AuthorId = post.AuthorId,
                        AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                        AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                        CreatedAt = post.Timestamp,
                        UpdatedAt = post.UpdatedAt,
                        Files = files
                            .Select(f => new FileResponseDTO
                            {
                                Id = f.Id,
                                FileName = f.FileName,
                                FileUrl = f.FileUrl,
                                FileType = f.FileType,
                                FileSize = f.FileSize,
                                UploadedAt = f.UploadedAt,
                            })
                            .ToList(),
                        Comments = post
                            .Comments?.Select(c => new CommentResponseDTO
                            {
                                Id = c.Id,
                                Content = c.Content,
                                AuthorId = c.AuthorId,
                                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                                CreatedAt = c.Timestamp,
                                UpdatedAt = c.UpdatedAt,
                            })
                            .ToList(),
                        ReactionCounts = post.ReactionCounts,
                    };
                    postDtos.Add(postDto);
                }

                var paginatedResponse = new PaginatedPostsDTO
                {
                    Posts = postDtos,
                    NextLastItemId = nextLastItemId,
                    HasMore = hasMore,
                };

                return Ok(paginatedResponse);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // POST: api/post/channel/{channelId}
        [HttpPost("channel/{channelId}")]
        [Authorize(Roles = "DIRECTOR")]
        public async Task<ActionResult<Post>> CreateChannelPost(
            string channelId,
            PostRequestDTO postRequest
        )
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
                return NotFound(new { message = $"Channel with ID {channelId} not found" });
            }

            // Check if user is authorized to post in this channel
            // For department channels, only directors of that department can post
            if (!channel.IsGeneral && channel.DepartmentId.HasValue)
            {
                // If it's a department channel, check if user is the director
                if (
                    employee.Role != RoleType.SUPERADMIN
                    && (
                        employee.Role != RoleType.DIRECTOR
                        || employee.DepartmentId != channel.DepartmentId
                    )
                )
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
                ChannelId = channelId,
            };

            // Create the post
            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
        }

        // DELETE: api/post/channel/{channelId}/posts/{postId}
        [HttpDelete("channel/{channelId}/posts/{postId}")]
        [Authorize(Roles = "DIRECTOR")]
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
                return NotFound(new { message = $"Channel with ID {channelId} not found" });
            }

            // Get the post
            var post = await _postService.GetPostByIdAsync(postId);
            if (post == null)
            {
                return NotFound(new { message = $"Post with ID {postId} not found" });
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
                if (
                    employee.Role == RoleType.DIRECTOR
                    && channel.DepartmentId.HasValue
                    && employee.DepartmentId == channel.DepartmentId
                )
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
        
        // GET: api/Post/library
        [HttpGet("library")]
        public async Task<ActionResult<PaginatedPostsDTO>> GetLibraryPosts(
            [FromQuery] string lastItemId = null,
            [FromQuery] int limit = 10
        )
        {
            var (posts, nextLastItemId, hasMore) = await _postService.GetLibraryPostsAsync(lastItemId, limit);
            var postDtos = new List<PostResponseDTO>();

            // Collect all author IDs and file IDs for batch loading
            var authorIds = posts.Select(p => p.AuthorId).Distinct().ToList();
            var fileIds = posts.SelectMany(p => p.FileIds ?? new List<string>()).Distinct().ToList();

            // Batch load all user info and files
            var filesDictionary = new Dictionary<string, Models.File>();
            var userInfoDictionary = new Dictionary<string, UserInfoDTO>();

            if (authorIds.Any())
            {
                var userInfos = await _employeeService.GetUserInfoBatchAsync(authorIds.ToList());
                userInfoDictionary = userInfos.GroupBy(u => u.Id).ToDictionary(g => g.Key, g => g.First());
            }

            if (fileIds.Any())
            {
                var files = await _fileService.GetFilesByIdsAsync(fileIds);
                foreach (var file in files)
                {
                    filesDictionary[file.Id] = file;
                }
            }

            foreach (var post in posts)
            {
                userInfoDictionary.TryGetValue(post.AuthorId, out var userInfo);

                var postFiles = post.FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                    .Select(fileId => filesDictionary[fileId])
                    .ToList();

                var postDto = new PostResponseDTO
                {
                    Id = post.Id,
                    Content = post.Content,
                    AuthorId = post.AuthorId,
                    AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                    AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                    CreatedAt = post.Timestamp,
                    UpdatedAt = post.UpdatedAt,
                    Files = postFiles.Select(f => new FileResponseDTO
                    {
                        Id = f.Id,
                        FileName = f.FileName,
                        FileUrl = f.FileUrl,
                        FileType = f.FileType,
                        FileSize = f.FileSize,
                        UploadedAt = f.UploadedAt,
                    }).ToList(),
                    Comments = post.Comments?.Select(c =>
                    {
                        userInfoDictionary.TryGetValue(c.AuthorId, out var commentUserInfo);
                        return new CommentResponseDTO
                        {
                            Id = c.Id,
                            Content = c.Content,
                            AuthorId = c.AuthorId,
                            AuthorName = $"{commentUserInfo?.FirstName} {commentUserInfo?.LastName}",
                            AuthorProfilePicture = commentUserInfo?.ProfilePictureUrl,
                            CreatedAt = c.Timestamp,
                            UpdatedAt = c.UpdatedAt,
                        };
                    }).ToList(),
                    ReactionCounts = post.ReactionCounts,
                    ChannelId = post.ChannelId,
                    IsLibraryPost = post.IsLibraryPost
                };
                postDtos.Add(postDto);
            }

            var paginatedResponse = new PaginatedPostsDTO
            {
                Posts = postDtos,
                NextLastItemId = nextLastItemId,
                HasMore = hasMore,
            };

            return Ok(paginatedResponse);
        }

        // POST: api/Post/library
        [HttpPost("library/create")]
        public async Task<ActionResult<PostResponseDTO>> AddLibraryPost([FromBody] PostRequestDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var post = new Post
            {
                Content = request.Content,
                AuthorId = request.AuthorId,
                IsPublic = request.IsPublic,
                ChannelId = request.ChannelId,
                FileIds = request.FileIds ?? new List<string>(),
                IsLibraryPost = request.IsLibraryPost ?? true,
                Timestamp = DateTime.UtcNow,
                ReactionCounts = new Dictionary<ReactionType, int>(),
                Comments = new List<Comment>()
            };

            var createdPost = await _postService.CreatePostAsync(post);

            // Prepare DTO for response
            var userInfo = await _employeeService.GetUserInfoAsync(createdPost.AuthorId);
            var files = await _fileService.GetFilesByIdsAsync(createdPost.FileIds);

            var postDto = new PostResponseDTO
            {
                Id = createdPost.Id,
                Content = createdPost.Content,
                AuthorId = createdPost.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                CreatedAt = createdPost.Timestamp,
                UpdatedAt = createdPost.UpdatedAt,
                Files = files.Select(f => new FileResponseDTO
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    FileUrl = f.FileUrl,
                    FileType = f.FileType,
                    FileSize = f.FileSize,
                    UploadedAt = f.UploadedAt,
                }).ToList(),
                Comments = new List<CommentResponseDTO>(),
                ReactionCounts = createdPost.ReactionCounts,
                ChannelId = createdPost.ChannelId,
                IsLibraryPost = createdPost.IsLibraryPost
            };

            return CreatedAtAction(nameof(GetLibraryPosts), new { id = postDto.Id }, postDto);
        }

        // PUT: api/Post/library/{id}
        [HttpPut("library/update/{id}")]
        public async Task<ActionResult<PostResponseDTO>> UpdateLibraryPost(string id, [FromBody] PostRequestDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingPost = await _postService.GetPostByIdAsync(id);
            if (existingPost == null || !existingPost.IsLibraryPost)
                return NotFound();

            existingPost.Content = request.Content;
            existingPost.IsPublic = request.IsPublic;
            existingPost.ChannelId = request.ChannelId;
            existingPost.FileIds = request.FileIds ?? new List<string>();
            existingPost.UpdatedAt = DateTime.UtcNow;
            existingPost.IsLibraryPost = request.IsLibraryPost ?? true;

            await _postService.UpdatePostAsync(id, existingPost);

            // Prepare DTO for response
            var userInfo = await _employeeService.GetUserInfoAsync(existingPost.AuthorId);
            var files = await _fileService.GetFilesByIdsAsync(existingPost.FileIds);

            var postDto = new PostResponseDTO
            {
                Id = existingPost.Id,
                Content = existingPost.Content,
                AuthorId = existingPost.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                CreatedAt = existingPost.Timestamp,
                UpdatedAt = existingPost.UpdatedAt,
                Files = files.Select(f => new FileResponseDTO
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    FileUrl = f.FileUrl,
                    FileType = f.FileType,
                    FileSize = f.FileSize,
                    UploadedAt = f.UploadedAt,
                }).ToList(),
                Comments = existingPost.Comments?.Select(c =>
                {
                    var commentUserInfo = userInfo; // Optionally fetch comment author info
                    return new CommentResponseDTO
                    {
                        Id = c.Id,
                        Content = c.Content,
                        AuthorId = c.AuthorId,
                        AuthorName = $"{commentUserInfo?.FirstName} {commentUserInfo?.LastName}",
                        AuthorProfilePicture = commentUserInfo?.ProfilePictureUrl,
                        CreatedAt = c.Timestamp,
                        UpdatedAt = c.UpdatedAt,
                    };
                }).ToList(),
                ReactionCounts = existingPost.ReactionCounts,
                ChannelId = existingPost.ChannelId,
                IsLibraryPost = existingPost.IsLibraryPost
            };

            return Ok(postDto);
        }
    }
}
