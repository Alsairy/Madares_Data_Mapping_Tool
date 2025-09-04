using Microsoft.AspNetCore.Mvc;
using Madaris.DQ.Api.Services;
using Madaris.DQ.Api.Models;

namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/pipeline")]
public class PipelineController : ControllerBase
{
    private readonly IPipelineService _pipeline;
    public PipelineController(IPipelineService pipeline) => _pipeline = pipeline;

    [HttpPost("ingest/tarkhees")]
    [Consumes("multipart/form-data")]
    [Produces("application/json")]
    public async Task<IActionResult> IngestTarkhees([FromForm] IFormFile file)
    {
        if (file == null) return BadRequest("Please upload a Tarkhees license file.");
        
        var uploadId = Guid.NewGuid();
        var tempPath = Path.Combine(Path.GetTempPath(), $"tarkhees_{uploadId}_{file.FileName}");
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        
        return Ok(new { uploadId, fileName = file.FileName, message = "Tarkhees file uploaded successfully" });
    }

    [HttpPost("ingest/noor")]
    [Consumes("multipart/form-data")]
    [Produces("application/json")]
    public async Task<IActionResult> IngestNoor([FromForm] IFormFile file)
    {
        if (file == null) return BadRequest("Please upload a Noor roster file.");
        
        var uploadId = Guid.NewGuid();
        var tempPath = Path.Combine(Path.GetTempPath(), $"noor_{uploadId}_{file.FileName}");
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        
        return Ok(new { uploadId, fileName = file.FileName, message = "Noor file uploaded successfully" });
    }

    [HttpPost("ingest/madaris")]
    [Consumes("multipart/form-data")]
    [Produces("application/json")]
    public async Task<IActionResult> IngestMadaris([FromForm] IFormFile file)
    {
        if (file == null) return BadRequest("Please upload a Madaris schools file.");
        
        var uploadId = Guid.NewGuid();
        var tempPath = Path.Combine(Path.GetTempPath(), $"madaris_{uploadId}_{file.FileName}");
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        
        return Ok(new { uploadId, fileName = file.FileName, message = "Madaris file uploaded successfully" });
    }

    [HttpPost("process")]
    public async Task<IActionResult> ProcessFiles([FromBody] ProcessFilesRequest request)
    {
        if (string.IsNullOrEmpty(request.TarkheesUploadId) || 
            string.IsNullOrEmpty(request.NoorUploadId) || 
            string.IsNullOrEmpty(request.MadarisUploadId))
            return BadRequest("All three upload IDs are required.");

        var tarkheesPath = Directory.GetFiles(Path.GetTempPath(), $"tarkhees_{request.TarkheesUploadId}_*").FirstOrDefault();
        var noorPath = Directory.GetFiles(Path.GetTempPath(), $"noor_{request.NoorUploadId}_*").FirstOrDefault();
        var madarisPath = Directory.GetFiles(Path.GetTempPath(), $"madaris_{request.MadarisUploadId}_*").FirstOrDefault();

        if (tarkheesPath == null || noorPath == null || madarisPath == null)
            return BadRequest("One or more uploaded files could not be found.");

        var tarkheesFile = CreateFormFileFromPath(tarkheesPath);
        var noorFile = CreateFormFileFromPath(noorPath);
        var madarisFile = CreateFormFileFromPath(madarisPath);

        var result = await _pipeline.RunAsync(tarkheesFile, noorFile, madarisFile, request.UploadedBy ?? "system");
        
        System.IO.File.Delete(tarkheesPath);
        System.IO.File.Delete(noorPath);
        System.IO.File.Delete(madarisPath);

        return Ok(result);
    }

    [HttpPost("run")]
    [Consumes("multipart/form-data")]
    [Produces("application/json")]
    public async Task<IActionResult> Run([FromForm] IFormFile licenseFile, [FromForm] IFormFile noorRosterFile, [FromForm] IFormFile madarisSchoolsFile, [FromQuery] string uploadedBy = "system")
    {
        if (licenseFile == null || noorRosterFile == null || madarisSchoolsFile == null)
            return BadRequest("Please upload licenseFile, noorRosterFile, and madarisSchoolsFile.");
        var result = await _pipeline.RunAsync(licenseFile, noorRosterFile, madarisSchoolsFile, uploadedBy);
        return Ok(result);
    }

    private IFormFile CreateFormFileFromPath(string filePath)
    {
        var fileName = Path.GetFileName(filePath);
        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return new FormFile(stream, 0, stream.Length, "file", fileName);
    }

    [HttpGet("{jobId}/status")]
    public async Task<IActionResult> GetStatus(Guid jobId)
    {
        var batch = await _pipeline.GetBatchAsync(jobId);
        if (batch == null) return NotFound();
        
        var result = new PipelineResult(
            jobId,
            schoolsMatched: 15,      // Mock data - would be calculated from actual results
            studentsPrepared: 450,   // Mock data - would be calculated from actual results  
            parentsPrepared: 380,    // Mock data - would be calculated from actual results
            exceptions: 12           // Mock data - would be calculated from actual results
        );
        
        result.OverallDqScore = 92.5; // Mock DQ score
        
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
