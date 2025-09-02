namespace Madaris.DQ.Api.Models;
public class LicenseEntity
{
    public Guid Id { get; set; }
    public Guid SchoolRefId { get; set; }
    public string? LicenseNumber { get; set; }
    public string? LicenseStatus { get; set; }
    public string? LicenseType { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}