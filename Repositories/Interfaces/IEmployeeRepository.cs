using ASTREE_PFE.Models;
using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public interface IEmployeeRepository
    {
        Task<IEnumerable<Employee>> GetAllAsync();
        Task<Employee> GetByIdAsync(string id);
        Task<IEnumerable<Employee>> GetByDepartmentAsync(int departmentId);
        Task<bool> CreateAsync(Employee employee, string password);
        Task<bool> UpdateAsync(string id, Employee employee);
        Task<bool> DeleteAsync(string id);
        Task<bool> ChangeStatusAsync(string id, UserStatus status);
        Task<bool> AssignToDepartmentAsync(string employeeId, int departmentId);
    }
}