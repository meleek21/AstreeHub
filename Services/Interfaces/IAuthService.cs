using ASTREE_PFE.DTOs;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(bool success, string message, string? token)> LoginAsync(LoginDTO model);
        Task<(bool success, string message)> RegisterAsync(RegisterDTO model);
        Task<(bool success, string message)> LogoutAsync(); 
    }
}