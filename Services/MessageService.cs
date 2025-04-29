using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Bson;

namespace ASTREE_PFE.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IConversationRepository _conversationRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly INotificationService _notificationService;

        public MessageService(
            IMessageRepository messageRepository,
            IConversationRepository conversationRepository,
            IEmployeeRepository employeeRepository,
            INotificationService notificationService
            )
        {
            _messageRepository = messageRepository;
            _conversationRepository = conversationRepository;
            _employeeRepository = employeeRepository;
            _notificationService = notificationService;
        }

        public async Task<MessageResponseDto> GetMessageByIdAsync(string id)
        {
            var message = await _messageRepository.GetMessageByIdAsync(id);
            if (message == null)
                return null;

            return await MapToMessageResponseDtoAsync(message);
        }

        public async Task<IEnumerable<MessageResponseDto>> GetMessagesByConversationIdAsync(string conversationId, int skip = 0, int limit = 50)
        {
            var messages = await _messageRepository.GetMessagesByConversationIdAsync(conversationId, skip, limit);
            var messageDtos = new List<MessageResponseDto>();

            foreach (var message in messages)
            {
                messageDtos.Add(await MapToMessageResponseDtoAsync(message));
            }

            return messageDtos;
        }

        public async Task<MessageResponseDto> CreateMessageAsync(MessageCreateDto messageDto)
        {
            if (string.IsNullOrEmpty(messageDto.ConversationId))
            {
                throw new ArgumentException("ConversationId is required");
            }

            var conversation = await _conversationRepository.GetConversationByIdAsync(messageDto.ConversationId);
            if (conversation == null)
            {
                throw new ArgumentException("Invalid conversation ID");
            }

            // Verify sender is a participant in the conversation
            if (!conversation.Participants.Contains(messageDto.UserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this conversation");
            }

            // Create the message
            var message = new Message
            {
                Content = messageDto.Content,
                SenderId = messageDto.UserId,
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                AttachmentUrl = messageDto.AttachmentUrl,
                ConversationId = messageDto.ConversationId,
            };

            await _messageRepository.CreateMessageAsync(message);

            // Update the conversation's last message
            await _conversationRepository.UpdateLastMessageAsync(messageDto.ConversationId, message.Id);

            // Send notifications to other participants
            foreach (var participantId in conversation.Participants)
            {
                if (participantId != messageDto.UserId) // Don't notify the sender
                {
                    await _notificationService.CreateMessageNotificationAsync(
                        messageDto.UserId,
                        participantId,
                        messageDto.ConversationId);
                }
            }

            return await MapToMessageResponseDtoAsync(message);
        }

        public async Task<bool> UpdateMessageReadStatusAsync(string messageId, bool isRead, string userId)
{
    var message = await _messageRepository.GetMessageByIdAsync(messageId);
    if (message == null || message.SenderId == userId)
        return false;

    await _messageRepository.UpdateMessageReadStatusAsync(messageId, isRead, DateTime.UtcNow);
    return true;
}

        public async Task<bool> DeleteMessageAsync(string id)
        {
            var message = await _messageRepository.GetMessageByIdAsync(id);
            if (message == null)
                return false;
                


            await _messageRepository.DeleteMessageAsync(id);
            return true;
        }

        public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId)
        {
            var conversations = await _conversationRepository.GetConversationsByParticipantIdAsync(userId);
            var conversationDtos = new List<ConversationDto>();

            foreach (var conversation in conversations)
            {
                conversationDtos.Add(await MapToConversationDtoAsync(conversation, userId));
            }

            return conversationDtos.OrderByDescending(c => c.UpdatedAt);
        }

        public async Task<ConversationDto> GetConversationByIdAsync(string conversationId, string userId)
        {
            var conversation = await _conversationRepository.GetConversationByIdAsync(conversationId);
            if (conversation == null || !conversation.Participants.Contains(userId))
                return null;

            return await MapToConversationDtoAsync(conversation, userId);
        }

        public async Task<ConversationDto> GetOrCreateConversationWithUserAsync(string currentUserId, string otherUserId)
        {
            // Create a list with both user IDs
            var participantIds = new List<string> { currentUserId, otherUserId };
            
            // Sort participant IDs to ensure consistent lookup regardless of order
            participantIds.Sort();
            
            // Try to find an existing conversation first
            var existingConversation = await _conversationRepository.GetConversationByParticipantsAsync(participantIds);
            
            if (existingConversation != null)
            {
                // Return the existing conversation
                return await MapToConversationDtoAsync(existingConversation, currentUserId);
            }
            
            // Return null if no conversation exists - it will be created when a message is sent
            return null;
        }

        public async Task<ConversationDto> CreateGroupConversationAsync(CreateConversationDto createConversationDto)
        {
            string creatorId = createConversationDto.UserId;
            List<string> participantIds = createConversationDto.ParticipantIds;
            string title = createConversationDto.Title;
            
            // Ensure creator is in the participants list
            if (!participantIds.Contains(creatorId))
            {
                participantIds.Add(creatorId);
            }

            // For direct conversations (exactly 2 participants), check if one already exists
            if (participantIds.Count == 2 && string.IsNullOrEmpty(title))
            {
                // Sort participant IDs to ensure consistent lookup regardless of order
                var sortedParticipantIds = new List<string>(participantIds);
                sortedParticipantIds.Sort();
                
                // First try to find an existing conversation
                var existingConversation = await _conversationRepository.GetConversationByParticipantsAsync(sortedParticipantIds);
                if (existingConversation != null)
                {
                    // Return the existing conversation instead of creating a new one
                    return await MapToConversationDtoAsync(existingConversation, creatorId);
                }
            }

            // Create a new conversation
            var conversation = new Conversation
            {
                Participants = participantIds,
                IsGroup = participantIds.Count > 2,
                Title = title,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _conversationRepository.CreateConversationAsync(conversation);
            return await MapToConversationDtoAsync(conversation, creatorId);
        }

        public async Task<int> GetUnreadMessagesCountAsync(string userId)
        {
            return await _messageRepository.GetUnreadMessagesCountAsync(userId);
        }

        // Helper methods for mapping entities to DTOs
        private async Task<MessageResponseDto> MapToMessageResponseDtoAsync(Message message)
        {
            var sender = await _employeeRepository.GetByIdAsync(message.SenderId);
            var conversation = await _conversationRepository.GetConversationByIdAsync(message.ConversationId);
            var recipient = await _employeeRepository.GetByIdAsync(
            conversation?.Participants.FirstOrDefault(p => p != message.SenderId));


            return new MessageResponseDto
            {
                Id = message.Id,
                Content = message.Content,
                SenderId = message.SenderId,
                SenderName = sender?.FullName ?? "Unknown User",
                SenderProfilePicture = sender?.ProfilePictureUrl,
                RecipientName = recipient?.FullName ?? "Unknown User",
                RecipientProfilePicture = recipient?.ProfilePictureUrl,
                Timestamp = message.Timestamp,
                IsRead = message.IsRead,
                ReadAt = message.ReadAt,
                AttachmentUrl = message.AttachmentUrl,
                ConversationId = message.ConversationId
            };
        }

        private async Task<ConversationDto> MapToConversationDtoAsync(Conversation conversation, string currentUserId)
        {
            var participantDtos = new List<ParticipantDto>();
            foreach (var participantId in conversation.Participants)
            {
                var employee = await _employeeRepository.GetByIdAsync(participantId);
                if (employee != null)
                {
                    participantDtos.Add(new ParticipantDto
                    {
                        Id = employee.Id,
                        Name = employee.FullName,
                        ProfilePictureUrl = employee.ProfilePictureUrl
                    });
                }
            }

            var lastMessage = conversation.LastMessageId != null
                ? await _messageRepository.GetMessageByIdAsync(conversation.LastMessageId)
                : null;

            int unreadCount = await _messageRepository.FindMessagesAsync(m => m.ConversationId == conversation.Id && m.SenderId != currentUserId && !m.IsRead).ContinueWith(t => t.Result.Count());
return new ConversationDto
            {
                Id = conversation.Id,
                Title = !conversation.IsGroup
                    ? participantDtos.FirstOrDefault(p => p.Id != currentUserId)?.Name
                    : conversation.Title,
                IsGroup = conversation.IsGroup,
                Participants = participantDtos,
                LastMessage = lastMessage != null ? await MapToMessageResponseDtoAsync(lastMessage) : null,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                UnreadCount = unreadCount
            };
        }

        public async Task<bool> EditMessageAsync(string messageId, MessageCreateDto messageDto)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            if (message == null || message.SenderId != messageDto.UserId)
                return false;
            // Only allow editing within 5 minutes
            if ((DateTime.UtcNow - message.Timestamp).TotalMinutes > 5 || message.IsUnsent)
                return false;
            message.Content = messageDto.Content;
            message.IsEdited = true;
            message.EditedAt = DateTime.UtcNow;
            await _messageRepository.UpdateMessageAsync(messageId, message);
            return true;
        }

        public async Task<bool> UnsendMessageAsync(string messageId, string userId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            if (message == null || message.SenderId != userId || (DateTime.UtcNow - message.Timestamp).TotalMinutes > 5)
                return false;

            message.IsUnsent = true;
            message.Content = "This message was unsent.";
            await _messageRepository.UpdateMessageAsync(messageId, message);
            return true;
        }

        public async Task<bool> SoftDeleteMessageAsync(string messageId, string userId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            if (message == null)
                return false;
            if (!message.DeletedForUsers.Contains(userId))
            {
                message.DeletedForUsers.Add(userId);
                await _messageRepository.UpdateMessageAsync(messageId, message);
            }
            return true;
        }
    }
}