import { HttpTestingController } from '@angular/common/http/testing';
import { apiTestProviders, flushCourseData, loadCourseData } from '../../services/course-api.testing';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';

describe('My Courses child routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), ...apiTestProviders('Student')] });
    await loadCourseData('Student');
  });

  it('opens the schedule from the legacy URL and returns there after a refund', async () => {
    const harness = await RouterTestingHarness.create('/my-registrations');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/my-courses/jadwal');
    expect(harness.routeNativeElement!.textContent).toContain('Jadwal kelas');
    const refundLink = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href$="/refund"]')!;
    await harness.navigateByUrl(refundLink.pathname);
    expect(harness.routeNativeElement!.textContent).toContain('16 hari sebelum kelas');

    const buttons = Array.from(harness.routeNativeElement!.querySelectorAll('button'));
    const navigation = firstValueFrom(router.events.pipe(filter(event => event instanceof NavigationEnd)));
    buttons.find(button => button.textContent?.includes('Konfirmasi Pembatalan'))!.click();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/Registration/1');
    expect(request.request.method).toBe('DELETE');
    request.flush({});
    await Promise.resolve();
    flushCourseData('Student', { phone: '', expertise: '', cancelled: true });
    await navigation;
    harness.detectChanges();
    expect(router.url).toBe('/my-courses/jadwal');
    expect(harness.routeNativeElement!.textContent).toContain('Pendaftaran kelas ini sudah dibatalkan.');
  });

  it('excludes unpaid registrations from direct refund links', async () => {
    const harness = await RouterTestingHarness.create('/my-courses/2/refund');
    expect(harness.routeNativeElement!.textContent).toContain('tidak tersedia untuk pembatalan');
    expect(harness.routeNativeElement!.textContent).not.toContain('Konfirmasi Pembatalan');
  });
});
