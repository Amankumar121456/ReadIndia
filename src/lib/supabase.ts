import { createClient } from '@supabase/supabase-js';

// These should be set in your .env file
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * GOOGLE SHEETS INTEGRATION
 * 
 * To sync data to Google Sheets, you would typically use a Webhook (e.g., Google Apps Script).
 * Set this environment variable to your Apps Script Webhook URL.
 */
export const GOOGLE_SHEETS_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || '';

/**
 * Background sync function to send data to Google Sheets without blocking the UI.
 */
export const syncToGoogleSheets = async (action: 'CREATE' | 'UPDATE' | 'DELETE', table: string, data: any) => {
  // Skip if no URL is provided or if it's a placeholder
  if (!GOOGLE_SHEETS_WEBHOOK_URL || GOOGLE_SHEETS_WEBHOOK_URL.includes('placeholder')) return;

  try {
    // Fire and forget - don't await this in the main thread if you don't want to block
    // mode: 'no-cors' is often required for Google Apps Script webhooks to prevent CORS errors in the browser
    fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        table,
        data,
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => {
      // Downgrade to warning since this is a background task and shouldn't break the app
      console.warn('Background sync note (can be ignored if webhook is not fully configured):', err.message);
    });
  } catch (error) {
    console.warn('Failed to trigger Google Sheets sync:', error);
  }
};
