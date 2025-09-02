namespace Madaris.DQ.Api.Services;
public interface IExceptionsService
{
    Task<object> GetQueueAsync(string? entityType = null, int page = 1, int pageSize = 50);
    Task ResolveAsync(Guid issueId, bool resolved);
}