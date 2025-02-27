using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO model)
        {
            var (success, message, token) = await _authService.LoginAsync(model);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { token, message });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO model)
        {
            var (success, message) = await _authService.RegisterAsync(model);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}