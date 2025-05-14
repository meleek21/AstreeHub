using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly IDepartmentService _departmentService;
        private readonly ICloudinaryService _cloudinaryService;

        public EmployeeController(
            IEmployeeService employeeService,
            IDepartmentService departmentService,
            ICloudinaryService cloudinaryService
        )
        {
            _employeeService = employeeService;
            _departmentService = departmentService;
            _cloudinaryService = cloudinaryService;
        }

        [HttpGet("user-info/{id}")]
        [Authorize]
        public async Task<ActionResult<UserInfoDTO>> GetUserInfo(string id)
        {
            var userInfo = await _employeeService.GetUserInfoAsync(id);
            if (userInfo == null)
            {
                return NotFound(new { message = "Employee not found" });
            }
            Console.WriteLine("user info: {0}", userInfo);
            return userInfo;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<EmployeeResponseDto>>> GetAllEmployees()
        {
            var employees = await _employeeService.GetAllEmployeesAsync();
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
                    ProfilePictureUrl = e.ProfilePictureUrl,
                })
                .ToList();

            return employeeDtos;
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<EmployeeResponseDto>> GetEmployee(string id)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }

            var employeeDto = new EmployeeResponseDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                DateOfBirth = employee.DateOfBirth,
                Role = employee.Role,
                Status = employee.Status,
                Email = employee.Email,
                PasswordHash = employee.PasswordHash,
                DepartmentId = employee.DepartmentId,
                PhoneNumber = employee.PhoneNumber,
            };

            return employeeDto;
        }

        [HttpGet("department/{departmentId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<EmployeeResponseDto>>> GetEmployeesByDepartment(
            int departmentId
        )
        {
            var employees = await _employeeService.GetEmployeesByDepartmentAsync(departmentId);
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

        [HttpPost("create")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult> CreateEmployee([FromBody] EmployeeCreateDto employeeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Generate default password: Capitalized first name + '@' + departmentId
            var capitalizedFirstName = employeeDto.FirstName.Length > 0 ? char.ToUpper(employeeDto.FirstName[0]) + employeeDto.FirstName.Substring(1) : string.Empty;
            var defaultPassword = $"{capitalizedFirstName}@{employeeDto.DepartmentId}";

            var employee = new Employee
            {
                UserName = employeeDto.Email ?? $"{employeeDto.FirstName.ToLower()}.{employeeDto.LastName.ToLower()}@company.com",
                Email = employeeDto.Email ?? $"{employeeDto.FirstName.ToLower()}.{employeeDto.LastName.ToLower()}@company.com",
                FirstName = employeeDto.FirstName,
                LastName = employeeDto.LastName,
                DepartmentId = employeeDto.DepartmentId,
                Role = employeeDto.Role,
                Status = UserStatus.Active,
            };

            var result = await _employeeService.CreateEmployeeAsync(employee, defaultPassword);
            if (!result)
            {
                return BadRequest("Failed to create employee");
            }

            return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employee);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult> UpdateEmployee(
            string id,
            [FromForm] EmployeeUpdateDto employeeDto
        )
        {
            if (!ModelState.IsValid)
            {
                // Log the validation errors
                var errors = ModelState
                    .Values.SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                Console.WriteLine("Validation Errors: " + string.Join(", ", errors));
                return BadRequest(ModelState);
            }

            var existingEmployee = await _employeeService.GetEmployeeByIdAsync(id);
            if (existingEmployee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }

            bool isUpdated = false;

            // Update only the fields that are provided
            if (employeeDto.FirstName != null)
            {
                existingEmployee.FirstName = employeeDto.FirstName;
                isUpdated = true;
            }
            if (employeeDto.LastName != null)
            {
                existingEmployee.LastName = employeeDto.LastName;
                isUpdated = true;
            }
            if (employeeDto.Email != null)
            {
                existingEmployee.Email = employeeDto.Email;
                isUpdated = true;
            }
            if (employeeDto.PhoneNumber != null)
            {
                existingEmployee.PhoneNumber = employeeDto.PhoneNumber;
                isUpdated = true;
            }
            if (employeeDto.DateOfBirth.HasValue)
            {
                existingEmployee.DateOfBirth = employeeDto.DateOfBirth.Value;
                isUpdated = true;
            }
            if (employeeDto.DepartmentId.HasValue)
            {
                existingEmployee.DepartmentId = employeeDto.DepartmentId.Value;
                isUpdated = true;
            }
            if (employeeDto.Role != null)
            {
                existingEmployee.Role = employeeDto.Role.Value;
                isUpdated = true;
            }

            // Handle profile picture update if a file is provided
            if (employeeDto.File != null)
            {
                // Upload the file to Cloudinary
                var uploadResult = await _cloudinaryService.UploadImageAsync(employeeDto.File);
                if (uploadResult == null)
                {
                    return StatusCode(500, "Failed to upload profile picture.");
                }

                // Update the profile picture URL
                existingEmployee.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
                isUpdated = true;
            }

            if (!isUpdated)
            {
                return BadRequest("No fields were updated.");
            }

            // Save the updated employee to the database
            var result = await _employeeService.UpdateEmployeeAsync(id, existingEmployee);
            if (!result)
            {
                return BadRequest("Failed to update employee");
            }

            return NoContent();
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult> DeleteEmployee(string id)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found" });
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
        [Authorize(Roles = "SUPERADMIN")]
        public async Task<ActionResult> ChangeEmployeeStatus(
            string id,
            [FromBody] StatusUpdateDto statusDto
        )
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }

            var result = await _employeeService.ChangeEmployeeStatusAsync(id, statusDto.Status);
            if (!result)
            {
                return BadRequest("Failed to update employee status");
            }

            return NoContent();
        }

        [HttpPatch("assign/{id}/department")]
        [Authorize]
        public async Task<ActionResult> AssignEmployeeToDepartment(
            string id,
            [FromBody] DepartmentAssignDto departmentDto
        )
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }

            var result = await _employeeService.AssignEmployeeToDepartmentAsync(
                id,
                departmentDto.DepartmentId
            );
            if (!result)
            {
                return BadRequest("Failed to assign employee to department");
            }

            return NoContent();
        }

        [HttpPost("{id}/profile-picture")]
        [Authorize]
        public async Task<ActionResult> UploadProfilePicture(string id, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }

            try
            {
                var uploadResult = await _cloudinaryService.UploadImageAsync(file);
                employee.ProfilePictureUrl = uploadResult.SecureUrl.ToString();

                var result = await _employeeService.UpdateEmployeeAsync(id, employee);
                if (!result)
                {
                    return BadRequest("Failed to update employee profile picture");
                }

                return Ok(new { profilePictureUrl = employee.ProfilePictureUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
            return Ok(new { profilePictureUrl = employee.ProfilePictureUrl });
        }
    }
}
