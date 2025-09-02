namespace Madaris.DQ.Api.Models;
public class DQIssueEntity
{
    public Guid Id { get; set; }
    public string? EntityType { get; set; } // School/Student/Parent
    public Guid EntityId { get; set; }
    public string? RuleCode { get; set; }
    public string? Severity { get; set; } // Info/Warning/Error
    public string? Details { get; set; }
    public bool Resolved { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAtUtc { get; set; }
}