import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProcessTrajectory } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AiInsightResult {
  tag: string;
  insight: string;
}

const SYSTEM_PROMPT = `You are a behavioral pattern narrator for Trajectorr, a habit/process tracker.

CRITICAL: The process name IS the goal. Parse it carefully.
- "Sleep 8 hours" → the goal is 8 hours of quality sleep, not just sleeping. A log means they achieved it that day.
- "Run 5k" → the goal is running 5k, not just running. Each log = a completed 5k.
- "Read 30 min" → 30 minutes of reading per session.
- "Meditate" → a meditation session happened.
Each logged day means the user accomplished that specific goal, not a watered-down version of it.

Your job: Given a process and its tracking data, respond with valid JSON containing:
1. "tag" — a single word (ALL CAPS) capturing the current state. Be creative and specific to the process (e.g., RESTED, GRINDING, ANCHORED, FADING, SURGING, ROOTED, DRIFTING). Avoid generic labels.
2. "insight" — ONE concise sentence that:
   - Understands what the process name actually demands (the quality bar, the target, the intent)
   - Reflects the pattern honestly (frequency, consistency, gaps)
   - Speaks to the specific achievement, not a generic "sessions" count
   - Is forward-looking without being prescriptive (no "you should")

BAD: "Your sleep sessions are up to 9 per month" — treats it like generic counting
GOOD: "You've hit 8-hour sleep 9 times this month — consistency is building but weekday gaps suggest the routine isn't locked in yet."

Tone: Direct, observational, slightly nudging.

Respond ONLY with valid JSON. Example:
{"tag": "ANCHORING", "insight": "You're landing 8-hour sleep about every other day — the rhythm is forming but hasn't become automatic yet."}`;

export async function generateInsight(
  processName: string,
  trajectory: ProcessTrajectory,
  category?: string
): Promise<AiInsightResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const categoryContext = category ? ` (${category})` : '';
    const prompt = `Process: ${processName}${categoryContext}

Data:
- Status: ${trajectory.status}
- Frequency: ${trajectory.frequency.perWeek}/week (${trajectory.frequency.perMonth}/month), trend: ${trajectory.frequency.trend}
- Consistency: ${trajectory.consistency.score}% (avg gap: ${trajectory.consistency.avgGapDays} days)
- Pattern: ${trajectory.patterns.strongestDay ? `${trajectory.patterns.strongestDay}s show uptick` : 'No clear day pattern'}
- Weekend bias: ${trajectory.patterns.weekendBias > 0.2 ? 'weekend-heavy' : trajectory.patterns.weekendBias < -0.2 ? 'weekday-heavy' : 'balanced'}
- 30-day projection: ${trajectory.projection.thirtyDay} sessions (confidence: ${trajectory.projection.confidence})

Respond with JSON:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text) as { tag?: string; insight?: string };

    return {
      tag: (parsed.tag || trajectory.status).toUpperCase(),
      insight: parsed.insight || trajectory.insight,
    };
  } catch (error) {
    console.error("AI insight generation failed:", error);
    return {
      tag: trajectory.status.toUpperCase(),
      insight: trajectory.insight,
    };
  }
}
