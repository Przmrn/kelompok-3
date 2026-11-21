import { HttpTestingController } from '@angular/common/http/testing';
import { apiTestProviders, flushCourseData, flushInstructorAssignments, loadCourseData } from '../../services/course-api.testing';
import { CourseSystemService } from '../../services/course-system.service';
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

  it('lists pending registrations alongside a partially paid class and shows the payment status of each', async () => {
    const harness = await RouterTestingHarness.create('/my-courses');
    const page = harness.routeNativeElement!;
    expect(page.querySelector('h1')?.textContent).toContain('Kelas saya (3)');
    expect(page.querySelector('a[href="/cart"]')?.textContent).toContain('(2)');
    const paid = page.querySelector('a[href="/payments/1"]')!.closest('article')!;
    expect(paid.textContent).toContain('Pendaftaran dikonfirmasi');
    expect(paid.textContent).toContain('Dibayar sebagian');
    for (const id of [2, 3]) {
      const card = page.querySelector(`a[href="/payments/${id}"]`)!.closest('article')!;
      expect(card.textContent).toContain('REG-' + id);
      expect(card.textContent).toContain('Menunggu konfirmasi pendaftaran');
      expect(card.textContent).toContain('Belum dibayar');
      expect(card.querySelector('a[href$="/refund"]')).toBeNull();
    }
  });

  it('shows the first newly saved registration even before the first payment', async () => {
    const service = TestBed.inject(CourseSystemService);
    const http = TestBed.inject(HttpTestingController);
    const reload = service.reload();
    flushCourseData('Guest');
    flushInstructorAssignments();
    http.expectOne('/api/Registration/me').flush([]);
    await reload;
    const harness = await RouterTestingHarness.create('/my-courses');
    expect(harness.routeNativeElement!.textContent).toContain('Anda belum mendaftar kelas');

    const registration = service.submitCourseRegistration(9, 'Upfront', null);
    const create = http.expectOne({ method: 'POST', url: '/api/Registration' });
    create.flush({ id: 8 });
    await Promise.resolve();
    flushCourseData('Guest');
    flushInstructorAssignments();
    http.expectOne('/api/Registration/me').flush([{
      id: 8, batchId: 9, registrationNumber: 'REG-8', queueNumber: 1, paymentMethod: 'UPFRONT',
      registrationStatus: 'PENDING', paymentStatus: 'PENDING', totalAmount: 999000, paidAmount: 0, installments: [],
    }]);
    expect((await registration).success).toBeTrue();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain('Kelas saya (1)');
    const card = harness.routeNativeElement!.querySelector('a[href="/payments/8"]')!.closest('article')!;
    expect(card.textContent).toContain('REG-8');
    expect(card.textContent).toContain('Belum dibayar');
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
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain('Kelas saya (2)');
    expect(harness.routeNativeElement!.textContent).not.toContain('Pendaftaran kelas ini sudah dibatalkan.');
    expect(harness.routeNativeElement!.querySelector('a[href="/payments/1"]')).toBeNull();
  });

  it('excludes unpaid registrations from direct refund links', async () => {
    const harness = await RouterTestingHarness.create('/my-courses/2/refund');
    expect(harness.routeNativeElement!.textContent).toContain('tidak tersedia untuk pembatalan');
    expect(harness.routeNativeElement!.textContent).not.toContain('Konfirmasi Pembatalan');
  });
});
