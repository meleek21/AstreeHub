using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly SignInManager<Employee> _signInManager;
        private readonly UserManager<Employee> _userManager;

        public AuthController(IAuthService authService, SignInManager<Employee> signInManager, UserManager<Employee> userManager)
        {
            _authService = authService;
            _signInManager = signInManager;
            _userManager = userManager;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO model)
        {
            var result = await _signInManager.PasswordSignInAsync(model.Email, model.Password, false, false);
            if (!result.Succeeded)
                return BadRequest(new { message = "Invalid credentials" });

            var user = await _userManager.FindByEmailAsync(model.Email);
            var token = await _authService.GenerateJwtTokenAsync(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email
                }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO model)
        {
            var (success, message) = await _authService.RegisterAsync(model);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var (success, message) = await _authService.LogoutAsync();
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [Authorize] // Ensure only authenticated users can access this endpoint
        [HttpPost("me")]
        public async Task<IActionResult> GetCurrentUser([FromBody] TokenDTO model)
        {
            if (string.IsNullOrEmpty(model.Token))
                return BadRequest(new { message = "Token is required" });

            try
            {
                // Verify the token and get the user ID
                var userId = await _authService.ValidateTokenAsync(model.Token);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "Invalid token" });

                // Fetch the user from the database
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Return the user's data
                return Ok(new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email
                });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = "Invalid token: " + ex.Message });
            }
        }
    }
}