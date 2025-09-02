namespace Madaris.DQ.Api.Models;
public class EnrollmentEntity
{
    public Guid Id { get; set; }
    public Guid StudentRefId { get; set; }
    public Guid SchoolRefId { get; set; }
    public string? AcademicYear { get; set; }
    public string? Grade { get; set; }
    public string? Class { get; set; }
    public string? Status { get; set; }
}