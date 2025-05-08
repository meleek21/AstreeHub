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
        public async Task<ActionResult<string>> GetLastSeen(string userId)
        {
            var lastSeen = await _userOnlineStatusService.GetLastSeenTimeAsync(userId);
            if (lastSeen == null)
                return ("Hors ligne");

            var duration = GetHumanReadableDuration(lastSeen.Value);
            return Ok(duration);
        }

        [HttpPost("{userId}/status")]
        public async Task<ActionResult> UpdateUserStatus(string userId, [FromBody] bool isOnline)
        {
            await _userOnlineStatusService.UpdateUserStatusAsync(userId, isOnline);
            return Ok();
        }

        [HttpPost("{userId}/activity")]
        public async Task<ActionResult> UpdateUserActivity(string userId)
        {
            // Remplacer UpdateLastActivityAsync par UpdateUserHeartbeatAsync
            await _userOnlineStatusService.UpdateUserHeartbeatAsync(userId);
            return Ok();
        }

        private string GetHumanReadableDuration(DateTime lastSeenTime)
        {
            var timeDifference = DateTime.UtcNow - lastSeenTime;

            if (timeDifference.TotalMinutes < 1)
                return "À l'instant";
            if (timeDifference.TotalMinutes < 60)
                return $"{(int)timeDifference.TotalMinutes}m";
            if (timeDifference.TotalHours < 24)
                return $"{(int)timeDifference.TotalHours}h";
            if (timeDifference.TotalDays < 30)
                return $"{(int)timeDifference.TotalDays}j";
            if (timeDifference.TotalDays < 365)
                return $"{(int)(timeDifference.TotalDays / 30)} mois";

            return $"{(int)(timeDifference.TotalDays / 365)} an(s)";
        }
    }
}
