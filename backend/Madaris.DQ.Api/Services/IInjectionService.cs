namespace Madaris.DQ.Api.Services;
public interface IInjectionService
{
    Task<object> PreviewImpactAsync(Guid batchId);
    Task<object> InjectAsync(Guid batchId, bool simulate = true);
}