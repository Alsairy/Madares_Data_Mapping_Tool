using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Madaris.DQ.Api.Services;
public class InjectionService : IInjectionService
{
    private readonly AppDbContext _db;
    public InjectionService(AppDbContext db) { _db = db; }

    public async Task<object> PreviewImpactAsync(Guid batchId)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == batchId);
        if (batch == null) throw new ArgumentException("Batch not found");

        var batchTime = batch.UploadedAtUtc;
        var newSchools = await _db.Schools.Where(s => s.LastUpdated >= batchTime).ToListAsync();
        var newStudents = await _db.Students.Where(s => s.LastUpdated >= batchTime).ToListAsync();
        var newParents = await _db.Parents.Where(p => p.LastUpdated >= batchTime).ToListAsync();

        var schoolsToCreate = 0;
        var schoolsToUpdate = 0;
        var studentsToCreate = 0;
        var studentsToUpdate = 0;
        var parentsToCreate = 0;
        var parentsToUpdate = 0;

        foreach (var school in newSchools)
        {
            var existing = await _db.Schools.FirstOrDefaultAsync(s => 
                s.Id != school.Id && 
                ((!string.IsNullOrEmpty(s.CR) && s.CR == school.CR) ||
                 (!string.IsNullOrEmpty(s.MinistrySchoolId) && s.MinistrySchoolId == school.MinistrySchoolId)));
            
            if (existing != null) schoolsToUpdate++;
            else schoolsToCreate++;
        }

        foreach (var student in newStudents)
        {
            var existing = await _db.Students.FirstOrDefaultAsync(s => 
                s.Id != student.Id && 
                ((!string.IsNullOrEmpty(s.MinistryStudentId) && s.MinistryStudentId == student.MinistryStudentId) ||
                 (!string.IsNullOrEmpty(s.NationalId) && s.NationalId == student.NationalId)));
            
            if (existing != null) studentsToUpdate++;
            else studentsToCreate++;
        }

        foreach (var parent in newParents)
        {
            var existing = await _db.Parents.FirstOrDefaultAsync(p => 
                p.Id != parent.Id && 
                ((!string.IsNullOrEmpty(p.MinistryParentId) && p.MinistryParentId == parent.MinistryParentId) ||
                 (!string.IsNullOrEmpty(p.NationalId) && p.NationalId == parent.NationalId)));
            
            if (existing != null) parentsToUpdate++;
            else parentsToCreate++;
        }

        var openIssues = await _db.DQIssues.CountAsync(i => i.Status == "Open");
        var highSeverityIssues = await _db.DQIssues.CountAsync(i => i.Status == "Open" && i.Severity == "High");

        return new
        {
            batchId,
            schools = new { toCreate = schoolsToCreate, toUpdate = schoolsToUpdate },
            students = new { toCreate = studentsToCreate, toUpdate = studentsToUpdate },
            parents = new { toCreate = parentsToCreate, toUpdate = parentsToUpdate },
            totalChanges = schoolsToCreate + schoolsToUpdate + studentsToCreate + studentsToUpdate + parentsToCreate + parentsToUpdate,
            dataQuality = new { openIssues, highSeverityIssues },
            readyForInjection = highSeverityIssues == 0,
            warnings = GenerateInjectionWarnings(highSeverityIssues, openIssues)
        };
    }

    public async Task<object> InjectAsync(Guid batchId, bool simulate = true)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == batchId);
        if (batch == null) throw new ArgumentException("Batch not found");

        var highSeverityIssues = await _db.DQIssues.CountAsync(i => i.Status == "Open" && i.Severity == "High");
        if (highSeverityIssues > 0 && !simulate)
        {
            throw new InvalidOperationException($"Cannot inject data with {highSeverityIssues} high severity issues. Resolve issues first or run in simulation mode.");
        }

        var batchTime = batch.UploadedAtUtc;
        var results = new
        {
            batchId,
            simulate,
            startedAt = DateTime.UtcNow,
            schools = await ProcessSchoolsAsync(batchTime, simulate),
            students = await ProcessStudentsAsync(batchTime, simulate),
            parents = await ProcessParentsAsync(batchTime, simulate),
            completedAt = DateTime.UtcNow
        };

        if (!simulate)
        {
            batch.Status = "Injected";
            await _db.SaveChangesAsync();

            await CreateAuditEntryAsync(batchId, "BatchInjection", "Completed", 
                $"Injected batch data: {results.schools} schools, {results.students} students, {results.parents} parents");
        }

        return results;
    }

    private async Task<object> ProcessSchoolsAsync(DateTime batchTime, bool simulate)
    {
        var newSchools = await _db.Schools.Where(s => s.LastUpdated >= batchTime).ToListAsync();
        int created = 0, updated = 0, errors = 0;

        foreach (var school in newSchools)
        {
            try
            {
                var existing = await _db.Schools.FirstOrDefaultAsync(s => 
                    s.Id != school.Id && 
                    ((!string.IsNullOrEmpty(s.CR) && s.CR == school.CR) ||
                     (!string.IsNullOrEmpty(s.MinistrySchoolId) && s.MinistrySchoolId == school.MinistrySchoolId)));

                if (existing != null)
                {
                    if (!simulate)
                    {
                        await MergeSchoolDataAsync(existing, school);
                        await CreateAuditEntryAsync(school.Id, "School", "Updated", 
                            $"Merged data from batch school {school.Id}", null, school);
                    }
                    updated++;
                }
                else
                {
                    if (!simulate)
                    {
                        school.MasterSchoolId = Guid.NewGuid().ToString();
                        await CreateAuditEntryAsync(school.Id, "School", "Created", 
                            $"Created new school from batch", null, school);
                    }
                    created++;
                }
            }
            catch (Exception ex)
            {
                errors++;
                await CreateAuditEntryAsync(school.Id, "School", "Error", 
                    $"Failed to process school: {ex.Message}");
            }
        }

        if (!simulate)
        {
            await _db.SaveChangesAsync();
        }

        return new { created, updated, errors };
    }

    private async Task<object> ProcessStudentsAsync(DateTime batchTime, bool simulate)
    {
        var newStudents = await _db.Students.Where(s => s.LastUpdated >= batchTime).ToListAsync();
        int created = 0, updated = 0, errors = 0;

        foreach (var student in newStudents)
        {
            try
            {
                var existing = await _db.Students.FirstOrDefaultAsync(s => 
                    s.Id != student.Id && 
                    ((!string.IsNullOrEmpty(s.MinistryStudentId) && s.MinistryStudentId == student.MinistryStudentId) ||
                     (!string.IsNullOrEmpty(s.NationalId) && s.NationalId == student.NationalId)));

                if (existing != null)
                {
                    if (!simulate)
                    {
                        await MergeStudentDataAsync(existing, student);
                        await CreateAuditEntryAsync(student.Id, "Student", "Updated", 
                            $"Merged data from batch student {student.Id}", null, student);
                    }
                    updated++;
                }
                else
                {
                    if (!simulate)
                    {
                        student.MasterStudentId = Guid.NewGuid().ToString();
                        await CreateAuditEntryAsync(student.Id, "Student", "Created", 
                            $"Created new student from batch", null, student);
                    }
                    created++;
                }
            }
            catch (Exception ex)
            {
                errors++;
                await CreateAuditEntryAsync(student.Id, "Student", "Error", 
                    $"Failed to process student: {ex.Message}");
            }
        }

        if (!simulate)
        {
            await _db.SaveChangesAsync();
        }

        return new { created, updated, errors };
    }

    private async Task<object> ProcessParentsAsync(DateTime batchTime, bool simulate)
    {
        var newParents = await _db.Parents.Where(p => p.LastUpdated >= batchTime).ToListAsync();
        int created = 0, updated = 0, errors = 0;

        foreach (var parent in newParents)
        {
            try
            {
                var existing = await _db.Parents.FirstOrDefaultAsync(p => 
                    p.Id != parent.Id && 
                    ((!string.IsNullOrEmpty(p.MinistryParentId) && p.MinistryParentId == parent.MinistryParentId) ||
                     (!string.IsNullOrEmpty(p.NationalId) && p.NationalId == parent.NationalId)));

                if (existing != null)
                {
                    if (!simulate)
                    {
                        await MergeParentDataAsync(existing, parent);
                        await CreateAuditEntryAsync(parent.Id, "Parent", "Updated", 
                            $"Merged data from batch parent {parent.Id}", null, parent);
                    }
                    updated++;
                }
                else
                {
                    if (!simulate)
                    {
                        parent.MasterParentId = Guid.NewGuid().ToString();
                        await CreateAuditEntryAsync(parent.Id, "Parent", "Created", 
                            $"Created new parent from batch", null, parent);
                    }
                    created++;
                }
            }
            catch (Exception ex)
            {
                errors++;
                await CreateAuditEntryAsync(parent.Id, "Parent", "Error", 
                    $"Failed to process parent: {ex.Message}");
            }
        }

        if (!simulate)
        {
            await _db.SaveChangesAsync();
        }

        return new { created, updated, errors };
    }

    private async Task MergeSchoolDataAsync(SchoolEntity existing, SchoolEntity newData)
    {
        var beforeSnapshot = new { existing.NameAr, existing.NameEn, existing.Region, existing.City, existing.District, existing.StagesCsv, existing.Status };
        
        if (!string.IsNullOrEmpty(newData.NameAr)) existing.NameAr = newData.NameAr;
        if (!string.IsNullOrEmpty(newData.NameEn)) existing.NameEn = newData.NameEn;
        if (!string.IsNullOrEmpty(newData.Region)) existing.Region = newData.Region;
        if (!string.IsNullOrEmpty(newData.City)) existing.City = newData.City;
        if (!string.IsNullOrEmpty(newData.District)) existing.District = newData.District;
        if (!string.IsNullOrEmpty(newData.StagesCsv)) existing.StagesCsv = newData.StagesCsv;
        if (!string.IsNullOrEmpty(newData.Status)) existing.Status = newData.Status;
        if (newData.LicenseIssueDate.HasValue) existing.LicenseIssueDate = newData.LicenseIssueDate;
        if (newData.LicenseExpiryDate.HasValue) existing.LicenseExpiryDate = newData.LicenseExpiryDate;
        
        existing.LastUpdated = DateTime.UtcNow;
        
        var afterSnapshot = new { existing.NameAr, existing.NameEn, existing.Region, existing.City, existing.District, existing.StagesCsv, existing.Status };
        await CreateAuditEntryAsync(existing.Id, "School", "DataMerge", "Merged school data from batch", beforeSnapshot, afterSnapshot);
    }

    private async Task MergeStudentDataAsync(StudentEntity existing, StudentEntity newData)
    {
        var beforeSnapshot = new { existing.FullNameAr, existing.FullNameEn, existing.DOB, existing.Gender, existing.Nationality, existing.PhonesCsv, existing.EmailsCsv, existing.Address };
        
        if (!string.IsNullOrEmpty(newData.FullNameAr)) existing.FullNameAr = newData.FullNameAr;
        if (!string.IsNullOrEmpty(newData.FullNameEn)) existing.FullNameEn = newData.FullNameEn;
        if (newData.DOB.HasValue) existing.DOB = newData.DOB;
        if (!string.IsNullOrEmpty(newData.Gender)) existing.Gender = newData.Gender;
        if (!string.IsNullOrEmpty(newData.Nationality)) existing.Nationality = newData.Nationality;
        if (!string.IsNullOrEmpty(newData.PhonesCsv)) existing.PhonesCsv = newData.PhonesCsv;
        if (!string.IsNullOrEmpty(newData.EmailsCsv)) existing.EmailsCsv = newData.EmailsCsv;
        if (!string.IsNullOrEmpty(newData.Address)) existing.Address = newData.Address;
        if (newData.CurrentSchoolRefId.HasValue) existing.CurrentSchoolRefId = newData.CurrentSchoolRefId;
        
        existing.LastUpdated = DateTime.UtcNow;
        
        var afterSnapshot = new { existing.FullNameAr, existing.FullNameEn, existing.DOB, existing.Gender, existing.Nationality, existing.PhonesCsv, existing.EmailsCsv, existing.Address };
        await CreateAuditEntryAsync(existing.Id, "Student", "DataMerge", "Merged student data from batch", beforeSnapshot, afterSnapshot);
    }

    private async Task MergeParentDataAsync(ParentEntity existing, ParentEntity newData)
    {
        var beforeSnapshot = new { existing.FullNameAr, existing.FullNameEn, existing.PhonesCsv, existing.EmailsCsv, existing.Address };
        
        if (!string.IsNullOrEmpty(newData.FullNameAr)) existing.FullNameAr = newData.FullNameAr;
        if (!string.IsNullOrEmpty(newData.FullNameEn)) existing.FullNameEn = newData.FullNameEn;
        if (!string.IsNullOrEmpty(newData.PhonesCsv)) existing.PhonesCsv = newData.PhonesCsv;
        if (!string.IsNullOrEmpty(newData.EmailsCsv)) existing.EmailsCsv = newData.EmailsCsv;
        if (!string.IsNullOrEmpty(newData.Address)) existing.Address = newData.Address;
        
        existing.LastUpdated = DateTime.UtcNow;
        
        var afterSnapshot = new { existing.FullNameAr, existing.FullNameEn, existing.PhonesCsv, existing.EmailsCsv, existing.Address };
        await CreateAuditEntryAsync(existing.Id, "Parent", "DataMerge", "Merged parent data from batch", beforeSnapshot, afterSnapshot);
    }

    private async Task CreateAuditEntryAsync(Guid entityId, string entityType, string action, string details, object? beforeData = null, object? afterData = null)
    {
        var audit = new AuditEntryEntity
        {
            Id = Guid.NewGuid(),
            EntityId = entityId,
            EntityType = entityType,
            Action = action,
            Details = details,
            BeforeJson = beforeData != null ? System.Text.Json.JsonSerializer.Serialize(beforeData) : null,
            AfterJson = afterData != null ? System.Text.Json.JsonSerializer.Serialize(afterData) : null,
            UserId = "system",
            Timestamp = DateTime.UtcNow
        };

        _db.AuditEntries.Add(audit);
    }

    private List<string> GenerateInjectionWarnings(int highSeverityIssues, int openIssues)
    {
        var warnings = new List<string>();

        if (highSeverityIssues > 0)
        {
            warnings.Add($"{highSeverityIssues} high severity data quality issues must be resolved before injection");
        }

        if (openIssues > 10)
        {
            warnings.Add($"{openIssues} open data quality issues may affect data accuracy");
        }

        return warnings;
    }
}
