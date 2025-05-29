//This file handles user authentication, registration, and JWT token generation
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ASTREE_PFE.Data;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ASTREE_PFE.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<Employee> _userManager;
        private readonly SignInManager<Employee> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _dbContext;
        private readonly IEmailService _emailService;

        public AuthService(
            UserManager<Employee> userManager,
            SignInManager<Employee> signInManager,
            IConfiguration configuration,
            ApplicationDbContext dbContext,
            IEmailService emailService
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _dbContext = dbContext;
            _emailService = emailService;
        }

        public async Task<(bool success, string message, string? token)> LoginAsync(LoginDTO model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return (false, "Invalid credentials", null);

            var result = await _signInManager.PasswordSignInAsync(
                user,
                model.Password,
                false,
                true
            );
            if (!result.Succeeded)
                return (false, "Invalid credentials", null);

            user.LastLoginDate = DateTime.UtcNow;
            // Do not set IsFirstLogin to false here; it should remain true until profile completion
            await _userManager.UpdateAsync(user);

            var token = await GenerateJwtTokenAsync(user);
            return (true, "Login successful", token);
        }

        public async Task<string> GenerateJwtTokenAsync(Employee user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName),
                new Claim("DepartmentId", user.DepartmentId?.ToString() ?? "0"),
            };

            // Add roles as claims
            var roles = _userManager.GetRolesAsync(user).Result;
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["JWT:Secret"]
                        ?? throw new InvalidOperationException("JWT:Secret is not configured")
                )
            );
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddDays(1);

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                claims: claims,
                expires: expires,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<(bool success, string message)> LogoutAsync()
        {
            try
            {
                await _signInManager.SignOutAsync();
                return (true, "Logged out successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Logout failed: {ex.Message}");
            }
        }

        public async Task<string> ValidateTokenAsync(string token)
        {
            if (string.IsNullOrEmpty(token))
                return string.Empty;

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(
                    _configuration["JWT:Secret"]
                        ?? throw new InvalidOperationException("JWT:Secret is not configured")
                );

                // Set up validation parameters to match Program.cs configuration
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _configuration["JWT:ValidIssuer"],
                    ValidAudience = _configuration["JWT:ValidAudience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero, // Match Program.cs configuration
                };

                // Validate and decode the token
                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);

                // Extract the user ID from the claims
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return userId ?? string.Empty;
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        public async Task<(bool success, string message)> RequestPasswordResetAsync(
            RequestPasswordResetDTO model
        )
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(model.Email);

                // Always return success to prevent email enumeration attacks
                // Don't reveal whether the user exists or not
                if (user != null)
                {
                    var resetToken = await GeneratePasswordResetTokenAsync(model.Email);
                    var resetLink =
                        $"http://localhost:5173/reset-password?token={resetToken}&email={model.Email}";

                    await _emailService.SendPasswordResetEmailAsync(model.Email, resetLink);
                }

                return (
                    true,
                    "If an account with that email exists, a password reset link has been sent."
                );
            }
            catch (Exception ex)
            {
                return (false, "An error occurred while processing your request.");
            }
        }

        public async Task<(bool success, string message)> ResetPasswordAsync(ResetPasswordDTO model)
        {
            try
            {
                // Validate the reset token
                var (isValid, tokenEmail) = await ValidatePasswordResetTokenAsync(model.Token);

                if (!isValid)
                {
                    return (false, "Invalid or expired reset token.");
                }

                // Ensure the email in the token matches the request
                if (!string.Equals(tokenEmail, model.Email, StringComparison.OrdinalIgnoreCase))
                {
                    return (false, "Invalid reset token.");
                }

                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    return (false, "User not found.");
                }

                // Reset the password using UserManager
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(
                    user,
                    resetToken,
                    model.NewPassword
                );

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return (false, $"Password reset failed: {errors}");
                }

                return (true, "Password has been reset successfully.");
            }
            catch (Exception ex)
            {
                return (false, "An error occurred while resetting your password.");
            }
        }

        public async Task<string> GeneratePasswordResetTokenAsync(string email)
        {
            try
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Email, email),
                    new Claim("purpose", "password-reset"),
                };

                var key = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        _configuration["JWT:Secret"]
                            ?? throw new InvalidOperationException("JWT:Secret is not configured")
                    )
                );
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
                var expires = DateTime.UtcNow.AddMinutes(15); // 15-minute expiration

                var token = new JwtSecurityToken(
                    issuer: _configuration["JWT:ValidIssuer"],
                    audience: _configuration["JWT:ValidAudience"],
                    claims: claims,
                    expires: expires,
                    signingCredentials: credentials
                );

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        public async Task<(bool isValid, string email)> ValidatePasswordResetTokenAsync(
            string token
        )
        {
            if (string.IsNullOrEmpty(token))
                return (false, string.Empty);

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(
                    _configuration["JWT:Secret"]
                        ?? throw new InvalidOperationException("JWT:Secret is not configured")
                );

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _configuration["JWT:ValidIssuer"],
                    ValidAudience = _configuration["JWT:ValidAudience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero,
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);

                // Verify this is a password reset token
                var purpose = principal.FindFirst("purpose")?.Value;
                if (purpose != "password-reset")
                {
                    return (false, string.Empty);
                }

                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                return (!string.IsNullOrEmpty(email), email ?? string.Empty);
            }
            catch (Exception)
            {
                return (false, string.Empty);
            }
        }
    }
}
