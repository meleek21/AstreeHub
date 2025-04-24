using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<IActionResult> GetUserConversations([FromQuery] GetConversationRequestDto request)
        {
            var conversations = await _messageService.GetUserConversationsAsync(request.UserId);
            return Ok(conversations);
        }

        [HttpGet("conversations/{conversationId}")]
        public async Task<IActionResult> GetConversationById(string conversationId, [FromQuery] GetConversationRequestDto request)
        {
            var conversation = await _messageService.GetConversationByIdAsync(conversationId, request.UserId);
            if (conversation == null)
                return NotFound();

            return Ok(conversation);
        }

        [HttpGet("conversations/{conversationId}/messages")]
        public async Task<IActionResult> GetConversationMessages(
            string conversationId, 
            [FromQuery] GetMessagesRequestDto request)
        {
            // Verify user is part of the conversation
            var conversation = await _messageService.GetConversationByIdAsync(conversationId, request.UserId);
            if (conversation == null)
                return NotFound(new { message = "Conversation not found or user not authorized" });

            var messages = await _messageService.GetMessagesByConversationIdAsync(conversationId, request.Skip, request.Limit);
            return Ok(messages);
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] MessageCreateDto messageDto)
        {
            var message = await _messageService.CreateMessageAsync(messageDto);
            return Ok(message);
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto)
        {
            var conversation = await _messageService.CreateGroupConversationAsync(dto);
            return Ok(conversation);
        }

 

        [HttpPut("messages/{messageId}/status")]
        public async Task<IActionResult> UpdateMessageStatus(
            string messageId, 
            [FromBody] MessageStatusUpdateDto statusDto)
        {
            var success = await _messageService.UpdateMessageStatusAsync(messageId, statusDto.Status, statusDto.UserId);
            if (!success)
                return NotFound();

            return Ok();
        }

        [HttpDelete("messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(
            string messageId)
        {
            var success = await _messageService.DeleteMessageAsync(messageId);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadMessagesCount([FromQuery] GetConversationRequestDto request)
        {
            var count = await _messageService.GetUnreadMessagesCountAsync(request.UserId);
            return Ok(new { count });
        }
    }
}