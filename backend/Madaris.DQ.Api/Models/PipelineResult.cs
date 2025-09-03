namespace Madaris.DQ.Api.Models;

public class PipelineResult
{
    public Guid JobId { get; set; }
    public int SchoolsMatched { get; set; }
    public int StudentsPrepared { get; set; }
    public int ParentsPrepared { get; set; }
    public int Exceptions { get; set; }
    public double OverallDqScore { get; set; }
    public DateTime CompletedAt { get; set; }
    public string Status { get; set; } = "Completed";
    
    public PipelineResult(Guid jobId, int schoolsMatched, int studentsPrepared, int parentsPrepared, int exceptions)
    {
        JobId = jobId;
        SchoolsMatched = schoolsMatched;
        StudentsPrepared = studentsPrepared;
        ParentsPrepared = parentsPrepared;
        Exceptions = exceptions;
        CompletedAt = DateTime.UtcNow;
        OverallDqScore = 0.0;
    }
}
