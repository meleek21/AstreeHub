
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepository;

        public DepartmentService(IDepartmentRepository departmentRepository)
        {
            _departmentRepository = departmentRepository;
        }

        public async Task<IEnumerable<Department>> GetAllDepartmentsAsync()
        {
            return await _departmentRepository.GetAllAsync();
        }

        public async Task<Department> GetDepartmentByIdAsync(int id)
        {
            return await _departmentRepository.GetByIdAsync(id);
        }

        public async Task<Department> CreateDepartmentAsync(Department department)
        {
            return await _departmentRepository.CreateAsync(department);
        }

        public async Task<bool> UpdateDepartmentAsync(int id, Department department)
        {
            return await _departmentRepository.UpdateAsync(id, department);
        }

        public async Task<bool> DeleteDepartmentAsync(int id)
        {
            return await _departmentRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<Employee>> GetEmployeesInDepartmentAsync(int departmentId)
        {
            return await _departmentRepository.GetEmployeesInDepartmentAsync(departmentId);
        }

        public async Task<bool> AssignDirectorAsync(int departmentId, string employeeId)
        {
            return await _departmentRepository.AssignDirectorAsync(departmentId, employeeId);
        }

        public async Task<bool> RemoveDirectorFromDepartmentsAsync(string employeeId)
        {
            // Get all departments where this employee is the director
            var departments = await _departmentRepository.GetAllAsync();
            var affectedDepartments = departments.Where(d => d.DirectorId == employeeId).ToList();

            if (!affectedDepartments.Any())
            {
                return true; // No departments to update
            }

            // Update each department to remove the director
            foreach (var department in affectedDepartments)
            {
                department.DirectorId = null;
                await _departmentRepository.UpdateAsync(department.Id, department);
            }

            return true;
        }
    }
}
