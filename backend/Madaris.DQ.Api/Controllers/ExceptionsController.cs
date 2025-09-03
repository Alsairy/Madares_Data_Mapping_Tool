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

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
        => Ok(await _svc.GetStatisticsAsync());

    [HttpGet("{issueId:guid}")]
    public async Task<IActionResult> GetDetails([FromRoute] Guid issueId)
    {
        try
        {
            var result = await _svc.GetIssueDetailsAsync(issueId);
            if (result == null) return NotFound(new { message = "Issue not found" });
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{issueId}/resolve")]
    public async Task<IActionResult> Resolve([FromRoute]Guid issueId, [FromQuery]bool resolved = true)
    {
        await _svc.ResolveAsync(issueId, resolved);
        return Ok(new { issueId, resolved });
    }

    [HttpPost("{issueId}/action")]
    public async Task<IActionResult> ResolveWithAction([FromRoute]Guid issueId, [FromBody]ResolveActionRequest request)
        => Ok(await _svc.ResolveWithActionAsync(issueId, request.Action, request.Resolution));
}

public class ResolveActionRequest
{
    public string Action { get; set; } = "";
    public string? Resolution { get; set; }
}
