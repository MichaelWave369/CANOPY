import React, { useState } from 'react';
import ScenarioLab from './ScenarioLab.jsx';
import LivingAtlas from './LivingAtlas.jsx';
import { ACRONYM, ASSUMPTIONS, DISTRICTS, LAND_USE, SYSTEMS, PHASES, energyBalanceGWh } from './model.js';

const repoUrl = 'https://github.com/MichaelWave369/CANOPY';
const landColor = {
  built: 'var(--gold)',
  habitat: 'var(--forest)',
  landscape: 'var(--mint)',
  mobility: 'var(--blue)'
};

function BrandMark() {
  return (
    <svg className="brand-symbol" viewBox="0 0 50 50" aria-hidden="true">
      <circle cx="25" cy="25" r="23" fill="#142c23" stroke="#769980" strokeWidth="1.5" />
      <path d="M25 41V15M24 29C9 12 7 27 18 34M26 26C41 11 44 25 34 34" fill="none" stroke="#b9dfb5" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="25" cy="11" r="3.6" fill="#d7b577" />
    </svg>
  );
}

function MapArtwork() {
  return (
    <svg className="site-art" viewBox="0 0 1000 690" role="img" aria-label="Illustrative plan with six walkable neighborhoods, a protected north-south river corridor, farms, wetlands, forests and transit links.">
      <defs>
        <linearGradient id="ground" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#d7e1c5" offset="0" />
          <stop stopColor="#a2c6a9" offset="1" />
        </linearGradient>
        <linearGradient id="water" x1="0" x2="1">
          <stop stopColor="#4a9db0" offset="0" />
          <stop stopColor="#8bc3be" offset="1" />
        </linearGradient>
        <pattern id="farmRows" width="15" height="16" patternUnits="userSpaceOnUse">
          <rect width="15" height="16" fill="#bacf99" />
          <path d="M0 5H15 M0 11H15" stroke="#7c995e" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="1000" height="690" rx="25" fill="url(#ground)" />
      <path d="M0 0H420Q453 64 355 129T0 173Z" fill="#477a53" opacity=".45" />
      <path d="M805 0H1000V164Q934 189 861 132T805 0" fill="#477a53" opacity=".37" />
      <path d="M0 596Q180 550 276 690H0Z M824 600Q939 559 1000 635V690H802Z" fill="#4d805d" opacity=".45" />
      <path d="M553 -30Q586 111 562 199T563 364T581 532T580 720" stroke="#c4e4d6" strokeWidth="232" fill="none" opacity=".88" />
      <path d="M569 -30Q595 118 581 204T579 364T602 527T598 719" stroke="#77b1ae" strokeWidth="124" fill="none" />
      <path d="M571 -30Q592 117 581 204T577 364T599 527T597 719" stroke="url(#water)" strokeWidth="69" fill="none" />
      <g className="greenway" fill="none" strokeWidth="33" strokeLinecap="round">
        <path d="M0 240Q223 265 389 304T1000 268" />
        <path d="M49 497Q236 456 386 476T1000 502" />
      </g>
      <g fill="url(#farmRows)" stroke="#f1e4b7" strokeWidth="6" opacity=".9">
        <rect x="64" y="329" width="230" height="90" rx="8" />
        <rect x="770" y="334" width="175" height="100" rx="8" />
        <rect x="203" y="596" width="235" height="73" rx="8" />
        <rect x="762" y="29" width="175" height="83" rx="8" />
      </g>
      <g fill="#7cb7a0" opacity=".55">
        <ellipse cx="740" cy="629" rx="99" ry="55" />
        <ellipse cx="689" cy="652" rx="60" ry="34" />
        <ellipse cx="792" cy="667" rx="68" ry="25" />
      </g>
      <g className="transit-routes" fill="none" stroke="#d3b278" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round">
        <path d="M175 195L390 151L829 193" />
        <path d="M174 195L150 511L397 458L831 530L829 193" />
        <path d="M390 151L397 458" />
      </g>
      <g fill="none" stroke="#f9f1d6" strokeWidth="3" strokeLinecap="round" opacity=".86">
        <path d="M175 195L390 151L829 193 M174 195L150 511L397 458L831 530L829 193 M390 151L397 458" strokeDasharray="3 17" />
      </g>
      {DISTRICTS.map((d) => {
        const px = d.x * 10;
        const py = d.y * 6.9;
        return (
          <g key={d.id} transform={'translate(' + px + ',' + py + ')'} aria-hidden="true">
            <circle r="101" fill="#e4ead7" stroke="#6c9585" strokeWidth="4" opacity=".94" />
            <circle r="86" fill="none" stroke="#9abda0" strokeWidth="2" strokeDasharray="6 5" />
            <g fill="#749e83" opacity=".77">
              <rect x="-49" y="-52" width="27" height="24" rx="3" />
              <rect x="-11" y="-62" width="28" height="25" rx="3" />
              <rect x="31" y="-43" width="24" height="24" rx="3" />
              <rect x="-61" y="-11" width="29" height="24" rx="3" />
              <rect x="31" y="10" width="25" height="27" rx="3" />
              <rect x="-29" y="39" width="28" height="23" rx="3" />
            </g>
            <circle r="17" fill="#d0b071" stroke="#fcf8ea" strokeWidth="6" />
          </g>
        );
      })}
      <g fill="#1a514a" opacity=".8" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700" letterSpacing="1.7">
        <text x="31" y="46">UPLAND HABITAT</text>
        <text x="33" y="64">NO BUILD</text>
        <text x="656" y="357">RIPARIAN RESERVE</text>
        <text x="735" y="608">WETLAND CELL</text>
      </g>
      <g fill="#fcfaec" opacity=".82">
        <rect x="551" y="165" width="92" height="17" rx="3" transform="rotate(4 597 173)" />
        <rect x="568" y="470" width="90" height="17" rx="3" transform="rotate(6 613 478)" />
      </g>
    </svg>
  );
}

