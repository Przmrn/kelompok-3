import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';
import { CourseSystemService } from '../../services/course-system.service';

describe('My Courses child routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    TestBed.inject(CourseSystemService).switchDemoUser(1);
  });

  it('opens the schedule from the legacy URL and returns there after a refund', async () => {
    const harness = await RouterTestingHarness.create('/my-registrations');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/my-courses/jadwal');
    expect(harness.routeNativeElement!.textContent).toContain('Jadwal Pelaksanaan Batch');
    const refundLink = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href$="/refund"]')!;
    await harness.navigateByUrl(refundLink.pathname);
    expect(harness.routeNativeElement!.textContent).toContain('16 hari sebelum kelas');

    const buttons = Array.from(harness.routeNativeElement!.querySelectorAll('button'));
    buttons.find(button => button.textContent?.includes('7–13 Hari'))!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('10 hari sebelum kelas');
    const navigation = firstValueFrom(router.events.pipe(filter(event => event instanceof NavigationEnd)));
    buttons.find(button => button.textContent?.includes('Konfirmasi Pembatalan'))!.click();
    await navigation;
    harness.detectChanges();
    expect(router.url).toBe('/my-courses/jadwal');
    expect(harness.routeNativeElement!.textContent).toContain('Refund 50%');
  });

  it('excludes unpaid registrations from direct refund links', async () => {
    const harness = await RouterTestingHarness.create('/my-courses/2/refund');
    expect(harness.routeNativeElement!.textContent).toContain('tidak tersedia untuk pembatalan');
    expect(harness.routeNativeElement!.textContent).not.toContain('Konfirmasi Pembatalan');
  });
});
