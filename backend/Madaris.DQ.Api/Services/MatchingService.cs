using Madaris.DQ.Api.Data;
namespace Madaris.DQ.Api.Services;
public class MatchingService : IMatchingService
{
    private readonly AppDbContext _db;
    public MatchingService(AppDbContext db) { _db = db; }

    public async Task<Guid> RunMatchingAsync(Guid batchId)
    {
        // TODO: implement rules (deterministic via Tarkhees bridge; fuzzy w/ Arabic normalization)
        // For now, just return batchId as a token
        await Task.CompletedTask;
        return batchId;
    }
}