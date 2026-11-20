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

            modelBuilder.Entity<BatchInstructor>()
                .HasIndex(bi => new { bi.BatchId, bi.InstructorId })
                .IsUnique();

            modelBuilder.Entity<InstallmentSchedule>()
                .HasIndex(i => new { i.RegistrationId, i.InstallmentNumber })
                .IsUnique();

            modelBuilder.Entity<Registration>()
                .HasIndex(r => new { r.StudentId, r.BatchId });

            modelBuilder.Entity<Registration>()
                .HasIndex(r => new { r.BatchId, r.QueueNumber })
                .IsUnique();

            modelBuilder.Entity<Registration>()
                .HasIndex(r => r.RegistrationNumber)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Registration>()
                .Property(r => r.RegistrationStatus)
                .HasConversion<string>();

            modelBuilder.Entity<Registration>()
                .Property(r => r.PaymentStatus)
                .HasConversion<string>();

            modelBuilder.Entity<Registration>()
                .Property(r => r.PaymentMethod)
                .HasConversion<string>();

            modelBuilder.Entity<InstallmentSchedule>()
                .Property(i => i.InstallmentStatus)
                .HasConversion<string>();

            modelBuilder.Entity<CourseBatch>()
                .Property(cb => cb.CourseStatus)
                .HasConversion<string>();

            modelBuilder.Entity<Student>()
                .HasOne(s => s.User)
                .WithOne(u => u.Student)
                .HasForeignKey<Student>(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Instructor>()
                .HasOne(i => i.User)
                .WithOne(u => u.Instructor)
                .HasForeignKey<Instructor>(i => i.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Registration>()
                .HasOne(r => r.Student)
                .WithMany(s => s.Registrations)
                .HasForeignKey(r => r.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Registration>()
                .HasOne(r => r.Batch)
                .WithMany(cb => cb.Registrations)
                .HasForeignKey(r => r.BatchId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InstallmentSchedule>()
                .HasOne(i => i.Registration)
                .WithMany(r => r.InstallmentSchedules)
                .HasForeignKey(i => i.RegistrationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CourseBatch>()
                .HasOne(cb => cb.Course)
                .WithMany(c => c.CourseBatches)
                .HasForeignKey(cb => cb.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CourseBatch>()
                .HasOne(cb => cb.Location)
                .WithMany(l => l.CourseBatches)
                .HasForeignKey(cb => cb.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Course>()
                .HasOne(c => c.CourseCategory)
                .WithMany(cc => cc.Courses)
                .HasForeignKey(c => c.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BatchInstructor>()
                .HasOne(bi => bi.CourseBatch)
                .WithMany(cb => cb.BatchInstructors)
                .HasForeignKey(bi => bi.BatchId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BatchInstructor>()
                .HasOne(bi => bi.Instructor)
                .WithMany(i => i.BatchInstructors)
                .HasForeignKey(bi => bi.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
