using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
public async Task<IActionResult> Login(LoginDTO model)
{
    var result = await _signInManager.PasswordSignInAsync(model.Email, model.Password, false, false);
    if (!result.Succeeded)
        return BadRequest(new { message = "Invalid credentials" });

    var user = await _userManager.FindByEmailAsync(model.Email);
    return Ok(new
    {
        user.Id,
        user.FirstName,
        user.LastName,
        user.Email
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
        
    }
}