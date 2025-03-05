using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations; 
using System.Threading.Tasks;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;
        
        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }
        
        [HttpGet("post/{postId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByPost(string postId)
        {
            if (!ObjectId.TryParse(postId, out _))
                return BadRequest("Invalid post ID format");
                
            var comments = await _commentService.GetCommentsByPostAsync(postId);
            return Ok(comments);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<Comment>> GetComment(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid comment ID format");
                
            var comment = await _commentService.GetCommentByIdAsync(id);
            if (comment == null)
                return NotFound();
                
            return Ok(comment);
        }
        
        [HttpPost]
        public async Task<ActionResult<Comment>> CreateComment([FromBody] CommentCreateDto commentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            if (!ObjectId.TryParse(commentDto.PostId, out _))
                return BadRequest("Invalid post ID format");
            
            // Create a Comment from the DTO
            var comment = new Comment
            {
                Content = commentDto.Content,
                AuthorId = commentDto.AuthorId,
                PostId = commentDto.PostId,
                Timestamp = DateTime.UtcNow
            };
            
            var createdComment = await _commentService.CreateCommentAsync(comment);
            return CreatedAtAction(nameof(GetComment), new { id = createdComment.Id }, createdComment);
        }
        
        [HttpPost("{commentId}/reply")]
        public async Task<ActionResult<Comment>> AddReply(string commentId, [FromBody] CommentCreateDto replyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            if (!ObjectId.TryParse(commentId, out _))
                return BadRequest("Invalid comment ID format");
                
            if (!ObjectId.TryParse(replyDto.PostId, out _))
                return BadRequest("Invalid post ID format");
            
            // Create a Comment from the DTO
            var reply = new Comment
            {
                Content = replyDto.Content,
                AuthorId = replyDto.AuthorId,
                PostId = replyDto.PostId,
                Timestamp = DateTime.UtcNow
            };
            
            await _commentService.AddReplyAsync(commentId, reply);
            return Ok(reply);
        }
        
        [HttpPut("{id}")]
        public async Task<ActionResult<Comment>> UpdateComment(string id, [FromBody] CommentUpdateDto commentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid comment ID format");
                
            var existingComment = await _commentService.GetCommentByIdAsync(id);
            if (existingComment == null)
                return NotFound();
            
            // Update only the allowed fields
            existingComment.Content = commentDto.Content;
            
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
    }
    
    // DTOs to separate input/output models
    public class CommentCreateDto
    {
        [Required]
        public string Content { get; set; } = null!;
        
        [Required]
        public string AuthorId { get; set; } = null!;
        
        [Required]
        public string PostId { get; set; } = null!;
    }
    
    public class CommentUpdateDto
    {
        [Required]
        public string Content { get; set; } = null!;
    }
}