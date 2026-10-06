import { describe, expect, it, vi } from 'vitest';
import { readEnv } from '@/lib/env';

describe('readEnv', () => {
  it('treats blank values as unset instead of failing', () => {
    expect(
      readEnv({
        APP_SECRET: '',
        BROWSER_WS_ENDPOINT: '   ',
        ADMIN_TOKEN: '',
      }),
    ).toEqual({});
  });

  it('ignores invalid optional values with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const env = readEnv({
      ADMIN_TOKEN: 'short',
      MONGODB_URI: 'mongodb+srv://u:p@c.example/db',
    });
    expect(env).toEqual({ MONGODB_URI: 'mongodb+srv://u:p@c.example/db' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ADMIN_TOKEN'));
    warn.mockRestore();
  });

  it('coerces numeric values', () => {
    expect(readEnv({ SMTP_PORT: '587' })).toEqual({
      SMTP_PORT: 587,
    });
  });

  it('accepts alternative variable names', () => {
    expect(readEnv({ EMAIL_PASSWORD: 'pw' })).toEqual({
      SMTP_PASSWORD: 'pw',
    });
  });
});
