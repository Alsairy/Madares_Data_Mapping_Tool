namespace Madaris.DQ.Api.Models;
public class BatchLoadEntity
{
    public Guid Id { get; set; }
    public string? Source { get; set; } // Tarkhees/Noor/Madaris
    public string? FileName { get; set; }
    public string? FileHash { get; set; }
    public DateTime UploadedAtUtc { get; set; }
    public string? UploadedBy { get; set; }
    public string? Status { get; set; } // Staged, Profiled, Cleansed, Matched, Injected
}