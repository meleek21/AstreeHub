using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessageController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetUserConversations()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var conversations = await _messageService.GetUserConversationsAsync(userId);
            return Ok(conversations);
        }

        [HttpGet("conversations/{conversationId}")]
        public async Task<IActionResult> GetConversationById(string conversationId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var conversation = await _messageService.GetConversationByIdAsync(conversationId, userId);
            if (conversation == null)
                return NotFound();

            return Ok(conversation);
        }

        [HttpGet("conversations/{conversationId}/messages")]
        public async Task<IActionResult> GetConversationMessages(string conversationId, [FromQuery] int skip = 0, [FromQuery] int limit = 50)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Verify user is part of the conversation
            var conversation = await _messageService.GetConversationByIdAsync(conversationId, userId);
            if (conversation == null)
                return NotFound("Conversation not found or user not authorized");

            var messages = await _messageService.GetMessagesByConversationIdAsync(conversationId, skip, limit);
            return Ok(messages);
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] MessageCreateDto messageDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var message = await _messageService.CreateMessageAsync(userId, messageDto);
            return Ok(message);
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var conversation = await _messageService.CreateGroupConversationAsync(userId, dto.ParticipantIds, dto.Title);
            return Ok(conversation);
        }

        [HttpPut("messages/{messageId}/status")]
        public async Task<IActionResult> UpdateMessageStatus(string messageId, [FromBody] MessageStatusUpdateDto statusDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _messageService.UpdateMessageStatusAsync(messageId, statusDto.Status);
            if (!success)
                return NotFound();

            return Ok();
        }

        [HttpDelete("messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(string messageId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _messageService.DeleteMessageAsync(messageId);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadMessagesCount()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var count = await _messageService.GetUnreadMessagesCountAsync(userId);
            return Ok(new { count });
        }
    }
}