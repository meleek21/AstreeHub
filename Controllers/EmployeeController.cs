using ASTREE_PFE.Models;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly IDepartmentService _departmentService;

        public EmployeeController(IEmployeeService employeeService, IDepartmentService departmentService)
        {
            _employeeService = employeeService;
            _departmentService = departmentService;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<Employee>>> GetAllEmployees()
        {
            var employees = await _employeeService.GetAllEmployeesAsync();
            return Ok(employees);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult<Employee>> GetEmployee(string id)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound();
            }
            return Ok(employee);
        }

        [HttpGet("department/{departmentId}")]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployeesByDepartment(int departmentId)
        {
            var employees = await _employeeService.GetEmployeesByDepartmentAsync(departmentId);
            return Ok(employees);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> CreateEmployee([FromBody] EmployeeCreateDto employeeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var employee = new Employee
            {
                UserName = employeeDto.Email,
                Email = employeeDto.Email,
                FirstName = employeeDto.FirstName,
                LastName = employeeDto.LastName,
                PhoneNumber = employeeDto.PhoneNumber,
                DateOfBirth = employeeDto.DateOfBirth,
                DepartmentId = employeeDto.DepartmentId,
                Role = employeeDto.Role,
                Status = UserStatus.Active
            };

            var result = await _employeeService.CreateEmployeeAsync(employee, employeeDto.Password);
            if (!result)
            {
                return BadRequest("Failed to create employee");
            }

            return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employee);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> UpdateEmployee(string id, [FromBody] EmployeeUpdateDto employeeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingEmployee = await _employeeService.GetEmployeeByIdAsync(id);
            if (existingEmployee == null)
            {
                return NotFound();
            }

            existingEmployee.FirstName = employeeDto.FirstName;
            existingEmployee.LastName = employeeDto.LastName;
            existingEmployee.Email = employeeDto.Email;
            existingEmployee.PhoneNumber = employeeDto.PhoneNumber;
            existingEmployee.DateOfBirth = employeeDto.DateOfBirth;
            existingEmployee.DepartmentId = employeeDto.DepartmentId;
            existingEmployee.Role = employeeDto.Role;

            var result = await _employeeService.UpdateEmployeeAsync(id, existingEmployee);
            if (!result)
            {
                return BadRequest("Failed to update employee");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> DeleteEmployee(string id)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound();
            }

            // Check if employee is a director of any department
            if (employee.Role == RoleType.DIRECTOR)
            {
                // Find departments where this employee is the director and set DirectorId to null
                await _departmentService.RemoveDirectorFromDepartmentsAsync(id);
            }

            var result = await _employeeService.DeleteEmployeeAsync(id);
            if (!result)
            {
                return BadRequest("Failed to delete employee");
            }

            return NoContent();
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "ADMIN,SUPER_ADMIN")]
        public async Task<ActionResult> ChangeEmployeeStatus(string id, [FromBody] StatusUpdateDto statusDto)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound();
            }

            var result = await _employeeService.ChangeEmployeeStatusAsync(id, statusDto.Status);
            if (!result)
            {
                return BadRequest("Failed to update employee status");
            }

            return NoContent();
        }

        [HttpPatch("{id}/department")]
        [Authorize(Roles = "ADMIN,DIRECTOR,SUPER_ADMIN")]
        public async Task<ActionResult> AssignEmployeeToDepartment(string id, [FromBody] DepartmentAssignDto departmentDto)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound();
            }

            var result = await _employeeService.AssignEmployeeToDepartmentAsync(id, departmentDto.DepartmentId);
            if (!result)
            {
                return BadRequest("Failed to assign employee to department");
            }

            return NoContent();
        }
    }


}