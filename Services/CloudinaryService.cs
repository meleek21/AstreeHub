using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using ASTREE_PFE.Services.Interfaces;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        public async Task<ImageUploadResult> UploadImageAsync(IFormFile file)
        {
            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream)
                };

                return await _cloudinary.UploadAsync(uploadParams);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading image: {ex.Message}");
                throw;
            }
        }

        public async Task<VideoUploadResult> UploadFileAsync(IFormFile file)
        {
            try
            {
                if (file == null)
                    throw new ArgumentNullException(nameof(file));

                using var stream = file.OpenReadStream();
                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream)
                };

                var result = await _cloudinary.UploadAsync(uploadParams);
                return new VideoUploadResult
                {
                    PublicId = result.PublicId,
                    SecureUrl = result.SecureUrl,
                    Url = result.Url,
                    Format = result.Format,
                    CreatedAt = result.CreatedAt
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading file: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string publicId)
        {
            try
            {
                var deletionParams = new DeletionParams(publicId);
                var result = await _cloudinary.DestroyAsync(deletionParams);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting file: {ex.Message}");
                return false;
            }
        }
    }
}