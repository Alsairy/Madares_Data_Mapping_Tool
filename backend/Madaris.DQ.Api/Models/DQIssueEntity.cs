namespace Madaris.DQ.Api.Models;
public class DQIssueEntity
{
    public Guid Id { get; set; }
    public Guid EntityId { get; set; }
    public string? EntityType { get; set; }
    public string? IssueType { get; set; }
    public string? Description { get; set; }
    public string? Severity { get; set; }
    public string? Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public string? Resolution { get; set; }
}
