// Data fetching functions for Supabase

import { supabase } from './supabase';
import type { Process, ProcessInsert, Log, LogInsert } from './database.types';

// Fetch all processes for the current user
export async function getProcesses(): Promise<Process[]> {
  const { data, error } = await supabase
    .from('processes')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .returns<Process[]>();

  if (error) {
    console.error('Error fetching processes:', error);
    return [];
  }

  return data ?? [];
}

// Fetch logs only for active (non-archived) processes
export async function getLogs(): Promise<Log[]> {
  type LogWithRelation = Log & { processes: { id: string } };

  const { data, error } = await supabase
    .from('logs')
    .select('id, process_id, logged_at, created_at, processes!inner(id)')
    .is('processes.archived_at', null)
    .order('logged_at', { ascending: false })
    .returns<LogWithRelation[]>();

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return (data?.map(({ processes: _, ...log }) => log) ?? []);
}

// Toggle a log — caller provides the intended action to avoid a SELECT precheck
export async function toggleLog(
  processId: string,
  dateKey: string,
  shouldAdd: boolean
): Promise<{ action: 'added' | 'removed'; log?: Log }> {
  if (shouldAdd) {
    const insert: LogInsert = { process_id: processId, logged_at: dateKey };
    const { data, error } = await supabase
      .from('logs')
      .insert(insert)
      .select()
      .returns<Log[]>()
      .single();

    if (error) {
      // Duplicate — silently treat as success
      if (error.code === '23505') return { action: 'added' };
      console.error('Error adding log:', error);
      throw error;
    }

    return { action: 'added', log: data };
  }

  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('process_id', processId)
    .eq('logged_at', dateKey);

  if (error) {
    console.error('Error removing log:', error);
    throw error;
  }

  return { action: 'removed' };
}

// Add a new process
export async function createProcess(
  name: string,
  category: string,
  key: string,
  userId: string
): Promise<Process | null> {
  const insert: ProcessInsert = { name, category, key, user_id: userId };
  const { data, error } = await supabase
    .from('processes')
    .insert(insert)
    .select()
    .returns<Process[]>()
    .single();

  if (error) {
    console.error('Error creating process:', error);
    return null;
  }

  return data;
}

// Archive a process (soft delete)
export async function archiveProcess(processId: string): Promise<boolean> {
  const { error } = await supabase
    .from('processes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', processId);

  if (error) {
    console.error('Error archiving process:', error);
    return false;
  }

  return true;
}
