namespace Madaris.DQ.Api.Models;

public class ProcessFilesRequest
{
    public string? TarkheesUploadId { get; set; }
    public string? NoorUploadId { get; set; }
    public string? MadarisUploadId { get; set; }
    public string? UploadedBy { get; set; }
}
