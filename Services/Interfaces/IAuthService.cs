using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(bool success, string message, string? token)> LoginAsync(LoginDTO model);
        Task<(bool success, string message)> LogoutAsync();
        Task<string> GenerateJwtTokenAsync(Employee user);
        Task<string> ValidateTokenAsync(string token);
    }
}
