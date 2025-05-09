
using ASTREE_PFE.Data;
using ASTREE_PFE.Models;
using Microsoft.EntityFrameworkCore;

namespace ASTREE_PFE.Repositories
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly ApplicationDbContext _context;

        public DepartmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Department>> GetAllAsync()
        {
            return await _context.Departments.Include(d => d.Director).ToListAsync();
        }

        public async Task<Department> GetByIdAsync(int id)
        {
            return await _context
                .Departments.Include(d => d.Director)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<Department> CreateAsync(Department department)
        {
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<bool> UpdateAsync(int id, Department department)
        {
            var existingDepartment = await _context.Departments.FindAsync(id);
            if (existingDepartment == null)
                return false;

            existingDepartment.Name = department.Name;
            existingDepartment.Description = department.Description;
            existingDepartment.DirectorId = department.DirectorId;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
                return false;

            // Check if there are employees in this department
            var hasEmployees = await _context.Users.AnyAsync(e => e.DepartmentId == id);
            if (hasEmployees)
                return false; // Cannot delete department with employees

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Employee>> GetEmployeesInDepartmentAsync(int departmentId)
        {
            return await _context.Users.Where(e => e.DepartmentId == departmentId).ToListAsync();
        }

        public async Task<bool> AssignDirectorAsync(int departmentId, string employeeId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null)
                return false;

            var employee = await _context.Users.FindAsync(employeeId);
            if (employee == null)
                return false;

            department.DirectorId = employeeId;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
