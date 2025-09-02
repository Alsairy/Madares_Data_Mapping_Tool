# Madaris.DQ.Api (Backend)

**Tech**: .NET 8 Web API, EF Core (SQL Server)

## Run Locally
1. Install .NET 8 SDK and SQL Server.
2. Update `appsettings.json` connection string if needed.
3. From `backend/Madaris.DQ.Api`: 
   ```bash
   dotnet restore
   dotnet ef database update   # after adding an initial migration
   dotnet run
   ```

> Create an initial migration (first time only):
```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Key Endpoints
- `GET /api/health`
- `POST /api/upload/{source}` with form-data `file=...` (source = tarkhees|noor_schools|noor_students|noor_parents|madaris_schools)
- `GET /api/batch/{batchId}/profile`
- `POST /api/batch/{batchId}/match`
- `GET /api/batch/{batchId}/impact`
- `POST /api/batch/{batchId}/inject?simulate=true`
- `GET /api/exceptions`
- `POST /api/exceptions/{issueId}/resolve`
- `GET /api/templates/{name}`
