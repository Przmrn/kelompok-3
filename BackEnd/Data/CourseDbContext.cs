using BackEnd.Models;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Data
{
    public class CourseDbContext : DbContext
    {
        public CourseDbContext(DbContextOptions<CourseDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Registration> Registrations { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Instructor> Instructors { get; set; }
        public DbSet<InstallmentSchedule> InstallmentSchedules { get; set; }
        public DbSet<CourseCategory> CourseCategories { get; set; }
        public DbSet<CourseBatch> CourseBatches { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<BatchInstructor> BatchInstructors { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // Relasi one-to-one
            modelBuilder.Entity<Student>()
                .HasOne(s => s.User)
                .WithOne(u => u.Student)
                .HasForeignKey<Student>(s => s.UserId);

            modelBuilder.Entity<Instructor>()
                .HasOne(i => i.User)
                .WithOne(u => u.Instructor)
                .HasForeignKey<Instructor>(i => i.UserId);

            // Relasi one-to-many
            modelBuilder.Entity<Registration>()
                .HasOne(r => r.Student)
                .WithMany(s => s.Registrations)
                .HasForeignKey(r => r.StudentId);

            modelBuilder.Entity<Registration>()
                .HasOne(r => r.CourseBatch)
                .WithMany(cb => cb.Registrations)
                .HasForeignKey(r => r.BatchId);

            modelBuilder.Entity<InstallmentSchedule>()
                .HasOne(i => i.Registration)
                .WithMany(r => r.InstallmentSchedules)
                .HasForeignKey(i => i.RegistrationId);

            modelBuilder.Entity<CourseBatch>()
                .HasOne(cb => cb.Course)
                .WithMany(c => c.CourseBatches)
                .HasForeignKey(cb => cb.CourseId);

            modelBuilder.Entity<CourseBatch>()
                .HasOne(cb => cb.Location)
                .WithMany(l => l.CourseBatches)
                .HasForeignKey(cb => cb.LocationId);

            modelBuilder.Entity<Course>()
                .HasOne(c => c.CourseCategory)
                .WithMany(cc => cc.Courses)
                .HasForeignKey(c => c.CategoryId);

            modelBuilder.Entity<BatchInstructor>()
                .HasOne(bi => bi.CourseBatch)
                .WithMany(cb => cb.BatchInstructors)
                .HasForeignKey(bi => bi.BatchId);

            modelBuilder.Entity<BatchInstructor>()
                .HasOne(bi => bi.Instructor)
                .WithMany(i => i.BatchInstructors)
                .HasForeignKey(bi => bi.InstructorId);
        }
    }
}
