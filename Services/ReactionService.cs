using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Hubs;

namespace ASTREE_PFE.Services
{
    public class ReactionService : IReactionService
    {
        private readonly IReactionRepository _reactionRepository;
        private readonly IPostService _postService;
        private readonly IHubContext<FeedHub> _feedHub;

        public ReactionService(IReactionRepository reactionRepository, IPostService postService, IHubContext<FeedHub> feedHub)
        {
            _reactionRepository = reactionRepository;
            _postService = postService;
            _feedHub = feedHub;
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



        public async Task<Reaction> GetReactionByEmployeeAndPostAsync(string employeeId, string postId)
        {
            // No need to validate employeeId format since we're accepting UUID
            
            // No need to validate postId format since we're accepting UUID
            return await _reactionRepository.GetReactionByEmployeeAndPostAsync(employeeId, postId);
        }



        public async Task<Reaction> AddReactionAsync(ReactionRequest request)
        {
            // No need to validate EmployeeId format since we're accepting UUID

            // Check if we're dealing with a post or comment reaction
            if (!string.IsNullOrEmpty(request.PostId))
            {
                var reaction = new Reaction
                {
                    EmployeeId = request.EmployeeId,
                    PostId = request.PostId,
                    Type = request.Type,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _reactionRepository.CreateAsync(reaction);
                await _postService.IncrementReactionCountAsync(request.PostId, request.Type);
                
                // Broadcast the new reaction to all connected clients
                await _feedHub.Clients.All.SendAsync("ReceiveNewReaction", reaction);
                
                // Broadcast updated reaction summary
                var summary = await GetReactionsSummaryForPostAsync(request.PostId);
                await _feedHub.Clients.All.SendAsync("ReceiveReactionSummary", request.PostId, summary);
                
                return reaction;
            }
            else
            {
                throw new ArgumentException("Either PostId or CommentId must be provided");
            }
        }

        public async Task<Reaction> UpdateReactionAsync(string reactionId, ReactionRequest request)
        {
            var existingReaction = await _reactionRepository.GetByIdAsync(reactionId);
            if (existingReaction == null)
                throw new KeyNotFoundException("Reaction not found");

            var previousType = existingReaction.Type;
            existingReaction.Type = request.Type;
            existingReaction.UpdatedAt = DateTime.UtcNow;

            await _reactionRepository.UpdateAsync(existingReaction.Id, existingReaction);

            if (!string.IsNullOrEmpty(existingReaction.PostId))
            {
                await _postService.UpdateReactionCountAsync(existingReaction.PostId, previousType, request.Type);
            }
            
            // Broadcast the updated reaction to all connected clients
            await _feedHub.Clients.All.SendAsync("ReceiveUpdatedReaction", existingReaction);
            
            // Broadcast updated reaction summary
            if (!string.IsNullOrEmpty(existingReaction.PostId))
            {
                var summary = await GetReactionsSummaryForPostAsync(existingReaction.PostId);
                await _feedHub.Clients.All.SendAsync("ReceiveReactionSummary", existingReaction.PostId, summary);
            }
            return existingReaction;
        }

        public async Task DeleteReactionAsync(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                throw new ArgumentException("Invalid reaction ID format");

            var reaction = await _reactionRepository.GetByIdAsync(id);
            if (reaction != null && !string.IsNullOrEmpty(reaction.PostId))
            {
                var postId = reaction.PostId;
                await _postService.DecrementReactionCountAsync(postId, reaction.Type);
                await _reactionRepository.DeleteAsync(reaction.Id);
                
                // Broadcast the deleted reaction to all connected clients
                await _feedHub.Clients.All.SendAsync("ReceiveReactionDeleted", new { ReactionId = id, PostId = postId });
                
                // Broadcast updated reaction summary
                var summary = await GetReactionsSummaryForPostAsync(postId);
                await _feedHub.Clients.All.SendAsync("ReceiveReactionSummary", postId, summary);
            }
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



        private ReactionsSummary GenerateReactionsSummary(IEnumerable<Reaction> reactions)
        {
            var summary = new ReactionsSummary
            {
                Total = reactions.Count(),
                JaimeCount = reactions.Count(r => r.Type == ReactionType.Jaime),
                JadoreCount = reactions.Count(r => r.Type == ReactionType.Jadore),
                BravoCount = reactions.Count(r => r.Type == ReactionType.Bravo),
                YoupiCount = reactions.Count(r => r.Type == ReactionType.Youpi),
                BrillantCount = reactions.Count(r => r.Type == ReactionType.Brillant)
            };

            return summary;
        }
    }
}