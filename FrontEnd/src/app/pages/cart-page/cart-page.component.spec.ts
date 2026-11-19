import { apiTestProviders, loadCourseData } from '../../services/course-api.testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { CartPageComponent } from './cart-page.component';

describe('Cart payment summary', () => {
  it('shows the full price for a single payment and only the first installment in the installment summary', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, ...apiTestProviders('Student')] });
    await loadCourseData('Student');

    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
    const cart: HTMLElement = fixture.nativeElement;
    const upfront = cart.querySelector('a[href="/payments/2"]')!.closest('.k-card')!;
    expect(upfront.textContent).toContain('Menunggu pembayaran');
    expect(upfront.textContent).toContain('Sekali bayar');
    expect(upfront.textContent).toContain('Rp1.318.125');
    expect(upfront.querySelector('a')!.textContent).toContain('Lihat rincian pembayaran');

    const card = cart.querySelector(`a[href="/payments/3"]`)!.closest('.k-card')!;
    expect(card.textContent).toContain('Cicilan 3 bulan');
    expect(card.textContent).toContain('Rp999.000');
    expect(card.textContent).toContain('Rp333.000');
    expect(card.querySelector('a')!.textContent).toContain('Lihat jadwal cicilan');
  });
});
