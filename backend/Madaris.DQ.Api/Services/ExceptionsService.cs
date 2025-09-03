using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Madaris.DQ.Api.Services;
public class ExceptionsService : IExceptionsService
{
    private readonly AppDbContext _db;
    public ExceptionsService(AppDbContext db) { _db = db; }

    public async Task<object> GetQueueAsync(string? entityType = null, int page = 1, int pageSize = 50)
    {
        var query = _db.DQIssues.AsQueryable();

        if (!string.IsNullOrEmpty(entityType))
        {
            query = query.Where(i => i.EntityType == entityType);
        }

        query = query.Where(i => i.Status == "Open")
                    .OrderByDescending(i => i.Severity == "High" ? 3 : i.Severity == "Medium" ? 2 : 1)
                    .ThenByDescending(i => i.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize)
                              .Take(pageSize)
                              .Select(i => new
                              {
                                  i.Id,
                                  i.EntityId,
                                  i.EntityType,
                                  i.IssueType,
                                  i.Description,
                                  i.Severity,
                                  i.Status,
                                  i.CreatedAt,
                                  i.ResolvedAt,
                                  i.ResolvedBy,
                                  i.Resolution,
                                  EntityDetails = GetEntityDetails(i.EntityId, i.EntityType)
                              })
                              .ToListAsync();

        return new { items, total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) };
    }

    public async Task ResolveAsync(Guid issueId, bool resolved)
    {
        var issue = await _db.DQIssues.FirstOrDefaultAsync(i => i.Id == issueId);
        if (issue == null) throw new ArgumentException("Issue not found");

        issue.Status = resolved ? "Resolved" : "Dismissed";
        issue.ResolvedAt = DateTime.UtcNow;
        issue.ResolvedBy = "system";

        await _db.SaveChangesAsync();
    }

    public async Task<object> ResolveWithActionAsync(Guid issueId, string action, string? resolution = null)
    {
        var issue = await _db.DQIssues.FirstOrDefaultAsync(i => i.Id == issueId);
        if (issue == null) throw new ArgumentException("Issue not found");

        switch (action.ToLower())
        {
            case "accept":
                issue.Status = "Resolved";
                issue.Resolution = resolution ?? "Accepted as valid";
                break;
            case "correct":
                issue.Status = "Resolved";
                issue.Resolution = resolution ?? "Data corrected";
                await ApplyDataCorrectionAsync(issue, resolution);
                break;
            case "ignore":
                issue.Status = "Dismissed";
                issue.Resolution = resolution ?? "Ignored as acceptable";
                break;
            default:
                throw new ArgumentException("Invalid action. Use: accept, correct, or ignore");
        }

        issue.ResolvedAt = DateTime.UtcNow;
        issue.ResolvedBy = "steward";

        await _db.SaveChangesAsync();

        return new { issueId, action, status = issue.Status, resolvedAt = issue.ResolvedAt };
    }

    public async Task<object> GetIssueDetailsAsync(Guid issueId)
    {
        var issue = await _db.DQIssues.FirstOrDefaultAsync(i => i.Id == issueId);
        if (issue == null) throw new ArgumentException("Issue not found");

        var entityDetails = await GetEntityDetailsAsync(issue.EntityId, issue.EntityType);
        var relatedIssues = await _db.DQIssues
            .Where(i => i.EntityId == issue.EntityId && i.Id != issue.Id)
            .Select(i => new { i.Id, i.IssueType, i.Description, i.Status })
            .ToListAsync();

        return new
        {
            issue.Id,
            issue.EntityId,
            issue.EntityType,
            issue.IssueType,
            issue.Description,
            issue.Severity,
            issue.Status,
            issue.CreatedAt,
            issue.ResolvedAt,
            issue.ResolvedBy,
            issue.Resolution,
            entityDetails,
            relatedIssues
        };
    }

    public async Task<object> GetStatisticsAsync()
    {
        var totalIssues = await _db.DQIssues.CountAsync();
        var openIssues = await _db.DQIssues.CountAsync(i => i.Status == "Open");
        var resolvedIssues = await _db.DQIssues.CountAsync(i => i.Status == "Resolved");
        var dismissedIssues = await _db.DQIssues.CountAsync(i => i.Status == "Dismissed");

        var issuesByType = await _db.DQIssues
            .GroupBy(i => i.IssueType)
            .Select(g => new { IssueType = g.Key, Count = g.Count() })
            .ToListAsync();

        var issuesBySeverity = await _db.DQIssues
            .GroupBy(i => i.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync();

        var issuesByEntity = await _db.DQIssues
            .GroupBy(i => i.EntityType)
            .Select(g => new { EntityType = g.Key, Count = g.Count() })
            .ToListAsync();

        var resolutionRate = totalIssues > 0 ? (double)(resolvedIssues + dismissedIssues) / totalIssues : 0.0;

        return new
        {
            totalIssues,
            openIssues,
            resolvedIssues,
            dismissedIssues,
            resolutionRate,
            issuesByType,
            issuesBySeverity,
            issuesByEntity
        };
    }

    private object GetEntityDetails(Guid entityId, string entityType)
    {
        return entityType switch
        {
            "School" => _db.Schools.Where(s => s.Id == entityId)
                .Select(s => new { s.NameAr, s.CR, s.Region, s.City })
                .FirstOrDefault(),
            "Student" => _db.Students.Where(s => s.Id == entityId)
                .Select(s => new { s.FullNameAr, s.NationalId, s.DOB })
                .FirstOrDefault(),
            "Parent" => _db.Parents.Where(p => p.Id == entityId)
                .Select(p => new { p.FullNameAr, p.NationalId, p.PhonesCsv })
                .FirstOrDefault(),
            _ => null
        };
    }

    private async Task<object?> GetEntityDetailsAsync(Guid entityId, string entityType)
    {
        return entityType switch
        {
            "School" => await _db.Schools.Where(s => s.Id == entityId)
                .Select(s => new { s.NameAr, s.NameEn, s.CR, s.Region, s.City, s.District, s.Status })
                .FirstOrDefaultAsync(),
            "Student" => await _db.Students.Where(s => s.Id == entityId)
                .Select(s => new { s.FullNameAr, s.FullNameEn, s.NationalId, s.DOB, s.Gender, s.PhonesCsv, s.EmailsCsv })
                .FirstOrDefaultAsync(),
            "Parent" => await _db.Parents.Where(p => p.Id == entityId)
                .Select(p => new { p.FullNameAr, p.FullNameEn, p.NationalId, p.PhonesCsv, p.EmailsCsv, p.Address })
                .FirstOrDefaultAsync(),
            _ => null
        };
    }

    private async Task ApplyDataCorrectionAsync(DQIssueEntity issue, string? correction)
    {
        if (string.IsNullOrEmpty(correction)) return;

        switch (issue.EntityType)
        {
            case "Student":
                var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == issue.EntityId);
                if (student != null)
                {
                    ApplyStudentCorrection(student, issue.IssueType, correction);
                }
                break;
            case "Parent":
                var parent = await _db.Parents.FirstOrDefaultAsync(p => p.Id == issue.EntityId);
                if (parent != null)
                {
                    ApplyParentCorrection(parent, issue.IssueType, correction);
                }
                break;
            case "School":
                var school = await _db.Schools.FirstOrDefaultAsync(s => s.Id == issue.EntityId);
                if (school != null)
                {
                    ApplySchoolCorrection(school, issue.IssueType, correction);
                }
                break;
        }
    }

    private void ApplyStudentCorrection(StudentEntity student, string issueType, string correction)
    {
        switch (issueType)
        {
            case "InvalidNationalId":
                student.NationalId = correction;
                break;
            case "InvalidDOB":
                if (DateTime.TryParse(correction, out var dob))
                    student.DOB = dob;
                break;
        }
    }

    private void ApplyParentCorrection(ParentEntity parent, string issueType, string correction)
    {
        switch (issueType)
        {
            case "InvalidNationalId":
                parent.NationalId = correction;
                break;
        }
    }

    private void ApplySchoolCorrection(SchoolEntity school, string issueType, string correction)
    {
        switch (issueType)
        {
            case "NoMatch":
                if (correction.StartsWith("CR:"))
                    school.CR = correction.Substring(3);
                break;
        }
    }
}
