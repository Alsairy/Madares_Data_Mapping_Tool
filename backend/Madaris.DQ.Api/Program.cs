using Microsoft.EntityFrameworkCore;
using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Services;
using Madaris.DQ.Api.Swagger;

var builder = WebApplication.CreateBuilder(args);

var useInMemory = builder.Configuration.GetValue<bool>("UseInMemory", true) || 
                  string.IsNullOrEmpty(builder.Configuration.GetConnectionString("DefaultConnection"));
if (useInMemory)
{
    builder.Services.AddDbContext<AppDbContext>(opts =>
        opts.UseInMemoryDatabase("MadarisDQ"));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(opts =>
        opts.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sql =>
            {
                sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null);
                sql.CommandTimeout(60);
            }));
}

builder.Services.AddScoped<IIngestionService, IngestionService>();
builder.Services.AddScoped<IMatchingService, MatchingService>();
builder.Services.AddScoped<IProfilesService, ProfilesService>();
builder.Services.AddScoped<IInjectionService, InjectionService>();
builder.Services.AddScoped<IExceptionsService, ExceptionsService>();
builder.Services.AddScoped<IPipelineService, PipelineService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Madaris DQ API", Version = "v1" });
    c.OperationFilter<FileUploadOperationFilter>();
});
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => policy
        .SetIsOriginAllowed(origin => 
        {
            return origin == "https://data-mapping-assessment-app-x5jb4izt.devinapps.com" ||
                   origin?.StartsWith("http://localhost") == true ||
                   origin?.StartsWith("https://localhost") == true;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithExposedHeaders("Content-Length", "Content-Range", "Content-Disposition"));
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    var origin = context.Request.Headers["Origin"].ToString();
    
    if (!string.IsNullOrEmpty(origin))
    {
        context.Response.Headers["Access-Control-Allow-Origin"] = origin;
        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
    }
    else
    {
        context.Response.Headers["Access-Control-Allow-Origin"] = "*";
    }
    
    context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
    context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name";
    context.Response.Headers["Access-Control-Max-Age"] = "86400";
    context.Response.Headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Range, Content-Disposition";
    
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 204; // No Content is more appropriate for OPTIONS
        return;
    }
    
    await next();
});

app.UseCors("AllowAll");

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();
app.Run();

public partial class Program { }
