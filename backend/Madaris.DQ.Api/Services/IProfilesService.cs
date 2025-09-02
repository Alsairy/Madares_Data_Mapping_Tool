namespace Madaris.DQ.Api.Services;
public interface IProfilesService
{
    Task<object> GetBatchProfileAsync(Guid batchId);
}