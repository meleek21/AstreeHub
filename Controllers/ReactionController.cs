using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReactionController : ControllerBase
    {
        private readonly IReactionService _reactionService;
        
        public ReactionController(IReactionService reactionService)
        {
            _reactionService = reactionService;
        }
        
        // POST: api/reaction
        [HttpPost]
        public async Task<IActionResult> AddReaction([FromBody] ReactionRequest request)
        {
            var reaction = await _reactionService.AddReactionAsync(request);
            if (reaction == null)
            {
                return NoContent(); // Reaction toggled off (deleted)
            }
            return CreatedAtAction(nameof(GetReactionById), new { id = reaction.Id }, reaction);
        }
        
        // GET: api/reaction
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reaction>>> GetAllReactions()
        {
            var reactions = await _reactionService.GetAllAsync();
            return Ok(reactions);
        }
        
        // GET: api/reaction/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Reaction>> GetReactionById(string id)
        {
            var reaction = await _reactionService.GetReactionByIdAsync(id);
            if (reaction == null)
            {
                return NotFound();
            }
            return Ok(reaction);
        }
        
        // GET: api/reaction/post/{postId}
        [HttpGet("post/{postId}")]
        public async Task<ActionResult<IEnumerable<Reaction>>> GetReactionsByPost(string postId)
        {
            var reactions = await _reactionService.GetReactionsByPostAsync(postId);
            return Ok(reactions);
        }
        
        
        // GET: api/reaction/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<Reaction>>> GetReactionsByEmployee(string employeeId)
        {
            var reactions = await _reactionService.GetReactionsByEmployeeAsync(employeeId);
            return Ok(reactions);
        }
        
        // GET: api/reaction/employee/{employeeId}/post/{postId}
        [HttpGet("employee/{employeeId}/post/{postId}")]
        public async Task<ActionResult<Reaction>> GetReactionByEmployeeAndPost(string employeeId, string postId)
        {
            var reaction = await _reactionService.GetReactionByEmployeeAndPostAsync(employeeId, postId);
            if (reaction == null)
            {
                return Ok(null); // Return 200 OK with null when no reaction exists
            }
            return Ok(reaction);
        }
        
        // GET: api/reaction/post/{postId}/summary
        [HttpGet("post/{postId}/summary")]
        public async Task<ActionResult<ReactionsSummary>> GetReactionsSummaryForPost(string postId)
        {
            var summary = await _reactionService.GetReactionsSummaryForPostAsync(postId);
            return Ok(summary);
        }
        
        
        // DELETE: api/reaction/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReaction(string id)
        {
            await _reactionService.DeleteReactionAsync(id);
            return NoContent();
        }
    }
}