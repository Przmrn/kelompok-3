import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { apiTestProviders, flushCourseData, instructor, loadCourseData } from '../../services/course-api.testing';
import { CourseSystemService } from '../../services/course-system.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('Dashboard admin - periksa keterlambatan', () => {
  async function openDashboard() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin/dashboard', component: AdminDashboardComponent }]),
        ...apiTestProviders('Admin'),
      ],
    });
    const service = await loadCourseData('Admin');
    const harness = await RouterTestingHarness.create('/admin/dashboard');
    harness.detectChanges();
    return {
      harness,
      service,
      http: TestBed.inject(HttpTestingController),
      view: harness.routeNativeElement!,
    };
  }

  function findButton(view: Element, text: string): HTMLButtonElement {
    const btn = Array.from(view.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(text)
    );
    expect(btn).withContext(`Tombol "${text}" harus ada`).toBeTruthy();
    return btn!;
  }

  it('memunculkan notifikasi jika tidak ada pembayaran yang terlambat', async () => {
    const { harness, service, http, view } = await openDashboard();
    expect(view.querySelector('section[aria-label="Pembayaran terlambat"]')).toBeNull();

    findButton(view, 'Periksa keterlambatan').click();
    harness.detectChanges();

    http.expectOne({ method: 'POST', url: '/api/Registration/process-overdue' }).flush({});
    await Promise.resolve();
    flushCourseData('Admin');
    await new Promise((resolve) => setTimeout(resolve, 0));
    harness.detectChanges();

    expect(view.querySelector('section[aria-label="Pembayaran terlambat"]')).toBeNull();
    expect(service.notification()).toEqual({
      type: 'info',
      title: 'Tidak ada keterlambatan',
      message: 'Tidak ada pembayaran yang terlambat.',
    });
    http.verify();
  });

  it('menampilkan daftar pembayaran terlambat dan dapat ditutup kembali', async () => {
    const { harness, service, http, view } = await openDashboard();

    findButton(view, 'Periksa keterlambatan').click();
    harness.detectChanges();

    http.expectOne({ method: 'POST', url: '/api/Registration/process-overdue' }).flush({});
    await Promise.resolve();
    flushCourseData('Admin', {
      phone: '',
      expertise: instructor.expertise,
      cancelled: false,
      paymentStatusOverrides: { 2: 'OVERDUE' },
      installmentStatusOverrides: { 30: 'OVERDUE' },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    harness.detectChanges();

    const overdueSection = view.querySelector('section[aria-label="Pembayaran terlambat"]');
    expect(overdueSection).not.toBeNull();
    expect(overdueSection!.textContent).toContain('2 terlambat');
    expect(overdueSection!.textContent).toContain('REG-2');
    expect(overdueSection!.textContent).toContain('REG-3');
    expect(overdueSection!.textContent).toContain('Cicilan ke-1');
    expect(overdueSection!.textContent).not.toContain('REG-1');
    expect(service.notification()).toEqual({
      type: 'warning',
      title: 'Pembayaran terlambat ditemukan',
      message: 'Ditemukan 2 pembayaran yang terlambat.',
    });

    findButton(overdueSection!, 'Tutup').click();
    harness.detectChanges();
    expect(view.querySelector('section[aria-label="Pembayaran terlambat"]')).toBeNull();
    http.verify();
  });

  it('tidak menampilkan notifikasi tanpa keterlambatan ketika permintaan server gagal', async () => {
    const { harness, service, http, view } = await openDashboard();

    findButton(view, 'Periksa keterlambatan').click();
    harness.detectChanges();

    http.expectOne({ method: 'POST', url: '/api/Registration/process-overdue' })
      .flush({ message: 'Gagal memproses tagihan.' }, { status: 500, statusText: 'Server Error' });
    await Promise.resolve();
    harness.detectChanges();

    expect(view.querySelector('section[aria-label="Pembayaran terlambat"]')).toBeNull();
    expect(service.notification()).toEqual({
      type: 'warning',
      title: 'Permintaan belum berhasil',
      message: 'Gagal memproses tagihan.',
    });
    http.verify();
  });
});
