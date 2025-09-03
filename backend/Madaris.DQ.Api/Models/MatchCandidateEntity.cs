namespace Madaris.DQ.Api.Models;
public class MatchCandidateEntity
{
    public Guid Id { get; set; }
    public string? EntityType { get; set; } // School/Student/Parent
    public Guid SourceEntityId { get; set; }
    public Guid TargetEntityId { get; set; }
    public string? LeftSource { get; set; }
    public string? RightSource { get; set; }
    public double ConfidenceScore { get; set; }
    public string? MatchMethod { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; } // AutoAccept/Review/Reject
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
