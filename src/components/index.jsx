import React from "react";
import "../styles/design-system.css";

const cx = (...values) => values.filter(Boolean).join(" ");

export function Watermark({ label = "THE DIAMOND DEALER", compact = false }) {
  return <div className={cx("watermark", compact && "watermark--compact")} aria-hidden="true"><span className="watermark__gem">◇</span><span>{label}</span></div>;
}

export function AppShell({ children, demo, navigation, status, className = "" }) {
  return <div className={cx("app-shell", className)}>
    <a className="skip-link" href="#main-content">Skip to report</a>
    {demo}
    {navigation}
    {status}
    <main id="main-content" className="app-shell__main">{children}</main>
    <footer className="app-footer"><Watermark compact /><p>Independent review. Clear evidence. No commissions.</p></footer>
  </div>;
}

export function DemoBar({ label = "Interactive demo", message = "Sample data — no purchase required", action }) {
  return <aside className="demo-bar" aria-label={label}>
    <div className="container demo-bar__inner"><span className="eyebrow demo-bar__label">{label}</span><span>{message}</span>{action && <span className="demo-bar__action">{action}</span>}</div>
  </aside>;
}

export function Navigation({ current = "Report", items = [], onMenuToggle, menuOpen = false, action }) {
  return <header className="navigation">
    <div className="container navigation__inner">
      <a className="brand" href="#" aria-label="The Diamond Dealer home"><span className="brand__mark" aria-hidden="true">◇</span><span><strong>The Diamond</strong><em>Dealer</em></span></a>
      <button className="icon-button navigation__toggle" type="button" onClick={onMenuToggle} aria-expanded={menuOpen} aria-controls="primary-navigation"><span className="sr-only">Toggle navigation</span><span aria-hidden="true">{menuOpen ? "×" : "☰"}</span></button>
      <nav id="primary-navigation" className={cx("navigation__links", menuOpen && "is-open")} aria-label="Primary navigation">
        {items.map((item) => <a key={item.label} href={item.href || "#"} aria-current={item.label === current ? "page" : undefined}>{item.label}</a>)}
      </nav>
      {action && <div className="navigation__action">{action}</div>}
    </div>
  </header>;
}

export function StatusBand({ status = "in_review", label, detail, updatedAt, steps = [] }) {
  const statusLabels = { draft: "Draft", submitted: "Submitted", in_review: "Under independent review", complete: "Report complete", needs_info: "More information needed" };
  return <section className={cx("status-band", `status-band--${status}`)} aria-label="Case status">
    <div className="container status-band__inner"><div><span className="status-dot" aria-hidden="true" /><span className="eyebrow">Case status</span><strong>{label || statusLabels[status] || status}</strong></div>{detail && <p>{detail}</p>}{updatedAt && <time>{updatedAt}</time>}</div>
    {steps.length > 0 && <div className="container status-band__steps" aria-label="Review progress">{steps.map((step, i) => <span key={step} className={i === 0 ? "is-current" : ""}>{step}</span>)}</div>}
  </section>;
}

export function VerdictCard({ verdict = "fair", title = "Fairly priced", summary, score, confidence = "High confidence", price, marketRange, children }) {
  const icon = verdict === "good" ? "✓" : verdict === "caution" ? "!" : verdict === "avoid" ? "×" : "≈";
  return <article className={cx("verdict-card", `verdict-card--${verdict}`)} aria-labelledby="verdict-title">
    <div className="verdict-card__top"><span className="verdict-card__seal" aria-hidden="true">{icon}</span><div><span className="eyebrow">Independent verdict</span><h1 id="verdict-title">{title}</h1>{summary && <p className="verdict-card__summary">{summary}</p>}</div>{score != null && <div className="score" aria-label={`${score} out of 100`}><strong>{score}</strong><span>/100</span></div>}</div>
    {(price || marketRange) && <dl className="verdict-card__prices">{price && <div><dt>Listed price</dt><dd>{price}</dd></div>}{marketRange && <div><dt>Expected market range</dt><dd>{marketRange}</dd></div>}</dl>}
    <div className="confidence"><span className="confidence__bars" aria-hidden="true"><i /><i /><i /></span>{confidence}</div>{children}
  </article>;
}

