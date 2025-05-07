namespace ASTREE_PFE.Services.Interfaces{
    using FileModel = ASTREE_PFE.Models.File;

public interface IFileService
{
    Task<string> CreateFileAsync(FileModel file);
    Task<FileModel> GetFileByIdAsync(string fileId);
    Task<List<FileModel>> GetFilesByIdsAsync(List<string> fileIds);
    Task<FileModel> FindFileByUrlAsync(string fileUrl);
    Task<bool> DeleteFileAsync(string fileId);
    Task<bool> UpdateFileAsync(string fileId, FileModel file);
}
}
