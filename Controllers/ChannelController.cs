using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;

namespace ASTREE_PFE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChannelController : ControllerBase
    {
        private readonly IChannelService _channelService;

        public ChannelController(IChannelService channelService)
        {
            _channelService = channelService;
        }

        // GET: api/channels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Channel>>> GetAllChannels()
        {
            var channels = await _channelService.GetAllChannelsAsync();
            return Ok(channels);
        }

        // GET: api/channels/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Channel>> GetChannel(string id)
        {
            var channel = await _channelService.GetChannelByIdAsync(id);
            if (channel == null)
            {
                return NotFound();
            }

            return Ok(channel);
        }

        // POST: api/channels
        [HttpPost]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult<Channel>> CreateChannel(ChannelCreateDto channelDto)
        {
            try
            {
                var channel = new Channel
                {
                    Name = channelDto.Name,
                    DepartmentId = channelDto.DepartmentId,
                    IsGeneral = channelDto.IsGeneral,
                    CreatedAt = DateTime.UtcNow
                };
                
                var createdChannel = await _channelService.CreateChannelAsync(channel);
                return CreatedAtAction(nameof(GetChannel), new { id = createdChannel.Id }, createdChannel);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // PUT: api/channels/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<IActionResult> UpdateChannel(string id, ChannelUpdateDto channelDto)
        {
            try
            {
                // Get existing channel
                var existingChannel = await _channelService.GetChannelByIdAsync(id);
                if (existingChannel == null)
                {
                    return NotFound($"Channel with ID {id} not found");
                }
                
                // Update channel properties
                existingChannel.Name = channelDto.Name;
                existingChannel.DepartmentId = channelDto.DepartmentId;
                existingChannel.IsGeneral = channelDto.IsGeneral;

                
                await _channelService.UpdateChannelAsync(id, existingChannel);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/channels/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<IActionResult> DeleteChannel(string id)
        {
            try
            {
                await _channelService.DeleteChannelAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}