import type { SportConfig } from '@/lib/sports'

export interface AnalyzeReplyContext {
  first_name: string
  last_name: string
  primary_position: string
  grad_year: number
  highest_club_level: string
  school_name: string
  verified_division: string | null
  tier: string | null
  overall_score: number | null
  coach_message: string
  sport: SportConfig
}

export function buildAnalyzeReplyPrompt(ctx: AnalyzeReplyContext): string {
  return `SPORT CONTEXT
${ctx.sport.aiPromptContext}

Player: ${ctx.first_name} ${ctx.last_name}
Position: ${ctx.primary_position}
Grad Year: ${ctx.grad_year}
Club Level: ${ctx.highest_club_level}

School: ${ctx.school_name}
Division: ${ctx.verified_division ?? 'Unknown'}
Player's tier for this school: ${ctx.tier ?? 'Not set'} (Lock/Realistic/Reach)
Player's fit score: ${ctx.overall_score != null ? `${ctx.overall_score}/100` : 'N/A'}

Coach's message:
"""
${ctx.coach_message}
"""

Analyze this message and return:
{
  "interest_level": "High|Medium|Low|Unclear",
  "interest_explanation": "one sentence explaining the interest signal",
  "tone_label": "short descriptive label (e.g. Warm and personal / Professional but guarded / Generic recruiting template)",
  "tone_explanation": "one sentence explaining the tone assessment",
  "key_signals": ["signal 1", "signal 2", "signal 3"],
  "next_step": "specific actionable step for the player to take",
  "next_step_urgency": "High|Medium|Low"
}

Consider:
- Is the coach using generic recruiting language or personalizing to this player?
- Did they mention watching the player play, reviewing film, or seeing stats?
- Did they mention scholarships, roster needs, or timeline?
- Did they ask for anything (transcript, visit, questionnaire)?
- What is NOT said that a more interested coach would typically say?
- Factor in the player's division tier — a D3 coach at "Lock" level showing medium interest reads differently than a D1 reach school showing the same signal.`
}
