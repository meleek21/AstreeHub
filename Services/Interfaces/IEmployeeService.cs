using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IEmployeeService
    {
        Task<IEnumerable<Employee>> GetAllEmployeesAsync();
        Task<Employee> GetEmployeeByIdAsync(string id);
        Task<IEnumerable<Employee>> GetEmployeesByDepartmentAsync(int departmentId);
        Task<bool> CreateEmployeeAsync(Employee employee, string password);
        Task<bool> UpdateEmployeeAsync(string id, Employee employee);
        Task<bool> DeleteEmployeeAsync(string id);
        Task<bool> ChangeEmployeeStatusAsync(string id, UserStatus status);
        Task<bool> AssignEmployeeToDepartmentAsync(string employeeId, int departmentId);
    }
}