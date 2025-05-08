using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace ASTREE_PFE.Services
{
    // Add this at the top with other using statements
    using FileModel = ASTREE_PFE.Models.File;

    public class FileService : IFileService
    {
        private readonly IMongoCollection<FileModel> _files; // Changed from File to FileModel
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<FileService> _logger;

        public FileService(
            IMongoDatabase database,
            IOptions<CloudinarySettings> cloudinarySettings,
            ILogger<FileService> logger
        )
        {
            _files = database.GetCollection<FileModel>("Files"); // Changed to FileModel

            // Validate Cloudinary settings
            if (string.IsNullOrEmpty(cloudinarySettings.Value.CloudName))
            {
                throw new ArgumentException(
                    "Cloudinary CloudName is not configured in appsettings.json"
                );
            }
            if (string.IsNullOrEmpty(cloudinarySettings.Value.ApiKey))
            {
                throw new ArgumentException(
                    "Cloudinary ApiKey is not configured in appsettings.json"
                );
            }
            if (string.IsNullOrEmpty(cloudinarySettings.Value.ApiSecret))
            {
                throw new ArgumentException(
                    "Cloudinary ApiSecret is not configured in appsettings.json"
                );
            }

            var account = new Account(
                cloudinarySettings.Value.CloudName,
                cloudinarySettings.Value.ApiKey,
                cloudinarySettings.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
            _logger = logger;
        }

        /// <summary>
        /// Creates a new file record in the database.
        /// </summary>
        public async Task<string> CreateFileAsync(FileModel file)
        {
            await _files.InsertOneAsync(file); // Fixed variable name from _filesCollection
            return file.Id;
        }

        /// <summary>
        /// Fetches a file by its ID.
        /// </summary>
        public async Task<FileModel> GetFileByIdAsync(string fileId)
        {
            try
            {
                return await _files.Find(f => f.Id == fileId).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching file by ID: {FileId}", fileId);
                throw;
            }
        }

        /// <summary>
        /// Fetches multiple files by their IDs.
        /// </summary>
        public async Task<List<FileModel>> GetFilesByIdsAsync(List<string> fileIds) // Changed return type
        {
            try
            {
                // If the list is empty, return all files
                if (fileIds == null || fileIds.Count == 0)
                {
                    return await _files.Find(_ => true).ToListAsync();
                }

                var filter = Builders<FileModel>.Filter.In(f => f.Id, fileIds);
                return await _files.Find(filter).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching files by IDs: {FileIds}",
                    string.Join(", ", fileIds)
                );
                throw;
            }
        }

        /// <summary>
        /// Finds a file by its URL.
        /// </summary>
        public async Task<FileModel> FindFileByUrlAsync(string fileUrl)
        {
            try
            {
                return await _files.Find(f => f.FileUrl == fileUrl).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding file by URL: {FileUrl}", fileUrl);
                throw;
            }
        }

        /// <summary>
        /// Deletes a file from Cloudinary and the database.
        /// </summary>
        public async Task<bool> DeleteFileAsync(string fileId)
        {
            try
            {
                var file = await _files.Find(f => f.Id == fileId).FirstOrDefaultAsync();
                if (file == null)
                {
                    _logger.LogWarning("File not found: {FileId}", fileId);
                    return false;
                }

                // Delete file from Cloudinary
                var deletionParams = new DeletionParams(file.PublicId);
                var deletionResult = await _cloudinary.DestroyAsync(deletionParams);

                if (deletionResult.Result == "ok")
                {
                    // Delete file from database
                    var result = await _files.DeleteOneAsync(f => f.Id == fileId);
                    return result.DeletedCount > 0;
                }

                _logger.LogWarning("Failed to delete file from Cloudinary: {FileId}", fileId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FileId}", fileId);
                throw;
            }
        }

        /// <summary>
        /// Updates a file's metadata in the database.
        /// </summary>
        public async Task<bool> UpdateFileAsync(string fileId, FileModel file)
        {
            try
            {
                var result = await _files.ReplaceOneAsync(f => f.Id == fileId, file);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating file: {FileId}", fileId);
                throw;
            }
        }
    }
}
