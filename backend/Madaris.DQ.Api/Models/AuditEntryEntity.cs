namespace Madaris.DQ.Api.Models;
public class AuditEntryEntity
{
    public Guid Id { get; set; }
    public string? Action { get; set; } // Merge/Update/Inject
    public string? EntityType { get; set; }
    public Guid EntityId { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? User { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}