namespace Madaris.DQ.Api.Services;
public interface IMatchingService
{
    Task<Guid> RunMatchingAsync(Guid batchId);
}