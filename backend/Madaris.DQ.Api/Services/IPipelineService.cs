using Microsoft.AspNetCore.Http;
using Madaris.DQ.Api.Models;

namespace Madaris.DQ.Api.Services;
public interface IPipelineService
{
    Task<PipelineResult> RunAsync(IFormFile tarkheesLicense, IFormFile noorRoster, IFormFile madarisSchools, string uploadedBy);
    Task<string> GetExportPathAsync(Guid jobId, string exportName); // e.g., students_master.xlsx
    Task<BatchLoadEntity?> GetBatchAsync(Guid jobId);
}
