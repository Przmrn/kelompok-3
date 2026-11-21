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

  it('uses the server refund preview and opens the persisted cancellation detail', async () => {
    const harness = await RouterTestingHarness.create('/my-registrations');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/my-courses/jadwal');
    expect(harness.routeNativeElement!.textContent).toContain('Jadwal kelas');
    const refundLink = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href$="/refund"]')!;
    await harness.navigateByUrl(refundLink.pathname);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/Registration/1/cancellation-preview').flush({
      daysDifference: 16, totalPaid: 333000, refundPercentage: 100, floorAdminFee: 25000,
      estimatedRefundAmount: 308000, canCancel: true, tierLabel: '100% dikurangi biaya administrasi Rp25.000',
    });
    harness.detectChanges();
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
    expect(router.url).toBe('/payments/1');
    http.expectOne('/api/Registration/1/payment').flush({
      registrationId: 1, registrationNumber: 'REG-1', paymentMethod: 'INSTALLMENT',
      totalAmount: 999000, paidAmount: 333000, remainingAmount: 666000,
      paymentStatus: 'PARTIALLY_PAID', registrationStatus: 'CANCELLED', installmentSchedules: [],
      refundAmount: 308000, refundedAt: null,
    });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Refund tercatat');
    expect(harness.routeNativeElement!.textContent).toContain('Menunggu pengembalian dana');
    http.verify();
  });

  it('does not allow cancellation before the server preview loads and allows retry after a failure', async () => {
    const harness = await RouterTestingHarness.create('/my-courses/1/refund');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/Registration/1/cancellation-preview').flush({}, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).not.toContain('Konfirmasi Pembatalan');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('button')!.click();
    harness.detectChanges();
    http.expectOne('/api/Registration/1/cancellation-preview').flush({ daysDifference: 0, estimatedRefundAmount: 0, canCancel: false, reasonIfBlocked: 'Kelas sudah dimulai' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('button')!.disabled).toBeTrue();
    http.expectNone({ method: 'DELETE', url: '/api/Registration/1' });
    http.verify();
  });

  it('excludes unpaid registrations from direct refund links', async () => {
    const harness = await RouterTestingHarness.create('/my-courses/2/refund');
    expect(harness.routeNativeElement!.textContent).toContain('tidak tersedia untuk pembatalan');
    expect(harness.routeNativeElement!.textContent).not.toContain('Konfirmasi Pembatalan');
  });
});
