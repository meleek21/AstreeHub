using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ASTREE_PFE.Hubs
{
    [Authorize]
    public class MessageHub : Hub
    {
        private readonly IMessageService _messageService;
        private readonly IUserOnlineStatusService _userOnlineStatusService;
        private static readonly Dictionary<string, string> _userConnectionMap = new Dictionary<string, string>();

        public MessageHub(IMessageService messageService, IUserOnlineStatusService userOnlineStatusService)
        {
            _messageService = messageService;
            _userOnlineStatusService = userOnlineStatusService;
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
                
                // Update user's online status
                await _userOnlineStatusService.UpdateUserStatusAsync(userId, true);
                
                // Get user's conversations and join those groups
                var conversations = await _messageService.GetUserConversationsAsync(userId);
                foreach (var conversation in conversations)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversation.Id}");
                }
                
                // Notify others that user is online
                await Clients.Others.SendAsync("UserOnline", userId);
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
                
                // Update user's online status
                await _userOnlineStatusService.UpdateUserStatusAsync(userId, false);
                
                // Notify others that user is offline
                await Clients.Others.SendAsync("UserOffline", userId);
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(MessageCreateDto messageDto)
        {
            var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(senderId))
                throw new HubException("User not authenticated");

            try
            {
                // Create the message in the database
                var message = await _messageService.CreateMessageAsync(senderId, messageDto);
                
                // Send to all participants in the conversation group
                await Clients.Group($"conversation_{message.ConversationId}").SendAsync("ReceiveMessage", message);
            }
            catch (Exception ex)
            {
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
                var success = await _messageService.UpdateMessageStatusAsync(messageId, "read");
                if (success)
                {
                    // Notify the sender that their message was read
                    var message = await _messageService.GetMessageByIdAsync(messageId);
                    if (message != null && _userConnectionMap.TryGetValue(message.SenderId, out var connectionId))
                    {
                        await Clients.Client(connectionId).SendAsync("MessageRead", messageId, userId);
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
                throw new HubException("User not authenticated");

            try
            {
                await Clients.Group($"conversation_{conversationId}").SendAsync("UserTyping", userId, conversationId);
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to send typing indicator: {ex.Message}");
            }
        }
    }}