import { TestBed } from '@angular/core/testing';
import { computed } from '@angular/core';
import { Profile } from './profile';
import { AuthService } from '../../core/auth/auth.service';
import { AuthUser } from '../../core/auth/auth.model';

describe('Profile', () => {
  async function setup(user: AuthUser | null) {
    const authService = {
      user: computed(() => user),
      status: computed(() => (user ? 'authenticated' : 'anonymous')),
    };

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return { fixture };
  }

  it('renders the current session details when a user is available', async () => {
    const { fixture } = await setup({
      id: 'user-1',
      email: 'pablo@mail.com',
      firstName: 'Pablo',
      lastName: 'Salut',
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Pablo');
    expect(compiled.textContent).toContain('pablo@mail.com');
    expect(compiled.textContent).toContain('authenticated');
    expect(compiled.textContent).toContain('user-1');
  });

  it('renders the anonymous fallback when there is no active session', async () => {
    const { fixture } = await setup(null);

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('There is no active session.');
  });
});
