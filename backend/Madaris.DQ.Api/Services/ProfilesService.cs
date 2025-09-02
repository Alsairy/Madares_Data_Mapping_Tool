using Madaris.DQ.Api.Data;
namespace Madaris.DQ.Api.Services;
public class ProfilesService : IProfilesService
{
    private readonly AppDbContext _db;
    public ProfilesService(AppDbContext db) { _db = db; }

    public async Task<object> GetBatchProfileAsync(Guid batchId)
    {
        // TODO: return counts, null rates, top values; stub:
        await Task.CompletedTask;
        return new { batchId, columnsProfiled = 0, dqScore = 0.0 };
    }
}