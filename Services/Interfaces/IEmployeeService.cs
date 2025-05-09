
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IEmployeeService
    {
        Task<IEnumerable<Employee>> GetAllEmployeesAsync();
        Task<Employee> GetEmployeeByIdAsync(string id);
        Task<IEnumerable<Employee>> GetEmployeesByDepartmentAsync(int departmentId);
        Task<bool> CreateEmployeeAsync(Employee employee, string password);
        Task<bool> UpdateEmployeeAsync(string id, Employee employee);
        Task<bool> UpdateEmployeeRoleAsync(string employeeId, string roleName);
        Task<bool> DeleteEmployeeAsync(string id);
        Task<bool> ChangeEmployeeStatusAsync(string id, UserStatus status);
        Task<bool> AssignEmployeeToDepartmentAsync(string employeeId, int departmentId);
        Task<UserInfoDTO> GetUserInfoAsync(string id);
        Task<List<UserInfoDTO>> GetUserInfoBatchAsync(List<string> userIds);
        Task<IEnumerable<Employee>> GetEmployeesByBirthMonthAsync(int month);
        Task<IEnumerable<Employee>> GetEmployeesByBirthDateAsync(DateTime date);
    }
}
