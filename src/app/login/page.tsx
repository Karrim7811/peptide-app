'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <style>{`
        .login-root {
          display: flex;
          min-height: 100vh;
          background: #0E0C0A;
          font-family: 'Jost', sans-serif;
        }
        /* LEFT PANEL */
        .login-left {
          position: relative;
          width: 58%;
          display: flex;
          flex-direction: column;
          padding: 48px 52px;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .login-logo-wrap { flex-shrink: 0; }
        .login-logo-sub {
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 300;
          letter-spacing: 0.48em;
          text-transform: uppercase;
          color: rgba(250,250,248,0.35);
          margin-bottom: 4px;
        }
        .login-logo-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-size: 26px;
          letter-spacing: 0.14em;
          color: rgba(250,250,248,0.85);
          line-height: 1;
        }
        .login-logo-name span { color: #1A8A9E; }
        /* Ghost background letter */
        .login-ghost {
          position: absolute;
          bottom: -40px;
          left: -20px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-size: clamp(260px, 28vw, 420px);
          color: rgba(250,250,248,0.025);
          line-height: 1;
          pointer-events: none;
          user-select: none;
          letter-spacing: -0.02em;
        }
        /* Bottom CORTEX letter grid */
        .login-letters {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
        }
        .login-letter-cell {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 18px 20px;
          border-top: 1px solid rgba(255,255,255,0.07);
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .login-letter-cell:last-child { border-right: none; }
        .login-letter-char {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-size: clamp(28px, 3.5vw, 44px);
          color: rgba(250,250,248,0.18);
          line-height: 1;
          margin-bottom: 6px;
        }
        .login-letter-char.teal { color: rgba(26,138,158,0.45); }
        .login-letter-label {
          font-family: 'Jost', sans-serif;
          font-size: 7px;
          font-weight: 400;
          letter-spacing: 0.15em;
          color: rgba(250,250,248,0.25);
          text-transform: uppercase;
          line-height: 1.6;
        }

        /* RIGHT PANEL */
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 60px 64px 52px;
        }
        .login-badge {
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #1A8A9E;
          margin-bottom: 32px;
        }
        .login-badge span { color: rgba(250,250,248,0.3); margin: 0 10px; }
        .login-heading {
          margin-bottom: 8px;
        }
        .login-heading-main {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 500;
          font-size: clamp(44px, 5vw, 64px);
          color: rgba(250,250,248,0.92);
          line-height: 1.05;
          display: block;
        }
        .login-heading-italic {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-style: italic;
          font-size: clamp(44px, 5vw, 64px);
          color: rgba(250,250,248,0.7);
          line-height: 1.05;
          display: block;
        }
        .login-sub {
          font-size: 13px;
          font-weight: 300;
          color: rgba(250,250,248,0.4);
          margin-top: 14px;
          margin-bottom: 40px;
          letter-spacing: 0.01em;
        }
        .login-field-label {
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(250,250,248,0.35);
          margin-bottom: 10px;
          display: block;
        }
        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 14px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgba(250,250,248,0.85);
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: rgba(250,250,248,0.2); }
        .login-input:focus { border-color: rgba(26,138,158,0.6); }
        .login-input-wrap { position: relative; }
        .login-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(250,250,248,0.25);
          padding: 0;
          display: flex;
          align-items: center;
        }
        .login-eye:hover { color: rgba(250,250,248,0.6); }
        .login-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: rgba(239,68,68,0.85);
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .login-btn {
          width: 100%;
          background: #1A8A9E;
          border: none;
          border-radius: 6px;
          padding: 16px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #FAFAF8;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
        }
        .login-btn:hover:not(:disabled) { background: #168090; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-signup {
          margin-top: 24px;
          font-size: 12px;
          font-weight: 300;
          color: rgba(250,250,248,0.3);
          text-align: center;
        }
        .login-signup a {
          color: #1A8A9E;
          text-decoration: none;
        }
        .login-signup a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-root { background: #0E0C0A; }
          .login-right { padding: 48px 28px; }
        }
      `}</style>

      <div className="login-root">
        {/* LEFT */}
        <div className="login-left">
          <div className="login-logo-wrap">
            <div className="login-logo-sub">Peptide</div>
            <div className="login-logo-name">
              CORTE<span>X</span>
            </div>
          </div>

          {/* Ghost letter */}
          <div className="login-ghost">C</div>

          {/* Bottom letter grid */}
          <div className="login-letters">
            {[
              { char: 'C', label: 'Cognitive\nCore' },
              { char: 'O', label: 'Optimization\nEngine' },
              { char: 'R', label: 'Reasoning\nLayer' },
              { char: 'T', label: 'Tracking\nIntelligence' },
              { char: 'E', label: 'Evidence-\nBased' },
              { char: 'X', label: 'Execution\nEngine', teal: true },
            ].map(({ char, label, teal }) => (
              <div key={char} className="login-letter-cell">
                <span className={`login-letter-char${teal ? ' teal' : ''}`}>{char}</span>
                <span className="login-letter-label" style={{ whiteSpace: 'pre-line' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <div className="login-badge">
            Peptide Intelligence<span>·</span>AI-Powered
          </div>

          <div className="login-heading">
            <span className="login-heading-main">Welcome</span>
            <span className="login-heading-italic">back.</span>
          </div>
          <p className="login-sub">Sign in to your Peptide Cortex workspace.</p>

          <form onSubmit={handleLogin}>
            {error && <div className="login-error">{error}</div>}

            <div style={{ marginBottom: 20 }}>
              <label className="login-field-label">Email Address</label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="login-field-label">Password</label>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in...</> : 'Sign in to Cortex'}
            </button>
          </form>

          <div className="login-signup">
            Don&apos;t have an account?{' '}
            <Link href="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </>
  )
}
