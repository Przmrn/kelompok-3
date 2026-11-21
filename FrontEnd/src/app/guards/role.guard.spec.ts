import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { routes } from '../app.routes';

describe('Pengalihan tamu ke halaman Login', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
    { provide: AuthService, useValue: { user: () => null } }] }));
  for (const destination of ['/admin/dashboard', '/teaching-schedule', '/cart', '/payments/1']) {
    it('melindungi ' + destination + ' dan menyimpan tujuan semula', async () => {
      const harness = await RouterTestingHarness.create(destination);
      const router = TestBed.inject(Router);
      const url = router.parseUrl(router.url);
      expect(url.root.children['primary'].segments[0].path).toBe('login');
      expect(url.queryParams['returnUrl']).toBe(destination);
      expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain('Masuk');
      expect(harness.routeNativeElement!.querySelector('input[type=password]')).not.toBeNull();
    });
  }
});
