FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Madaris.DQ.Api/Madaris.DQ.Api.csproj", "Madaris.DQ.Api/"]
RUN dotnet restore "Madaris.DQ.Api/Madaris.DQ.Api.csproj"
COPY . .
WORKDIR "/src/Madaris.DQ.Api"
RUN dotnet build "Madaris.DQ.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Madaris.DQ.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Madaris.DQ.Api.dll"]
