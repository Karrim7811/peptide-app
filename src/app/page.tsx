'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [navShadow, setNavShadow] = useState(false)
  const router = useRouter()
  const sectionsRef = useRef<NodeListOf<Element> | null>(null)

  useEffect(() => {
    const handleScroll = () => setNavShadow(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('cx-visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.cx-reveal').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (modalOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
        :root{--white:#FAFAF8;--off:#F2F0ED;--light:#E8E5E0;--mid:#B0AAA0;--dark:#3A3730;--black:#1A1915;--accent:#1A8A9E;--accent2:#127080;--serif:'Cormorant Garamond',Georgia,serif;--sans:'Jost',sans-serif;}
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        .cx-body{background:var(--white);color:var(--black);font-family:var(--sans);font-weight:300;overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--off);}::-webkit-scrollbar-thumb{background:var(--accent);}

        /* NAV */
        .cx-nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 60px;height:72px;background:rgba(250,250,248,0.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--light);transition:box-shadow 0.3s;}
        .cx-nav.shadow{box-shadow:0 1px 24px rgba(26,25,21,0.08);}
        .nav-logo{display:flex;flex-direction:column;gap:1px;cursor:pointer;text-decoration:none;}
        .nav-logo-super{font-size:8px;font-weight:300;letter-spacing:0.45em;text-transform:uppercase;color:var(--mid);line-height:1;}
        .nav-logo-main{font-family:var(--serif);font-weight:300;font-size:22px;letter-spacing:0.16em;color:var(--black);line-height:1;}
        .nav-logo-main .x{color:var(--accent);}
        .nav-links{display:flex;align-items:center;gap:40px;}
        .nav-link{font-size:10px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--mid);text-decoration:none;transition:color 0.2s;background:none;border:none;cursor:pointer;font-family:var(--sans);}
        .nav-link:hover{color:var(--black);}
        .nav-actions{display:flex;align-items:center;gap:16px;}
        .btn-ghost{font-family:var(--sans);font-size:10px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--dark);background:transparent;border:1px solid var(--light);padding:10px 24px;cursor:pointer;transition:all 0.2s;}
        .btn-ghost:hover{border-color:var(--dark);}
        .btn-primary{font-family:var(--sans);font-size:10px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--white);background:var(--accent);border:1px solid var(--accent);padding:10px 28px;cursor:pointer;transition:all 0.25s;}
        .btn-primary:hover{background:var(--accent2);border-color:var(--accent2);}

        /* HERO */
        .cx-hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:140px 60px 100px;position:relative;overflow:hidden;}
        .cx-hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(26,138,158,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(26,138,158,0.05) 1px,transparent 1px);background-size:64px 64px;pointer-events:none;}
        .cx-hero::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-55%);width:800px;height:800px;background:radial-gradient(circle,rgba(26,138,158,0.08) 0%,transparent 70%);pointer-events:none;}
        .hero-eyebrow{font-size:10px;font-weight:300;letter-spacing:0.45em;text-transform:uppercase;color:var(--accent);margin-bottom:28px;opacity:0;animation:rise 0.9s 0.2s forwards;position:relative;z-index:1;}
        .hero-super{font-family:var(--serif);font-weight:300;font-size:clamp(16px,2.2vw,22px);letter-spacing:0.55em;text-transform:uppercase;color:var(--mid);margin-bottom:8px;opacity:0;animation:rise 0.9s 0.35s forwards;position:relative;z-index:1;}
        .hero-logo{font-family:var(--serif);font-weight:300;font-size:clamp(72px,14vw,160px);letter-spacing:0.1em;line-height:1;color:var(--black);opacity:0;animation:rise 0.9s 0.5s forwards;position:relative;z-index:1;}
        .hero-logo .x{color:var(--accent);}
        .hero-rule{width:1px;height:64px;background:var(--light);margin:40px auto;opacity:0;animation:rise 0.9s 0.7s forwards;position:relative;z-index:1;}
        .hero-tagline{font-family:var(--serif);font-weight:300;font-style:italic;font-size:clamp(22px,3vw,38px);color:var(--dark);letter-spacing:0.02em;line-height:1.3;max-width:700px;opacity:0;animation:rise 0.9s 0.85s forwards;position:relative;z-index:1;}
        .hero-sub{font-size:14px;font-weight:300;letter-spacing:0.03em;color:var(--mid);margin-top:20px;max-width:520px;line-height:1.9;opacity:0;animation:rise 0.9s 1s forwards;position:relative;z-index:1;}
        .hero-ctas{display:flex;align-items:center;gap:16px;margin-top:48px;opacity:0;animation:rise 0.9s 1.15s forwards;position:relative;z-index:1;flex-wrap:wrap;justify-content:center;}
        .btn-hero{font-family:var(--sans);font-size:11px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--white);background:var(--accent);border:none;padding:16px 40px;cursor:pointer;transition:all 0.25s;}
        .btn-hero:hover{background:var(--accent2);transform:translateY(-1px);}
        .btn-hero-ghost{font-family:var(--sans);font-size:11px;font-weight:300;letter-spacing:0.3em;text-transform:uppercase;color:var(--dark);background:transparent;border:1px solid var(--light);padding:16px 40px;cursor:pointer;transition:all 0.25s;text-decoration:none;display:inline-block;}
        .btn-hero-ghost:hover{border-color:var(--dark);}
        .hero-stats{display:flex;align-items:center;gap:60px;margin-top:80px;padding-top:48px;border-top:1px solid var(--light);justify-content:center;opacity:0;animation:rise 0.9s 1.3s forwards;position:relative;z-index:1;flex-wrap:wrap;}
        .hero-stat-num{font-family:var(--serif);font-weight:300;font-size:40px;color:var(--accent);line-height:1;}
        .hero-stat-label{font-size:9px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--mid);margin-top:6px;}
        .stat-divider{width:1px;height:48px;background:var(--light);}
        @keyframes rise{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}

        /* LAYOUT */
        .wrap{max-width:1100px;margin:0 auto;padding:0 60px;}
        .cx-reveal{padding:120px 0;border-top:1px solid var(--light);opacity:0;transform:translateY(28px);transition:opacity 0.8s ease,transform 0.8s ease;}
        .cx-reveal.cx-visible{opacity:1;transform:translateY(0);}
        .cx-always{padding:120px 0;border-top:1px solid var(--light);}
        .section-meta{display:flex;align-items:baseline;gap:28px;margin-bottom:56px;}
        .section-num{font-family:var(--serif);font-size:13px;color:var(--mid);letter-spacing:0.1em;}
        .section-label{font-size:10px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--mid);}
        .section-title{font-family:var(--serif);font-weight:300;font-size:clamp(36px,5vw,58px);line-height:1.15;color:var(--black);letter-spacing:0.02em;}
        .section-title em{font-style:italic;color:var(--dark);}

        /* FEATURES */
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--light);margin-top:60px;}
        .feature-card{background:var(--white);padding:52px 40px;transition:background 0.3s;cursor:default;}
        .feature-card:hover{background:var(--off);}
        .feature-icon{width:40px;height:40px;border:1px solid var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:32px;}
        .feature-icon svg{width:18px;height:18px;stroke:var(--accent);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
        .feature-title{font-family:var(--serif);font-weight:300;font-size:24px;color:var(--black);margin-bottom:16px;line-height:1.2;}
        .feature-body{font-size:14px;line-height:1.9;color:var(--mid);font-weight:300;}

        /* STEPS */
        .steps{margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--light);}
        .step{background:var(--white);padding:60px 48px;display:flex;gap:32px;transition:background 0.3s;}
        .step:hover{background:var(--off);}
        .step-num{font-family:var(--serif);font-weight:300;font-size:56px;color:var(--light);line-height:1;min-width:52px;transition:color 0.3s;}
        .step:hover .step-num{color:var(--accent);}
        .step-title{font-family:var(--serif);font-weight:300;font-size:26px;color:var(--black);margin-bottom:14px;line-height:1.2;}
        .step-body{font-size:14px;line-height:1.9;color:var(--mid);}

        /* INTEL BAND */
        .intel-band{background:var(--black);padding:100px 60px;text-align:center;position:relative;overflow:hidden;}
        .intel-band::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(26,138,158,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(26,138,158,0.06) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;}
        .intel-label{font-size:10px;font-weight:400;letter-spacing:0.4em;text-transform:uppercase;color:var(--accent);margin-bottom:28px;position:relative;}
        .intel-title{font-family:var(--serif);font-weight:300;font-size:clamp(36px,5vw,64px);color:var(--white);line-height:1.2;letter-spacing:0.02em;max-width:800px;margin:0 auto 24px;position:relative;}
        .intel-title em{color:var(--accent);font-style:italic;}
        .intel-sub{font-size:14px;font-weight:300;color:#666;max-width:560px;margin:0 auto;line-height:1.9;position:relative;}
        .intel-metrics{display:flex;justify-content:center;gap:80px;margin-top:72px;padding-top:56px;border-top:1px solid #2A2925;position:relative;flex-wrap:wrap;}
        .intel-metric-num{font-family:var(--serif);font-weight:300;font-size:52px;color:var(--accent);line-height:1;margin-bottom:8px;}
        .intel-metric-label{font-size:9px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:#555;}

        /* PRICING */
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--light);margin-top:60px;}
        .pricing-card{background:var(--white);padding:56px 40px;position:relative;display:flex;flex-direction:column;}
        .pricing-card.featured{background:var(--black);}
        .pricing-badge{position:absolute;top:24px;right:24px;font-size:8px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);padding:5px 12px;}
        .pricing-tier{font-size:9px;font-weight:400;letter-spacing:0.35em;text-transform:uppercase;color:var(--mid);margin-bottom:20px;}
        .pricing-card.featured .pricing-tier{color:#555;}
        .pricing-price{font-family:var(--serif);font-weight:300;font-size:64px;color:var(--black);line-height:1;margin-bottom:4px;}
        .pricing-card.featured .pricing-price{color:var(--white);}
        .pricing-price sup{font-family:var(--sans);font-size:18px;font-weight:300;color:var(--mid);vertical-align:super;}
        .pricing-period{font-size:11px;font-weight:300;letter-spacing:0.1em;color:var(--mid);margin-bottom:8px;}
        .pricing-annual{font-size:10px;font-weight:300;color:var(--accent);margin-bottom:36px;min-height:16px;}
        .pricing-rule{width:100%;height:1px;background:var(--light);margin-bottom:36px;}
        .pricing-card.featured .pricing-rule{background:#2A2925;}
        .pricing-features{list-style:none;display:flex;flex-direction:column;gap:16px;margin-bottom:40px;flex:1;}
        .pricing-features li{display:flex;align-items:flex-start;gap:14px;font-size:13px;font-weight:300;color:var(--dark);line-height:1.5;}
        .pricing-card.featured .pricing-features li{color:#888;}
        .pricing-features li::before{content:'';width:16px;height:1px;background:var(--accent);margin-top:10px;flex-shrink:0;}
        .pricing-features li.dim{color:var(--mid);}
        .pricing-features li.dim::before{background:var(--light);}
        .pcta{font-family:var(--sans);font-size:10px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;padding:14px 28px;cursor:pointer;border:none;transition:all 0.25s;width:100%;display:block;text-align:center;}
        .pcta-outline{color:var(--dark);background:transparent;border:1px solid var(--light);}
        .pcta-outline:hover{border-color:var(--dark);}
        .pcta-filled{color:var(--white);background:var(--accent);}
        .pcta-filled:hover{background:var(--accent2);}
        .pcta-lite{color:var(--black);background:var(--white);}
        .pcta-lite:hover{background:var(--off);}

        /* TAGLINES */
        .tagline-strip{margin-top:60px;}
        .tagline-row{display:flex;align-items:baseline;justify-content:space-between;padding:32px 0;border-bottom:1px solid var(--light);gap:40px;transition:padding 0.3s;cursor:default;}
        .tagline-row:first-child{border-top:1px solid var(--light);}
        .tagline-row:hover{padding:40px 0;}
        .tl-text{font-family:var(--serif);font-weight:300;font-size:clamp(20px,2.8vw,32px);color:var(--black);line-height:1.3;}
        .tl-text em{color:var(--accent);font-style:italic;}
        .tl-tag{font-size:9px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--mid);white-space:nowrap;}

        /* FINAL CTA */
        .final-cta{background:var(--off);padding:120px 60px;text-align:center;border-top:1px solid var(--light);}
        .final-cta-title{font-family:var(--serif);font-weight:300;font-size:clamp(40px,6vw,72px);color:var(--black);line-height:1.15;margin-bottom:24px;letter-spacing:0.02em;}
        .final-cta-title em{font-style:italic;color:var(--accent);}
        .final-cta-sub{font-size:14px;font-weight:300;color:var(--mid);margin-bottom:48px;line-height:1.9;}
        .final-btns{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;}

        /* FOOTER */
        footer{background:var(--black);padding:72px 60px 40px;}
        .footer-top{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:60px;padding-bottom:60px;border-bottom:1px solid #2A2925;margin-bottom:40px;}
        .footer-logo-super{font-size:8px;font-weight:300;letter-spacing:0.5em;text-transform:uppercase;color:#555;margin-bottom:4px;}
        .footer-logo-main{font-family:var(--serif);font-weight:300;font-size:36px;letter-spacing:0.12em;color:var(--white);line-height:1;margin-bottom:20px;}
        .footer-logo-main .x{color:var(--accent);}
        .footer-desc{font-size:12px;font-weight:300;color:#555;line-height:1.9;}
        .footer-col-label{font-size:9px;font-weight:400;letter-spacing:0.35em;text-transform:uppercase;color:#555;margin-bottom:24px;}
        .footer-links{list-style:none;display:flex;flex-direction:column;gap:14px;}
        .footer-links a{font-size:13px;font-weight:300;color:#666;text-decoration:none;letter-spacing:0.02em;transition:color 0.2s;}
        .footer-links a:hover{color:var(--white);}
        .footer-bottom{display:flex;align-items:center;justify-content:space-between;}
        .footer-copy{font-size:10px;font-weight:300;letter-spacing:0.2em;color:#444;text-transform:uppercase;}
        .footer-suite{display:flex;align-items:center;gap:20px;}
        .footer-suite-label{font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#444;}
        .footer-suite-link{font-family:var(--serif);font-size:16px;letter-spacing:0.15em;color:#555;text-decoration:none;transition:color 0.2s;}
        .footer-suite-link:hover{color:var(--white);}
        .footer-suite-link .ax{color:#C4875A;}

        /* MODAL */
        .modal-overlay{position:fixed;inset:0;background:rgba(26,25,21,0.8);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:1000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.35s;}
        .modal-overlay.active{opacity:1;pointer-events:all;}
        .modal{background:var(--white);width:100%;max-width:480px;position:relative;transform:translateY(28px);transition:transform 0.35s;}
        .modal-overlay.active .modal{transform:translateY(0);}
        .modal-header{padding:48px 48px 32px;border-bottom:1px solid var(--light);}
        .modal-logo-super{font-size:8px;font-weight:300;letter-spacing:0.5em;text-transform:uppercase;color:var(--mid);margin-bottom:4px;}
        .modal-logo{font-family:var(--serif);font-weight:300;font-size:32px;letter-spacing:0.14em;color:var(--black);line-height:1;}
        .modal-logo .x{color:var(--accent);}
        .modal-close{position:absolute;top:20px;right:20px;width:36px;height:36px;background:none;border:1px solid var(--light);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--mid);font-size:20px;font-weight:200;transition:all 0.2s;line-height:1;}
        .modal-close:hover{border-color:var(--dark);color:var(--black);}
        .modal-body{padding:40px 48px 48px;}
        .modal-title{font-family:var(--serif);font-weight:300;font-size:28px;color:var(--black);margin-bottom:8px;}
        .modal-subtitle{font-size:13px;font-weight:300;color:var(--mid);margin-bottom:36px;line-height:1.7;}
        .form-group{margin-bottom:20px;}
        .form-label{display:block;font-size:9px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:var(--mid);margin-bottom:10px;}
        .form-input{width:100%;padding:14px 16px;font-family:var(--sans);font-size:14px;font-weight:300;color:var(--black);background:var(--off);border:1px solid var(--light);outline:none;transition:border-color 0.2s;}
        .form-input::placeholder{color:var(--mid);}
        .form-input:focus{border-color:var(--accent);background:var(--white);}
        .btn-login{width:100%;font-family:var(--sans);font-size:11px;font-weight:400;letter-spacing:0.35em;text-transform:uppercase;color:var(--white);background:var(--accent);border:none;padding:16px;margin-top:28px;cursor:pointer;transition:background 0.25s;}
        .btn-login:hover{background:var(--accent2);}
        .modal-divider{display:flex;align-items:center;gap:16px;margin:28px 0;}
        .modal-divider::before,.modal-divider::after{content:'';flex:1;height:1px;background:var(--light);}
        .modal-divider-text{font-size:9px;font-weight:400;letter-spacing:0.2em;text-transform:uppercase;color:var(--mid);}
        .modal-signup{text-align:center;font-size:12px;font-weight:300;color:var(--mid);}
        .modal-signup a{color:var(--accent);text-decoration:none;font-weight:400;}
        .modal-signup a:hover{text-decoration:underline;}

        @media(max-width:768px){
          .cx-nav{padding:0 24px;}
          .nav-links{display:none;}
          .cx-hero{padding:120px 24px 80px;}
          .wrap{padding:0 24px;}
          .features-grid{grid-template-columns:1fr;}
          .steps{grid-template-columns:1fr;}
          .pricing-grid{grid-template-columns:1fr;}
          .footer-top{grid-template-columns:1fr 1fr;gap:40px;}
          .intel-metrics{gap:40px;}
          .intel-band,.final-cta{padding:80px 24px;}
          footer{padding:60px 24px 32px;}
          .modal{margin:16px;}
          .modal-header,.modal-body{padding:32px 28px;}
          .stat-divider{display:none;}
          .hero-stats{gap:32px;}
        }
      `}</style>

      <div className="cx-body">
        {/* NAV */}
        <nav className={`cx-nav${navShadow ? ' shadow' : ''}`}>
          <a href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
            <div className="nav-logo-super">Peptide</div>
            <div className="nav-logo-main">CORTE<span className="x">X</span></div>
          </a>
          <div className="nav-links">
            <button className="nav-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="nav-link" onClick={() => scrollTo('how')}>How it Works</button>
            <button className="nav-link" onClick={() => scrollTo('pricing')}>Pricing</button>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => router.push('/login')}>Sign In</button>
            <button className="btn-primary" onClick={() => scrollTo('pricing')}>Get Started</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="cx-hero">
          <div className="hero-eyebrow">AI-Powered Peptide Intelligence Engine</div>
          <div className="hero-super">Peptide</div>
          <div className="hero-logo">CORTE<span className="x">X</span></div>
          <div className="hero-rule" />
          <div className="hero-tagline">The intelligence center<br />of your protocol.</div>
          <div className="hero-sub">The only peptide tracker built around an AI reasoning engine. Every cycle, every dose, every biomarker — analyzed, optimized, and delivered as insight.</div>
          <div className="hero-ctas">
            <button className="btn-hero" onClick={() => router.push('/signup')}>Start Free</button>
            <button className="btn-hero-ghost" onClick={() => scrollTo('features')}>Explore Features</button>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">AI</div>
              <div className="hero-stat-label">Reasoning Engine</div>
            </div>
            <div className="stat-divider" />
            <div>
              <div className="hero-stat-num">58+</div>
              <div className="hero-stat-label">Peptides Mapped</div>
            </div>
            <div className="stat-divider" />
            <div>
              <div className="hero-stat-num">360°</div>
              <div className="hero-stat-label">Protocol Memory</div>
            </div>
          </div>
        </section>

        <div className="wrap">
          {/* FEATURES */}
          <div className="cx-reveal" id="features">
            <div className="section-meta">
              <span className="section-num">01</span>
              <span className="section-label">Core Features</span>
            </div>
            <div className="section-title">Further than anything<br /><em>in the market.</em></div>
            <div className="features-grid">
              {[
                { title: 'AI Insight Engine', body: 'Not a log — a reasoning system. Cortex AI continuously analyzes your stack, dosing patterns, and cycle history to generate protocol-level intelligence no other tracker can produce.', icon: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></> },
                { title: 'Protocol Memory', body: 'Every cycle, dose, response, and biomarker — indexed and queryable. Your entire protocol history becomes the foundation for every future recommendation Cortex makes.', icon: <><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></> },
                { title: 'Cycle Intelligence', body: 'AI-generated dosing windows, cycle forecasts, and off-cycle timing based on your peptide class, half-life data, and personal response patterns tracked over time.', icon: <><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/></> },
                { title: 'Biomarker Tracking', body: 'Log labs and bloodwork directly in your protocol. Cortex correlates marker changes with your stack to surface insights invisible to any other tracker on the market.', icon: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></> },
                { title: 'Stack Builder', body: 'Design and simulate peptide stacks with interaction awareness. Cortex flags potential conflicts and recommends optimized sequencing before you commit to a cycle.', icon: <><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></> },
                { title: 'Vendor Intelligence', body: 'Ranked vendor data, purity reports, and COA sourcing intelligence built into the platform. Know exactly where to source — and which vendors the Cortex community trusts most.', icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></> },
              ].map(({ title, body, icon }) => (
                <div key={title} className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24">{icon}</svg>
                  </div>
                  <div className="feature-title">{title}</div>
                  <div className="feature-body">{body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="cx-reveal" id="how">
            <div className="section-meta">
              <span className="section-num">02</span>
              <span className="section-label">How it Works</span>
            </div>
            <div className="section-title">From first dose<br /><em>to full intelligence.</em></div>
            <div className="steps">
              {[
                { n: '01', title: 'Build your stack', body: 'Select from 58+ mapped peptides across every class. Cortex auto-populates half-life data, dosing ranges, and initial cycle recommendations the moment you add a peptide.' },
                { n: '02', title: 'Log your protocol', body: 'Track doses, timing, injection sites, and subjective responses in seconds. Every entry feeds the AI reasoning engine — the more you log, the sharper Cortex gets.' },
                { n: '03', title: 'Surface the insights', body: 'Cortex surfaces protocol-level insights you\'d never catch manually — optimal dosing windows, cycle timing, response patterns, and stack interactions as actionable guidance.' },
                { n: '04', title: 'Optimize continuously', body: 'Pattern recognition compounds over time. Your protocol history becomes a personal performance dataset that no spreadsheet, no generic tracker, and no other app can replicate.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="step">
                  <div className="step-num">{n}</div>
                  <div>
                    <div className="step-title">{title}</div>
                    <div className="step-body">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INTEL BAND */}
        <div className="intel-band">
          <div className="intel-label">Why Cortex Wins</div>
          <div className="intel-title">Your protocol deserves more<br />than <em>a spreadsheet.</em></div>
          <div className="intel-sub">Most trackers log. A few visualize. Only Peptide Cortex reasons — turning your stack history into a living, adaptive intelligence layer that improves every single cycle.</div>
          <div className="intel-metrics">
            {[
              { num: 'AI', label: 'Reasoning Engine' },
              { num: '58+', label: 'Peptide Profiles' },
              { num: '∞', label: 'Insight Depth' },
              { num: '0', label: 'Spreadsheets Needed' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="intel-metric-num">{num}</div>
                <div className="intel-metric-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="wrap">
          {/* PRICING */}
          <div className="cx-reveal" id="pricing">
            <div className="section-meta">
              <span className="section-num">03</span>
              <span className="section-label">Pricing</span>
            </div>
            <div className="section-title">Simple pricing.<br /><em>Serious intelligence.</em></div>
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="pricing-tier">Free</div>
                <div className="pricing-price"><sup>$</sup>0</div>
                <div className="pricing-period">forever · no credit card</div>
                <div className="pricing-annual">&nbsp;</div>
                <div className="pricing-rule" />
                <ul className="pricing-features">
                  <li>Up to 3 peptide profiles</li>
                  <li>Basic dose &amp; cycle logging</li>
                  <li>Half-life reference data</li>
                  <li>7-day protocol history</li>
                  <li className="dim">AI Insight Engine</li>
                  <li className="dim">Biomarker tracking</li>
                  <li className="dim">Stack builder</li>
                  <li className="dim">Vendor intelligence</li>
                </ul>
                <button className="pcta pcta-outline" onClick={() => router.push('/signup')}>Start Free</button>
              </div>

              <div className="pricing-card featured">
                <div className="pricing-badge">Most Popular</div>
                <div className="pricing-tier">Cortex Pro</div>
                <div className="pricing-price"><sup style={{ color: '#555' }}>$</sup>24</div>
                <div className="pricing-period" style={{ color: '#555' }}>per month</div>
                <div className="pricing-annual" style={{ color: 'var(--accent)' }}>or $19/mo — billed annually</div>
                <div className="pricing-rule" />
                <ul className="pricing-features">
                  <li>Unlimited peptide profiles</li>
                  <li>Full AI Insight Engine</li>
                  <li>Unlimited protocol history</li>
                  <li>Biomarker &amp; labs tracking</li>
                  <li>Cycle intelligence &amp; forecasting</li>
                  <li>Dosing window optimization</li>
                  <li>Stack interaction alerts</li>
                  <li className="dim">Vendor intelligence</li>
                </ul>
                <button className="pcta pcta-filled" onClick={() => router.push('/signup')}>Start Cortex Pro</button>
              </div>

              <div className="pricing-card">
                <div className="pricing-tier">Cortex Elite</div>
                <div className="pricing-price"><sup>$</sup>49</div>
                <div className="pricing-period">per month</div>
                <div className="pricing-annual">or $39/mo — billed annually</div>
                <div className="pricing-rule" />
                <ul className="pricing-features">
                  <li>Everything in Pro</li>
                  <li>Advanced AI stack builder</li>
                  <li>Vendor rankings &amp; sourcing intel</li>
                  <li>Purity &amp; COA database access</li>
                  <li>Priority AI processing</li>
                  <li>Early access to new features</li>
                  <li>Exportable protocol reports</li>
                  <li>Dedicated support</li>
                </ul>
                <button className="pcta pcta-outline" onClick={() => router.push('/signup')}>Start Elite</button>
              </div>
            </div>
          </div>

          {/* TAGLINES */}
          <div className="cx-reveal">
            <div className="section-meta">
              <span className="section-num">04</span>
              <span className="section-label">The Cortex Difference</span>
            </div>
            <div className="section-title">Built different.<br /><em>By design.</em></div>
            <div className="tagline-strip">
              {[
                { text: <>The only tracker that <em>thinks</em> between the doses.</>, tag: 'Intelligence' },
                { text: <><em>Every peptide.</em> Every cycle. Every insight.</>, tag: 'Coverage' },
                { text: <>Built on research. <em>Powered by AI.</em> Optimized for you.</>, tag: 'Credibility' },
                { text: <>From dosing window to <em>peak output</em> — intelligently.</>, tag: 'Performance' },
              ].map(({ text, tag }) => (
                <div key={tag} className="tagline-row">
                  <div className="tl-text">{text}</div>
                  <div className="tl-tag">{tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="final-cta">
          <div className="final-cta-title">Ready to give your protocol<br />a <em>real intelligence layer?</em></div>
          <div className="final-cta-sub">Start free. No credit card. Upgrade when you&apos;re ready.</div>
          <div className="final-btns">
            <button className="btn-hero" onClick={() => router.push('/signup')}>Get Started Free</button>
            <button className="btn-hero-ghost" onClick={() => router.push('/login')}>Sign In</button>
          </div>
        </div>

        {/* FOOTER */}
        <footer>
          <div className="footer-top">
            <div>
              <div className="footer-logo-super">Peptide</div>
              <div className="footer-logo-main">CORTE<span className="x">X</span></div>
              <div className="footer-desc">AI-Powered Peptide Intelligence Engine. The reasoning layer your protocol has always needed.</div>
            </div>
            <div>
              <div className="footer-col-label">Product</div>
              <ul className="footer-links">
                <li><button className="nav-link" style={{ color: '#666', fontSize: 13 }} onClick={() => scrollTo('features')}>Features</button></li>
                <li><button className="nav-link" style={{ color: '#666', fontSize: 13 }} onClick={() => scrollTo('how')}>How it Works</button></li>
                <li><button className="nav-link" style={{ color: '#666', fontSize: 13 }} onClick={() => scrollTo('pricing')}>Pricing</button></li>
                <li><a href="/reference" style={{ fontSize: 13, fontWeight: 300, color: '#666', textDecoration: 'none', letterSpacing: '0.02em' }}>Peptide Library</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-label">Legal</div>
              <ul className="footer-links">
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-label">Account</div>
              <ul className="footer-links">
                <li><a href="/login">Sign In</a></li>
                <li><a href="/signup">Create Account</a></li>
                <li><a href="/pricing">Upgrade to Pro</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2025 Peptide Cortex · All Rights Reserved</div>
            <div className="footer-suite">
              <div className="footer-suite-label">Also in this suite</div>
              <a href="https://praix.ai" className="footer-suite-link">PRAI<span className="ax">X</span></a>
            </div>
          </div>
        </footer>

        {/* LOGIN MODAL */}
        <div
          className={`modal-overlay${modalOpen ? ' active' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="modal-logo-super">Peptide</div>
              <div className="modal-logo">CORTE<span className="x">X</span></div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-title">Welcome back.</div>
              <div className="modal-subtitle">Sign in to access your protocols, AI insights, and full cycle history.</div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="••••••••••••" />
              </div>
              <button className="btn-login" onClick={() => router.push('/login')}>Sign In to Cortex</button>
              <div className="modal-divider"><span className="modal-divider-text">New to Cortex?</span></div>
              <div className="modal-signup">Don&apos;t have an account? <a href="/signup" onClick={() => setModalOpen(false)}>Choose a plan</a> and get started in seconds.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
