//This file handles user authentication, registration, and JWT token generation
using ASTREE_PFE.Models;
using ASTREE_PFE.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ASTREE_PFE.Services
{
    public class AuthService
    {
        private readonly UserManager<Employee> _userManager;
        private readonly SignInManager<Employee> _signInManager;
        private readonly IConfiguration _configuration;

        public AuthService(
            UserManager<Employee> userManager,
            SignInManager<Employee> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        public async Task<(bool success, string message, string? token)> LoginAsync(LoginDTO model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return (false, "Invalid credentials", null);

            var result = await _signInManager.PasswordSignInAsync(user, model.Password, false, true);
            if (!result.Succeeded)
                return (false, "Invalid credentials", null);

            user.LastLoginDate = DateTime.UtcNow;
            user.IsFirstLogin = false;
            await _userManager.UpdateAsync(user);

            var token = GenerateJwtToken(user);
            return (true, "Login successful", token);
        }

        public async Task<(bool success, string message)> RegisterAsync(RegisterDTO model)
        {
            var user = new Employee
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                Role = model.Role,
                Status = Models.UserStatus.Active,
                DepartmentId = model.DepartmentId,
                IsFirstLogin = true,
                CreatedDate = DateTime.UtcNow,
                DateOfBirth = model.DateOfBirth
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

            // Assign the role to the user
            await _userManager.AddToRoleAsync(user, model.Role.ToString());

            return (true, "Registration successful");
        }

        private string GenerateJwtToken(Employee user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName),
                new Claim("DepartmentId", user.DepartmentId.ToString())
            };

            // Add roles as claims
            var roles = _userManager.GetRolesAsync(user).Result;
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT:Secret is not configured")));
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
    }
}