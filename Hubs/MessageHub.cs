using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging; // Add this using statement
using System.Security.Claims;

namespace ASTREE_PFE.Hubs
{
    [Authorize]
    public class MessageHub : Hub
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessageHub> _logger; // Add logger field
        private static readonly Dictionary<string, string> _userConnectionMap = new Dictionary<string, string>();

        // Inject ILogger in the constructor
        public MessageHub(IMessageService messageService, ILogger<MessageHub> logger)
        {
            _messageService = messageService;
            _logger = logger; // Assign logger
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Add to user's personal group for direct messaging
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                // Update connection mapping
                _userConnectionMap[userId] = Context.ConnectionId;
                
                // Get user's conversations and join those groups
                var conversations = await _messageService.GetUserConversationsAsync(userId);
                foreach (var conversation in conversations)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversation.Id}");
                }
                
                // Notify through UserHub
                var userHub = Context.GetHttpContext().RequestServices.GetRequiredService<IHubContext<UserHub>>();
                await userHub.Clients.All.SendAsync("UserStatusChanged", userId, true);
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Remove from user's personal group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                // Remove from connection mapping
                _userConnectionMap.Remove(userId);
                
                // Notify through UserHub
                var userHub = Context.GetHttpContext().RequestServices.GetRequiredService<IHubContext<UserHub>>();
                await userHub.Clients.All.SendAsync("UserStatusChanged", userId, false);
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(MessageCreateDto messageDto)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("SendMessage called by unauthenticated user.");
                throw new HubException("User not authenticated");
            }

            _logger.LogInformation("User {UserId} attempting to send message in conversation {ConversationId}", userId, messageDto.ConversationId);

            try
            {
                // Set the UserId from the authenticated user
                messageDto.UserId = userId;

                _logger.LogInformation("Calling CreateMessageAsync for User {UserId} with DTO: {@MessageDto}", userId, messageDto);
                // Create the message in the database using the updated service method
                var message = await _messageService.CreateMessageAsync(messageDto);
                _logger.LogInformation("CreateMessageAsync successful for User {UserId}. Message ID: {MessageId}", userId, message.Id);

                // Send to all participants in the conversation group
                await Clients.Group($"conversation_{message.ConversationId}").SendAsync("ReceiveMessage", message);
                _logger.LogInformation("Message {MessageId} sent to group conversation_{ConversationId}", message.Id, message.ConversationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send message for User {UserId} in conversation {ConversationId}. DTO: {@MessageDto}", userId, messageDto.ConversationId, messageDto);
                throw new HubException($"Failed to send message: {ex.Message}");
            }
        }

        public async Task JoinConversation(string conversationId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            try
            {
                // Create request DTO for the service method
                var request = new GetConversationRequestDto { UserId = userId };
                
                // Verify user is part of the conversation
                var conversation = await _messageService.GetConversationByIdAsync(conversationId, userId);
                if (conversation == null)
                    throw new HubException("User not part of this conversation");

                await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to join conversation: {ex.Message}");
            }
        }

        public async Task LeaveConversation(string conversationId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to leave conversation: {ex.Message}");
            }
        }

        public async Task MarkMessageAsRead(string messageId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            try
            {
                var success = await _messageService.UpdateMessageReadStatusAsync(messageId, true, userId);
                if (success)
                {
                    var message = await _messageService.GetMessageByIdAsync(messageId);
                    if (message != null)
                    {
                        // Broadcast to the conversation group that the message was read
                        await Clients.Group($"conversation_{message.ConversationId}").SendAsync("MessageRead", messageId, userId);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to mark message as read: {ex.Message}");
            }
        }

        public async Task SendTypingIndicator(string conversationId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("SendTypingIndicator called by unauthenticated user.");
                throw new HubException("User not authenticated");
            }

            try
            {
                // Verify user is part of the conversation first
                var conversation = await _messageService.GetConversationByIdAsync(conversationId, userId);
                if (conversation == null)
                {
                    _logger.LogWarning("User {UserId} attempted to send typing indicator for conversation {ConversationId} they are not part of.", userId, conversationId);
                    throw new HubException("User not part of this conversation");
                }

                // Send typing indicator to conversation participants, excluding the sender
                // Confirmed casing is 'UserTyping'
                await Clients.GroupExcept($"conversation_{conversationId}", Context.ConnectionId).SendAsync("UserTyping", userId, conversationId);
                _logger.LogInformation("User {UserId} sent typing indicator for conversation {ConversationId}", userId, conversationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send typing indicator for User {UserId} in conversation {ConversationId}", userId, conversationId);
                throw new HubException($"Failed to send typing indicator: {ex.Message}");
            }
        }

        // Method to handle message editing
        public async Task EditMessage(string messageId, string updatedContent)
{
    var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        throw new HubException("User not authenticated");

    try
    {
        // Verify the user is the sender of the message
        var message = await _messageService.GetMessageByIdAsync(messageId);
        if (message == null || message.SenderId != userId)
            throw new HubException("Unauthorized to edit this message");

        // Create the message DTO with updated content
        var messageDto = new MessageCreateDto
        {
            Content = updatedContent,
            UserId = userId,
            ConversationId = message.ConversationId
        };

        // Update the message content in the service
        var success = await _messageService.EditMessageAsync(messageId, messageDto);
        if (success)
        {
            // Broadcast the edited message details to the conversation group
            await Clients.Group($"conversation_{message.ConversationId}").SendAsync("MessageEdited", messageId, updatedContent);
        }
        else
        {
            throw new HubException("Failed to update message in database.");
        }
    }
    catch (Exception ex)
    {
        throw new HubException($"Failed to edit message: {ex.Message}");
    }
}
        // Method to handle unsending a message
        public async Task UnsendMessage(string messageId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            try
            {
                // Verify the user is the sender
                var message = await _messageService.GetMessageByIdAsync(messageId);
                if (message == null || message.SenderId != userId)
                    throw new HubException("Unauthorized to unsend this message");

                // Call service to mark the message as unsent
                var success = await _messageService.UnsendMessageAsync(messageId , userId);
                if (success)
                {
                    // Broadcast the unsend event to the conversation group
                    await Clients.Group($"conversation_{message.ConversationId}").SendAsync("MessageUnsent", messageId);
                }
                 else
                {
                     throw new HubException("Failed to mark message as unsent in database.");
                }
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to unsend message: {ex.Message}");
            }
        }

        // Method to handle deleting a message for the current user (soft delete)
        public async Task DeleteMessageForUser(string messageId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            try
            {
                 // Call service to perform soft delete for the user
                var success = await _messageService.SoftDeleteMessageAsync(messageId, userId);
                if (success)
                {
                    // Notify only the calling client that the message is deleted for them
                    // No broadcast needed as it's a per-user action
                    await Clients.Caller.SendAsync("MessageDeleted", messageId, userId);
                }
                 else
                {
                     throw new HubException("Failed to soft delete message in database.");
                }
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to delete message for user: {ex.Message}");
            }
        }
    }
}