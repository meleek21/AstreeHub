using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserOnlineStatusController : ControllerBase
    {
        private readonly IUserOnlineStatusService _userOnlineStatusService;

        public UserOnlineStatusController(IUserOnlineStatusService userOnlineStatusService)
        {
            _userOnlineStatusService = userOnlineStatusService;
        }

        [HttpGet("online")]
        public async Task<ActionResult<IEnumerable<UserOnlineStatus>>> GetOnlineUsers()
        {
            var onlineUsers = await _userOnlineStatusService.GetAllOnlineUsersAsync();
            return Ok(onlineUsers);
        }

        [HttpGet("{userId}/status")]
        public async Task<ActionResult<UserOnlineStatus>> GetUserStatus(string userId)
        {
            var status = await _userOnlineStatusService.GetUserStatusAsync(userId);
            if (status == null)
                return NotFound();

            return Ok(status);
        }

        [HttpGet("{userId}/last-seen")]
        public async Task<ActionResult<DateTime?>> GetLastSeen(string userId)
        {
            var lastSeen = await _userOnlineStatusService.GetLastSeenTimeAsync(userId);
            if (lastSeen == null)
                return NotFound();

            return Ok(lastSeen);
        }

        [HttpPost("{userId}/status")]
        public async Task<ActionResult> UpdateUserStatus(string userId, [FromBody] bool isOnline)
        {
            await _userOnlineStatusService.UpdateUserStatusAsync(userId, isOnline);
            return Ok();
        }

        [HttpPost("{userId}/activity")]
        public async Task<ActionResult> UpdateLastActivity(string userId)
        {
            await _userOnlineStatusService.UpdateLastActivityAsync(userId);
            return Ok();
        }
    }
}