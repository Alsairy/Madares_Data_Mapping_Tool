using Microsoft.AspNetCore.Mvc;
using Madaris.DQ.Api.Services;

namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/pipeline")]
public class PipelineController : ControllerBase
{
    private readonly IPipelineService _pipeline;
    public PipelineController(IPipelineService pipeline) => _pipeline = pipeline;

    [HttpPost("run")]
    public async Task<IActionResult> Run([FromForm] IFormFile licenseFile, [FromForm] IFormFile noorRosterFile, [FromForm] IFormFile madarisSchoolsFile, [FromQuery] string uploadedBy = "system")
    {
        if (licenseFile == null || noorRosterFile == null || madarisSchoolsFile == null)
            return BadRequest("Please upload licenseFile, noorRosterFile, and madarisSchoolsFile.");
        var result = await _pipeline.RunAsync(licenseFile, noorRosterFile, madarisSchoolsFile, uploadedBy);
        return Ok(result);
    }

    [HttpGet("{jobId}/download/{name}")]
    public async Task<IActionResult> Download([FromRoute] Guid jobId, [FromRoute] string name)
    {
        var path = await _pipeline.GetExportPathAsync(jobId, name);
        var contentType = name.EndsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv";
        var stream = System.IO.File.OpenRead(path);
        return File(stream, contentType, name);
    }
}