function SiteExplorer() {
  const [activeId, setActiveId] = useState('garden');
  const district = DISTRICTS.find(d => d.id === activeId);
  return (
    <div className="explorer-grid">
      <div className="map-container">
        <div className="map-topline"><span className="eyebrow dark">Conceptual land study</span><span className="map-scale">Not to scale • no real site selected</span></div>
        <div className="map-canvas">
          <MapArtwork />
          {DISTRICTS.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className={'district-button' + (activeId === d.id ? ' is-active' : '')}
              style={{ left: d.x + '%', top: d.y + '%' }}
              aria-label={'Explore ' + d.name}
              aria-pressed={activeId === d.id}
              title={d.name}
              onClick={() => setActiveId(d.id)}
            >{i + 1}</button>
          ))}
        </div>
        <div className="map-caption"><span className="legend-dot" /> District center <span className="line-symbol" /> Transit + emergency spine <span className="water-symbol" /> Protected river</div>
      </div>
      <aside className="district-card">
        <div className="card-rule"><span>District selector</span><span>0{DISTRICTS.findIndex(d => d.id === activeId) + 1} / 06</span></div>
        <h3>{district.name}</h3>
        <p className="district-role">{district.role}</p>
        <div className="detail-divider" />
        <span className="detail-label">PLACE-MAKING PRIORITY</span>
        <p>{district.detail}</p>
        <div className="detail-divider" />
        <span className="detail-label">LANDSCAPE CHARACTER</span>
        <p>{district.feature}</p>
        <div className="district-note">Every district is a planning module, not a surveyed parcel. Ecological conditions can move, shrink, or eliminate development.</div>
      </aside>
    </div>
  );
}

