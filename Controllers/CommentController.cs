using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IEmployeeService _employeeService;

        public CommentController(ICommentService commentService, IEmployeeService employeeService)
        {
            _commentService = commentService;
            _employeeService = employeeService;
        }

        [HttpGet("post/{postId}")]
        public async Task<ActionResult<IEnumerable<CommentResponseDTO>>> GetCommentsByPost(
            string postId
        )
        {
            if (!ObjectId.TryParse(postId, out _))
                return BadRequest("Invalid post ID format");

            var comments = await _commentService.GetCommentsByPostAsync(postId);
            var authorIds = comments
                .Select(c => c.AuthorId)
                .Concat(comments.SelectMany(c => c.Replies).Select(r => r.AuthorId))
                .Distinct()
                .ToList();

            var userInfoDict = new Dictionary<string, UserInfoDTO>();
            foreach (var authorId in authorIds)
            {
                var userInfo = (
                    await _employeeService.GetUserInfoBatchAsync(new List<string> { authorId })
                ).FirstOrDefault();
                if (userInfo != null)
                {
                    userInfoDict[authorId] = userInfo;
                }
            }

            var commentDtos = comments
                .Select(comment => new CommentResponseDTO
                {
                    Id = comment.Id,
                    Content = comment.Content,
                    AuthorId = comment.AuthorId,
                    AuthorName = userInfoDict.ContainsKey(comment.AuthorId)
                        ? $"{userInfoDict[comment.AuthorId].FirstName} {userInfoDict[comment.AuthorId].LastName}"
                        : string.Empty,
                    AuthorProfilePicture = userInfoDict.ContainsKey(comment.AuthorId)
                        ? userInfoDict[comment.AuthorId].ProfilePictureUrl
                        : string.Empty,
                    CreatedAt = comment.Timestamp,
                    UpdatedAt = comment.UpdatedAt,
                    Replies = comment
                        .Replies?.Select(reply => new ReplyResponseDTO
                        {
                            Id = reply.Id,
                            Content = reply.Content,
                            AuthorId = reply.AuthorId,
                            AuthorName = userInfoDict.ContainsKey(reply.AuthorId)
                                ? $"{userInfoDict[reply.AuthorId].FirstName} {userInfoDict[reply.AuthorId].LastName}"
                                : string.Empty,
                            AuthorProfilePicture = userInfoDict.ContainsKey(reply.AuthorId)
                                ? userInfoDict[reply.AuthorId].ProfilePictureUrl
                                : string.Empty,
                            CreatedAt = reply.Timestamp,
                            UpdatedAt = reply.UpdatedAt,
                        })
                        .ToList(),
                })
                .ToList();

            return Ok(commentDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CommentResponseDTO>> GetComment(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid comment ID format");

            var comment = await _commentService.GetCommentByIdAsync(id);
            if (comment == null)
                return NotFound();

            var userInfo = (
                await _employeeService.GetUserInfoBatchAsync(new List<string> { comment.AuthorId })
            ).FirstOrDefault();
            var commentDto = new CommentResponseDTO
            {
                Id = comment.Id,
                Content = comment.Content,
                AuthorId = comment.AuthorId,
                AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                CreatedAt = comment.Timestamp,
                UpdatedAt = comment.UpdatedAt,
                Replies = comment
                    .Replies?.Select(r => new ReplyResponseDTO
                    {
                        Id = r.Id,
                        Content = r.Content,
                        AuthorId = r.AuthorId,
                        AuthorName = $"{userInfo?.FirstName} {userInfo?.LastName}",
                        AuthorProfilePicture = userInfo?.ProfilePictureUrl,
                        CreatedAt = r.Timestamp,
                        UpdatedAt = r.UpdatedAt,
                    })
                    .ToList(),
            };

            return Ok(commentDto);
        }

        [HttpPost]
        public async Task<ActionResult<Comment>> CreateComment(
            [FromBody] CommentCreateDto commentDto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(commentDto.PostId, out _))
                return BadRequest("Invalid post ID format");

            var comment = new Comment
            {
                Content = commentDto.Content,
                AuthorId = commentDto.AuthorId,
                PostId = commentDto.PostId,
                Timestamp = DateTime.UtcNow,
            };

            var createdComment = await _commentService.CreateCommentAsync(comment);
            return CreatedAtAction(
                nameof(GetComment),
                new { id = createdComment.Id },
                createdComment
            );
        }

        [HttpPost("{commentId}/reply")]
        public async Task<ActionResult<Comment>> AddReply(
            string commentId,
            [FromBody] CommentCreateDto replyDto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(commentId, out _))
                return BadRequest("Invalid comment ID format");

            if (!ObjectId.TryParse(replyDto.PostId, out _))
                return BadRequest("Invalid post ID format");

            var reply = new Comment
            {
                Content = replyDto.Content,
                AuthorId = replyDto.AuthorId,
                PostId = replyDto.PostId,
                Timestamp = DateTime.UtcNow,
            };

            await _commentService.AddReplyAsync(commentId, reply);
            return Ok(reply);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Comment>> UpdateComment(
            string id,
            [FromBody] CommentUpdateDto commentDto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid comment ID format");

            var existingComment = await _commentService.GetCommentByIdAsync(id);
            if (existingComment == null)
                return NotFound();

            existingComment.Content = commentDto.Content;
            existingComment.UpdatedAt = DateTime.UtcNow;

            await _commentService.UpdateCommentAsync(id, existingComment);
            return Ok(existingComment);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteComment(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid comment ID format");

            var comment = await _commentService.GetCommentByIdAsync(id);
            if (comment == null)
                return NotFound();

            await _commentService.DeleteCommentAsync(id);
            return NoContent();
        }

        [HttpPut("{commentId}/reply/{replyId}")]
        public async Task<ActionResult<Comment>> UpdateReply(
            string commentId,
            string replyId,
            [FromBody] CommentUpdateDto replyDto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ObjectId.TryParse(commentId, out _))
                return BadRequest("Invalid comment ID format");

            if (!ObjectId.TryParse(replyId, out _))
                return BadRequest("Invalid reply ID format");

            var updatedReply = new Comment
            {
                Content = replyDto.Content,
                UpdatedAt = DateTime.UtcNow,
            };

            await _commentService.UpdateReplyAsync(commentId, replyId, updatedReply);
            return Ok(updatedReply);
        }

        [HttpDelete("{commentId}/reply/{replyId}")]
        public async Task<ActionResult> DeleteReply(string commentId, string replyId)
        {
            if (!ObjectId.TryParse(commentId, out _))
                return BadRequest("Invalid comment ID format");

            if (!ObjectId.TryParse(replyId, out _))
                return BadRequest("Invalid reply ID format");

            await _commentService.DeleteReplyAsync(commentId, replyId);
            return NoContent();
        }
    }
}
