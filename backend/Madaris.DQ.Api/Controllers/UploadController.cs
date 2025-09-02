using Microsoft.AspNetCore.Mvc;
using Madaris.DQ.Api.Services;

namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly IIngestionService _ingestion;
    public UploadController(IIngestionService ingestion) { _ingestion = ingestion; }

    [HttpPost("{source}")]
    public async Task<IActionResult> Upload([FromRoute]string source, IFormFile file, [FromQuery]string uploadedBy = "system")
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");
        var batchId = await _ingestion.IngestAsync(source, file, uploadedBy);
        return Ok(new { batchId });
    }
}