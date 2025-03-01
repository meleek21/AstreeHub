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
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;
        
        public PostController(IPostService postService)
        {
            _postService = postService;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Post>>> GetAllPosts()
        {
            var posts = await _postService.GetAllPostsAsync();
            return Ok(posts);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<Post>> GetPost(string id)
        {
            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();
            
            return Ok(post);
        }
        
        [HttpGet("author/{authorId}")]
        public async Task<ActionResult<IEnumerable<Post>>> GetPostsByAuthor(string authorId)
        {
            // Removed ObjectId validation since we're using GUIDs now
            
            var posts = await _postService.GetPostsByAuthorAsync(authorId);
            return Ok(posts);
        }
        
        [HttpPost]
        public async Task<ActionResult<Post>> CreatePost([FromBody] Post post)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            // Removed ObjectId validation since we're using GUIDs now
            
            post.Timestamp = DateTime.UtcNow;
            var createdPost = await _postService.CreatePostAsync(post);
            return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost);
        }
        
        [HttpPut("{id}")]
        public async Task<ActionResult<Post>> UpdatePost(string id, [FromBody] Post post)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");
            
            var existingPost = await _postService.GetPostByIdAsync(id);
            if (existingPost == null)
                return NotFound();
            
            // Preserve original author and creation timestamp
            post.Id = id;
            post.AuthorId = existingPost.AuthorId;
            post.Timestamp = existingPost.Timestamp;
            
            await _postService.UpdatePostAsync(id, post);
            return Ok(post);
        }
        
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return BadRequest("Invalid post ID format");
            
            var post = await _postService.GetPostByIdAsync(id);
            if (post == null)
                return NotFound();
            
            await _postService.DeletePostAsync(id);
            return NoContent();
        }
    }
}