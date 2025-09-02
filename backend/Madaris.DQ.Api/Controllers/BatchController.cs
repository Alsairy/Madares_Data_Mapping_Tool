using Microsoft.AspNetCore.Mvc;
using Madaris.DQ.Api.Services;

namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/batch")]
public class BatchController : ControllerBase
{
    private readonly IProfilesService _profiles;
    private readonly IMatchingService _matching;
    private readonly IInjectionService _injection;
    public BatchController(IProfilesService profiles, IMatchingService matching, IInjectionService injection)
    {
        _profiles = profiles; _matching = matching; _injection = injection;
    }

    [HttpGet("{batchId}/profile")]
    public async Task<IActionResult> Profile([FromRoute] Guid batchId) => Ok(await _profiles.GetBatchProfileAsync(batchId));

    [HttpPost("{batchId}/match")]
    public async Task<IActionResult> Match([FromRoute] Guid batchId) => Ok(new { token = await _matching.RunMatchingAsync(batchId) });

    [HttpGet("{batchId}/impact")]
    public async Task<IActionResult> Impact([FromRoute] Guid batchId) => Ok(await _injection.PreviewImpactAsync(batchId));

    [HttpPost("{batchId}/inject")]
    public async Task<IActionResult> Inject([FromRoute] Guid batchId, [FromQuery]bool simulate = true) => Ok(await _injection.InjectAsync(batchId, simulate));
}