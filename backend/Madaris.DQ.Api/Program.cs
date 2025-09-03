using Microsoft.EntityFrameworkCore;
using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Config
var useInMemory = builder.Configuration.GetValue<bool>("UseInMemory", false);
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
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => {
    options.AddPolicy("all", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("all");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();

public partial class Program { }