function Systems() {
  const [active, setActive] = useState('water');
  const item = SYSTEMS.find(s => s.id === active);
  return (
    <div className="systems-layout">
      <div className="system-list" role="group" aria-label="Explore the five circulatory systems">
        {SYSTEMS.map(s => (
          <button className={'system-choice' + (active === s.id ? ' is-active' : '')} key={s.id} onClick={() => setActive(s.id)} aria-pressed={active === s.id} type="button">
            <span className="system-index">{s.order}</span>
            <span>{s.name}</span>
            <span className="system-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="system-content" aria-live="polite">
        <div className="eyebrow">Circulatory system {item.order}</div>
        <h3>{item.tagline}</h3>
        <p>{item.description}</p>
        <div className="evidence">
          <span className="detail-label">REFERENCE MODEL / EVIDENCE BOUNDARY</span>
          <p>{item.evidence}</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="CANOPY home"><BrandMark/><span>CANOPY<span className="brand-period">.</span></span></a>
        <nav aria-label="Primary navigation">
          <a href="#place">The place</a>
          <a href="#systems">The systems</a><a href="#atlas">Living atlas</a><a href="#lab">Living lab</a>
          <a href="#evidence">Reality ledger</a>
          <a className="nav-github" href={repoUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> OPEN URBAN RESEARCH / CONCEPT 001</div>
            <h1>A city designed <em>to belong.</em></h1>
            <p className="hero-lead">Not a city with nature added. A climate-adaptive network of open places, designed around watersheds, biodiversity, and the people who call them home.</p>
            <div className="hero-actions"><a href="#place" className="primary-link">Explore the masterplan <span>↘</span></a><a href="#evidence" className="secondary-link">Read the reality ledger ↗</a></div>
            <p className="acronym-line">C.A.N.O.P.Y. = {ACRONYM}</p>
          </div>
          <div className="hero-aside">
            <div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="orbit orbit-3" />
            <div className="hero-center"><BrandMark /><p>ONE WATERSHED<br />SIX NEIGHBORHOODS<br />FIVE LIVING SYSTEMS</p></div>
            <div className="hero-stamp">DESIGNED FOR LIFE, NOT EXCESS</div>
          </div>
        </section>

        <section className="stat-strip" aria-label="Reference planning assumptions">
          <div><strong>12 <small>km²</small></strong><span>illustrative study area</span></div>
          <div><strong>60,000</strong><span>planned residents at maturity</span></div>
          <div><strong>06</strong><span>walkable districts</span></div>
          <div><strong>05</strong><span>linked resource systems</span></div>
        </section>

        <section id="place" className="section section-site">
          <div className="section-intro">
            <span className="eyebrow">01 / THE PLACE</span>
            <h2>Build less ground.<br /><em>Protect more life.</em></h2>
            <p>Six human-scale districts fit into a continuous river, forest and farming landscape. The land comes first. The architecture follows.</p>
          </div>
          <SiteExplorer />
          <div className="land-budget">
            <div className="budget-title"><div><span className="eyebrow dark">Land use • preliminary allocation</span><h3>Space for more than us.</h3></div><p>Shares refer to surface categories, not a claim that all undeveloped land is wilderness.</p></div>
            <div className="land-bar" aria-label="15 percent building footprints, 48 percent habitat water and restoration, 25 percent productive landscape, 12 percent transit civic and utilities">
              {LAND_USE.map(l => <div key={l.key} className={'land-segment ' + l.key} style={{ flexBasis: l.percent + '%' }} title={l.name + ': ' + l.percent + '%'} />)}
            </div>
            <div className="land-legend">{LAND_USE.map(l => <div key={l.key}><span className="land-key" style={{ background: landColor[l.key] }} /><strong>{l.percent}%</strong><span>{l.name}</span></div>)}</div>
          </div>
        </section>

        <section id="systems" className="section section-systems">
          <div className="section-intro">
            <span className="eyebrow">02 / CITY METABOLISM</span>
            <h2>Five systems.<br /><em>One living relationship.</em></h2>
            <p>Resource cycles are measured, shared and engineered with safe separation. No mythical perpetual-motion machines required.</p>
          </div>
          <Systems />
        </section>

        <section id="evidence" className="section section-evidence">
          <div className="section-intro">
            <span className="eyebrow">03 / THE REALITY LEDGER</span>
            <h2>Hope is a vision.<br /><em>Evidence is a requirement.</em></h2>
            <p>These are design calculations, not real-world output or verified performance. Hourly modeling, environmental review and third-party checks come before claims.</p>
          </div>
          <div className="metric-grid">
            <article className="metric-card"><span className="metric-kicker">ELECTRICITY / ANNUAL SCENARIO</span><strong>{ASSUMPTIONS.annualDemandGWh} <small>GWh</small></strong><p>Estimated gross demand. Solar and conditional wind total 240.5 GWh in the illustrative model, just {energyBalanceGWh()} GWh above demand <em>before</em> losses and hourly mismatches.</p></article>
            <article className="metric-card"><span className="metric-kicker">WATER / DAILY SCENARIO</span><strong>{ASSUMPTIONS.dailyWaterML} <small>ML</small></strong><p>Illustrative gross water demand. Reclaimed non-potable reuse of 2–3 ML/day is a conditional target requiring lawful supply, treatment and verification.</p></article>
            <article className="metric-card"><span className="metric-kicker">RESILIENCE / STARTING CASE</span><strong>72 <small>hours</small></strong><p>Model essential loads first: 5 MW for 72 hours implies 360 MWh delivered before losses. Two-week full-city autonomy is not yet supported.</p></article>
          </div>
          <div className="truth-banner"><span className="truth-chip">{ASSUMPTIONS.status}</span><p>There is no selected site, completed environmental assessment, planning approval or constructed CANOPY city. These materials are an open reference for scrutiny and iteration.</p></div>
        </section>

        <section id="lab" className="section-lab"><ScenarioLab /></section>

        <section id="atlas" className="section-atlas"><LivingAtlas /></section>

        <section id="roadmap" className="section section-roadmap">
          <div className="section-intro"><span className="eyebrow">04 / FROM CONCEPT TO EVIDENCE</span><h2>Start with one quarter.<br /><em>Earn the right to scale.</em></h2><p>The first neighborhood is a test of water, ecology, housing and governance. No expansion without audited performance.</p></div>
          <div className="phase-grid">{PHASES.map(p => <div className="phase-card" key={p.id}><span className="phase-id">{p.id}</span><span className="phase-period">{p.period}</span><h3>{p.title}</h3><p>{p.description}</p></div>)}</div>
        </section>

        <section className="end-panel">
          <span className="eyebrow">OPEN BY DESIGN</span>
          <h2>A better place is<br /><em>something we build together.</em></h2>
          <p>Open architecture. Transparent models. Biodiversity and affordability as hard constraints. The next step is to find a real site and test every assumption.</p>
          <a className="primary-link light" href={repoUrl} target="_blank" rel="noreferrer">Explore the repository <span>↗</span></a>
        </section>
      </main>

      <footer><span>© 2026 CANOPY • MIT open source</span><span>Climate-Adaptive Network of Open Places for You</span><a href={repoUrl + '/blob/main/docs/RESEARCH-LEDGER.md'} target="_blank" rel="noreferrer">Research transparency ↗</a></footer>
    </div>
  );
}

export default App;
