namespace Madaris.DQ.Api.Models;
public class MatchCandidateEntity
{
    public Guid Id { get; set; }
    public string? EntityType { get; set; } // School/Student/Parent
    public Guid? LeftRefId { get; set; }
    public Guid? RightRefId { get; set; }
    public string? LeftSource { get; set; }
    public string? RightSource { get; set; }
    public double Score { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; } // AutoAccept/Review/Reject
}