export function PreliminaryCard({ title = "Preliminary review", description, missing = [], action }) {
  return <article className="preliminary-card"><span className="eyebrow">Early signal</span><h2>{title}</h2>{description && <p>{description}</p>}{missing.length > 0 && <div><h3>Needed for a final verdict</h3><ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}{action && <div className="card-action">{action}</div>}</article>;
}

export function EvidenceChip({ children, tone = "neutral", icon }) {
  return <span className={cx("evidence-chip", `evidence-chip--${tone}`)}>{icon && <span aria-hidden="true">{icon}</span>}{children}</span>;
}

export function FindingRow({ label, verdict = "neutral", headline, detail, evidence = [], expanded = false, onToggle }) {
  const symbols = { positive: "✓", caution: "!", negative: "×", neutral: "•" };
  const content = <><span className={cx("finding-row__icon", `is-${verdict}`)} aria-hidden="true">{symbols[verdict] || "•"}</span><span className="finding-row__body"><span className="eyebrow">{label}</span><strong>{headline}</strong>{detail && <span className="finding-row__detail">{detail}</span>}{evidence.length > 0 && <span className="finding-row__evidence">{evidence.map((item, i) => <EvidenceChip key={i} tone={item.tone}>{item.label || item}</EvidenceChip>)}</span>}</span></>;
  return onToggle ? <button type="button" className="finding-row finding-row--button" onClick={onToggle} aria-expanded={expanded}>{content}<span className="finding-row__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span></button> : <div className="finding-row">{content}</div>;
}

export function Timeline({ items = [], currentId }) {
  return <ol className="timeline">{items.map((item) => <li key={item.id || item.title} className={cx(item.id === currentId && "is-current", item.complete && "is-complete")}><span className="timeline__marker" aria-hidden="true" /><div><div className="timeline__heading"><strong>{item.title}</strong>{item.time && <time>{item.time}</time>}</div>{item.description && <p>{item.description}</p>}</div></li>)}</ol>;
}

