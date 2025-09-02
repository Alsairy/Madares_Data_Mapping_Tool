using Microsoft.AspNetCore.Mvc;
using Madaris.DQ.Api.Services;

namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/exceptions")]
public class ExceptionsController : ControllerBase
{
    private readonly IExceptionsService _svc;
    public ExceptionsController(IExceptionsService svc) { _svc = svc; }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery]string? entityType, [FromQuery]int page = 1, [FromQuery]int pageSize = 50)
        => Ok(await _svc.GetQueueAsync(entityType, page, pageSize));

    [HttpPost("{issueId}/resolve")]
    public async Task<IActionResult> Resolve([FromRoute]Guid issueId, [FromQuery]bool resolved = true)
    {
        await _svc.ResolveAsync(issueId, resolved);
        return Ok(new { issueId, resolved });
    }
}