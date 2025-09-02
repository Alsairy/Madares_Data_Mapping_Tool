using Microsoft.EntityFrameworkCore;
using Madaris.DQ.Api.Data;
using Madaris.DQ.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Config
builder.Services.AddDbContext<AppDbContext>(opts =>
{
    var cs = builder.Configuration.GetConnectionString("SqlServer") ?? "Server=localhost;Database=MadarisDQ;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;";
    opts.UseSqlServer(cs);
});

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
