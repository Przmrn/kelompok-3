import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { InstructorsPageComponent } from './instructors-page.component';

describe('Keahlian pengajar', () => {
  it('menampilkan keahlian lama per kartu dan menyimpan susunan hasil edit', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const fixture = TestBed.createComponent(InstructorsPageComponent);
    const page = fixture.componentInstance;
    const view: HTMLElement = fixture.nativeElement;
    const skills = () => Array.from(view.querySelector('ul.skill-list')!.children, li => li.textContent!.trim());
    fixture.detectChanges();
    expect(skills()).toEqual(['ASP.NET Core', 'SQL Server', 'PostgreSQL', 'Distributed Systems']);
    const instructor = page.svc.instructors()[0];
    page.editInstructor(instructor);
    fixture.detectChanges();
    view.querySelector<HTMLButtonElement>('button[aria-label="Pindahkan SQL Server lebih awal"]')!.click();
    view.querySelector<HTMLButtonElement>('button[aria-label="Hapus keahlian PostgreSQL"]')!.click();
    page.pendingSkill = 'Cloud, sql server';
    expect(page.svc.instructors()[0].expertise).toBe(instructor.expertise);
    page.saveInstructor();
    fixture.detectChanges();
    expect(skills()).toEqual(['SQL Server', 'ASP.NET Core', 'Distributed Systems', 'Cloud']);
    page.editInstructor(page.svc.instructors()[0]);
    expect(page.form.expertise).toEqual(skills());
  });
});
