import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { CourseSystemService } from '../../services/course-system.service';
import { CartPageComponent } from './cart-page.component';

describe('Cart payment summary', () => {
  it('shows the full price for a single payment and only the first installment on the installment pay button', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const svc = TestBed.inject(CourseSystemService);
    svc.switchDemoUser(1);
    const installment = svc.submitCourseRegistration({
      userId: 1,
      batchId: 3,
      paymentMethod: 'Installment',
      installmentTenor: 3,
      simulateInitialPaymentConfirmed: false,
    });
    expect(installment.success).toBeTrue();

    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
    const cart: HTMLElement = fixture.nativeElement;
    const upfront = cart.querySelector('a[href="/payments/2"]')!.closest('.k-card')!;
    expect(upfront.textContent).toContain('Menunggu pembayaran');
    expect(upfront.textContent).toContain('Sekali bayar');
    expect(upfront.querySelector('.btn-k-coral')!.textContent).toContain('Bayar Rp1.318.125 sekarang');
    expect(upfront.querySelector('a')!.textContent).toContain('Lihat rincian pembayaran');

    const card = cart.querySelector(`a[href="/payments/${installment.registration!.id}"]`)!.closest('.k-card')!;
    expect(card.textContent).toContain('Cicilan 3 bulan');
    expect(card.textContent).toContain('Rp999.000');
    expect(card.querySelector('.btn-k-coral')!.textContent).toContain('Bayar Rp333.000 sekarang');
    expect(card.querySelector('a')!.textContent).toContain('Lihat jadwal cicilan');
  });
});
