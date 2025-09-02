using Microsoft.AspNetCore.Http;
namespace Madaris.DQ.Api.Services;
public interface IPipelineService
{
    Task<PipelineResult> RunAsync(IFormFile tarkheesLicense, IFormFile noorRoster, IFormFile madarisSchools, string uploadedBy);
    Task<string> GetExportPathAsync(Guid jobId, string exportName); // e.g., students_master.xlsx
}

public record PipelineResult(Guid JobId, int SchoolsMatched, int StudentsPrepared, int ParentsPrepared, int Exceptions);
