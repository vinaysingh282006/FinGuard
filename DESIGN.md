# FinGuard AI - Design System
Reference Aesthetic: Linear.app × Vercel Dashboard × Apple Intelligence UI
Clean Apple-grade glassmorphism, restrained, intentional, premium.

## Colors
- **Base Backgrounds**: --bg-base (#04070f), --bg-sunken (#060b18), --bg-surface (#0b1525), --bg-raised (#111e33), --bg-overlay (#18273d)
- **Glass**: --glass-00 (rgba(255,255,255,0.02)), --glass-01 (rgba(255,255,255,0.04)), --glass-02 (rgba(255,255,255,0.06)), --glass-03 (rgba(255,255,255,0.09)), --glass-04 (rgba(255,255,255,0.13)), --glass-05 (rgba(255,255,255,0.20))
- **Cyan Accent**: --cyan-500 (#00d4f5), --cyan-400 (#33dcf7)
- **Violet Accent**: --violet-500 (#7c5cfc), --violet-400 (#9b7dfd)
- **Emerald/Safe**: --emerald-500 (#00d68f)
- **Risk Critical**: --risk-critical (#ff2d55)
- **Risk High**: --risk-high (#ff6a00)
- **Risk Medium**: --risk-medium (#f5c400)
- **Risk Low**: --risk-low (#00d68f)
- **Text**: --text-1 (#eef2ff), --text-2 (#8892b0), --text-3 (#4a566d), --text-code (#a8b4d8)
- **Borders**: --border-0 (rgba(255,255,255,0.05)), --border-1 (rgba(255,255,255,0.09)), --border-2 (rgba(255,255,255,0.15))

## Typography
- **Headings/Titles**: Space Grotesk
- **Body/UI**: Inter
- **Monospace**: JetBrains Mono

## Components
- **GlassCard**: backdrop-filter blur-lg saturate-160, bg glass-02, border border-1, border-radius 14px, shadow-3 + inset-highlight.
- **GlassButton Primary**: gradient cyan-500 to violet-500, text white, border-radius 8px.
- **GlassButton Ghost**: bg glass-01, border border-1, text-2, border-radius 8px.
- **GlassInput**: bg glass-01, border border-1, text-1, blur-sm, border-radius 8px.
- **RiskBadges**: colored bg (10% opacity) and colored text, border 28% opacity, border-radius 4px.
- **StatusDot**: 7x7px circle with pulsing after element.
