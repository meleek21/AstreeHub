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

        public AuthService(
            UserManager<Employee> userManager,
            SignInManager<Employee> signInManager,
            IConfiguration configuration,
            ApplicationDbContext dbContext
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _dbContext = dbContext;
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
            user.IsFirstLogin = false;
            await _userManager.UpdateAsync(user);

            var token = await GenerateJwtTokenAsync(user);
            return (true, "Login successful", token);
        }

        public async Task<(bool success, string message)> RegisterAsync(RegisterDTO model)
        {
            // Validate DepartmentId if provided
            if (model.DepartmentId.HasValue)
            {
                bool departmentExists = await _dbContext.Departments.AnyAsync(d =>
                    d.Id == model.DepartmentId.Value
                );
                if (!departmentExists)
                {
                    return (false, $"Department with ID {model.DepartmentId.Value} does not exist");
                }
            }

            var user = new Employee
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                Role = model.Role,
                Status = Models.UserStatus.Active,
                DepartmentId = null, // Set to null initially
                IsFirstLogin = true,
                CreatedDate = DateTime.UtcNow,
                DateOfBirth = model.DateOfBirth,
            };

            // Only set DepartmentId if it has a value and we've already validated it exists
            if (model.DepartmentId.HasValue)
            {
                user.DepartmentId = model.DepartmentId.Value;
            }

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

            // Assign the role to the user
            await _userManager.AddToRoleAsync(user, model.Role.ToString());

            return (true, "Registration successful");
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
    }
}
