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

        public MessageService(
            IMessageRepository messageRepository,
            IConversationRepository conversationRepository,
            IEmployeeRepository employeeRepository)
        {
            _messageRepository = messageRepository;
            _conversationRepository = conversationRepository;
            _employeeRepository = employeeRepository;
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

        public async Task<MessageResponseDto> CreateMessageAsync(string senderId, MessageCreateDto messageDto)
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
            if (!conversation.Participants.Contains(senderId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this conversation");
            }

            // Create the message
            var message = new Message
            {
                Content = messageDto.Content,
                SenderId = senderId,
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                AttachmentUrl = messageDto.AttachmentUrl,
                ConversationId = messageDto.ConversationId,

            };

            await _messageRepository.CreateMessageAsync(message);

            // Update the conversation's last message
            await _conversationRepository.UpdateLastMessageAsync(messageDto.ConversationId, message.Id);

            return await MapToMessageResponseDtoAsync(message);
        }

        public async Task<bool> UpdateMessageStatusAsync(string messageId, string status)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            if (message == null)
                return false;

            await _messageRepository.UpdateMessageStatusAsync(messageId, status, DateTime.UtcNow);
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

        public async Task<ConversationDto> CreateGroupConversationAsync(string creatorId, List<string> participantIds, string title)
        {
            // Ensure creator is in the participants list
            if (!participantIds.Contains(creatorId))
            {
                participantIds.Add(creatorId);
            }

            // Create a new group conversation
            var conversation = new Conversation
            {
                Participants = participantIds,
                IsGroup = true,
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
            var recipientId = conversation?.Participants.FirstOrDefault(p => p != message.SenderId);
            var recipient = recipientId != null ? await _employeeRepository.GetByIdAsync(recipientId) : null;

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
                UpdatedAt = conversation.UpdatedAt
            };
        }
    }
}
        