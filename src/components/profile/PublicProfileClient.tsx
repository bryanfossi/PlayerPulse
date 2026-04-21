'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import type { PlayerAward, PlayerEvent, ScheduleEntry, HighlightClip } from '@/types/app'

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD = '#D4AF37'
const GOLD_LIGHT = '#E8CC6E'
const DARK = '#050505'
const DARK_CARD = '#0A0A0A'
const DARK_SOFT = '#141414'

interface Player {
  id: string
  first_name: string
  last_name: string
  grad_year: number
  gender: string
  primary_position: string
  secondary_position: string | null
  club_team: string
  highest_club_level: string
  high_school: string | null
  home_city: string
  home_state: string
  unweighted_gpa: number | null
  sat_score: number | null
  act_score: number | null
  height_inches: number | null
  weight_lbs: number | null
  highlight_url: string | null
  bio: string | null
  target_levels: string[] | null
  // Extended fields
  jersey_number: string | null
  hero_image_url: string | null
  contact_phone: string | null
  contact_twitter: string | null
  contact_instagram: string | null
  contact_hudl: string | null
  contact_tiktok: string | null
  contact_youtube: string | null
  coach_name: string | null
  coach_email: string | null
  coach_phone: string | null
  class_rank: string | null
  intended_major: string | null
  academic_honors: string[] | null
  stats_json: Record<string, string> | null
  awards_json: PlayerAward[] | null
  upcoming_events_json: PlayerEvent[] | null
  match_schedule_json: ScheduleEntry[] | null
  highlight_clips_json: HighlightClip[] | null
}

interface SchoolPS {
  id: string
  tier: string | null
  school: { id: string; name: string; verified_division: string | null }
}

interface Props {
  player: Player
  topSchools: SchoolPS[]
  slug: string
}

