using Madaris.DQ.Api.Data;
namespace Madaris.DQ.Api.Services;
public class InjectionService : IInjectionService
{
    private readonly AppDbContext _db;
    public InjectionService(AppDbContext db) { _db = db; }

    public async Task<object> PreviewImpactAsync(Guid batchId)
    {
        await Task.CompletedTask;
        return new { batchId, toCreate = 0, toUpdate = 0, toDelete = 0 };
    }

    public async Task<object> InjectAsync(Guid batchId, bool simulate = true)
    {
        await Task.CompletedTask;
        return new { batchId, simulate, injected = true };
    }
}