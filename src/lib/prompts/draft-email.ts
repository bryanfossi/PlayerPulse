import type { Player, School, EmailDraftType } from '@/types/app'

export interface DraftEmailContext {
  player: Pick<
    Player,
    | 'first_name'
    | 'last_name'
    | 'grad_year'
    | 'gender'
    | 'primary_position'
    | 'secondary_position'
    | 'club_team'
    | 'highest_club_level'
    | 'high_school'
    | 'home_city'
    | 'home_state'
    | 'unweighted_gpa'
    | 'sat_score'
    | 'act_score'
    | 'highlight_url'
  >
  school: Pick<School, 'name' | 'verified_division' | 'city' | 'state' | 'conference'>
  draftType: EmailDraftType
  coachName?: string
  coachEmail?: string
  personalNote?: string
}

const DRAFT_TYPE_CONTEXT: Record<EmailDraftType, string> = {
  initial_outreach:
    'This is the player\'s first contact with this program. The email should introduce the player, express genuine interest in the program, briefly highlight key stats and accomplishments, and request next steps (questionnaire, visit, etc.).',
  follow_up:
    'The player has already contacted this program but has not received a response. The email should be brief, politely re-introduce the player, reference the prior outreach, and reiterate interest.',
  thank_you:
    'The player recently had a call or visit with this coaching staff. The email should thank the coach by name (if provided), reference specifics of their conversation, and reaffirm the player\'s interest.',
  campus_visit_request:
    'The player wants to schedule a campus visit (official or unofficial). The email should express strong interest, briefly restate key qualifications, and ask the coach about available visit dates.',
  offer_response:
    'The player received a scholarship or roster offer from this program. The email should express gratitude, confirm receipt of the offer, and indicate the player\'s timeline for making a decision.',
}

export function buildDraftEmailPrompt(ctx: DraftEmailContext): string {
  const { player: p, school: s, draftType, coachName, coachEmail, personalNote } = ctx

  const coachLine = coachName
    ? `Coach name: ${coachName}${coachEmail ? ` (${coachEmail})` : ''}`
    : 'Coach name: unknown — use "Coach [Last Name]" as a placeholder'

  const gpa = p.unweighted_gpa ? `Unweighted GPA: ${p.unweighted_gpa}` : ''
  const sat = p.sat_score ? `SAT: ${p.sat_score}` : ''
  const act = p.act_score ? `ACT: ${p.act_score}` : ''
  const testScores = [gpa, sat, act].filter(Boolean).join(' · ')

  const highlight = p.highlight_url
    ? `Highlight video: ${p.highlight_url}`
    : ''

  const highSchool = p.high_school ? `High school: ${p.high_school}` : ''

  return `You are an expert college soccer recruiting advisor. Write a professional, personalized recruiting email for this player.

OUTPUT FORMAT
Return ONLY valid JSON with exactly two fields: {"subject": "...", "body": "..."}
- subject: concise email subject line (no quotes around it inside JSON)
- body: full email text with natural paragraph breaks (use \\n for newlines inside the JSON string)
- Do NOT include any prose, explanation, or text outside the JSON object.
- Do NOT wrap in markdown code fences.

EMAIL CONTEXT
Draft type: ${draftType.replace(/_/g, ' ').toUpperCase()}
Context: ${DRAFT_TYPE_CONTEXT[draftType]}

PLAYER
Name: ${p.first_name} ${p.last_name}
Graduation year: ${p.grad_year}
Gender: ${p.gender}
Primary position: ${p.primary_position}${p.secondary_position ? ` / ${p.secondary_position}` : ''}
Club team: ${p.club_team} (${p.highest_club_level})
${highSchool}
Location: ${p.home_city}, ${p.home_state}
${testScores}
${highlight}

TARGET SCHOOL
School: ${s.name}
Division: ${s.verified_division ?? 'Unknown'}
Location: ${[s.city, s.state].filter(Boolean).join(', ') || 'Unknown'}
${s.conference ? `Conference: ${s.conference}` : ''}
${coachLine}

${personalNote ? `ADDITIONAL CONTEXT FROM PLAYER\n${personalNote}\n` : ''}
WRITING GUIDELINES
- First-person voice, player writing to coach
- Warm but professional tone — not overly casual, not stiff
- 150–250 words for initial outreach; 80–120 words for follow-up/thank-you
- Include 2–3 specific, concrete details about the player (position, club level, GPA if strong)
- Mention the specific school name and division, not generic placeholders
- End with a clear call-to-action
- Do NOT use generic phrases like "I have always dreamed of playing college soccer"
- Sign off as "${p.first_name} ${p.last_name}"`.trim()
}
