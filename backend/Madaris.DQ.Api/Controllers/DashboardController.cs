using Microsoft.AspNetCore.Mvc;
using Madaris.DQ.Api.Services;
using Madaris.DQ.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IProfilesService _profiles;
    private readonly IExceptionsService _exceptions;
    private readonly AppDbContext _db;

    public DashboardController(IProfilesService profiles, IExceptionsService exceptions, AppDbContext db)
    {
        _profiles = profiles;
        _exceptions = exceptions;
        _db = db;
    }

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKPIs()
    {
        var totalSchools = await _db.Schools.CountAsync();
        var totalStudents = await _db.Students.CountAsync();
        var totalParents = await _db.Parents.CountAsync();
        var openIssues = await _db.DQIssues.CountAsync(i => i.Status == "Open");
        var resolvedIssues = await _db.DQIssues.CountAsync(i => i.Status == "Resolved");

        var schoolsWithLicense = await _db.Schools.CountAsync(s => !string.IsNullOrEmpty(s.LicenseNumber));
        var studentsWithValidNationalId = await _db.Students.CountAsync(s => !string.IsNullOrEmpty(s.NationalId) && s.NationalId.Length == 10);
        var parentsWithValidNationalId = await _db.Parents.CountAsync(p => !string.IsNullOrEmpty(p.NationalId) && p.NationalId.Length == 10);

        return Ok(new
        {
            schoolMatchRate = totalSchools > 0 ? (double)schoolsWithLicense / totalSchools : 0.0,
            studentMatchRate = totalStudents > 0 ? (double)studentsWithValidNationalId / totalStudents : 0.0,
            parentMatchRate = totalParents > 0 ? (double)parentsWithValidNationalId / totalParents : 0.0,
            dqRulePassRate = (resolvedIssues + openIssues) > 0
                ? (double)resolvedIssues / (resolvedIssues + openIssues)
                : 1.0,
            totalRecords = totalSchools + totalStudents + totalParents,
            openIssues,
            resolvedIssues
        });
    }

    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends([FromQuery]int days = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);
        
        var dailyStats = await _db.Batches
            .Where(b => b.UploadedAtUtc >= cutoffDate)
            .GroupBy(b => b.UploadedAtUtc.Date)
            .Select(g => new
            {
                date = g.Key,
                batchCount = g.Count(),
                recordsProcessed = g.Count()
            })
            .OrderBy(x => x.date)
            .ToListAsync();

        return Ok(dailyStats);
    }

    [HttpGet("regional")]
    public async Task<IActionResult> GetRegionalCoverage()
    {
        var regionalStats = await _db.Schools
            .GroupJoin(_db.Students, s => s.Id, st => st.SchoolId, (s, studs) => new
            {
                Region = s.Region ?? "Unknown",
                SchoolId = s.Id,
                StudCount = studs.Count()
            })
            .GroupBy(x => x.Region)
            .Select(g => new
            {
                region = g.Key,
                schoolCount = g.Select(x => x.SchoolId).Distinct().Count(),
                studentCount = g.Sum(x => x.StudCount)
            })
            .OrderByDescending(x => x.schoolCount)
            .ToListAsync();

        return Ok(regionalStats);
    }
}
