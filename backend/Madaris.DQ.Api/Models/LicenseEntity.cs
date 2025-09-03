namespace Madaris.DQ.Api.Models;
public class LicenseEntity
{
    public Guid Id { get; set; }
    public string? UnifiedCRNumber { get; set; }
    public string? MinistrySchoolId { get; set; }
    public string? LicenseNumber { get; set; }
    public string? LicenseStatus { get; set; }
    public string? LicenseType { get; set; }
    public string? InstitutionName { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
