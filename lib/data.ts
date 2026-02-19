// Data fetching functions for Supabase

import { supabase } from './supabase';
import type { Process, ProcessInsert, Log, LogInsert, Database } from './database.types';

// Fetch all processes for the current user
export async function getProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from('processes')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching processes:', error);
    return [];
  }

  return (data as Process[]) || [];
}

// Fetch all logs for the current user's processes
export async function getLogs(): Promise<Log[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('logged_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return (data as Log[]) || [];
}

// Toggle a log (add if not exists, remove if exists)
export async function toggleLog(
  processId: string, 
  date: Date
): Promise<{ action: 'added' | 'removed'; log?: Log }> {
  const dateKey = date.toISOString().split('T')[0];

  // Check if log exists
  const { data: existing, error: fetchError } = await supabase
    .from('logs')
    .select('*')
    .eq('process_id', processId)
    .eq('logged_at', dateKey)
    .maybeSingle();

  // Only throw on actual errors, not "not found"
  if (fetchError) {
    console.error('Error checking log:', fetchError);
    throw fetchError;
  }

  if (existing) {
    // Remove existing log
    const log = existing as Log;
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', log.id);

    if (error) {
      console.error('Error removing log:', error);
      throw error;
    }

    return { action: 'removed' };
  } else {
    // Add new log
    const { data, error } = await supabase
      .from('logs')
      .insert({
        process_id: processId,
        logged_at: dateKey,
      } as any)
      .select()
      .single();

    if (error) {
      // If it's a duplicate key error, just fetch and return the existing one
      if (error.code === '23505') { // PostgreSQL unique violation code
        const { data: existingLog } = await supabase
          .from('logs')
          .select('*')
          .eq('process_id', processId)
          .eq('logged_at', dateKey)
          .single();
        
        return { action: 'added', log: existingLog ? existingLog as Log : undefined };
      }
      
      console.error('Error adding log:', error);
      throw error;
    }

    return { action: 'added', log: data as Log };
  }
}

// Add a new process
export async function createProcess(
  name: string,
  category: string,
  key: string,
  userId: string
): Promise<Process | null> {
  const { data, error } = await supabase
    .from('processes')
    .insert({
      name,
      category,
      key,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating process:', error);
    return null;
  }

  return data as Process;
}

// Archive a process (soft delete)
export async function archiveProcess(processId: string): Promise<boolean> {
  const { error } = await supabase
    .from('processes')
    // @ts-ignore - Supabase type inference issue
    .update({ archived_at: new Date().toISOString() })
    .eq('id', processId);

  if (error) {
    console.error('Error archiving process:', error);
    return false;
  }

  return true;
}
