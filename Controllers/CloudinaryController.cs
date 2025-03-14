using Microsoft.AspNetCore.Mvc;
using ASTREE_PFE.Services.Interfaces;
using ASTREE_PFE.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Linq;
using MongoDB.Bson;
using FileModel = ASTREE_PFE.Models.File;
using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Hubs;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Ensure only authenticated users can upload files
    public class CloudinaryController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<CloudinaryController> _logger;
        private readonly IFileService _fileService; // Service to manage File collection
        private readonly IHubContext<FeedHub> _feedHub; // Add SignalR hub context

        public CloudinaryController(
            ICloudinaryService cloudinaryService,
            ILogger<CloudinaryController> logger,
            IFileService fileService,
            IHubContext<FeedHub> feedHub) // Inject SignalR hub context
        {
            _cloudinaryService = cloudinaryService;
            _logger = logger;
            _fileService = fileService;
            _feedHub = feedHub;
        }

        /// <summary>
        /// Uploads an image to Cloudinary and associates it with a post.
        /// </summary>
        /// <param name="file">The image file to upload.</param>
        /// <returns>The uploaded file details.</returns>
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                    return BadRequest("No file uploaded.");

                var allowedImageTypes = new[] { "image/jpeg", "image/png", "image/gif" };
                if (!allowedImageTypes.Contains(file.ContentType))
                    return BadRequest("Invalid file type. Only JPEG, PNG, and GIF images are allowed.");

                if (file.Length > 5 * 1024 * 1024) // 5 MB
                    return BadRequest("File size exceeds the limit (5MB).");

                // Upload image to Cloudinary
                var uploadResult = await _cloudinaryService.UploadImageAsync(file);

                if (uploadResult == null)
                    return StatusCode(500, "Error uploading image.");

                // Create File object
                var fileModel = new FileModel
                {
                    FileName = file.FileName,
                    FileUrl = uploadResult.SecureUrl.AbsoluteUri, // Convert URI to string
                    PublicId = uploadResult.PublicId,
                    UploaderId = User.Identity.Name, // Assuming the user ID is in the claims
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    UploadedAt = DateTime.UtcNow
                };

                // Save file metadata to the database
                var fileId = await _fileService.CreateFileAsync(fileModel);
                
                // Set the ID from the database
                fileModel.Id = fileId;
                
                // Broadcast the new file upload to all connected clients
                await _feedHub.Clients.All.SendAsync("ReceiveNewFile", fileModel);

                return Ok(new { FileId = fileId, FileUrl = fileModel.FileUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image.");
                return StatusCode(500, "An error occurred while uploading the image.");
            }
        }

        
        /// Uploads a file to Cloudinary and associates it with a post.
        [HttpPost("upload-file")]
public async Task<IActionResult> UploadFile(IFormFile file)
{
    try
    {
        // Validate file
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        if (file.Length > 10 * 1024 * 1024) // 10 MB
            return BadRequest("File size exceeds the limit (10MB).");

        // Upload file to Cloudinary
        var uploadResult = await _cloudinaryService.UploadFileAsync(file);

        if (uploadResult == null)
            return StatusCode(500, "Error uploading file.");

        // Create File object
        var fileModel = new FileModel
        {
            FileName = file.FileName,
            FileUrl = uploadResult.SecureUrl.AbsoluteUri, // Convert URI to string
            PublicId = uploadResult.PublicId,
            UploaderId = User.Identity.Name, // Assuming the user ID is in the claims
            FileType = file.ContentType,
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow
        };

        // Save file metadata to the database
        var fileId = await _fileService.CreateFileAsync(fileModel);
        
        // Set the ID from the database
        fileModel.Id = fileId;
        
        // Broadcast the new file upload to all connected clients
        await _feedHub.Clients.All.SendAsync("ReceiveNewFile", fileModel);

        // Return file ID and URL in the response
        return Ok(new { FileId = fileId, FileUrl = fileModel.FileUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error uploading file.");
        return StatusCode(500, "An error occurred while uploading the file.");
    }
}

        
        /// Deletes a file from Cloudinary and the database.
        [HttpDelete("delete-file/{fileId}")]
        public async Task<IActionResult> DeleteFile(string fileId)
        {
            try
            {
                if (string.IsNullOrEmpty(fileId))
                    return BadRequest("File ID is required.");

                // Fetch file metadata from the database
                var file = await _fileService.GetFileByIdAsync(fileId);

                if (file == null)
                    return NotFound("File not found.");

                // Delete file from Cloudinary
                var result = await _cloudinaryService.DeleteFileAsync(file.PublicId);

                if (!result)
                    return StatusCode(500, "Error deleting file from Cloudinary.");

                // Delete file metadata from the database
                await _fileService.DeleteFileAsync(fileId);
                
                // Broadcast the file deletion to all connected clients
                await _feedHub.Clients.All.SendAsync("ReceiveFileDeleted", fileId);

                return Ok(new { message = "File deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file.");
                return StatusCode(500, "An error occurred while deleting the file.");
            }
        }
    }
}