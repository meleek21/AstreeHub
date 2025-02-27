using ASTREE_PFE.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ASTREE_PFE.Data
{
    public class ApplicationDbContext : IdentityDbContext<Employee>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Department> Departments { get; set; }
        // Add this line if it's not already there
        public DbSet<Employee> Employees { get; set; }
        
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            
            // Configure Department-Employee relationship
            builder.Entity<Department>()
                .HasOne(d => d.Director)
                .WithMany()  // Remove the .Members reference
                .HasForeignKey(d => d.DirectorId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Configure Employee-Department relationship
            // In the OnModelCreating method:
            builder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)  // Use the Employees navigation property
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
