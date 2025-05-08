using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<Department>> GetAllDepartmentsAsync();
        Task<Department> GetDepartmentByIdAsync(int id);
        Task<Department> CreateDepartmentAsync(Department department);
        Task<bool> UpdateDepartmentAsync(int id, Department department);
        Task<bool> DeleteDepartmentAsync(int id);
        Task<IEnumerable<Employee>> GetEmployeesInDepartmentAsync(int departmentId);
        Task<bool> AssignDirectorAsync(int departmentId, string employeeId);
        Task<bool> RemoveDirectorFromDepartmentsAsync(string employeeId);
    }
}
