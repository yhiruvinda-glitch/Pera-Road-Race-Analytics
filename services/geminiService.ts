
import { GoogleGenAI } from "@google/genai";
import { RaceSession, Athlete, EventStandard } from "../types";
import { formatTime } from "../utils";

const COACH_PERSONA = `
You are a High-Performance Athletic Director and Sports Scientist for a elite University Running Team.
Your job is to provide data-driven, actionable analysis using the team's custom points system.

### POINT SYSTEM CONTEXT
- 1000 points = World-Class Gold Standard for that distance.
- Points are calculated using a power-law decay (k-factor) to account for physiological endurance limits.
- High points (>800) indicate elite collegiate performance.

### OUTPUT REQUIREMENTS
1. **Formatting**: You MUST use professional Markdown. Use Bold headings, bullet points, and Markdown TABLES for training schedules.
2. **Structure**:
   - **Executive Summary**: A high-level overview.
   - **Performance Insights**: Analyze specific metrics (pace consistency, point trends).
   - **Tactical Training Plan**: A structured 7-day table of workouts (VO2 Max, Threshold, Recovery, Long Run).
   - **Motivational Guidance**: Coach-like encouragement based on the data.
3. **Tone**: Direct, analytical, authoritative yet supportive. No generic "fluff."

If data is missing for specific fields, infer based on the available history or note the gap.
`;

export const generateCoachingReport = async (
  type: 'team' | 'session' | 'athlete',
  subjectId: string | undefined,
  data: { sessions: RaceSession[], athletes: Athlete[], standards: EventStandard[] }
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const standardsContext = data.standards.map(s => `${s.name}: Gold=${formatTime(s.goldTime)} (k=${s.kValue})`).join("; ");
  
  let promptContext = "";
  
  if (type === 'team') {
    const recentSessions = data.sessions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const athleteSummaries = data.athletes.filter(a => a.isActive).map(a => {
        const aResults = data.sessions.flatMap(s => s.results).filter(r => r.athleteId === a.id);
        const avgPts = aResults.length > 0 ? Math.round(aResults.reduce((s, r) => s + r.points, 0) / aResults.length) : 0;
        return `- ${a.name} (${a.faculty}): Avg ${avgPts} pts over ${aResults.length} events.`;
    }).join("\n");

    const sessionSummaries = recentSessions.map(s => {
       const evt = data.standards.find(st => st.id === s.eventId);
       const winner = s.results.length > 0 ? data.athletes.find(a => a.id === s.results[0].athleteId)?.name : "N/A";
       return `* ${s.name} (${evt?.name}) on ${s.date}: Winner ${winner}, ${s.results.length} participants.`;
    }).join("\n");

    promptContext = `
      STAKEHOLDER: TEAM OVERVIEW
      
      STANDARDS: ${standardsContext}
      
      ACTIVE ROSTER:
      ${athleteSummaries}

      RECENT COMPETITIONS:
      ${sessionSummaries}

      TASK: Analyze the team's current fitness block. Identify which faculty is dominating and provide a collective training strategy for the next 4 weeks to peak for an upcoming championship.
    `;

  } else if (type === 'session') {
    const session = data.sessions.find(s => s.id === subjectId);
    if (!session) return "Session not found.";
    
    const evt = data.standards.find(st => st.id === session.eventId);
    const resultsContext = session.results.map(r => {
        const a = data.athletes.find(at => at.id === r.athleteId);
        return `| ${r.rank} | ${a?.name || 'Unknown'} | ${formatTime(r.time)} | ${r.points} | ${r.tags.join(', ')} |`;
    }).join("\n");

    promptContext = `
      STAKEHOLDER: RACE SESSION ANALYSIS
      EVENT: ${session.name} (${evt?.name})
      DATE: ${session.date}
      
      RESULTS TABLE:
      | Rank | Athlete | Time | Points | Tags |
      |------|---------|------|--------|------|
      ${resultsContext}

      TASK: Provide a technical debrief. Evaluate if the "Gold Standard" was challenged. Identify the "Mover of the Week" (biggest overperformer) and suggest immediate recovery protocols.
    `;

  } else if (type === 'athlete') {
    const athlete = data.athletes.find(a => a.id === subjectId);
    if (!athlete) return "Athlete not found.";

    const athleteResults = data.sessions
      .flatMap(s => s.results.map(r => ({ ...r, date: s.date, eventName: s.name, eventId: s.eventId })))
      .filter(r => r.athleteId === athlete.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const raceHistory = athleteResults.map(r => {
         const evt = data.standards.find(st => st.id === r.eventId);
         return `- ${r.date}: ${r.eventName} (${evt?.name}) -> ${formatTime(r.time)} (${r.points} pts, Rank #${r.rank})`;
      }).join("\n");

    const pbs = athlete.personalBests.map(pb => {
        const evt = data.standards.find(s => s.id === pb.eventId);
        return `${evt?.name}: ${formatTime(pb.time)}`;
    }).join(", ");

    promptContext = `
      STAKEHOLDER: INDIVIDUAL ATHLETE PERFORMANCE
      ATHLETE: ${athlete.name} (${athlete.faculty}, Batch ${athlete.batch})
      PERSONAL BESTS: ${pbs}

      COMPETITION HISTORY (Latest First):
      ${raceHistory}

      TASK: Review this athlete's trajectory. Are they peaking or plateauing? Provide a highly specific 7-day training microcycle (in a Markdown table) designed to improve their specific weaknesses based on their race times.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: promptContext,
      config: {
        systemInstruction: COACH_PERSONA,
        temperature: 0.7,
      }
    });
    return response.text || "Report generation failed. Please verify data integrity.";
  } catch (error) {
    console.error("Gemini Coach Error:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
        return "API Key Error: Please ensure a valid Gemini API Key is configured in your environment.";
    }
    return "The Coach is currently unavailable. Please try again in a few minutes.";
  }
};
