using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Madaris.DQ.Api.Scripts;

public static class SeedData
{
    public static async Task SeedSampleDataAsync(AppDbContext context)
    {
        if (await context.Schools.AnyAsync()) return;

        var licenses = new[]
        {
            new LicenseEntity { Id = Guid.NewGuid(), UnifiedCRNumber = "1234567890", MinistrySchoolId = "MIN001", LicenseNumber = "LIC001", InstitutionName = "مدرسة النموذج الأولى", Region = "الرياض" },
            new LicenseEntity { Id = Guid.NewGuid(), UnifiedCRNumber = "2345678901", MinistrySchoolId = "MIN002", LicenseNumber = "LIC002", InstitutionName = "مدرسة النموذج الثانية", Region = "جدة" }
        };

        var schools = new[]
        {
            new SchoolEntity { Id = Guid.NewGuid(), CR = "1234567890", MadarisSchoolId = "MAD001", NameAr = "مدرسة النموذج الأولى", Region = "الرياض", City = "الرياض" },
            new SchoolEntity { Id = Guid.NewGuid(), CR = "2345678901", MadarisSchoolId = "MAD002", NameAr = "مدرسة النموذج الثانية", Region = "مكة المكرمة", City = "جدة" }
        };

        var students = new[]
        {
            new StudentEntity { Id = Guid.NewGuid(), MinistryStudentId = "STU001", FullNameAr = "محمد أحمد", NationalId = "1234567890", DOB = DateTime.Now.AddYears(-10), Gender = "ذكر" },
            new StudentEntity { Id = Guid.NewGuid(), MinistryStudentId = "STU002", FullNameAr = "فاطمة علي", NationalId = "2345678901", DOB = DateTime.Now.AddYears(-12), Gender = "أنثى" }
        };

        var parents = new[]
        {
            new ParentEntity { Id = Guid.NewGuid(), MinistryParentId = "PAR001", FullNameAr = "أحمد محمد", NationalId = "3456789012", PhonesCsv = "0501234567" },
            new ParentEntity { Id = Guid.NewGuid(), MinistryParentId = "PAR002", FullNameAr = "علي حسن", NationalId = "4567890123", PhonesCsv = "0507654321" }
        };

        context.Licenses.AddRange(licenses);
        context.Schools.AddRange(schools);
        context.Students.AddRange(students);
        context.Parents.AddRange(parents);

        await context.SaveChangesAsync();
    }
}
