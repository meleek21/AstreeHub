using System.Security.Claims;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using AutoMapper;
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
        private readonly IMapper _mapper;

        public PostController(
            IPostService postService,
            IEmployeeService employeeService,
            IChannelService channelService,
            IFileService fileService,
            ICloudinaryService cloudinaryService,
            ILogger<PostController> logger,
            IMapper mapper
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
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedPostsDTO>> GetAllPosts(
            [FromQuery] string lastItemId = null,
            [FromQuery] int limit = 10,
            [FromQuery] PostType? postType = null
        )
        {
            var (posts, nextLastItemId, hasMore) = await _postService.GetAllPostsAsync(
                lastItemId,
                limit,
                postType
            );

            // Collect all file IDs for batch loading
            var fileIds = posts
                .SelectMany(p => p.FileIds ?? new List<string>())
                .Distinct()
                .ToList();

            // Batch load all files
            var filesDictionary = new Dictionary<string, Models.File>();

            if (fileIds.Any())
            {
                var files = await _fileService.GetFilesByIdsAsync(fileIds);
                foreach (var file in files)
                {
                    filesDictionary[file.Id] = file;
                }
            }

            // Map posts to DTOs using AutoMapper
            var postDtos = posts
                .Select(post =>
                {
                    var postFiles = post
                        .FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                        .Select(fileId => filesDictionary[fileId])
                        .ToList();

                    // Use the tuple mapping to create the complete DTO
                    return _mapper.Map<PostResponseDTO>((post, postFiles));
                })
                .ToList();

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

            // Fetch files in a single batch
            var files = await _fileService.GetFilesByIdsAsync(post.FileIds);

            // Map to DTO using the tuple mapper
            var postDto = _mapper.Map<PostResponseDTO>((post, files));

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

            // Collect all file IDs for batch loading
            var fileIds = posts
                .SelectMany(p => p.FileIds ?? new List<string>())
                .Distinct()
                .ToList();

            // Batch load all files
            var filesDictionary = new Dictionary<string, Models.File>();

            if (fileIds.Any())
            {
                var files = await _fileService.GetFilesByIdsAsync(fileIds);
                foreach (var file in files)
                {
                    filesDictionary[file.Id] = file;
                }
            }

            // Map posts to DTOs using AutoMapper
            var postDtos = posts
                .Select(post =>
                {
                    var postFiles = post
                        .FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                        .Select(fileId => filesDictionary[fileId])
                        .ToList();

                    return _mapper.Map<PostResponseDTO>((post, postFiles));
                })
                .ToList();

            var paginatedResponse = new PaginatedPostsDTO
            {
                Posts = postDtos,
                NextLastItemId = nextLastItemId,
                HasMore = hasMore,
            };

            return Ok(paginatedResponse);
        }

        [HttpPost]
        public async Task<ActionResult<Post>> CreatePost([FromBody] PostRequestDTO postRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Use AutoMapper to map the request to a Post
            var post = _mapper.Map<Post>(postRequest);
            post.Timestamp = DateTime.UtcNow;

            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
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

            // Use AutoMapper to update the existing post
            _mapper.Map(postRequest, existingPost);
            existingPost.UpdatedAt = DateTime.UtcNow;

            await _postService.UpdatePostAsync(id, existingPost);
            return Ok(existingPost);
        }

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
                                uploadedFiles.Add(_mapper.Map<FileResponseDTO>(savedFile));
                            }
                        }
                    }
                    catch (Exception ex)
                    {
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

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");

            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();

            foreach (var fileId in post.FileIds)
            {
                await _fileService.DeleteFileAsync(fileId);
            }

            await _postService.DeletePostAsync(id);
            return NoContent();
        }

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

                // Collect all file IDs for batch loading
                var fileIds = posts
                    .SelectMany(p => p.FileIds ?? new List<string>())
                    .Distinct()
                    .ToList();

                // Batch load all files
                var filesDictionary = new Dictionary<string, Models.File>();

                if (fileIds.Any())
                {
                    var files = await _fileService.GetFilesByIdsAsync(fileIds);
                    foreach (var file in files)
                    {
                        filesDictionary[file.Id] = file;
                    }
                }

                // Map posts to DTOs using AutoMapper
                var postDtos = posts
                    .Select(post =>
                    {
                        var postFiles = post
                            .FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                            .Select(fileId => filesDictionary[fileId])
                            .ToList();

                        return _mapper.Map<PostResponseDTO>((post, postFiles));
                    })
                    .ToList();

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

        [HttpPost("channel/{channelId}")]
        [Authorize(Roles = "DIRECTOR")]
        public async Task<ActionResult<Post>> CreateChannelPost(
            string channelId,
            PostRequestDTO postRequest
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var employee = await _employeeService.GetEmployeeByIdAsync(userId);

            if (employee == null)
            {
                return Unauthorized();
            }

            var channel = await _channelService.GetChannelByIdAsync(channelId);
            if (channel == null)
            {
                return NotFound(new { message = $"Channel with ID {channelId} not found" });
            }

            if (!channel.IsGeneral && channel.DepartmentId.HasValue)
            {
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

            // Use AutoMapper to map the request to a Post
            var post = _mapper.Map<Post>(postRequest);
            post.AuthorId = userId;
            post.PostType = PostType.Channel;
            post.ChannelId = channelId;
            post.Timestamp = DateTime.UtcNow;

            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
        }

        [HttpDelete("channel/{channelId}/posts/{postId}")]
        [Authorize(Roles = "DIRECTOR")]
        public async Task<IActionResult> DeleteChannelPost(string channelId, string postId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var employee = await _employeeService.GetEmployeeByIdAsync(userId);

            if (employee == null)
            {
                return Unauthorized();
            }

            var channel = await _channelService.GetChannelByIdAsync(channelId);
            if (channel == null)
            {
                return NotFound(new { message = $"Channel with ID {channelId} not found" });
            }

            var post = await _postService.GetPostByIdAsync(postId);
            if (post == null)
            {
                return NotFound(new { message = $"Post with ID {postId} not found" });
            }

            if (post.ChannelId != channelId)
            {
                return BadRequest("Post does not belong to the specified channel");
            }

            if (employee.Role != RoleType.SUPERADMIN)
            {
                if (
                    employee.Role == RoleType.DIRECTOR
                    && channel.DepartmentId.HasValue
                    && employee.DepartmentId == channel.DepartmentId
                ) { }
                else if (post.AuthorId != userId)
                {
                    return Forbid();
                }
            }

            await _postService.DeletePostAsync(postId);
            return NoContent();
        }

        [HttpGet("library")]
        public async Task<ActionResult<PaginatedPostsDTO>> GetLibraryPosts(
            [FromQuery] string lastItemId = null,
            [FromQuery] int limit = 10
        )
        {
            var (posts, nextLastItemId, hasMore) = await _postService.GetLibraryPostsAsync(
                lastItemId,
                limit
            );

            // Collect all file IDs for batch loading
            var fileIds = posts
                .SelectMany(p => p.FileIds ?? new List<string>())
                .Distinct()
                .ToList();

            // Batch load all files
            var filesDictionary = new Dictionary<string, Models.File>();

            if (fileIds.Any())
            {
                var files = await _fileService.GetFilesByIdsAsync(fileIds);
                foreach (var file in files)
                {
                    filesDictionary[file.Id] = file;
                }
            }

            // Map posts to DTOs using AutoMapper
            var postDtos = posts
                .Select(post =>
                {
                    var postFiles = post
                        .FileIds.Where(fileId => filesDictionary.ContainsKey(fileId))
                        .Select(fileId => filesDictionary[fileId])
                        .ToList();

                    return _mapper.Map<PostResponseDTO>((post, postFiles));
                })
                .ToList();

            var paginatedResponse = new PaginatedPostsDTO
            {
                Posts = postDtos,
                NextLastItemId = nextLastItemId,
                HasMore = hasMore,
            };

            return Ok(paginatedResponse);
        }

        [HttpPost("library/create")]
        public async Task<ActionResult<PostResponseDTO>> AddLibraryPost(
            [FromBody] PostRequestDTO request
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Use AutoMapper to map the request to a Post
            var post = _mapper.Map<Post>(request);
            post.PostType = PostType.Library;
            post.Timestamp = DateTime.UtcNow;

            var createdPost = await _postService.CreatePostAsync(post);

            // Get files for the created post
            var files = await _fileService.GetFilesByIdsAsync(createdPost.FileIds);

            // Map the post and files to a response DTO
            var postDto = _mapper.Map<PostResponseDTO>((createdPost, files));

            return CreatedAtAction(nameof(GetLibraryPosts), new { id = postDto.Id }, postDto);
        }

        [HttpPut("library/update/{id}")]
        public async Task<ActionResult<PostResponseDTO>> UpdateLibraryPost(
            string id,
            [FromBody] PostRequestDTO request
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingPost = await _postService.GetPostByIdAsync(id);
            if (existingPost == null)
                return NotFound();

            // Use AutoMapper to update the existing post
            _mapper.Map(request, existingPost);
            existingPost.PostType = PostType.Library;
            existingPost.UpdatedAt = DateTime.UtcNow;

            await _postService.UpdatePostAsync(id, existingPost);

            // Get files for the updated post
            var files = await _fileService.GetFilesByIdsAsync(existingPost.FileIds);

            // Map the post and files to a response DTO
            var postDto = _mapper.Map<PostResponseDTO>((existingPost, files));

            return Ok(postDto);
        }
    }
}
