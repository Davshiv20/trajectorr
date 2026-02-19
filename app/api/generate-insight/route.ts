import { NextRequest, NextResponse } from "next/server";
import { generateInsight } from "../../../lib/ai-insights";
import { supabase } from "../../../lib/supabase";
import type { Process } from "../../../lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const { processId, processName, category, trajectory, logCount } = await request.json();

    if (!processId || !processName || !trajectory || logCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check cache
    const { data: process, error: fetchError } = await supabase
      .from('processes')
      .select('*')
      .eq('id', processId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching process for cache check:', fetchError);
      return NextResponse.json(
        { error: "Failed to fetch process data" },
        { status: 500 }
      );
    }

    const cachedProcess = process as Process | null;

    // Return cached if log count unchanged and both tag + insight exist
    if (cachedProcess?.ai_insight && cachedProcess.ai_insight_log_count === logCount) {
      const cached = cachedProcess as Record<string, unknown>;
      return NextResponse.json({
        tag: (cached.ai_tag as string) || cachedProcess.ai_insight.split(' ')[0].toUpperCase(),
        insight: cachedProcess.ai_insight,
        cached: true,
      });
    }

    // Generate new tag + insight
    const result = await generateInsight(processName, trajectory, category);

    // Cache both tag and insight
    const updateData: Record<string, unknown> = {
      ai_insight: result.insight,
      ai_tag: result.tag,
      ai_insight_log_count: logCount,
      ai_insight_updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('processes')
      // @ts-ignore - Supabase type inference issue
      .update(updateData)
      .eq('id', processId);

    if (updateError) {
      console.error('Failed to cache insight:', updateError);
    }

    return NextResponse.json({
      tag: result.tag,
      insight: result.insight,
      cached: false,
    });
  } catch (error) {
    console.error("Error generating insight:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
