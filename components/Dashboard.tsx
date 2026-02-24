"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ActivityGrid } from "./ActivityGrid";

import { useAuth } from "../lib/auth";

import { Login } from "./Login";
import { TrajectoryCard } from "./TrajectoryCard";
import { getProcesses, getLogs, toggleLog, createProcess, archiveProcess } from "../lib/data";
import type { Process, Log } from "../lib/database.types";
import { AddProcessModal } from "./AddProcessModal";
import { UserMenu } from "./UserMenu";
import { Onboarding } from "./Onboarding";

export function Dashboard() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading, signIn, signUp, signOut } = useAuth();

  // Track pending toggles to prevent duplicate rapid clicks
  const pendingTogglesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Cleanup pending toggles on unmount
  useEffect(() => {
    return () => {
      pendingTogglesRef.current.forEach((timeout) => clearTimeout(timeout));
      pendingTogglesRef.current.clear();
    };
  }, []);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [processesData, logsData] = await Promise.all([
          getProcesses(),
          getLogs(),
        ]);
        setProcesses(processesData);
        setLogs(logsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Check your Supabase connection.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleAddProcess = async (name: string, category: string, key: string) => {
    if (!user) return;

    const newProcess = await createProcess(name, category, key, user.id);
    if (newProcess) {
      setProcesses((prev) => [...prev, newProcess]);
    }
  };

  const handleDeleteProcess = useCallback(async (processId: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== processId));
    setLogs((prev) => prev.filter((l) => l.process_id !== processId));
    await archiveProcess(processId);
  }, []);
  

  const handleToggle = useCallback(async (processId: string, date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    const toggleKey = `${processId}-${dateKey}`;

    // Immediate optimistic UI update (no delay)
    let shouldAdd = false;
    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex(
        (l) => l.process_id === processId && l.logged_at === dateKey
      );

      if (existingIndex >= 0) {
        // Remove
        shouldAdd = false;
        return prevLogs.filter((_, index) => index !== existingIndex);
      } else {
        // Add (optimistic - will be replaced with real data)
        shouldAdd = true;
        const optimisticLog: Log = {
          id: `temp-${Date.now()}`,
          process_id: processId,
          logged_at: dateKey,
          created_at: new Date().toISOString(),
        };
        return [...prevLogs, optimisticLog];
      }
    });

    // Cancel any pending database write for this cell
    const existingTimeout = pendingTogglesRef.current.get(toggleKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Debounced database write (300ms delay)
    const timeout = setTimeout(async () => {
      try {
        const result = await toggleLog(processId, dateKey, shouldAdd);
        
        if (result.action === "added" && result.log) {
          // Replace optimistic log with real one
          setLogs((prevLogs) =>
            prevLogs.map((l) =>
              l.id.startsWith("temp-") && l.process_id === processId && l.logged_at === dateKey
                ? result.log!
                : l
            )
          );
        }
      } catch (err) {
        console.error("Failed to toggle log:", err);
        // Revert optimistic update on error
        const logsData = await getLogs();
        setLogs(logsData);
      } finally {
        pendingTogglesRef.current.delete(toggleKey);
      }
    }, 300); // 300ms debounce

    pendingTogglesRef.current.set(toggleKey, timeout);
  }, []);

  const today = new Date();
  const dateStr = today
    .toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

  // Convert logs to the format TrajectoryCard expects
  const getLogsForProcess = (processId: string) =>
    logs
      .filter((l) => l.process_id === processId)
      .map((l) => ({ logged_at: new Date(l.logged_at) }));

  // Convert logs to the format ActivityGrid expects
  const logsForGrid = logs.map((l) => ({
    process_id: l.process_id,
    logged_at: l.logged_at,
  }));



  // Convert processes to the format components expect
  const processesForGrid = processes.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || "",
    key: p.key || "code",
    ai_tag: p.ai_tag ?? null,
    ai_insight: p.ai_insight ?? null,
    ai_insight_log_count: p.ai_insight_log_count ?? null,
  }));


  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }
  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onSignIn={signIn} onSignUp={signUp} />;
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="text-red-600 text-center">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2 text-[var(--text-muted)]">
            Make sure you have set up your .env.local file with Supabase credentials.
          </p>
        </div>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <>
        <Onboarding onAddProcess={() => setShowAddModal(true)} />
        <AddProcessModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProcess}
        />
      </>
    );
  }

  return (
    <div className="min-w-dvh flex flex-col items-center">
      <main className="w-full flex flex-col">
       <header className="flex justify-between items-start p-6 pb-4">
  <div>
    <h1 className="text-xl font-bold">Trajectorr</h1>
    <p className="text-sm text-gray-500">{dateStr}, TODAY</p>
  </div>
  
  <div className="flex items-center gap-2">
    <UserMenu userEmail={user?.email} onSignOut={signOut} />
    
    <button
      className="w-10 h-10 rounded-xl bg-[var(--bg-cell-empty)] flex items-center justify-center text-xl hover:bg-[var(--bg-base)] transition-colors"
      aria-label="Add process"
      onClick={() => setShowAddModal(true)}
    >
      +
    </button>
  </div>
</header>


        <section className="mt-6 w-fit max-w-[720px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="section-label">Activity Log</span>
            <div className="flex gap-3 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--bg-cell-empty)]" />
                Empty
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--process-code)]" />
                Logged
              </span>
            </div>
          </div>
        
          {processesForGrid.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p>No processes yet.</p>
              <p className="text-sm mt-1">Add your first process to start tracking.</p>
            </div>
          ) : (
            <ActivityGrid
              processes={processesForGrid}
              logs={logsForGrid}
              onToggle={handleToggle}
            />
          )}
        </section>

        <section className="mt-8 pb-6 w-fit mx-auto">
          <span className="section-label">Trajectory Layer</span>
          <div className="mt-3 space-y-3 w-[720px]">
            {processesForGrid.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                Trajectories will appear here once you add processes.
              </div>
            ) : (
              processesForGrid.map((process) => (
                <TrajectoryCard
                  key={process.id}
                  process={process}
                  logs={getLogsForProcess(process.id)}
                  onDelete={handleDeleteProcess}
                />
              ))
            )}
          </div>
        </section>
      </main>
      <AddProcessModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProcess}
      />
    </div>
  );
}
