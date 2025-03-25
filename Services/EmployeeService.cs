using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Repositories.Interfaces;

namespace ASTREE_PFE.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IDepartmentRepository _departmentRepository;

        public EmployeeService(IEmployeeRepository employeeRepository, IDepartmentRepository departmentRepository)
        {
            _employeeRepository = employeeRepository;
            _departmentRepository = departmentRepository;
        }

        public async Task<IEnumerable<Employee>> GetAllEmployeesAsync()
        {
            return await _employeeRepository.GetAllAsync();
        }

        public async Task<Employee> GetEmployeeByIdAsync(string id)
        {
            return await _employeeRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Employee>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            return await _employeeRepository.GetByDepartmentAsync(departmentId);
        }

        public async Task<bool> CreateEmployeeAsync(Employee employee, string password)
        {
            return await _employeeRepository.CreateAsync(employee, password);
        }

        public async Task<bool> UpdateEmployeeAsync(string id, Employee employee)
        {
            return await _employeeRepository.UpdateAsync(id, employee);
        }

        public async Task<bool> DeleteEmployeeAsync(string id)
        {
            return await _employeeRepository.DeleteAsync(id);
        }

        public async Task<bool> ChangeEmployeeStatusAsync(string id, UserStatus status)
        {
            return await _employeeRepository.ChangeStatusAsync(id, status);
        }

        public async Task<UserInfoDTO> GetUserInfoAsync(string id)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            if (employee == null) return null;

            return new UserInfoDTO
            {
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                DateOfBirth = employee.DateOfBirth,
                Role = employee.Role,
                Status = employee.Status,
                DepartmentId = employee.DepartmentId,
                LastLoginDate = employee.LastLoginDate,
                IsFirstLogin = employee.IsFirstLogin,
                CreatedDate = employee.CreatedDate,
                ProfilePictureUrl = employee.ProfilePictureUrl ?? string.Empty,
                Department = employee.Department != null ? new DepartmentDTO
                {
                    Id = employee.Department.Id,
                    Name = employee.Department.Name,
                    Description = employee.Department.Description
                } : null
            };
        }

        public async Task<List<UserInfoDTO>> GetUserInfoBatchAsync(List<string> userIds)
        {
            return await _employeeRepository.GetUserInfoBatchAsync(userIds);
        }

        public async Task<bool> AssignEmployeeToDepartmentAsync(string employeeId, int departmentId)
        {
            return await _employeeRepository.AssignToDepartmentAsync(employeeId, departmentId);
        }
        
        public async Task<bool> UpdateEmployeeRoleAsync(string employeeId, string roleName)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
            {
                return false;
            }
            
            // Convert string role name to RoleType enum
            if (Enum.TryParse<RoleType>(roleName, out var roleType))
            {
                // If updating to Director role, handle the previous director
                if (roleType == RoleType.DIRECTOR && employee.DepartmentId.HasValue)
                {
                    var department = await _departmentRepository.GetByIdAsync(employee.DepartmentId.Value);
                    if (department?.DirectorId != null && department.DirectorId != employeeId)
                    {
                        // Get the previous director
                        var previousDirector = await _employeeRepository.GetByIdAsync(department.DirectorId);
                        if (previousDirector != null)
                        {
                            // Update previous director's role to Employee
                            previousDirector.Role = RoleType.EMPLOYEE;
                            await _employeeRepository.UpdateAsync(department.DirectorId, previousDirector);
                        }
                    }
                }
                
                employee.Role = roleType;
                return await _employeeRepository.UpdateAsync(employeeId, employee);
            }
            
            return false;
        }


    }
}