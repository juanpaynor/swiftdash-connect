'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function createPlatformAdmin(email: string, password: string) {
  const supabase = await createClient();
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Insert admin
  const { data, error } = await supabase
    .from('platform_admins')
    .insert({ email, password_hash: passwordHash })
    .select()
    .single();
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true, admin: data };
}

export async function loginPlatformAdmin(email: string, password: string) {
  const supabase = await createClient();
  
  // Get admin by email
  const { data: admin, error } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !admin) {
    return { error: 'Invalid credentials' };
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, admin.password_hash);
  
  if (!isValid) {
    return { error: 'Invalid credentials' };
  }
  
  // Set admin session cookie
  const cookieStore = await cookies();
  cookieStore.set('admin_session', JSON.stringify({ id: admin.id, email: admin.email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  return { success: true, admin: { id: admin.id, email: admin.email } };
}

export async function logoutPlatformAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return { success: true };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session) {
    return null;
  }
  
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}
