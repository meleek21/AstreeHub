using System.Security.Claims;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly SignInManager<Employee> _signInManager;
        private readonly UserManager<Employee> _userManager;
        private readonly IUserOnlineStatusService _userOnlineStatusService;

        public AuthController(
            IAuthService authService,
            SignInManager<Employee> signInManager,
            UserManager<Employee> userManager,
            IUserOnlineStatusService userOnlineStatusService
        )
        {
            _authService = authService;
            _signInManager = signInManager;
            _userManager = userManager;
            _userOnlineStatusService = userOnlineStatusService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDTO model)
        {
            var (success, message, token) = await _authService.LoginAsync(model);
            if (!success)
                return BadRequest(new { message });

            var user = await _userManager.FindByEmailAsync(model.Email);
            try
            {
                await _userOnlineStatusService.UpdateUserStatusAsync(user.Id, true);
            }
            catch (Exception ex)
            {
                // Log the error but don't prevent login
                Console.WriteLine($"Failed to update user online status: {ex.Message}");
            }
            return Ok(
                new
                {
                    token,
                    user = new
                    {
                        user.Id,
                        user.FirstName,
                        user.LastName,
                        user.Email,
                        user.Role,
                        user.IsFirstLogin
                    },
                }
            );
        }


        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User ID not found in token" });

            var (success, message) = await _authService.LogoutAsync();
            Console.WriteLine($"Logout success: {success}, Message: {message}");
            if (!success)
                return BadRequest(new { message });

            try
            {
                Console.WriteLine(
                    $"Attempting to update online status for user {userId} to offline"
                );
                await _userOnlineStatusService.UpdateUserStatusAsync(userId, false);
                Console.WriteLine(
                    $"Successfully updated online status for user {userId} to offline"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Failed to update user online status during logout: {ex.Message}"
                );
                Console.WriteLine($"Exception details: {ex}");
            }
            return Ok(new { message });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User ID not found in token" });

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(
                    new
                    {
                        user.Id,
                        user.FirstName,
                        user.LastName,
                        user.Email,
                        user.Role,
                        user.DepartmentId,
                        user.ProfilePictureUrl,
                    }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = "An error occurred while fetching user data" }
                );
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User ID not found in token" });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            // Mark first login as complete
            if (user.IsFirstLogin)
            {
                user.IsFirstLogin = false;
                await _userManager.UpdateAsync(user);
            }

            return Ok(new { message = "Password changed successfully" });
        }

        [HttpPost("request-password-reset")]
        [AllowAnonymous]
        public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetDTO model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message) = await _authService.RequestPasswordResetAsync(model);
            
            // Always return 200 OK to prevent email enumeration attacks
            return Ok(new { message });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message) = await _authService.ResetPasswordAsync(model);
            
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}
