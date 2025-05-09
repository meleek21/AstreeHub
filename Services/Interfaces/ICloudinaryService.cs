
using CloudinaryDotNet.Actions;


namespace ASTREE_PFE.Services.Interfaces
{
    public interface ICloudinaryService
    {
        Task<ImageUploadResult> UploadImageAsync(IFormFile file);
        Task<VideoUploadResult> UploadFileAsync(IFormFile file);
        Task<bool> DeleteFileAsync(string publicId);
    }
}
