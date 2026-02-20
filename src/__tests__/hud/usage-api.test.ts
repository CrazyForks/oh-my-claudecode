/**
 * Tests for z.ai host validation, response parsing, and getUsage routing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isZaiHost, parseZaiResponse, getUsage } from '../../hud/usage-api.js';

// Mock dependencies that touch filesystem / keychain / network
vi.mock('../../utils/paths.js', () => ({
  getClaudeConfigDir: () => '/tmp/test-claude',
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue('{}'),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue(''),
}));

vi.mock('https', () => ({
  default: {
    request: vi.fn(),
  },
}));

describe('isZaiHost', () => {
  it('accepts exact z.ai hostname', () => {
    expect(isZaiHost('https://z.ai')).toBe(true);
    expect(isZaiHost('https://z.ai/')).toBe(true);
    expect(isZaiHost('https://z.ai/v1')).toBe(true);
  });

  it('accepts subdomains of z.ai', () => {
    expect(isZaiHost('https://api.z.ai')).toBe(true);
    expect(isZaiHost('https://api.z.ai/v1/messages')).toBe(true);
    expect(isZaiHost('https://foo.bar.z.ai')).toBe(true);
  });

  it('rejects hosts that merely contain z.ai as substring', () => {
    expect(isZaiHost('https://z.ai.evil.tld')).toBe(false);
    expect(isZaiHost('https://notz.ai')).toBe(false);
    expect(isZaiHost('https://z.ai.example.com')).toBe(false);
  });

  it('rejects unrelated hosts', () => {
    expect(isZaiHost('https://api.anthropic.com')).toBe(false);
    expect(isZaiHost('https://example.com')).toBe(false);
    expect(isZaiHost('https://localhost:8080')).toBe(false);
  });

  it('rejects invalid URLs gracefully', () => {
    expect(isZaiHost('')).toBe(false);
    expect(isZaiHost('not-a-url')).toBe(false);
    expect(isZaiHost('://missing-protocol')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isZaiHost('https://Z.AI/v1')).toBe(true);
    expect(isZaiHost('https://API.Z.AI')).toBe(true);
  });
});

describe('parseZaiResponse', () => {
  it('returns null for empty response', () => {
    expect(parseZaiResponse({})).toBeNull();
    expect(parseZaiResponse({ data: {} })).toBeNull();
    expect(parseZaiResponse({ data: { limits: [] } })).toBeNull();
  });

  it('returns null when no known limit types exist', () => {
    const response = {
      data: {
        limits: [{ type: 'UNKNOWN_LIMIT', percentage: 50 }],
      },
    };
    expect(parseZaiResponse(response)).toBeNull();
  });

  it('parses TOKENS_LIMIT as fiveHourPercent', () => {
    const response = {
      data: {
        limits: [
          { type: 'TOKENS_LIMIT', percentage: 42, nextResetTime: Date.now() + 3600_000 },
        ],
      },
    };

    const result = parseZaiResponse(response);
    expect(result).not.toBeNull();
    expect(result!.fiveHourPercent).toBe(42);
    expect(result!.fiveHourResetsAt).toBeInstanceOf(Date);
  });

  it('parses TIME_LIMIT as monthlyPercent', () => {
    const response = {
      data: {
        limits: [
          { type: 'TOKENS_LIMIT', percentage: 10 },
          { type: 'TIME_LIMIT', percentage: 75, nextResetTime: Date.now() + 86400_000 },
        ],
      },
    };

    const result = parseZaiResponse(response);
    expect(result).not.toBeNull();
    expect(result!.monthlyPercent).toBe(75);
    expect(result!.monthlyResetsAt).toBeInstanceOf(Date);
  });

  it('does not set weeklyPercent (z.ai has no weekly quota)', () => {
    const response = {
      data: {
        limits: [
          { type: 'TOKENS_LIMIT', percentage: 50 },
        ],
      },
    };

    const result = parseZaiResponse(response);
    expect(result).not.toBeNull();
    expect(result!.weeklyPercent).toBeUndefined();
  });

  it('clamps percentages to 0-100', () => {
    const response = {
      data: {
        limits: [
          { type: 'TOKENS_LIMIT', percentage: 150 },
          { type: 'TIME_LIMIT', percentage: -10 },
        ],
      },
    };

    const result = parseZaiResponse(response);
    expect(result).not.toBeNull();
    expect(result!.fiveHourPercent).toBe(100);
    expect(result!.monthlyPercent).toBe(0);
  });

  it('parses monthly-only limited state (TIME_LIMIT without TOKENS_LIMIT)', () => {
    const resetTime = Date.now() + 86400_000 * 7;
    const response = {
      data: {
        limits: [
          { type: 'TIME_LIMIT', percentage: 90, nextResetTime: resetTime },
        ],
      },
    };

    const result = parseZaiResponse(response);
    expect(result).not.toBeNull();
    expect(result!.fiveHourPercent).toBe(0); // clamped from undefined
    expect(result!.monthlyPercent).toBe(90);
    expect(result!.monthlyResetsAt).toBeInstanceOf(Date);
    expect(result!.monthlyResetsAt!.getTime()).toBe(resetTime);
    expect(result!.weeklyPercent).toBeUndefined();
  });

  it('handles TIME_LIMIT without nextResetTime', () => {
    const response = {
      data: {
        limits: [
          { type: 'TOKENS_LIMIT', percentage: 10 },
          { type: 'TIME_LIMIT', percentage: 50 },
        ],
      },
    };

    const result = parseZaiResponse(response);
    expect(result).not.toBeNull();
    expect(result!.monthlyPercent).toBe(50);
    expect(result!.monthlyResetsAt).toBeNull();
  });
});

describe('fetchCustomRateLimits via getUsage', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OMC_HUD_RATE_LIMIT_CMD;
    delete process.env.ANTHROPIC_BASE_URL;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns null when OMC_HUD_RATE_LIMIT_CMD is not set', async () => {
    const result = await getUsage();
    expect(result).toBeNull();
  });

  it('returns custom data when command outputs valid JSON', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'echo \'{"used":300,"limit":1000}\'';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce('{"used":300,"limit":1000}');

    const result = await getUsage();
    expect(result).not.toBeNull();
    expect(result!.customPercent).toBe(30);
    expect(result!.customResetsAt).toBeNull();
    expect(result!.customLabel).toBeUndefined();
  });

  it('uses custom label from command output', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'myapi-limits';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce('{"used":500,"limit":1000,"label":"myapi"}');

    const result = await getUsage();
    expect(result).not.toBeNull();
    expect(result!.customPercent).toBe(50);
    expect(result!.customLabel).toBe('myapi');
  });

  it('parses reset as Unix seconds timestamp', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'check-limits';

    const resetSec = Math.floor((Date.now() + 3600_000) / 1000);
    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce(JSON.stringify({ used: 100, limit: 1000, reset: resetSec }));

    const result = await getUsage();
    expect(result).not.toBeNull();
    expect(result!.customResetsAt).toBeInstanceOf(Date);
    // Allow 5s tolerance for test timing
    expect(result!.customResetsAt!.getTime()).toBeCloseTo(resetSec * 1000, -4);
  });

  it('parses reset as Unix milliseconds timestamp', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'check-limits';

    const resetMs = Date.now() + 3600_000;
    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce(JSON.stringify({ used: 100, limit: 1000, reset: resetMs }));

    const result = await getUsage();
    expect(result).not.toBeNull();
    expect(result!.customResetsAt).toBeInstanceOf(Date);
    expect(result!.customResetsAt!.getTime()).toBeCloseTo(resetMs, -4);
  });

  it('parses reset as ISO 8601 string', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'check-limits';

    const resetIso = new Date(Date.now() + 3600_000).toISOString();
    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce(JSON.stringify({ used: 100, limit: 1000, reset: resetIso }));

    const result = await getUsage();
    expect(result).not.toBeNull();
    expect(result!.customResetsAt).toBeInstanceOf(Date);
  });

  it('returns null when command outputs invalid JSON', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'bad-cmd';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce('not json at all');

    const result = await getUsage();
    expect(result).toBeNull();
  });

  it('returns null when command throws (timeout / missing binary)', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'nonexistent-binary';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementationOnce(() => { throw new Error('command not found'); });

    const result = await getUsage();
    expect(result).toBeNull();
  });

  it('returns null when limit is zero (avoids division by zero)', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'check-limits';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce('{"used":0,"limit":0}');

    const result = await getUsage();
    expect(result).toBeNull();
  });

  it('clamps custom percent to 0-100', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'check-limits';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce('{"used":2000,"limit":1000}');

    const result = await getUsage();
    expect(result).not.toBeNull();
    expect(result!.customPercent).toBe(100);
  });

  it('merges custom data with built-in Anthropic data when both available', async () => {
    process.env.OMC_HUD_RATE_LIMIT_CMD = 'check-limits';
    process.env.ANTHROPIC_BASE_URL = 'https://z.ai';
    process.env.ANTHROPIC_AUTH_TOKEN = 'token';

    const { execSync } = await import('child_process');
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockReturnValueOnce('{"used":400,"limit":1000,"label":"api"}');

    // z.ai fetch returns null (no mock wired for https)
    const httpsModule = await import('https') as unknown as { default: { request: ReturnType<typeof vi.fn> } };
    // https.request not wired → fetchUsageFromZai → null

    const result = await getUsage();
    // Even if z.ai returned null, custom data is present
    expect(result).not.toBeNull();
    expect(result!.customPercent).toBe(40);
    expect(result!.customLabel).toBe('api');
  });
});

describe('getUsage routing', () => {
  const originalEnv = { ...process.env };
  let httpsModule: { default: { request: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset env
    delete process.env.ANTHROPIC_BASE_URL;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    // Get the mocked https module for assertions
    httpsModule = await import('https') as unknown as typeof httpsModule;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns null when no credentials and no z.ai env', async () => {
    const result = await getUsage();
    expect(result).toBeNull();
    // No network call should be made without credentials
    expect(httpsModule.default.request).not.toHaveBeenCalled();
  });

  it('routes to z.ai when ANTHROPIC_BASE_URL is z.ai host', async () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/v1';
    process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';

    // https.request mock not wired, so fetchUsageFromZai resolves to null
    const result = await getUsage();
    expect(result).toBeNull();

    // Verify z.ai quota endpoint was called
    expect(httpsModule.default.request).toHaveBeenCalledTimes(1);
    const callArgs = httpsModule.default.request.mock.calls[0][0];
    expect(callArgs.hostname).toBe('api.z.ai');
    expect(callArgs.path).toBe('/api/monitor/usage/quota/limit');
  });

  it('does NOT route to z.ai for look-alike hosts', async () => {
    process.env.ANTHROPIC_BASE_URL = 'https://z.ai.evil.tld/v1';
    process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';

    const result = await getUsage();
    expect(result).toBeNull();

    // Should NOT call https.request with z.ai endpoint.
    // Falls through to OAuth path which has no credentials (mocked),
    // so no network call should be made at all.
    expect(httpsModule.default.request).not.toHaveBeenCalled();
  });
});
