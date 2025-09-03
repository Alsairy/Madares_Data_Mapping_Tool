using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Models;
using Madaris.DQ.Api.Utils;
using Microsoft.EntityFrameworkCore;

namespace Madaris.DQ.Api.Services;
public class MatchingService : IMatchingService
{
    private readonly AppDbContext _db;
    public MatchingService(AppDbContext db) { _db = db; }

    public async Task<Guid> RunMatchingAsync(Guid batchId)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == batchId);
        if (batch == null) throw new ArgumentException("Batch not found");

        await MatchSchoolsAsync(batchId);
        await MatchStudentsAsync(batchId);
        await MatchParentsAsync(batchId);

        batch.Status = "MatchingCompleted";
        await _db.SaveChangesAsync();

        return batchId;
    }

    private async Task MatchSchoolsAsync(Guid batchId)
    {
        var schools = await _db.Schools.Where(s => s.LastUpdated >= DateTime.UtcNow.AddHours(-1)).ToListAsync();
        var licenses = await _db.Licenses.ToListAsync();

        foreach (var school in schools)
        {
            var matchCandidates = new List<MatchCandidateEntity>();

            var exactCRMatch = licenses.FirstOrDefault(l => 
                !string.IsNullOrEmpty(l.UnifiedCRNumber) && 
                !string.IsNullOrEmpty(school.CR) && 
                l.UnifiedCRNumber.Equals(school.CR, StringComparison.OrdinalIgnoreCase));

            if (exactCRMatch != null)
            {
                matchCandidates.Add(new MatchCandidateEntity
                {
                    Id = Guid.NewGuid(),
                    EntityType = "School",
                    SourceEntityId = school.Id,
                    TargetEntityId = exactCRMatch.Id,
                    MatchMethod = "ExactCR",
                    ConfidenceScore = 0.99,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var fuzzyMatches = licenses.Where(l => 
                    !string.IsNullOrEmpty(l.InstitutionName) && 
                    !string.IsNullOrEmpty(school.NameAr))
                    .Select(l => new { 
                        License = l, 
                        Score = CalculateNameSimilarity(school.NameAr, l.InstitutionName) 
                    })
                    .Where(x => x.Score > 0.7)
                    .OrderByDescending(x => x.Score)
                    .Take(3);

                foreach (var match in fuzzyMatches)
                {
                    matchCandidates.Add(new MatchCandidateEntity
                    {
                        Id = Guid.NewGuid(),
                        EntityType = "School",
                        SourceEntityId = school.Id,
                        TargetEntityId = match.License.Id,
                        MatchMethod = "FuzzyName",
                        ConfidenceScore = match.Score,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            if (matchCandidates.Any())
            {
                _db.MatchCandidates.AddRange(matchCandidates);
                
                var bestMatch = matchCandidates.OrderByDescending(m => m.ConfidenceScore).First();
                if (bestMatch.ConfidenceScore >= 0.95)
                {
                    var license = licenses.First(l => l.Id == bestMatch.TargetEntityId);
                    school.LicenseNumber = license.LicenseNumber;
                    school.MinistrySchoolId = license.MinistrySchoolId;
                }
                else if (bestMatch.ConfidenceScore < 0.75)
                {
                    await CreateDQIssueAsync(school.Id, "School", "LowConfidenceMatch", 
                        $"Best match confidence: {bestMatch.ConfidenceScore:P}");
                }
            }
            else
            {
                await CreateDQIssueAsync(school.Id, "School", "NoMatch", "No matching license found");
            }
        }

        await _db.SaveChangesAsync();
    }

    private async Task MatchStudentsAsync(Guid batchId)
    {
        var students = await _db.Students.Where(s => s.LastUpdated >= DateTime.UtcNow.AddHours(-1)).ToListAsync();
        var existingStudents = await _db.Students.Where(s => s.LastUpdated < DateTime.UtcNow.AddHours(-1)).ToListAsync();

        foreach (var student in students)
        {
            var duplicates = existingStudents.Where(es => 
                !string.IsNullOrEmpty(es.NationalId) && 
                !string.IsNullOrEmpty(student.NationalId) && 
                es.NationalId == student.NationalId).ToList();

            if (duplicates.Any())
            {
                var bestMatch = duplicates.OrderByDescending(d => 
                    CalculateNameSimilarity(student.FullNameAr ?? "", d.FullNameAr ?? "")).First();

                await CreateDQIssueAsync(student.Id, "Student", "PotentialDuplicate", 
                    $"Potential duplicate with student ID: {bestMatch.Id}");
            }

            if (!IsValidNationalId(student.NationalId))
            {
                await CreateDQIssueAsync(student.Id, "Student", "InvalidNationalId", 
                    $"Invalid National ID format: {student.NationalId}");
            }

            if (student.DOB.HasValue && (student.DOB.Value > DateTime.Now.AddYears(-3) || student.DOB.Value < DateTime.Now.AddYears(-25)))
            {
                await CreateDQIssueAsync(student.Id, "Student", "InvalidDOB", 
                    $"Suspicious date of birth: {student.DOB:yyyy-MM-dd}");
            }
        }

        await _db.SaveChangesAsync();
    }

    private async Task MatchParentsAsync(Guid batchId)
    {
        var parents = await _db.Parents.Where(p => p.LastUpdated >= DateTime.UtcNow.AddHours(-1)).ToListAsync();
        var existingParents = await _db.Parents.Where(p => p.LastUpdated < DateTime.UtcNow.AddHours(-1)).ToListAsync();

        foreach (var parent in parents)
        {
            var duplicates = existingParents.Where(ep => 
                !string.IsNullOrEmpty(ep.NationalId) && 
                !string.IsNullOrEmpty(parent.NationalId) && 
                ep.NationalId == parent.NationalId).ToList();

            if (duplicates.Any())
            {
                var bestMatch = duplicates.OrderByDescending(d => 
                    CalculateNameSimilarity(parent.FullNameAr ?? "", d.FullNameAr ?? "")).First();

                await CreateDQIssueAsync(parent.Id, "Parent", "PotentialDuplicate", 
                    $"Potential duplicate with parent ID: {bestMatch.Id}");
            }

            if (!IsValidNationalId(parent.NationalId))
            {
                await CreateDQIssueAsync(parent.Id, "Parent", "InvalidNationalId", 
                    $"Invalid National ID format: {parent.NationalId}");
            }
        }

        await _db.SaveChangesAsync();
    }

    private double CalculateNameSimilarity(string name1, string name2)
    {
        if (string.IsNullOrEmpty(name1) || string.IsNullOrEmpty(name2)) return 0.0;

        var normalized1 = ArabicNormalizer.Normalize(name1);
        var normalized2 = ArabicNormalizer.Normalize(name2);

        return CalculateLevenshteinSimilarity(normalized1, normalized2);
    }

    private double CalculateLevenshteinSimilarity(string s1, string s2)
    {
        if (s1 == s2) return 1.0;
        if (string.IsNullOrEmpty(s1) || string.IsNullOrEmpty(s2)) return 0.0;

        var distance = LevenshteinDistance(s1, s2);
        var maxLength = Math.Max(s1.Length, s2.Length);
        return 1.0 - (double)distance / maxLength;
    }

    private int LevenshteinDistance(string s1, string s2)
    {
        var matrix = new int[s1.Length + 1, s2.Length + 1];

        for (int i = 0; i <= s1.Length; i++) matrix[i, 0] = i;
        for (int j = 0; j <= s2.Length; j++) matrix[0, j] = j;

        for (int i = 1; i <= s1.Length; i++)
        {
            for (int j = 1; j <= s2.Length; j++)
            {
                var cost = s1[i - 1] == s2[j - 1] ? 0 : 1;
                matrix[i, j] = Math.Min(Math.Min(
                    matrix[i - 1, j] + 1,
                    matrix[i, j - 1] + 1),
                    matrix[i - 1, j - 1] + cost);
            }
        }

        return matrix[s1.Length, s2.Length];
    }

    private bool IsValidNationalId(string? nationalId)
    {
        if (string.IsNullOrEmpty(nationalId)) return false;
        return nationalId.Length == 10 && nationalId.All(char.IsDigit);
    }

    private async Task CreateDQIssueAsync(Guid entityId, string entityType, string issueType, string description)
    {
        var issue = new DQIssueEntity
        {
            Id = Guid.NewGuid(),
            EntityId = entityId,
            EntityType = entityType,
            IssueType = issueType,
            Description = description,
            Severity = issueType.Contains("Invalid") ? "High" : "Medium",
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };

        _db.DQIssues.Add(issue);
    }
}
