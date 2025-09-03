namespace Madaris.DQ.Api.Models;
public class StudentEntity
{
    public Guid Id { get; set; }
    public string? MasterStudentId { get; set; }
    public string? MinistryStudentId { get; set; }
    public string? NationalId { get; set; }
    public string? FullNameAr { get; set; }
    public string? FullNameEn { get; set; }
    public DateTime? DOB { get; set; }
    public string? Gender { get; set; }
    public string? Nationality { get; set; }
    public string? PhonesCsv { get; set; }
    public string? EmailsCsv { get; set; }
    public string? Address { get; set; }
    public Guid? CurrentSchoolRefId { get; set; }
    public Guid? SchoolId { get; set; }
    public SchoolEntity? CurrentSchool { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
