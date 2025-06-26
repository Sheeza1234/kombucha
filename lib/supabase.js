// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjwnczspgtbqkhrmvfxq.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd25jenNwZ3RicWtocm12ZnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDIyNjEsImV4cCI6MjA2NDExODI2MX0.tS8kfjTbjjspTI2SZd4LfdMK0qkD0zdEDIA57OMRak8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
