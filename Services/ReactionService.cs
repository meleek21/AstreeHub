using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services
{
    public class ReactionService : IReactionService
    {
        private readonly IReactionRepository _reactionRepository;

        public ReactionService(IReactionRepository reactionRepository)
        {
            _reactionRepository = reactionRepository;
        }

        public async Task<IEnumerable<Reaction>> GetAllAsync()
        {
            return await _reactionRepository.GetAllAsync();
        }

        public async Task<Reaction> GetReactionByIdAsync(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return null;

            return await _reactionRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Reaction>> GetReactionsByPostAsync(string postId)
        {
            // No need to validate if it's ObjectId format since we're now accepting UUID
            return await _reactionRepository.GetReactionsByPostAsync(postId);
        }

        public async Task<IEnumerable<Reaction>> GetReactionsByCommentAsync(string commentId)
        {
            if (!ObjectId.TryParse(commentId, out _))
                return new List<Reaction>();

            return await _reactionRepository.GetReactionsByCommentAsync(commentId);
        }

        public async Task<Reaction> GetReactionByEmployeeAndPostAsync(string employeeId, string postId)
        {
            // No need to validate employeeId format since we're accepting UUID
            
            // No need to validate postId format since we're accepting UUID
            return await _reactionRepository.GetReactionByEmployeeAndPostAsync(employeeId, postId);
        }

        public async Task<Reaction> GetReactionByEmployeeAndCommentAsync(string employeeId, string commentId)
        {
            // No need to validate employeeId format since we're accepting UUID
            
            if (!ObjectId.TryParse(commentId, out _))
                return null;

            return await _reactionRepository.GetReactionByEmployeeAndCommentAsync(employeeId, commentId);
        }

        public async Task<Reaction> AddReactionAsync(ReactionRequest request)
        {
            // No need to validate EmployeeId format since we're accepting UUID

            // Check if we're dealing with a post or comment reaction
            if (!string.IsNullOrEmpty(request.PostId))
            {
                // Check if the reaction already exists
                var existingReaction = await GetReactionByEmployeeAndPostAsync(request.EmployeeId, request.PostId);

                // If reaction exists and is the same type, delete it (toggle off)
                if (existingReaction != null && existingReaction.Type == request.Type)
                {
                    await _reactionRepository.DeleteAsync(existingReaction.Id);
                    return null;
                }
                // If reaction exists but with different type, update it
                else if (existingReaction != null)
                {
                    existingReaction.Type = request.Type;
                    existingReaction.UpdatedAt = DateTime.UtcNow;
                    await _reactionRepository.UpdateAsync(existingReaction.Id, existingReaction);
                    return existingReaction;
                }
                // Otherwise, create a new reaction
                else
                {
                    var reaction = new Reaction
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        EmployeeId = request.EmployeeId,
                        PostId = request.PostId,
                        Type = request.Type
                    };
                    await _reactionRepository.CreateAsync(reaction);
                    return reaction;
                }
            }
            else if (!string.IsNullOrEmpty(request.CommentId))
            {
                if (!ObjectId.TryParse(request.CommentId, out _))
                    throw new ArgumentException("Invalid comment ID format");

                // Handle comment reaction (similar logic)
                var existingReaction = await GetReactionByEmployeeAndCommentAsync(request.EmployeeId, request.CommentId);

                if (existingReaction != null && existingReaction.Type == request.Type)
                {
                    await _reactionRepository.DeleteAsync(existingReaction.Id);
                    return null;
                }
                else if (existingReaction != null)
                {
                    existingReaction.Type = request.Type;
                    existingReaction.UpdatedAt = DateTime.UtcNow;
                    await _reactionRepository.UpdateAsync(existingReaction.Id, existingReaction);
                    return existingReaction;
                }
                else
                {
                    var reaction = new Reaction
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        EmployeeId = request.EmployeeId,
                        CommentId = request.CommentId,
                        Type = request.Type
                    };
                    await _reactionRepository.CreateAsync(reaction);
                    return reaction;
                }
            }
            else
            {
                throw new ArgumentException("Either PostId or CommentId must be provided");
            }
        }

        public async Task DeleteReactionAsync(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                throw new ArgumentException("Invalid reaction ID format");

            await _reactionRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<Reaction>> GetReactionsByEmployeeAsync(string employeeId)
        {
            // No need to validate employeeId format since we're accepting UUID
            return await _reactionRepository.GetReactionsByEmployeeAsync(employeeId);
        }

        public async Task<ReactionsSummary> GetReactionsSummaryForPostAsync(string postId)
        {
            // No need to validate postId format since we're accepting UUID
            var reactions = await _reactionRepository.GetReactionsByPostAsync(postId);
            return GenerateReactionsSummary(reactions);
        }

        public async Task<ReactionsSummary> GetReactionsSummaryForCommentAsync(string commentId)
        {
            if (!ObjectId.TryParse(commentId, out _))
                return new ReactionsSummary();

            var reactions = await _reactionRepository.GetReactionsByCommentAsync(commentId);
            return GenerateReactionsSummary(reactions);
        }

        private ReactionsSummary GenerateReactionsSummary(IEnumerable<Reaction> reactions)
        {
            var summary = new ReactionsSummary
            {
                Total = reactions.Count(),
                LikeCount = reactions.Count(r => r.Type == ReactionType.Like),
                LoveCount = reactions.Count(r => r.Type == ReactionType.Love),
                HahaCount = reactions.Count(r => r.Type == ReactionType.Haha),
                WowCount = reactions.Count(r => r.Type == ReactionType.Wow),
                SadCount = reactions.Count(r => r.Type == ReactionType.Sad),
                AngryCount = reactions.Count(r => r.Type == ReactionType.Angry)
            };

            return summary;
        }
    }
}