using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface ICloudinaryService
    {
        Task<string?> UploadImageAsync(IFormFile file);
        Task<string?> UploadFileAsync(IFormFile file);
        Task DeleteFileAsync(string publicId);
    }
}