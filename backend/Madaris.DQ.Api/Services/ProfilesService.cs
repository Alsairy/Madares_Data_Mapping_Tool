using Madaris.DQ.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Madaris.DQ.Api.Services;
public class ProfilesService : IProfilesService
{
    private readonly AppDbContext _db;
    public ProfilesService(AppDbContext db) { _db = db; }

    public async Task<object> GetBatchProfileAsync(Guid batchId)
    {
        var batch = await _db.Batches.FirstOrDefaultAsync(b => b.Id == batchId);
        if (batch == null) return new { error = "Batch not found" };

        var schools = await _db.Schools.Where(s => s.LastUpdated >= batch.UploadedAtUtc).ToListAsync();
        var students = await _db.Students.Where(s => s.LastUpdated >= batch.UploadedAtUtc).ToListAsync();
        var parents = await _db.Parents.Where(p => p.LastUpdated >= batch.UploadedAtUtc).ToListAsync();

        var profile = new
        {
            batchId,
            uploadedAt = batch.UploadedAtUtc,
            schools = ProfileSchools(schools),
            students = ProfileStudents(students),
            parents = ProfileParents(parents),
            overallDqScore = CalculateOverallDqScore(schools, students, parents)
        };

        return profile;
    }

    private object ProfileSchools(List<Models.SchoolEntity> schools)
    {
        if (!schools.Any()) return new { count = 0, dqScore = 0.0 };

        var validCR = schools.Count(s => !string.IsNullOrEmpty(s.CR) && s.CR.Length >= 10);
        var validNames = schools.Count(s => !string.IsNullOrEmpty(s.NameAr));
        var validRegions = schools.Count(s => !string.IsNullOrEmpty(s.Region));
        var validLicenses = schools.Count(s => !string.IsNullOrEmpty(s.LicenseNumber));

        return new
        {
            count = schools.Count,
            crValidRate = (double)validCR / schools.Count,
            nameValidRate = (double)validNames / schools.Count,
            regionValidRate = (double)validRegions / schools.Count,
            licenseValidRate = (double)validLicenses / schools.Count,
            dqScore = ((double)(validCR + validNames + validRegions + validLicenses)) / (schools.Count * 4)
        };
    }

    private object ProfileStudents(List<Models.StudentEntity> students)
    {
        if (!students.Any()) return new { count = 0, dqScore = 0.0 };

        var validNationalIds = students.Count(s => IsValidNationalId(s.NationalId));
        var validNames = students.Count(s => !string.IsNullOrEmpty(s.FullNameAr));
        var validDOBs = students.Count(s => s.DOB.HasValue && s.DOB.Value > DateTime.Now.AddYears(-25));
        var validPhones = students.Count(s => IsValidPhone(s.PhonesCsv));
        var validEmails = students.Count(s => IsValidEmail(s.EmailsCsv));

        return new
        {
            count = students.Count,
            nationalIdValidRate = (double)validNationalIds / students.Count,
            nameValidRate = (double)validNames / students.Count,
            dobValidRate = (double)validDOBs / students.Count,
            phoneValidRate = (double)validPhones / students.Count,
            emailValidRate = (double)validEmails / students.Count,
            dqScore = ((double)(validNationalIds + validNames + validDOBs + validPhones + validEmails)) / (students.Count * 5)
        };
    }

    private object ProfileParents(List<Models.ParentEntity> parents)
    {
        if (!parents.Any()) return new { count = 0, dqScore = 0.0 };

        var validNationalIds = parents.Count(p => IsValidNationalId(p.NationalId));
        var validNames = parents.Count(p => !string.IsNullOrEmpty(p.FullNameAr));
        var validPhones = parents.Count(p => IsValidPhone(p.PhonesCsv));
        var validEmails = parents.Count(p => IsValidEmail(p.EmailsCsv));

        return new
        {
            count = parents.Count,
            nationalIdValidRate = (double)validNationalIds / parents.Count,
            nameValidRate = (double)validNames / parents.Count,
            phoneValidRate = (double)validPhones / parents.Count,
            emailValidRate = (double)validEmails / parents.Count,
            dqScore = ((double)(validNationalIds + validNames + validPhones + validEmails)) / (parents.Count * 4)
        };
    }

    private double CalculateOverallDqScore(List<Models.SchoolEntity> schools, List<Models.StudentEntity> students, List<Models.ParentEntity> parents)
    {
        var schoolProfile = ProfileSchools(schools);
        var studentProfile = ProfileStudents(students);
        var parentProfile = ProfileParents(parents);

        var schoolScore = (double)((dynamic)schoolProfile).dqScore;
        var studentScore = (double)((dynamic)studentProfile).dqScore;
        var parentScore = (double)((dynamic)parentProfile).dqScore;

        return (schoolScore + studentScore + parentScore) / 3.0;
    }

    private bool IsValidNationalId(string? nationalId)
    {
        if (string.IsNullOrEmpty(nationalId)) return false;
        return nationalId.Length == 10 && nationalId.All(char.IsDigit);
    }

    private bool IsValidPhone(string? phones)
    {
        if (string.IsNullOrEmpty(phones)) return false;
        var phoneNumbers = phones.Split(',', StringSplitOptions.RemoveEmptyEntries);
        return phoneNumbers.Any(p => Regex.IsMatch(p.Trim(), @"^(\+966|966|0)?[5][0-9]{8}$"));
    }

    private bool IsValidEmail(string? emails)
    {
        if (string.IsNullOrEmpty(emails)) return false;
        var emailAddresses = emails.Split(',', StringSplitOptions.RemoveEmptyEntries);
        return emailAddresses.Any(e => Regex.IsMatch(e.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$"));
    }
}
