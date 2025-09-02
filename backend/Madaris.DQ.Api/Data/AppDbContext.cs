using Microsoft.EntityFrameworkCore;
using Madaris.DQ.Api.Models;

namespace Madaris.DQ.Api.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<SchoolEntity> Schools => Set<SchoolEntity>();
    public DbSet<StudentEntity> Students => Set<StudentEntity>();
    public DbSet<ParentEntity> Parents => Set<ParentEntity>();
    public DbSet<EnrollmentEntity> Enrollments => Set<EnrollmentEntity>();
    public DbSet<LicenseEntity> Licenses => Set<LicenseEntity>();
    public DbSet<BatchLoadEntity> Batches => Set<BatchLoadEntity>();
    public DbSet<DQIssueEntity> DQIssues => Set<DQIssueEntity>();
    public DbSet<MatchCandidateEntity> MatchCandidates => Set<MatchCandidateEntity>();
    public DbSet<AuditEntryEntity> AuditEntries => Set<AuditEntryEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SchoolEntity>().HasIndex(x => x.CR);
        modelBuilder.Entity<SchoolEntity>().HasIndex(x => x.MinistrySchoolId);
        modelBuilder.Entity<StudentEntity>().HasIndex(x => x.MinistryStudentId);
        modelBuilder.Entity<StudentEntity>().HasIndex(x => x.NationalId);
        modelBuilder.Entity<ParentEntity>().HasIndex(x => x.MinistryParentId);
        modelBuilder.Entity<ParentEntity>().HasIndex(x => x.NationalId);
        base.OnModelCreating(modelBuilder);
    }
}
