using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Models.Enums;
using ASTREE_PFE.Services.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TodoController : ControllerBase
    {
        private readonly ITodoService _todoService;
        private readonly IMapper _mapper;

        public TodoController(ITodoService todoService, IMapper mapper)
        {
            _todoService = todoService;
            _mapper = mapper;
        }

        // Create a new todo
        [HttpPost]
        public async Task<ActionResult<TodoResponseDTO>> CreateTodo(
            [FromBody] TodoCreateDTO todoDto,
            [FromQuery] string userId
        )
        {
            if (todoDto == null)
                return BadRequest("Todo cannot be null");

            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            var todo = _mapper.Map<Todo>(todoDto);
            todo.UserId = userId;

            var createdTodo = await _todoService.CreateTodoAsync(todo);
            var responseDto = _mapper.Map<TodoResponseDTO>(createdTodo);

            return CreatedAtAction(
                nameof(GetTodoById),
                new { id = createdTodo.Id, userId },
                responseDto
            );
        }

        // Get a specific todo by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoResponseDTO>> GetTodoById(
            string id,
            [FromQuery] string userId
        )
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            var todo = await _todoService.GetTodoByIdAsync(id, userId);

            if (todo == null)
                return NotFound($"Todo with ID {id} not found");

            var responseDto = _mapper.Map<TodoResponseDTO>(todo);
            return Ok(responseDto);
        }

        // Get all todos with optional filtering
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoResponseDTO>>> GetTodos(
            [FromQuery] string userId,
            [FromQuery] TodoStatus? status = null,
            [FromQuery] TodoPriority? priority = null,
            [FromQuery] DateTime? dueDate = null
        )
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            var todos = await _todoService.GetUserTodosAsync(userId, status, priority, dueDate);
            var responseDtos = _mapper.Map<IEnumerable<TodoResponseDTO>>(todos);

            return Ok(responseDtos);
        }

        // Update a todo
        [HttpPut("{id}")]
        public async Task<ActionResult<TodoResponseDTO>> UpdateTodo(
            string id,
            [FromBody] TodoUpdateDTO todoDto,
            [FromQuery] string userId
        )
        {
            if (todoDto == null)
                return BadRequest("Todo cannot be null");

            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            var existingTodo = await _todoService.GetTodoByIdAsync(id, userId);

            if (existingTodo == null)
                return NotFound($"Todo with ID {id} not found");

            // Map the DTO to the existing entity
            _mapper.Map(todoDto, existingTodo);
            existingTodo.UpdatedAt = DateTime.UtcNow;

            var updatedTodo = await _todoService.UpdateTodoAsync(id, existingTodo, userId);
            var responseDto = _mapper.Map<TodoResponseDTO>(updatedTodo);

            return Ok(responseDto);
        }

        // Delete a todo
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTodo(string id, [FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            var todo = await _todoService.GetTodoByIdAsync(id, userId);

            if (todo == null)
                return NotFound($"Todo with ID {id} not found");

            await _todoService.DeleteTodoAsync(id, userId);
            return NoContent();
        }

        // Get summary of todos
        [HttpGet("summary")]
        public async Task<ActionResult<TodoSummary>> GetTodoSummary([FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            var summary = await _todoService.GetTodoSummaryAsync(userId);
            return Ok(summary);
        }
    }
}