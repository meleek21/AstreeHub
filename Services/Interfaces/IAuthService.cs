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
        Task<(bool success, string message)> RequestPasswordResetAsync(RequestPasswordResetDTO model);
        Task<(bool success, string message)> ResetPasswordAsync(ResetPasswordDTO model);
        Task<string> GeneratePasswordResetTokenAsync(string email);
        Task<(bool isValid, string email)> ValidatePasswordResetTokenAsync(string token);
    }
}
