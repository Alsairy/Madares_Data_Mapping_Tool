namespace Madaris.DQ.Api.Models;
public class SchoolEntity
{
    public Guid Id { get; set; }
    public string? MasterSchoolId { get; set; }
    public string? MadarisSchoolId { get; set; }
    public string? MinistrySchoolId { get; set; }
    public string? CR { get; set; }
    public string? LicenseNumber { get; set; }
    public string? NameAr { get; set; }
    public string? NameEn { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? StagesCsv { get; set; }
    public string? Status { get; set; }
    public DateTime? LicenseIssueDate { get; set; }
    public DateTime? LicenseExpiryDate { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}