using Madaris.DQ.Api.Data;
namespace Madaris.DQ.Api.Services;
public class ExceptionsService : IExceptionsService
{
    private readonly AppDbContext _db;
    public ExceptionsService(AppDbContext db) { _db = db; }

    public async Task<object> GetQueueAsync(string? entityType = null, int page = 1, int pageSize = 50)
    {
        await Task.CompletedTask;
        return new { items = Array.Empty<object>(), total = 0, page, pageSize };
    }

    public async Task ResolveAsync(Guid issueId, bool resolved)
    {
        await Task.CompletedTask;
    }
}