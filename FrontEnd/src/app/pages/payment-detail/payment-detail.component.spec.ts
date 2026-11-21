import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { apiTestProviders, flushCourseData, loadCourseData } from '../../services/course-api.testing';
import { PaymentDetailPageComponent } from './payment-detail.component';

describe('Rincian pembayaran', () => {
  const endpoint = '/api/Registration/3/payment';
  const payment = {
    registrationId: 3, registrationNumber: 'REG-3', paymentMethod: 'INSTALLMENT',
    totalAmount: 999000, paidAmount: 200000, remainingAmount: 799000, paidAt: '2026-11-20T04:00:00Z',
    paymentStatus: 1, registrationStatus: 1, installmentSchedules: [
      { id: 30, registrationId: 3, installmentNumber: 1, amount: 333000, paidAmount: 200000,
        remainingAmount: 133000, installmentStatus: 0, dueDate: '2026-12-20', paidAt: '2026-11-20T04:00:00Z' },
      { id: 31, registrationId: 3, installmentNumber: 2, amount: 333000, paidAmount: 0,
        remainingAmount: 333000, installmentStatus: 0, dueDate: '2027-01-20', paidAt: null },
    ],
  };

  async function open(role: 'Admin' | 'Student') {
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'payments/:registrationId', component: PaymentDetailPageComponent }]),
      ...apiTestProviders(role),
    ] });
    await loadCourseData(role);
    const harness = await RouterTestingHarness.create('/payments/3');
    return { harness, http: TestBed.inject(HttpTestingController), view: harness.routeNativeElement! };
  }

  it('mengirim nominal parsial untuk cicilan pertama yang belum lunas dan memuat kembali saldonya', async () => {
    const { harness, http, view } = await open('Admin');
    http.expectOne({ method: 'GET', url: endpoint }).flush(payment);
    harness.detectChanges();
    const input = view.querySelector<HTMLInputElement>('input[type=number]')!;
    expect(input.valueAsNumber).toBe(133000);
    expect(view.querySelectorAll('form').length).toBe(1);
    input.value = '133001';
    expect(input.checkValidity()).toBeFalse();
    input.value = '50000';
    input.form!.requestSubmit();
    const write = http.expectOne({ method: 'POST', url: '/api/Registration/installments/30/confirm' });
    expect(write.request.body).toEqual({ paidAmount: 50000 });
    const updated = { ...payment, paidAmount: 250000, remainingAmount: 749000,
      installmentSchedules: [{ ...payment.installmentSchedules[0], paidAmount: 250000, remainingAmount: 83000 },
        payment.installmentSchedules[1]] };
    write.flush(updated);
    await Promise.resolve();
    flushCourseData('Admin');
    harness.detectChanges();
    http.expectOne(endpoint).flush(updated);
    harness.detectChanges();
    expect(view.querySelector<HTMLInputElement>('input')!.valueAsNumber).toBe(83000);
    http.verify();
  });

  it('memberi peserta akses baca dan memuat ulang rincian setelah gangguan', async () => {
    const { harness, http, view } = await open('Student');
    http.expectOne(endpoint).flush({}, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    view.querySelector<HTMLButtonElement>('button')!.click();
    harness.detectChanges();
    http.expectOne(endpoint).flush(payment);
    harness.detectChanges();
    expect(view.textContent).toContain('Pembayaran terakhir');
    expect(view.querySelector('form')).toBeNull();
    expect(view.textContent).not.toContain('Konfirmasi cicilan');
    http.verify();
  });

  it('mencatat konfirmasi refund admin dan menampilkan referensi pengembalian dana', async () => {
    const { harness, http, view } = await open('Admin');
    const cancelled = { ...payment, registrationStatus: 'CANCELLED', refundAmount: 75000, refundedAt: null };
    http.expectOne(endpoint).flush(cancelled);
    harness.detectChanges();
    const reference = view.querySelector<HTMLInputElement>('#refund-reference')!;
    reference.value = 'BANK-123';
    reference.form!.requestSubmit();
    const write = http.expectOne({ method: 'POST', url: '/api/Registration/3/confirm-refund' });
    expect(write.request.body).toEqual({ reference: 'BANK-123' });
    write.flush({});
    await Promise.resolve();
    flushCourseData('Admin');
    harness.detectChanges();
    http.expectOne(endpoint).flush({ ...cancelled, refundedAt: '2026-11-21T12:00:00Z', refundReference: 'BANK-123' });
    harness.detectChanges();
    expect(view.textContent).toContain('Dana sudah dikembalikan');
    expect(view.textContent).toContain('BANK-123');
    expect(view.querySelector('#refund-reference')).toBeNull();
    http.verify();
  });

  it('peserta dapat membaca refund tetapi tidak dapat mengonfirmasi pengembaliannya', async () => {
    const { harness, http, view } = await open('Student');
    http.expectOne(endpoint).flush({ ...payment, registrationStatus: 'CANCELLED', refundAmount: 75000, refundedAt: null });
    harness.detectChanges();
    expect(view.textContent).toContain('Menunggu pengembalian dana');
    expect(view.querySelector('form')).toBeNull();
    http.verify();
  });
});
