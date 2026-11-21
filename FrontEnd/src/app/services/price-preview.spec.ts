import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { CourseSystemService } from './course-system.service';

describe('Preview cicilan sesuai aturan server', () => {
  let service: CourseSystemService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { user: () => null } }] });
    service = TestBed.inject(CourseSystemService);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-11-21T12:00:00Z'));
  });
  afterEach(() => jasmine.clock().uninstall());

  it('memulai jatuh tempo pada tanggal registrasi', () => {
    expect(service.calculatePriceBreakdown(1000000, 1).installmentPreviews[0].schedules.map(s => s.dueDate))
      .toEqual(['2026-11-21', '2026-12-21', '2027-01-21']);
  });
  it('menjepit akhir bulan tanpa menggeser tanggal bulan berikutnya', () => {
    jasmine.clock().mockDate(new Date('2028-01-31T12:00:00Z'));
    expect(service.calculatePriceBreakdown(1000000, 1).installmentPreviews[0].schedules.map(s => s.dueDate))
      .toEqual(['2028-01-31', '2028-02-29', '2028-03-31']);
  });
  it('tidak membuat cicilan negatif atau menagih melebihi total untuk harga rendah', () => {
    const calc = service.calculatePriceBreakdown(5000, 1);
    expect(calc.totalAmount).toBe(4995);
    for (const preview of calc.installmentPreviews) {
      expect(preview.schedules.every(s => s.amount >= 0)).toBeTrue();
      expect(preview.schedules.reduce((sum, s) => sum + s.amount, 0)).toBe(calc.totalAmount);
    }
    expect(calc.installmentPreviews[2].schedules.map(s => s.amount)).toEqual([1000,1000,1000,1000,995,0,0,0,0,0,0,0]);
  });
});
