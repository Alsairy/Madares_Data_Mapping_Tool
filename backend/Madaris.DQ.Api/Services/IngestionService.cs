using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Models;

namespace Madaris.DQ.Api.Services;
public class IngestionService : IIngestionService
{
    private readonly AppDbContext _db;
    public IngestionService(AppDbContext db) { _db = db; }

    public async Task<Guid> IngestAsync(string source, IFormFile file, string uploadedBy)
    {
        // NOTE: parse CSV/XLSX here; for starter kit we only register the batch and stub store
        var batch = new BatchLoadEntity {
            Id = Guid.NewGuid(),
            Source = source,
            FileName = file.FileName,
            FileHash = $"{file.Length}-{file.FileName}".GetHashCode().ToString(),
            UploadedAtUtc = DateTime.UtcNow,
            UploadedBy = uploadedBy,
            Status = "Staged"
        };
        _db.Batches.Add(batch);
        await _db.SaveChangesAsync();
        return batch.Id;
    }
}