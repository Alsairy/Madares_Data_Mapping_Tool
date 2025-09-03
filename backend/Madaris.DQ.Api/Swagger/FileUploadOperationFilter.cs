using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Linq;
using System.Reflection;

namespace Madaris.DQ.Api.Swagger;

public sealed class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var apiDesc = context.ApiDescription;
        var hasFormFile = apiDesc.ParameterDescriptions
            .Any(p => p.Type == typeof(IFormFile) || p.Type == typeof(IFormFile[]) || p.Type == typeof(List<IFormFile>));

        if (!hasFormFile) return;

        operation.RequestBody ??= new OpenApiRequestBody();

        var schema = new OpenApiSchema { Type = "object", Properties = new Dictionary<string, OpenApiSchema>() };

        foreach (var p in apiDesc.ParameterDescriptions)
        {
            var isFile =
                p.Type == typeof(IFormFile) ||
                p.Type == typeof(IFormFile[]) ||
                p.Type == typeof(List<IFormFile>);

            var name = p.Name;

            if (isFile)
            {
                if (p.Type == typeof(IFormFile))
                {
                    schema.Properties[name] = new OpenApiSchema { Type = "string", Format = "binary" };
                }
                else
                {
                    schema.Properties[name] = new OpenApiSchema
                    {
                        Type = "array",
                        Items = new OpenApiSchema { Type = "string", Format = "binary" }
                    };
                }
            }
            else
            {
                schema.Properties[name] = new OpenApiSchema { Type = "string" };
            }
        }

        operation.RequestBody.Content["multipart/form-data"] = new OpenApiMediaType { Schema = schema };

        operation.Parameters.Clear();
        
        foreach (var p in apiDesc.ParameterDescriptions)
        {
            var isFile = p.Type == typeof(IFormFile) || p.Type == typeof(IFormFile[]) || p.Type == typeof(List<IFormFile>);
            if (!isFile && p.Source.Id != "Form")
            {
                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = p.Name,
                    In = ParameterLocation.Query,
                    Required = p.IsRequired,
                    Schema = new OpenApiSchema { Type = "string" }
                });
            }
        }
    }
}
