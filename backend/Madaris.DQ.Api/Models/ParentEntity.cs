namespace Madaris.DQ.Api.Models;
public class ParentEntity
{
    public Guid Id { get; set; }
    public string? MasterParentId { get; set; }
    public string? MinistryParentId { get; set; }
    public string? NationalId { get; set; }
    public string? FullNameAr { get; set; }
    public string? FullNameEn { get; set; }
    public string? PhonesCsv { get; set; }
    public string? EmailsCsv { get; set; }
    public string? Address { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}