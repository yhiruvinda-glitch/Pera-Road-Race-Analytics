import { GoogleGenAI } from "@google/genai";
import { RaceSession, Athlete, EventStandard } from "../types";
import { formatTime } from "../utils";

const COACH_PERSONA = `
You are an endurance coach, data analyst, and sports scientist for a university running team.
Your job is to analyze performance, provide coaching advice, guide motivation, and track athlete progress using the team’s ranking system.

1. Parse and Understand the Data provided in the prompt.
2. Use the Team’s Points System context (Points = 1000 * (GoldTime / Time)^kValue).
3. Athlete-Specific Coaching Feedback:
   - Identify Strengths & Weaknesses
   - Analyze Fitness indicators
   - Suggest Needed training focus
   - Provide Race execution notes
   - Assess Psychological readiness
4. Team-Level Analysis:
   - Team average points
   - Point distribution
   - Biggest improvements
5. Training Prescription Behavior. Based on results, you MUST be able to suggest:
   - VO₂max sessions
   - Lactate threshold workouts
   - Speed & neuromuscular drills
   - Race-pace workouts
   - Long-run plans
   - Taper strategies
   - Injury-safe alternatives (cycling, cross training)
   - Make training progressive, evidence-based, distance-specific, and individually tailored.
   - Address weakest areas collectively.
   - Provide recommendations for group workouts.
6. Your personality should be:
   - Motivational but honest
   - Data-driven
   - Clear and concise
   - No fluff, no generic motivation
   - Coach-like authority + supportive tone
`;

export const generateCoachingReport = async (
  type: 'team' | 'session' | 'athlete',
  subjectId: string | undefined,
  data: { sessions: RaceSession[], athletes: Athlete[], standards: EventStandard[] }
): Promise<string> => {
  // Initialization: Always use process.env.API_KEY directly as per guidelines.
  // The SDK expects a named parameter: { apiKey: string }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Serialize Context
  const standardsContext = data.standards.map(s => `${s.name}: Gold=${formatTime(s.goldTime)} (k=${s.kValue})`).join("; ");
  
  let promptContext = "";
  
  if (type === 'team') {
    // Summarize team data to avoid token limits if many sessions
    const recentSessions = data.sessions.slice(0, 5); // Analyze last 5 sessions depth
    const athleteSummaries = data.athletes.map(a => {
        const raceCount = data.sessions.reduce((acc, s) => acc + (s.results.some(r => r.athleteId === a.id) ? 1 : 0), 0);
        return `${a.name} (${a.faculty}): ${raceCount} races`;
    }).join("\n");

    const sessionSummaries = recentSessions.map(s => {
       const evt = data.standards.find(st => st.id === s.eventId);
       const winner = s.results.length > 0 ? data.athletes.find(a => a.id === s.results[0].athleteId)?.name : "Unknown";
       return `Race: ${s.name} (${evt?.name}), Date: ${s.date}, Winner: ${winner}, Participants: ${s.results.length}`;
    }).join("\n");

    promptContext = `
      Data Context:
      Event Standards: ${standardsContext}
      
      Roster:
      ${athleteSummaries}

      Recent Sessions:
      ${sessionSummaries}

      Task: Provide a Team Overview and Strategic Plan for the upcoming training block. Focus on group weaknesses and collective improvements.
    `;

  } else if (type === 'session') {
    const session = data.sessions.find(s => s.id === subjectId);
    if (!session) return "Session not found.";
    
    const evt = data.standards.find(st => st.id === session.eventId);
    const resultsContext = session.results.map(r => {
        const a = data.athletes.find(at => at.id === r.athleteId);
        return `${r.rank}. ${a?.name || 'Unknown'} - Time: ${formatTime(r.time)} (${r.points} pts) [${r.tags.join(', ')}]`;
    }).join("\n");

    promptContext = `
      Data Context:
      Event Standards: ${standardsContext}
      
      Analyzing Race Session:
      Name: ${session.name}
      Event: ${evt?.name}
      Date: ${session.date}
      Mandatory: ${session.isMandatory}
      
      Results:
      ${resultsContext}

      Task: Provide a detailed post-race analysis. Identify standout performances, underperformers, and prescribe the training focus for the next week based on this race's demands.
    `;

  } else if (type === 'athlete') {
    const athlete = data.athletes.find(a => a.id === subjectId);
    if (!athlete) return "Athlete not found.";

    // Get athlete history
    const raceHistory = data.sessions
      .filter(s => s.results.some(r => r.athleteId === athlete.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
      .map(s => {
         const r = s.results.find(res => res.athleteId === athlete.id);
         const evt = data.standards.find(st => st.id === s.eventId);
         return `Date: ${s.date}, Race: ${s.name} (${evt?.name}), Time: ${formatTime(r?.time || 0)}, Points: ${r?.points}, Rank: ${r?.rank}`;
      }).join("\n");

    const pbs = athlete.personalBests.map(pb => {
        const evt = data.standards.find(s => s.id === pb.eventId);
        return `${evt?.name}: ${formatTime(pb.time)}`;
    }).join(", ");

    promptContext = `
      Data Context:
      Event Standards: ${standardsContext}

      Analyzing Athlete: ${athlete.name}
      Faculty: ${athlete.faculty}
      Personal Bests: ${pbs}

      Recent Race History:
      ${raceHistory}

      Task: Provide a specific coaching report for this athlete. Analyze their progression, consistency, and points trajectory. Prescribe specific workouts to break their current plateaus.
    `;
  }

  try {
    // Model Selection: Using 'gemini-3-pro-preview' for advanced reasoning and strategic coaching analysis.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: promptContext,
      config: {
        systemInstruction: COACH_PERSONA,
      }
    });
    // Accessing the generated text via the .text property as per guidelines.
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Coach Error:", error);
    return "Error generating coaching insight. Please check your API configuration or try again later.";
  }
};
