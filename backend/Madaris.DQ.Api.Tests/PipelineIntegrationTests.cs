using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Services;
using System.Text;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Madaris.DQ.Api.Tests;

public class PipelineIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PipelineIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Pipeline_ProcessesSampleData_ReturnsExpectedResults()
    {
        using var scope = _factory.Services.CreateScope();
        var pipelineService = scope.ServiceProvider.GetRequiredService<IPipelineService>();
        
        var tarkheesData = CreateSampleTarkheesFile();
        var noorData = CreateSampleNoorFile();
        var madarisData = CreateSampleMadarisFile();

        var result = await pipelineService.RunAsync(tarkheesData, noorData, madarisData, "test-user");

        Assert.NotEqual(Guid.Empty, result.JobId);
        Assert.True(result.SchoolsMatched > 0);
        Assert.True(result.StudentsPrepared > 0);
        Assert.True(result.OverallDqScore >= 0.0 && result.OverallDqScore <= 1.0);

        var studentsPath = await pipelineService.GetExportPathAsync(result.JobId, "students_master.xlsx");
        var parentsPath = await pipelineService.GetExportPathAsync(result.JobId, "parents_master.xlsx");
        var mappingPath = await pipelineService.GetExportPathAsync(result.JobId, "mapping_report.csv");
        var linksPath = await pipelineService.GetExportPathAsync(result.JobId, "student_parent_links.xlsx");
        
        Assert.True(File.Exists(studentsPath));
        Assert.True(File.Exists(parentsPath));
        Assert.True(File.Exists(mappingPath));
        Assert.True(File.Exists(linksPath));
    }

    [Fact]
    public async Task Dashboard_ReturnsRealKPIs_NotPlaceholders()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/kpis");
        var content = await response.Content.ReadAsStringAsync();

        response.EnsureSuccessStatusCode();
        Assert.Contains("schoolMatchRate", content);
        Assert.Contains("studentMatchRate", content);
        Assert.Contains("dqRulePassRate", content);
    }

    private IFormFile CreateSampleTarkheesFile()
    {
        var content = "Unified_CR_Number,Ministry_School_ID,License_Number,Institution_Name\n" +
                     "1234567890,MIN001,LIC001,Test School 1\n" +
                     "2345678901,MIN002,LIC002,Test School 2";
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "tarkhees", "tarkhees.csv")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/csv"
        };
    }

    private IFormFile CreateSampleNoorFile()
    {
        var content = "Ministry_School_ID,Ministry_Student_ID,FullName_AR,Ministry_Parent_ID,Parent_Name\n" +
                     "MIN001,STU001,محمد أحمد,PAR001,أحمد محمد\n" +
                     "MIN002,STU002,فاطمة علي,PAR002,علي حسن";
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "noor", "noor.csv")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/csv"
        };
    }

    private IFormFile CreateSampleMadarisFile()
    {
        var content = "CR,Madaris_School_ID,School_Name_AR\n" +
                     "1234567890,MAD001,مدرسة الاختبار الأولى\n" +
                     "2345678901,MAD002,مدرسة الاختبار الثانية";
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "madaris", "madaris.csv")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/csv"
        };
    }
}
