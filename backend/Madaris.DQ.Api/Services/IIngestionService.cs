using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
namespace Madaris.DQ.Api.Services;
public interface IIngestionService
{
    Task<Guid> IngestAsync(string source, IFormFile file, string uploadedBy);
}