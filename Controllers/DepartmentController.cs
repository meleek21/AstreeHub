using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;
        private readonly IEmployeeService _employeeService;
        private readonly IChannelService _channelService;

        public DepartmentController(
            IDepartmentService departmentService,
            IEmployeeService employeeService,
            IChannelService channelService
        )
        {
            _departmentService = departmentService;
            _employeeService = employeeService;
            _channelService = channelService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentResponseDto>>> GetAllDepartments()
        {
            var departments = await _departmentService.GetAllDepartmentsAsync();
            var departmentDtos = departments
                .Select(d => new DepartmentResponseDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    DirectorId = d.DirectorId,
                })
                .ToList();

            return departmentDtos;
        }

        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DepartmentListDto>>> GetPublicDepartments()
        {
            var departments = await _departmentService.GetAllDepartmentsAsync();
            var departmentDtos = departments
                .Select(d => new DepartmentListDto { Id = d.Id, Name = d.Name })
                .ToList();

            return departmentDtos;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentResponseDto>> GetDepartment(int id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            // Get employees in this department
            var employees = await _departmentService.GetEmployeesInDepartmentAsync(id);

            var departmentDto = new DepartmentResponseDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                DirectorId = department.DirectorId,
                Employees = employees
                    .Select(e => new EmployeeDTO
                    {
                        Id = e.Id,
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        DateOfBirth = e.DateOfBirth,
                        Role = e.Role,
                        Status = e.Status,
                        Email = e.Email,
                        PhoneNumber = e.PhoneNumber,
                        DepartmentId = e.DepartmentId,
                    })
                    .ToList(),
            };

            return departmentDto;
        }

        [HttpGet("{id}/employees")]
        public async Task<ActionResult<IEnumerable<EmployeeResponseDto>>> GetEmployeesInDepartment(
            int id
        )
        {
            var employees = await _departmentService.GetEmployeesInDepartmentAsync(id);
            var employeeDtos = employees
                .Select(e => new EmployeeResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    DateOfBirth = e.DateOfBirth,
                    Role = e.Role,
                    Status = e.Status,
                    Email = e.Email,
                    PasswordHash = e.PasswordHash,
                    DepartmentId = e.DepartmentId,
                    PhoneNumber = e.PhoneNumber,
                })
                .ToList();

            return employeeDtos;
        }

        // For the CreateDepartment method
        [HttpPost]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult<DepartmentResponseDto>> CreateDepartment(
            [FromBody] DepartmentCreateDto departmentDto
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var department = new Department
            {
                Name = departmentDto.Name,
                Description = departmentDto.Description,
                DirectorId = departmentDto.DirectorId,
            };

            // Update employee role to DIRECTOR if specified
            if (!string.IsNullOrEmpty(departmentDto.DirectorId))
            {
                var roleUpdateResult = await _employeeService.UpdateEmployeeRoleAsync(
                    departmentDto.DirectorId,
                    "DIRECTOR"
                );
                if (!roleUpdateResult)
                {
                    return BadRequest("Failed to update employee role to DIRECTOR");
                }
            }

            var createdDepartment = await _departmentService.CreateDepartmentAsync(department);

            // Automatically create a channel for the new department
            try
            {
                var channel = new Channel
                {
                    Name = $"{createdDepartment.Name} Channel",
                    DepartmentId = createdDepartment.Id,
                    IsGeneral = false,
                    CreatedAt = DateTime.UtcNow,
                };

                var createdChannel = await _channelService.CreateChannelAsync(channel);

                // Update department with channel ID reference
                createdDepartment.ChannelId = createdChannel.Id;
                await _departmentService.UpdateDepartmentAsync(
                    createdDepartment.Id,
                    createdDepartment
                );
            }
            catch (Exception ex)
            {
                // Log the error but continue - don't fail department creation if channel creation fails
                Console.WriteLine($"Error creating channel for department: {ex.Message}");
            }

            var responseDto = new DepartmentResponseDto
            {
                Id = createdDepartment.Id,
                Name = createdDepartment.Name,
                Description = createdDepartment.Description,
                DirectorId = createdDepartment.DirectorId,
            };

            return CreatedAtAction(nameof(GetDepartment), new { id = responseDto.Id }, responseDto);
        }

        // For the UpdateDepartment method
        [HttpPut("{id}")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<IActionResult> UpdateDepartment(
            int id,
            [FromBody] DepartmentUpdateDto departmentDto
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingDepartment = await _departmentService.GetDepartmentByIdAsync(id);
            if (existingDepartment == null)
            {
                return NotFound();
            }

            // Store the old name to check if it changed
            string oldName = existingDepartment.Name;

            // Handle director change
            if (existingDepartment.DirectorId != departmentDto.DirectorId)
            {
                // If there was a previous director, update their role back to EMPLOYEE
                if (!string.IsNullOrEmpty(existingDepartment.DirectorId))
                {
                    await _employeeService.UpdateEmployeeRoleAsync(
                        existingDepartment.DirectorId,
                        "EMPLOYEE"
                    );
                }

                // If there's a new director, update their role to DIRECTOR
                if (!string.IsNullOrEmpty(departmentDto.DirectorId))
                {
                    await _employeeService.UpdateEmployeeRoleAsync(
                        departmentDto.DirectorId,
                        "DIRECTOR"
                    );
                }
            }

            existingDepartment.Name = departmentDto.Name;
            existingDepartment.Description = departmentDto.Description;
            existingDepartment.DirectorId = departmentDto.DirectorId;

            await _departmentService.UpdateDepartmentAsync(id, existingDepartment);

            // Update the associated channel if the department name changed
            if (oldName != departmentDto.Name)
            {
                try
                {
                    // Try to get the department's channel
                    var channel = await _channelService.GetChannelByDepartmentIdAsync(id);
                    if (channel != null)
                    {
                        // Update the channel name to match the new department name
                        channel.Name = $"{departmentDto.Name} Channel";
                        channel.UpdatedAt = DateTime.UtcNow;
                        await _channelService.UpdateChannelAsync(channel.Id, channel);
                    }
                }
                catch (KeyNotFoundException)
                {
                    // Channel doesn't exist for this department, create one
                    try
                    {
                        var channel = new Channel
                        {
                            Name = $"{departmentDto.Name} Channel",
                            DepartmentId = id,
                            IsGeneral = false,
                            CreatedAt = DateTime.UtcNow,
                        };

                        var createdChannel = await _channelService.CreateChannelAsync(channel);

                        // Update department with channel ID reference
                        existingDepartment.ChannelId = createdChannel.Id;
                        await _departmentService.UpdateDepartmentAsync(id, existingDepartment);
                    }
                    catch (Exception ex)
                    {
                        // Log the error but continue
                        Console.WriteLine($"Error creating channel for department: {ex.Message}");
                    }
                }
                catch (Exception ex)
                {
                    // Log other errors but continue
                    Console.WriteLine($"Error updating channel for department: {ex.Message}");
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            // If there was a director, update their role back to EMPLOYEE
            if (!string.IsNullOrEmpty(department.DirectorId))
            {
                await _employeeService.UpdateEmployeeRoleAsync(department.DirectorId, "EMPLOYEE");
            }

            // Delete the associated channel if it exists
            try
            {
                var channel = await _channelService.GetChannelByDepartmentIdAsync(id);
                if (channel != null)
                {
                    await _channelService.DeleteChannelAsync(channel.Id);
                }
            }
            catch (KeyNotFoundException)
            {
                // No channel exists for this department, continue with deletion
            }
            catch (Exception ex)
            {
                // Log the error but continue with department deletion
                Console.WriteLine($"Error deleting channel for department: {ex.Message}");
            }

            await _departmentService.DeleteDepartmentAsync(id);

            return NoContent();
        }

        [HttpPatch("{id}/director")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult> AssignDirector(
            int id,
            [FromBody] DirectorAssignDto directorDto
        )
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            // Update the employee's role to DIRECTOR
            var roleUpdateResult = await _employeeService.UpdateEmployeeRoleAsync(
                directorDto.EmployeeId,
                "DIRECTOR"
            );
            if (!roleUpdateResult)
            {
                return BadRequest("Failed to update employee role to DIRECTOR");
            }

            var assignResult = await _departmentService.AssignDirectorAsync(
                id,
                directorDto.EmployeeId
            );
            if (!assignResult)
            {
                return BadRequest("Failed to assign director to department");
            }

            return NoContent();
        }
    }
}
