using Microsoft.AspNetCore.Mvc;
namespace Madaris.DQ.Api.Controllers;

[ApiController]
[Route("api/templates")]
public class TemplatesController : ControllerBase
{
    [HttpGet("{name}")]
    public IActionResult GetTemplate([FromRoute]string name)
    {
        // In a real impl, serve from storage; here just return sample headers.
        var templates = new Dictionary<string, string[]> {
            {"tarkhees", new[]{"Unified_CR_Number","License_Number","License_Status","License_Type","Institution_Name","Educational_Type","Curriculum","Region","City","District","Governorate","Owner_Name","Owner_ID","Nationality","Gender","Phone","Email","Issue_Date","Expiry_Date","Approvals","Special_Education_Categories","Municipality_Permits"}},
            {"noor_schools", new[]{"Ministry_School_ID","School_Name_AR","School_Name_EN","Region","City","District","Stages","Current_Status"}},
            {"noor_students", new[]{"Ministry_Student_ID","Ministry_School_ID","FullName_AR","FullName_EN","National_ID","DOB","Gender","Nationality","Phone","Email","Address","Grade","Class","Academic_Year"}},
            {"noor_parents", new[]{"Ministry_Parent_ID","FullName_AR","FullName_EN","National_ID","Phone","Email","Address"}},
            {"madaris_schools", new[]{"Madaris_School_ID","CR","School_Name_AR","School_Name_EN","Region","City","District","Stages","Status"}}
        };
        if (!templates.ContainsKey(name)) return NotFound();
        return Ok(new { name, headers = templates[name] });
    }
}