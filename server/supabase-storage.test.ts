import { describe, it, expect } from 'vitest';

describe('Supabase Storage Configuration', () => {
  it('should have SUPABASE_PROJECT_URL configured', () => {
    const url = process.env.SUPABASE_PROJECT_URL;
    expect(url).toBeDefined();
    expect(url).toContain('supabase.co');
  });

  it('should have SUPABASE_ANON_PUBLIC_KEY configured', () => {
    const key = process.env.SUPABASE_ANON_PUBLIC_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it('should have SUPABASE_SERVICE_ROLE configured', () => {
    const key = process.env.SUPABASE_SERVICE_ROLE;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it('should have SUPABASE_S3_ACCESS_KEY_ID configured', () => {
    const key = process.env.SUPABASE_S3_ACCESS_KEY_ID;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it('should have SUPABASE_S3_SECRET_KEY configured', () => {
    const key = process.env.SUPABASE_S3_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it('should be able to connect to Supabase API', async () => {
    const url = process.env.SUPABASE_PROJECT_URL;
    const key = process.env.SUPABASE_ANON_PUBLIC_KEY;
    
    if (!url || !key) {
      console.log('Supabase credentials not configured, skipping connection test');
      return;
    }

    // Test the Supabase REST API health endpoint
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });

    // Supabase returns 200 for valid credentials
    expect(response.status).toBeLessThan(500);
  }, 10000);
});
