namespace BackEnd.Services;

public sealed class OverdueWorker(IServiceScopeFactory scopes, ILogger<OverdueWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<IPaymentService>().ProcessOverdueRegistrationsAsync();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception error) { logger.LogError(error, "Pemeriksaan keterlambatan gagal; akan dicoba lagi satu jam berikutnya."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
