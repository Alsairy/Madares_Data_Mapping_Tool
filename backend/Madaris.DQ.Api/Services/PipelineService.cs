using System.Data;
using System.Text;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Models;
using Madaris.DQ.Api.Utils;

namespace Madaris.DQ.Api.Services;

public class PipelineService : IPipelineService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IMatchingService _matching;
    private readonly IProfilesService _profiles;

    private static string SanitizeForExcel(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        char c = s[0];
        return (c == '=' || c == '+' || c == '-' || c == '@') ? "'" + s : s;
    }
    
    public PipelineService(AppDbContext db, IWebHostEnvironment env, IMatchingService matching, IProfilesService profiles)
    {
        _db = db; 
        _env = env;
        _matching = matching;
        _profiles = profiles;
        System.Text.Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
    }

    private static DataSet ReadAnySpreadsheet(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        if (file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            // basic CSV reader into DataTable
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks:true);
            var dt = new DataTable("csv");
            string? line; bool header = true;
            while((line = reader.ReadLine()) != null)
            {
                var cols = line.Split(',');
                if (header)
                {
                    foreach (var c in cols) dt.Columns.Add(c.Trim());
                    header = false;
                }
                else
                {
                    var row = dt.NewRow();
                    // Ensure we don't try to access more columns than exist in the DataTable
                    int maxCols = Math.Min(cols.Length, dt.Columns.Count);
                    for (int i=0;i<maxCols;i++) row[i] = cols[i];
                    dt.Rows.Add(row);
                }
            }
            var ds = new DataSet(); ds.Tables.Add(dt); return ds;
        }
        else
        {
            using var rdr = ExcelReaderFactory.CreateReader(stream);
            return rdr.AsDataSet();
        }
    }

    public async Task<PipelineResult> RunAsync(IFormFile tarkheesLicense, IFormFile noorRoster, IFormFile madarisSchools, string uploadedBy)
    {
        var jobId = Guid.NewGuid();
        var exportDir = Path.Combine(_env.ContentRootPath, "exports", jobId.ToString());
        Directory.CreateDirectory(exportDir);

        // Read files
        var dsTarkhees = ReadAnySpreadsheet(tarkheesLicense);
        var dsNoor = ReadAnySpreadsheet(noorRoster);
        var dsMadaris = ReadAnySpreadsheet(madarisSchools);

        // Simplified assumptions on sheet 0
        var t = dsTarkhees.Tables[0];
        var n = dsNoor.Tables[0];
        var m = dsMadaris.Tables[0];

        // Normalize column names for robust matching
        string norm(string s) => s.Trim().ToLowerInvariant().Replace(" ", "_");

        var tCols = t.Columns.Cast<DataColumn>().ToDictionary(c => norm(c.ColumnName), c => c.ColumnName);
        var nCols = n.Columns.Cast<DataColumn>().ToDictionary(c => norm(c.ColumnName), c => c.ColumnName);
        var mCols = m.Columns.Cast<DataColumn>().ToDictionary(c => norm(c.ColumnName), c => c.ColumnName);

        // Expected keys (with fallbacks)
        string tCR = tCols.ContainsKey("unified_cr_number") ? tCols["unified_cr_number"] :
                     tCols.ContainsKey("cr") ? tCols["cr"] : t.Columns[0].ColumnName;
        string tMinSchool = tCols.ContainsKey("ministry_school_id") ? tCols["ministry_school_id"] :
                            tCols.ContainsKey("school_id") ? tCols["school_id"] : null;
        string tLicenseNo = tCols.ContainsKey("license_number") ? tCols["license_number"] : null;

        string nMinSchool = nCols.ContainsKey("ministry_school_id") ? nCols["ministry_school_id"] :
                            nCols.ContainsKey("school_id") ? nCols["school_id"] : null;
        string nStudId = nCols.ContainsKey("ministry_student_id") ? nCols["ministry_student_id"] :
                         nCols.ContainsKey("student_id") ? nCols["student_id"] : null;
        string nStudName = nCols.ContainsKey("fullname_ar") ? nCols["fullname_ar"] :
                           nCols.ContainsKey("student_name") ? nCols["student_name"] : n.Columns[0].ColumnName;
        string nParentId = nCols.ContainsKey("ministry_parent_id") ? nCols["ministry_parent_id"] :
                           nCols.ContainsKey("parent_id") ? nCols["parent_id"] : null;
        string nParentName = nCols.ContainsKey("parent_name") ? nCols["parent_name"] :
                             nCols.ContainsKey("fullname_parent_ar") ? nCols["fullname_parent_ar"] : null;
        string nGrade = nCols.ContainsKey("grade") ? nCols["grade"] :
                        nCols.ContainsKey("class") ? nCols["class"] : null;
        string nParentPhone = nCols.ContainsKey("parent_phone") ? nCols["parent_phone"] :
                              nCols.ContainsKey("phone") ? nCols["phone"] : null;

        string mCR = mCols.ContainsKey("cr") ? mCols["cr"] :
                     mCols.ContainsKey("commercial_registration") ? mCols["commercial_registration"] : m.Columns[0].ColumnName;
        string mMadarisId = mCols.ContainsKey("madaris_school_id") ? mCols["madaris_school_id"] :
                            mCols.ContainsKey("school_id") ? mCols["school_id"] : null;
        string mSchoolName = mCols.ContainsKey("school_name_ar") ? mCols["school_name_ar"] :
                             mCols.ContainsKey("name_ar") ? mCols["name_ar"] : m.Columns[0].ColumnName;

        // Build Tarkhees map: MinistrySchoolId -> CR
        var minSchoolToCR = new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(tMinSchool))
        {
            foreach (DataRow r in t.Rows)
            {
                var minId = r[tMinSchool]?.ToString()?.Trim();
                var cr = r[tCR]?.ToString()?.Trim();
                if (!string.IsNullOrEmpty(minId) && !string.IsNullOrEmpty(cr))
                    minSchoolToCR[minId] = cr;
            }
        }

        // Build Madaris map: CR -> Madaris_School_ID + Name
        var crToMadaris = new Dictionary<string,(string madarisId,string name)>(StringComparer.OrdinalIgnoreCase);
        foreach (DataRow r in m.Rows)
        {
            var cr = r[mCR]?.ToString()?.Trim();
            var madarisId = mMadarisId != null ? r[mMadarisId]?.ToString()?.Trim() : "";
            var name = r[mSchoolName]?.ToString()?.Trim() ?? "";
            if (!string.IsNullOrEmpty(cr))
                crToMadaris[cr] = (madarisId ?? "", name);
        }

        using var consolidatedWb = new XLWorkbook();
        var consolidatedWs = consolidatedWb.Worksheets.Add("Students_and_Parents");

        var consolidatedHeaders = new[]{"Record_Type","Ministry_ID","Name","Mapped_CR","Mapped_Madaris_School_ID","Mapped_Madaris_School_Name","Ministry_School_ID","Grade","Parent_Phone","Match_Method","Confidence","Issues"};
        for (int i=0;i<consolidatedHeaders.Length;i++) consolidatedWs.Cell(1, i+1).Value = consolidatedHeaders[i];

        int consolidatedRow = 2;
        int schoolsMatched = 0, studentsPrepared = 0, parentsPrepared = 0, exceptions = 0;

        // Iterate Noor rows and map to Madaris via Tarkhees bridge
        foreach (DataRow r in n.Rows)
        {
            var minSch = nMinSchool != null ? r[nMinSchool]?.ToString()?.Trim() : null;
            var studId = nStudId != null ? r[nStudId]?.ToString()?.Trim() : null;
            var studName = r[nStudName]?.ToString()?.Trim();
            var grade = nGrade != null ? r[nGrade]?.ToString()?.Trim() : "";
            var parentPhone = nParentPhone != null ? r[nParentPhone]?.ToString()?.Trim() : "";

            // School mapping
            string matchMethod = ""; double confidence = 0.0; string issues = "";
            string mappedCR = ""; string mappedMadarisId = ""; string mappedMadarisName = "";

            if (!string.IsNullOrEmpty(minSch) && minSchoolToCR.TryGetValue(minSch, out var cr))
            {
                mappedCR = cr;
                if (crToMadaris.TryGetValue(cr, out var mm))
                {
                    mappedMadarisId = mm.madarisId; mappedMadarisName = mm.name;
                    matchMethod = "TarkheesBridge"; confidence = 0.99;
                    schoolsMatched++;
                }
                else
                {
                    matchMethod = "CRNotInMadaris"; confidence = 0.8; issues = "CR missing in Madaris extract"; exceptions++;
                }
            }
            else
            {
                matchMethod = "NoMinistrySchoolIdOrNoBridge"; confidence = 0.5; issues = "Missing or unmapped Ministry School ID"; exceptions++;
            }

            if (!string.IsNullOrEmpty(studId))
            {
                consolidatedWs.Cell(consolidatedRow,1).SetValue("Student");
                consolidatedWs.Cell(consolidatedRow,2).SetValue(SanitizeForExcel(studId));
                consolidatedWs.Cell(consolidatedRow,3).SetValue(SanitizeForExcel(studName));
                consolidatedWs.Cell(consolidatedRow,4).SetValue(SanitizeForExcel(mappedCR));
                consolidatedWs.Cell(consolidatedRow,5).SetValue(SanitizeForExcel(mappedMadarisId));
                consolidatedWs.Cell(consolidatedRow,6).SetValue(SanitizeForExcel(mappedMadarisName));
                consolidatedWs.Cell(consolidatedRow,7).SetValue(SanitizeForExcel(minSch ?? ""));
                consolidatedWs.Cell(consolidatedRow,8).SetValue(SanitizeForExcel(grade));
                consolidatedWs.Cell(consolidatedRow,9).SetValue(SanitizeForExcel(parentPhone));
                consolidatedWs.Cell(consolidatedRow,10).SetValue(matchMethod);
                consolidatedWs.Cell(consolidatedRow,11).SetValue(confidence);
                consolidatedWs.Cell(consolidatedRow,12).SetValue(SanitizeForExcel(issues));
                consolidatedRow++; studentsPrepared++;
            }

            if (!string.IsNullOrEmpty(nParentId))
            {
                var pid = r[nParentId]?.ToString()?.Trim();
                var pname = !string.IsNullOrEmpty(nParentName) ? r[nParentName]?.ToString()?.Trim() : "";
                if (!string.IsNullOrEmpty(pid))
                {
                    consolidatedWs.Cell(consolidatedRow,1).SetValue("Parent");
                    consolidatedWs.Cell(consolidatedRow,2).SetValue(SanitizeForExcel(pid));
                    consolidatedWs.Cell(consolidatedRow,3).SetValue(SanitizeForExcel(pname));
                    consolidatedWs.Cell(consolidatedRow,4).SetValue(SanitizeForExcel(mappedCR));
                    consolidatedWs.Cell(consolidatedRow,5).SetValue(SanitizeForExcel(mappedMadarisId));
                    consolidatedWs.Cell(consolidatedRow,6).SetValue(SanitizeForExcel(mappedMadarisName));
                    consolidatedWs.Cell(consolidatedRow,7).SetValue(SanitizeForExcel(minSch ?? ""));
                    consolidatedWs.Cell(consolidatedRow,8).SetValue("");
                    consolidatedWs.Cell(consolidatedRow,9).SetValue(SanitizeForExcel(parentPhone));
                    consolidatedWs.Cell(consolidatedRow,10).SetValue(matchMethod);
                    consolidatedWs.Cell(consolidatedRow,11).SetValue(confidence);
                    consolidatedWs.Cell(consolidatedRow,12).SetValue(SanitizeForExcel(issues));
                    consolidatedRow++; parentsPrepared++;
                }
            }
        }

        // Autosize and save consolidated export
        consolidatedWs.Columns().AdjustToContents();
        var consolidatedPath = Path.Combine(exportDir, "madaris_injection_data.xlsx");
        consolidatedWb.SaveAs(consolidatedPath);

        var summaryReport = Path.Combine(exportDir, "processing_summary.csv");
        await File.WriteAllTextAsync(summaryReport, "metric,value\n" +
            $"schools_matched,{schoolsMatched}\n" +
            $"students_prepared,{studentsPrepared}\n" +
            $"parents_prepared,{parentsPrepared}\n" +
            $"exceptions,{exceptions}\n" +
            $"total_records,{studentsPrepared + parentsPrepared}\n" +
            $"success_rate,{(studentsPrepared + parentsPrepared > 0 ? Math.Round((double)(studentsPrepared + parentsPrepared - exceptions) / (studentsPrepared + parentsPrepared) * 100, 2) : 0)}%\n"
        );

        // Register batch for audit
        var batch = new BatchLoadEntity {
            Id = jobId,
            Source = "PipelineRun",
            FileName = $"{tarkheesLicense.FileName}|{noorRoster.FileName}|{madarisSchools.FileName}",
            UploadedAtUtc = DateTime.UtcNow,
            UploadedBy = uploadedBy,
            Status = "Completed"
        };
        _db.Batches.Add(batch);
        await _db.SaveChangesAsync();

        var matchingToken = await _matching.RunMatchingAsync(jobId);
        var profile = await _profiles.GetBatchProfileAsync(jobId);
        
        var result = new PipelineResult(jobId, schoolsMatched, studentsPrepared, parentsPrepared, exceptions);
        
        var totalRecords = studentsPrepared + parentsPrepared;
        if (totalRecords > 0)
        {
            result.OverallDqScore = Math.Max(0.0, 1.0 - (double)exceptions / totalRecords);
        }

        return result;
    }


    public Task<string> GetExportPathAsync(Guid jobId, string exportName)
    {
        var dir = Path.Combine(_env.ContentRootPath, "exports", jobId.ToString());
        var path = Path.Combine(dir, exportName);
        if (!File.Exists(path)) throw new FileNotFoundException(path);
        return Task.FromResult(path);
    }

    public async Task<BatchLoadEntity?> GetBatchAsync(Guid jobId)
    {
        return await _db.Batches.FirstOrDefaultAsync(b => b.Id == jobId);
    }
}
