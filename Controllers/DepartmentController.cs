using ASTREE_PFE.Models;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using ASTREE_PFE.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<Department>>> GetAllDepartments()
        {
            var departments = await _departmentService.GetAllDepartmentsAsync();
            return Ok(departments);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult<Department>> GetDepartment(int id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound();
            }
            return Ok(department);
        }

        [HttpGet("{id}/employees")]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployeesInDepartment(int id)
        {
            var employees = await _departmentService.GetEmployeesInDepartmentAsync(id);
            return Ok(employees);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult<Department>> CreateDepartment([FromBody] DepartmentCreateDto departmentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var department = new Department
            {
                Name = departmentDto.Name,
                Description = departmentDto.Description,
                DirectorId = departmentDto.DirectorId
            };

            var createdDepartment = await _departmentService.CreateDepartmentAsync(department);
            return CreatedAtAction(nameof(GetDepartment), new { id = createdDepartment.Id }, createdDepartment);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> UpdateDepartment(int id, [FromBody] DepartmentUpdateDto departmentDto)
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

            existingDepartment.Name = departmentDto.Name;
            existingDepartment.Description = departmentDto.Description;
            existingDepartment.DirectorId = departmentDto.DirectorId;

            var result = await _departmentService.UpdateDepartmentAsync(id, existingDepartment);
            if (!result)
            {
                return BadRequest("Failed to update department");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> DeleteDepartment(int id)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            var result = await _departmentService.DeleteDepartmentAsync(id);
            if (!result)
            {
                return BadRequest("Failed to delete department. Make sure it has no employees assigned to it.");
            }

            return NoContent();
        }

        [HttpPatch("{id}/director")]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> AssignDirector(int id, [FromBody] DirectorAssignDto directorDto)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            var result = await _departmentService.AssignDirectorAsync(id, directorDto.EmployeeId);
            if (!result)
            {
                return BadRequest("Failed to assign director to department");
            }

            return NoContent();
        }
    }

}