export function ListingCard({ image, eyebrow = "Listing snapshot", title, seller, price, specs = [], href, action }) {
  return <article className="listing-card">{image ? <img className="listing-card__image" src={image} alt="" /> : <div className="listing-card__placeholder" aria-hidden="true"><span>◇</span></div>}<div className="listing-card__content"><span className="eyebrow">{eyebrow}</span><h3>{title}</h3>{seller && <p className="listing-card__seller">Sold by {seller}</p>}<strong className="listing-card__price">{price}</strong>{specs.length > 0 && <dl className="spec-grid">{specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl>}<div className="listing-card__actions">{href && <a className="text-link" href={href}>View original listing <span aria-hidden="true">↗</span></a>}{action}</div></div></article>;
}

export function ReportVersionChain({ versions = [], activeId, onSelect }) {
  return <section className="version-chain" aria-labelledby="versions-heading"><div className="section-heading"><div><span className="eyebrow">Audit trail</span><h2 id="versions-heading">Report history</h2></div></div><ol>{versions.map((version, i) => <li key={version.id} className={version.id === activeId ? "is-active" : ""}><button type="button" onClick={() => onSelect?.(version)} aria-current={version.id === activeId ? "true" : undefined}><span className="version-chain__number">{String(versions.length - i).padStart(2, "0")}</span><span><strong>{version.label}</strong><small>{version.date}{version.author ? ` · ${version.author}` : ""}</small>{version.note && <span>{version.note}</span>}</span></button></li>)}</ol></section>;
}

export function CaseTracker({ cases = [], onOpen, empty }) {
  if (!cases.length) return empty || <EmptyState title="No reviews yet" description="Your submitted listings and independent reports will appear here." />;
  return <div className="case-grid">{cases.map((item) => <article className="case-card" key={item.id}><div className="case-card__header"><span className={cx("status-pill", `status-pill--${item.status}`)}>{item.statusLabel || item.status}</span><small>#{item.id}</small></div><h3>{item.title}</h3><p>{item.subtitle}</p><div className="case-card__meta">{item.price && <strong>{item.price}</strong>}{item.updatedAt && <time>{item.updatedAt}</time>}</div><button className="button button--secondary" type="button" onClick={() => onOpen?.(item)}>Open case <span aria-hidden="true">→</span></button></article>)}</div>;
}

export function ReviewerTable({ rows = [], selected = [], onSelect, onOpen }) {
  return <div className="table-wrap"><table className="review-table"><caption className="sr-only">Review queue</caption><thead><tr><th scope="col"><span className="sr-only">Select</span></th><th scope="col">Case</th><th scope="col">Listing</th><th scope="col">Risk</th><th scope="col">Age</th><th scope="col">Assignee</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><input type="checkbox" aria-label={`Select case ${row.id}`} checked={selected.includes(row.id)} onChange={() => onSelect?.(row.id)} /></td><td><strong>#{row.id}</strong><small>{row.stage}</small></td><td><strong>{row.title}</strong><small>{row.seller}</small></td><td><span className={cx("risk", `risk--${row.risk}`)}>{row.risk}</span></td><td>{row.age}</td><td>{row.assignee || "Unassigned"}</td><td><button type="button" className="text-button" onClick={() => onOpen?.(row)} aria-label={`Review case ${row.id}`}>Review →</button></td></tr>)}</tbody></table></div>;
}

export function ReviewerQueue({ title = "Review queue", rows = [], filters, metrics = [], ...tableProps }) {
  return <section className="reviewer-queue" aria-labelledby="queue-heading"><div className="section-heading"><div><span className="eyebrow">Operations</span><h1 id="queue-heading">{title}</h1></div>{filters}</div>{metrics.length > 0 && <dl className="metric-row">{metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd>{metric.note && <small>{metric.note}</small>}</div>)}</dl>}<ReviewerTable rows={rows} {...tableProps} /></section>;
}

export function DemoControls({ scenario, scenarios = [], onScenarioChange, density = "comfortable", onDensityChange, onReset }) {
  return <form className="demo-controls" onSubmit={(event) => event.preventDefault()}><div><label htmlFor="demo-scenario">Demo scenario</label><select id="demo-scenario" value={scenario} onChange={(e) => onScenarioChange?.(e.target.value)}>{scenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><fieldset><legend>Density</legend><div className="segmented">{["comfortable", "compact"].map((item) => <label key={item}><input type="radio" name="density" value={item} checked={density === item} onChange={() => onDensityChange?.(item)} /><span>{item}</span></label>)}</div></fieldset><button className="button button--ghost" type="button" onClick={onReset}>Reset demo</button></form>;
}

export function EmptyState({ icon = "◇", title = "Nothing here yet", description, action }) {
  return <div className="state-card state-card--empty" role="status"><span className="state-card__icon" aria-hidden="true">{icon}</span><h2>{title}</h2>{description && <p>{description}</p>}{action && <div className="card-action">{action}</div>}</div>;
}

export function ErrorState({ title = "We couldn’t load this report", description = "Your data is safe. Try again in a moment.", action, reference }) {
  return <div className="state-card state-card--error" role="alert"><span className="state-card__icon" aria-hidden="true">!</span><h2>{title}</h2><p>{description}</p>{reference && <small>Reference: {reference}</small>}{action && <div className="card-action">{action}</div>}</div>;
}

export function SectionHeading({ eyebrow, title, description, action, as: Tag = "h2" }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<Tag>{title}</Tag>{description && <p>{description}</p>}</div>{action}</div>;
}
