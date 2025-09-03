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
    options.AddPolicy("all", p => p
        .WithOrigins("https://data-mapping-assessment-app-x5jb4izt.devinapps.com")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("all");

app.MapControllers();
app.Run();

public partial class Program { }