function fmtHeight(inches: number): string {
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function getEmbedUrl(url: string): string | null {
  const ytId = getYouTubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}`
  if (url.includes('hudl.com')) return url
  return null
}

const navItems = [
  { href: '#about', label: 'About' },
  { href: '#stats', label: 'Stats' },
  { href: '#awards', label: 'Awards' },
  { href: '#events', label: 'Events' },
  { href: '#schedule', label: 'Schedule' },
  { href: '#academics', label: 'Academics' },
  { href: '#highlights', label: 'Film' },
  { href: '#contact', label: 'Contact' },
]

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar({ playerName }: { playerName: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.3s',
        background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      }}
    >
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#about" style={{ fontFamily: 'Cinzel, serif', fontSize: 18, letterSpacing: '0.1em', color: GOLD, textDecoration: 'none' }}>
          {playerName}
        </a>
        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="hidden md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5 }} className="md:hidden">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: 'block', width: 20, height: 1, background: 'white', transition: 'all 0.3s',
              transform: open ? (i === 0 ? 'rotate(45deg) translateY(6px)' : i === 2 ? 'rotate(-45deg) translateY(-6px)' : 'none') : 'none',
              opacity: open && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </div>
      {/* Mobile menu */}
      <div style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(12px)', overflow: 'hidden', maxHeight: open ? 400 : 0, transition: 'max-height 0.3s', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="md:hidden">
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 16 }}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 40, textAlign: 'center' }}>
      <div style={{ width: 64, height: 1, background: GOLD, margin: '0 auto 24px' }} />
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, fontWeight: 600, color: 'white', letterSpacing: '0.05em', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>{subtitle}</p>}
    </div>
  )
}

// ─── Coach contact form ───────────────────────────────────────────────────────
function CoachContactForm({ playerId }: { playerId: string }) {
  const [coachName, setCoachName] = useState('')
  const [coachSchool, setCoachSchool] = useState('')
  const [coachEmail, setCoachEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '10px 14px', color: 'white', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }

  function handleSubmit() {
    if (!coachName || !coachEmail || !message) { setError('Please fill in all required fields'); return }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/contacts/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, coach_name: coachName, school_name: coachSchool, coach_email: coachEmail, message }),
      })
      if (res.ok) setSent(true)
      else setError('Failed to send. Please email directly.')
    })
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <p style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: 18 }}>Message sent!</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>The player and their family will be in touch.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your Name *</label>
          <input style={inputStyle} value={coachName} onChange={e => setCoachName(e.target.value)} placeholder="Coach Mike Smith" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your School</label>
          <input style={inputStyle} value={coachSchool} onChange={e => setCoachSchool(e.target.value)} placeholder="University of Example" />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your Email *</label>
        <input style={inputStyle} type="email" value={coachEmail} onChange={e => setCoachEmail(e.target.value)} placeholder="coach@university.edu" />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Message *</label>
        <textarea style={{ ...inputStyle, resize: 'none', minHeight: 100 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="I'm reaching out about your interest in our program..." />
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={pending}
        style={{ background: GOLD, color: DARK, border: 'none', padding: '12px 24px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', borderRadius: 4, opacity: pending ? 0.7 : 1 }}
      >
        {pending ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  )
}

// ─── Main public profile ──────────────────────────────────────────────────────
export function PublicProfileClient({ player, topSchools, slug }: Props) {
  const fullName = `${player.first_name} ${player.last_name}`
  const heightStr = player.height_inches ? fmtHeight(player.height_inches) : null
  const embedUrl = player.highlight_url ? getEmbedUrl(player.highlight_url) : null

  // Build stat items
  const statItems: { value: string; label: string }[] = []
  if (player.stats_json) {
    Object.entries(player.stats_json).forEach(([key, val]) => {
      if (val) statItems.push({ value: val, label: key.replace(/([A-Z])/g, ' $1').trim() })
    })
  }
  if (statItems.length === 0) {
    if (player.unweighted_gpa) statItems.push({ value: String(player.unweighted_gpa), label: 'GPA' })
    if (player.sat_score) statItems.push({ value: String(player.sat_score), label: 'SAT' })
    if (player.act_score) statItems.push({ value: String(player.act_score), label: 'ACT' })
    if (player.highest_club_level) statItems.push({ value: player.highest_club_level, label: 'Club Level' })
  }

  const awards = player.awards_json ?? []
  const events = player.upcoming_events_json ?? []
  const schedule = player.match_schedule_json ?? []
  const highlights = player.highlight_clips_json ?? []

  const hasAcademics = player.unweighted_gpa || player.sat_score || player.act_score || player.class_rank || player.intended_major || (player.academic_honors?.length ?? 0) > 0

  return (
    <div style={{ background: DARK, minHeight: '100vh', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <NavBar playerName={fullName} />

      {/* ── Hero ── */}
      <section id="about" style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', background: '#000' }}>
        {player.hero_image_url && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image src={player.hero_image_url} alt={fullName} fill style={{ objectFit: 'cover', objectPosition: 'top', opacity: 0.5 }} priority />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.7) 50%, transparent 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(5,5,5,0.6) 0%, transparent 60%)' }} />
          </div>
        )}
        {!player.hero_image_url && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0A1628 0%, #050505 100%)' }} />
        )}

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1152, margin: '0 auto', padding: '0 24px 96px', paddingTop: 128 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
            {/* Player info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ display: 'inline-block', width: 32, height: 1, background: GOLD }} />
                <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.4em', fontSize: 11, fontWeight: 500 }}>
                  {player.primary_position}
                  {player.jersey_number ? ` · #${player.jersey_number}` : ''}
                  {` · Class of ${player.grad_year}`}
                </p>
              </div>

              <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(40px, 8vw, 72px)', color: 'white', margin: '0 0 16px', lineHeight: 1.1 }}>
                {fullName}
              </h1>

              {player.bio && (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, maxWidth: 560, marginBottom: 24, lineHeight: 1.6 }}>
                  {player.bio}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 32px', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                {heightStr && <span><span style={{ color: 'rgba(255,255,255,0.3)' }}>HT </span>{heightStr}</span>}
                {player.weight_lbs && <span><span style={{ color: 'rgba(255,255,255,0.3)' }}>WT </span>{player.weight_lbs} lbs</span>}
                {(player.home_city || player.home_state) && <span><span style={{ color: 'rgba(255,255,255,0.3)' }}>FROM </span>{[player.home_city, player.home_state].filter(Boolean).join(', ')}</span>}
                {player.club_team && <span><span style={{ color: 'rgba(255,255,255,0.3)' }}>CLUB </span>{player.club_team}</span>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {(highlights.length > 0 || embedUrl) && (
                  <a href="#highlights" style={{ padding: '12px 32px', background: GOLD, color: DARK, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', borderRadius: 2 }}>
                    Watch Film
                  </a>
                )}
                <a href="#contact" style={{ padding: '12px 32px', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', borderRadius: 2 }}>
                  Contact
                </a>
              </div>
            </div>

            {/* Headshot placeholder — uses profile_photo if available */}
            <div className="hidden lg:block" style={{ position: 'relative', width: 256, height: 320, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, border: `1px solid ${GOLD}33`, transform: 'translate(12px, 12px)' }} />
              {/* No headshot field yet; show a placeholder or schools list */}
              {topSchools.length > 0 && (
                <div style={{ position: 'absolute', inset: 0, background: DARK_CARD, border: `1px solid rgba(255,255,255,0.05)`, padding: 20, overflowY: 'auto' }}>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${GOLD}99`, marginBottom: 12 }}>Schools of Interest</p>
                  {topSchools.slice(0, 8).map((ps) => (
                    <div key={ps.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: ps.tier === 'Lock' ? '#4ade80' : '#60a5fa', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>{ps.school.name}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{ps.school.verified_division ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      {statItems.length > 0 && (
        <section id="stats" style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', marginTop: -32, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(statItems.length, 4)}, 1fr)`, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', gap: 1, background: 'rgba(255,255,255,0.1)' }}>
            {statItems.slice(0, 4).map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 16px', background: DARK_CARD }}>
                <div style={{ fontSize: 28, fontFamily: 'Cinzel, serif', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Awards ── */}
      {awards.length > 0 && (
        <section id="awards" style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 0' }}>
          <SectionHeading title="Awards & Honors" subtitle="Athletic and academic achievements" />
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 52, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {awards.map((award, i) => (
                <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: GOLD, width: 56, textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>{award.year}</div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: `${GOLD}80`, flexShrink: 0, marginTop: 8, outline: `2px solid ${DARK}`, position: 'relative', zIndex: 1 }} />
                  <div style={{ flex: 1, background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>{award.title}</span>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '2px 8px', borderRadius: 20, border: `1px solid ${award.type === 'academic' ? 'rgba(96,165,250,0.3)' : `${GOLD}30`}`, color: award.type === 'academic' ? 'rgba(96,165,250,0.8)' : `${GOLD}cc` }}>
                        {award.type === 'academic' ? 'Academic' : 'Athletic'}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{award.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Events ── */}
      {events.length > 0 && (
        <section id="events" style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 0' }}>
          <SectionHeading title="Upcoming Events" subtitle="Tournaments, showcases, and camps" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {events.map((evt, i) => {
              const typeColors: Record<string, string> = { tournament: '#fbbf24', showcase: '#34d399', camp: '#38bdf8' }
              const c = typeColors[evt.type?.toLowerCase()] ?? '#a78bfa'
              return (
                <div key={i} style={{ background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: c, border: `1px solid ${c}40`, borderRadius: 20, padding: '2px 8px' }}>{evt.type}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{evt.date}</span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{evt.name}</div>
                  {evt.location && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>{evt.location}</div>}
                  {evt.description && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.5 }}>{evt.description}</div>}
                  {evt.url && <a href={evt.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, color: `${GOLD}bb`, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Details →</a>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Schedule ── */}
      {schedule.length > 0 && (
        <section id="schedule" style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 0' }}>
          <SectionHeading title="Schedule" subtitle="Upcoming and recent matches" />
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: DARK_CARD }}>
                  {['Date', 'Opponent', 'Competition', 'Location', 'Time', 'Result'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map((g, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 12, color: 'rgba(255,255,255,0.5)' }}>{g.date}</td>
                    <td style={{ padding: 12, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{g.opponent}</td>
                    <td style={{ padding: 12, color: 'rgba(255,255,255,0.6)' }}>{g.competition}</td>
                    <td style={{ padding: 12, color: g.location === 'Home' ? '#4ade8099' : 'rgba(255,255,255,0.5)' }}>{g.location}</td>
                    <td style={{ padding: 12, color: 'rgba(255,255,255,0.6)' }}>{g.time}</td>
                    <td style={{ padding: 12, color: g.result?.startsWith('W') ? '#4ade80' : g.result?.startsWith('L') ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{g.result || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Academics ── */}
      {hasAcademics && (
        <section id="academics" style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 0' }}>
          <SectionHeading title="Academics" subtitle="Academic profile and honors" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            <div style={{ background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 24 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${GOLD}cc`, marginBottom: 16 }}>Academic Profile</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { val: player.unweighted_gpa ? String(player.unweighted_gpa) : null, label: 'GPA' },
                  { val: player.sat_score ? String(player.sat_score) : null, label: 'SAT' },
                  { val: player.act_score ? String(player.act_score) : null, label: 'ACT' },
                  { val: player.class_rank, label: 'Class Rank' },
                ].filter(x => x.val).map(({ val, label }) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: 'white' }}>{val}</div>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {player.high_school && <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>School: </span>{player.high_school}</div>}
                {player.grad_year && <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>Graduation: </span>{player.grad_year}</div>}
                {player.intended_major && <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>Intended Major: </span>{player.intended_major}</div>}
              </div>
            </div>

            {(player.academic_honors?.length ?? 0) > 0 && (
              <div style={{ background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 24 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${GOLD}cc`, marginBottom: 16 }}>Honors & Recognition</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {player.academic_honors!.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Film & Highlights ── */}
      {(highlights.length > 0 || embedUrl) && (
        <section id="highlights" style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 0' }}>
          <SectionHeading title="Film & Highlights" subtitle="Game film, highlight reels, and training clips" />

          {/* Primary embed */}
          {embedUrl && (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden', marginBottom: 32 }}>
              <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Highlight video" />
            </div>
          )}

          {/* Highlight clips grid */}
          {highlights.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {highlights.map((h, i) => {
                const thumb = h.thumb || getYouTubeThumbnail(h.url)
                return (
                  <a key={i} href={h.url} target="_blank" rel="noreferrer" style={{ display: 'block', background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden', textDecoration: 'none' }}>
                    {thumb && (
                      <div style={{ position: 'relative', height: 176, overflow: 'hidden' }}>
                        <Image src={thumb} alt={h.title} fill style={{ objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width={20} height={20} fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: 'white', marginBottom: 4 }}>{h.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{h.date}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {h.tags?.map((t) => (
                          <span key={t} style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 20 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Contact ── */}
      <section id="contact" style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 48px' }}>
        <SectionHeading title="Contact" subtitle="Get in touch for recruiting inquiries" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {/* Player contact */}
          <div style={{ background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${GOLD}cc` }}>Player Contact</div>
            {player.contact_phone && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>📞</span>{player.contact_phone}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
              {[
                { key: 'contact_hudl', label: 'Hudl', url: player.contact_hudl },
                { key: 'contact_youtube', label: 'YouTube', url: player.contact_youtube },
                { key: 'contact_instagram', label: 'Instagram', url: player.contact_instagram ? `https://instagram.com/${player.contact_instagram.replace('@', '')}` : null },
                { key: 'contact_twitter', label: 'Twitter', url: player.contact_twitter ? `https://twitter.com/${player.contact_twitter.replace('@', '')}` : null },
                { key: 'contact_tiktok', label: 'TikTok', url: player.contact_tiktok ? `https://tiktok.com/@${player.contact_tiktok.replace('@', '')}` : null },
              ].filter(s => s.url).map(s => (
                <a key={s.key} href={s.url!} target="_blank" rel="noreferrer" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Coach contact */}
          {(player.coach_name || player.coach_email || player.coach_phone) && (
            <div style={{ background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${GOLD}cc` }}>Coach Contact</div>
              {player.coach_name && <div style={{ fontWeight: 500, fontSize: 14 }}>{player.coach_name}</div>}
              {player.coach_email && (
                <a href={`mailto:${player.coach_email}`} style={{ fontSize: 13, color: GOLD, textDecoration: 'none' }}>{player.coach_email}</a>
              )}
              {player.coach_phone && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{player.coach_phone}</div>}
            </div>
          )}

          {/* Recruiting coach contact form */}
          <div style={{ background: DARK_CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${GOLD}cc`, marginBottom: 20 }}>Send a Message</div>
            <CoachContactForm playerId={player.id} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.6)', padding: '40px 24px', marginTop: 64 }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>&copy; {new Date().getFullYear()} {fullName}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>Recruiting profile powered by PlayerPulse</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>PromotedSoccerConsultants.com</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
