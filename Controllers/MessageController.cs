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

        [HttpGet("users/{userId}/conversations")]
        public async Task<IActionResult> GetUserConversations(string userId)
        {
            var conversations = await _messageService.GetUserConversationsAsync(userId);
            return Ok(conversations);
        }

        [HttpGet("conversations/{conversationId}")]
        public async Task<IActionResult> GetConversation(
            string conversationId,
            [FromQuery] string userId
        )
        {
            var conversation = await _messageService.GetConversationByIdAsync(
                conversationId,
                userId
            );
            if (conversation == null)
                return NotFound();

            return Ok(conversation);
        }

        [HttpGet("conversations/{conversationId}/messages")]
        public async Task<IActionResult> GetMessages(
            string conversationId,
            [FromQuery] GetMessagesRequestDto request
        )
        {
            // Verify user is part of the conversation
            var conversation = await _messageService.GetConversationByIdAsync(
                conversationId,
                request.UserId
            );
            if (conversation == null)
                return NotFound(new { message = "Conversation not found or user not authorized" });

            var messages = await _messageService.GetMessagesByConversationIdAsync(
                conversationId,
                request.Skip,
                request.Limit
            );
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

        [HttpPut("messages/{messageId}/read-status")]
        public async Task<IActionResult> MarkMessageAsRead(
            string messageId,
            [FromBody] MessageStatusUpdateDto statusDto
        )
        {
            var success = await _messageService.UpdateMessageReadStatusAsync(
                messageId,
                statusDto.IsRead,
                statusDto.UserId
            );
            if (!success)
                return NotFound();

            return Ok();
        }

        [HttpDelete("messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(string messageId)
        {
            var success = await _messageService.DeleteMessageAsync(messageId);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpGet("users/{userId}/unread-messages/count")]
        public async Task<IActionResult> GetUnreadMessagesCount(string userId)
        {
            var count = await _messageService.GetUnreadMessagesCountAsync(userId);
            return Ok(new { count });
        }

        [HttpPost("upload-message-attachment")]
        public async Task<IActionResult> UploadMessageAttachment(
            [FromForm] IFormFile file,
            [FromServices] ICloudinaryService cloudinaryService,
            [FromServices] IFileService fileService
        )
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (file.Length > 10 * 1024 * 1024) // 10 MB limit
                return BadRequest("File size exceeds the limit (10MB).");

            var allowedImageTypes = new[] { "image/jpeg", "image/png", "image/gif" };
            var isImage = allowedImageTypes.Contains(file.ContentType);

            try
            {
                dynamic uploadResult;
                if (isImage)
                {
                    uploadResult = await cloudinaryService.UploadImageAsync(file);
                }
                else
                {
                    uploadResult = await cloudinaryService.UploadFileAsync(file);
                }

                if (uploadResult == null)
                    return StatusCode(500, "Error uploading file.");

                var fileModel = new ASTREE_PFE.Models.File
                {
                    FileName = file.FileName,
                    FileUrl = uploadResult.SecureUrl.AbsoluteUri,
                    PublicId = uploadResult.PublicId,
                    UploaderId = User.Identity.Name,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    UploadedAt = DateTime.UtcNow,
                };
                var fileId = await fileService.CreateFileAsync(fileModel);
                fileModel.Id = fileId;
                return Ok(new { FileId = fileId, FileUrl = fileModel.FileUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while uploading the file: {ex.Message}");
            }
        }

        [HttpPut("messages/{messageId}/edit")]
        public async Task<IActionResult> EditMessage(
            string messageId,
            [FromBody] MessageCreateDto messageDto
        )
        {
            var result = await _messageService.EditMessageAsync(messageId, messageDto);
            if (!result)
                return Forbid();
            return Ok();
        }

        [HttpDelete("messages/{messageId}/unsend")]
        public async Task<IActionResult> UnsendMessage(string messageId, [FromBody] string userId)
        {
            var result = await _messageService.UnsendMessageAsync(messageId, userId);
            if (!result)
                return Forbid();
            return Ok();
        }

        [HttpPut("messages/{messageId}/soft-delete")]
        public async Task<IActionResult> SoftDeleteMessage(
            string messageId,
            [FromBody] string userId
        )
        {
            var result = await _messageService.SoftDeleteMessageAsync(messageId, userId);
            if (!result)
                return Forbid();
            return Ok();
        }

        [HttpPut("conversations/{conversationId}/soft-delete")]
        public async Task<IActionResult> SoftDeleteConversation(
            string conversationId,
            [FromBody] string userId
        )
        {
            var result = await _messageService.DeleteConversationAsync(conversationId, userId);
            if (!result)
                return Forbid();
            return Ok();
        }

        [HttpDelete("conversations/{conversationId}/permanent")]
        public async Task<IActionResult> PermanentlyDeleteGroup(
            string conversationId,
            [FromQuery] string userId
        )
        {
            var success = await _messageService.PermanentlyDeleteGroupAsync(conversationId, userId);
            if (!success)
                return Forbid();
            return NoContent();
        }

        [HttpPost("conversations/{conversationId}/participants")]
        public async Task<IActionResult> AddParticipant(
            string conversationId,
            [FromQuery] string userId,
            [FromQuery] string newParticipantId
        )
        {
            var success = await _messageService.AddParticipantToGroupAsync(
                conversationId,
                userId,
                newParticipantId
            );
            if (!success)
                return Forbid();
            return Ok();
        }

        [HttpGet("conversations/{conversationId}/participants")]
        public async Task<IActionResult> GetParticipants(string conversationId)
        {
            var participants = await _messageService.GetParticipantsByConversationIdAsync(
                conversationId
            );
            return Ok(participants);
        }

        [HttpDelete("conversations/{conversationId}/participants/{participantId}")]
        public async Task<IActionResult> RemoveParticipant(
            string conversationId,
            string participantId,
            [FromQuery] string userId
        )
        {
            var success = await _messageService.RemoveParticipantFromGroupAsync(
                conversationId,
                userId,
                participantId
            );
            if (!success)
                return Forbid();
            return Ok();
        }

        [HttpPost("conversations/{conversationId}/leave")]
        public async Task<IActionResult> LeaveGroup(
            string conversationId,
            [FromQuery] string userId
        )
        {
            var success = await _messageService.LeaveGroupAsync(conversationId, userId);
            if (!success)
                return Forbid();
            return Ok();
        }
    }
}
