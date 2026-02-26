import { config } from "../config";
import { createLogger } from "../logger";
import { handleApiRequest } from "./api";
import { join } from "path";

const log = createLogger("web");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".css": "text/css",
  ".js": "application/javascript",
};

export function startWebServer() {
  const server = Bun.serve({
    port: config.web.port,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname.startsWith("/api/")) {
        return handleApiRequest(url.pathname);
      }

      // Serve static files from public/
      if (url.pathname.startsWith("/img/") || url.pathname.startsWith("/public/")) {
        const filePath = join(process.cwd(), "public", url.pathname.replace(/^\/public/, ""));
        const file = Bun.file(filePath);
        if (await file.exists()) {
          const ext = filePath.substring(filePath.lastIndexOf("."));
          return new Response(file, {
            headers: { "Content-Type": MIME_TYPES[ext] || "application/octet-stream", "Cache-Control": "public, max-age=3600" },
          });
        }
        return new Response("Not found", { status: 404 });
      }

      return new Response(dashboardHtml(), {
        headers: { "Content-Type": "text/html" },
      });
    },
  });

  log.info(`Dashboard running at http://localhost:${config.web.port}`);
  return server;
}

function dashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nancy Pelosi - Congressional Trading Desk</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "Open Sans", sans-serif;
  font-size: 16px;
  color: #333;
  background: #fff;
  line-height: 1.5;
}
a { color: inherit; text-decoration: none; }
a:hover { text-decoration: underline; }

/* TOP ALERT BAR */
.top-alert-bar {
  background: #f0f4fa;
  border-bottom: 1px solid #d0dce8;
  padding: 8px 0;
  text-align: center;
  font-size: 14px;
}
.top-alert-bar a { color: #1a3a6b; font-weight: 700; }

/* NAVBAR */
.site-navbar {
  background: rgba(16, 36, 71, 0.97);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  min-height: 80px;
}
.navbar-logo { display: flex; align-items: center; text-decoration: none; }
.navbar-logo:hover { text-decoration: none; }
.navbar-logo-box { border: 2px solid #fff; padding: 8px 14px; line-height: 1.1; }
.navbar-logo-eyebrow { font-size: 10px; font-weight: 600; color: #ccd8f0; letter-spacing: 1.5px; text-transform: uppercase; }
.navbar-logo-title { font-size: 22px; font-weight: 800; color: #fff; text-transform: uppercase; line-height: 1.1; }
.navbar-logo-subtitle { font-size: 10px; font-weight: 600; color: #ccd8f0; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
.navbar-menu { display: flex; list-style: none; align-items: center; overflow-x: auto; scrollbar-width: none; }
.navbar-menu::-webkit-scrollbar { display: none; }
.navbar-menu > li { position: relative; }
.navbar-menu > li > a {
  display: block;
  padding: 28px 12px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  white-space: nowrap;
  transition: background 0.2s;
  text-decoration: none;
}
.navbar-menu > li > a:hover { background: rgba(66,109,230,0.4); text-decoration: none; }
.navbar-menu > li:hover .dropdown-menu { display: block; }
.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: #102447;
  min-width: 220px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  border-top: 3px solid #426de6;
  z-index: 999;
  list-style: none;
}
.dropdown-menu li a {
  display: block;
  padding: 10px 16px;
  color: #ccd8f0;
  font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  transition: background 0.15s;
  text-decoration: none;
}
.dropdown-menu li a:hover { background: rgba(66,109,230,0.3); color: #fff; }
.paper-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255,255,255,0.5);
  color: rgba(255,255,255,0.85);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 5px 14px;
  border-radius: 20px;
  text-transform: uppercase;
  white-space: nowrap;
}
.live-dot {
  width: 7px; height: 7px;
  background: #4caf50;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* HERO CAROUSEL */
.hero-carousel {
  position: relative;
  height: 520px;
  overflow: hidden;
  background: #0d162f;
}
.carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  pointer-events: none;
}
.carousel-slide.active { opacity: 1; pointer-events: all; }
.carousel-slide-bg {
  width: 100%; height: 100%; object-fit: cover; object-position: center top;
}
.carousel-slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, transparent 100%);
}
.carousel-slide-gradient {
  width: 100%; height: 100%;
}
.carousel-caption {
  position: absolute;
  bottom: 60px;
  left: 60px;
  max-width: 520px;
  color: #fff;
}
.carousel-caption h2 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 10px;
  line-height: 1.2;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}
.carousel-caption p {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255,255,255,0.88);
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}
.carousel-indicators {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.carousel-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.carousel-dot.active { background: #fff; }
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.4);
  border: none;
  color: #fff;
  font-size: 24px;
  padding: 12px 16px;
  cursor: pointer;
  z-index: 10;
  line-height: 1;
  transition: background 0.2s;
}
.carousel-btn:hover { background: rgba(66,109,230,0.7); }
.carousel-btn.prev { left: 10px; }
.carousel-btn.next { right: 10px; }

/* NEWSLETTER BANNER */
.newsletter-banner {
  background: #f5f7fa;
  border-top: 1px solid #dce6f0;
  border-bottom: 1px solid #dce6f0;
  text-align: center;
  padding: 50px 20px;
}
.newsletter-banner .eyebrow {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 24px;
  color: #3b5a7f;
  display: block;
  margin-bottom: 4px;
}
.newsletter-banner h2 {
  font-size: 48px;
  font-weight: 900;
  color: #426de6;
  letter-spacing: 4px;
  text-transform: uppercase;
  line-height: 1;
  margin-bottom: 2px;
}
.newsletter-banner h3 {
  font-size: 22px;
  font-weight: 600;
  color: #102447;
  letter-spacing: 5px;
  text-transform: uppercase;
}

/* HOW CAN I HELP YOU */
.help-section {
  background: #102447;
  padding: 60px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.help-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(16,36,71,0.82);
}
.help-section > * { position: relative; z-index: 1; }
.help-section h2 { color: #fff; font-size: 36px; font-weight: 800; margin-bottom: 40px; }
.help-icons { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; margin-bottom: 40px; }
.help-icon-item {
  text-align: center;
  color: #fff;
  text-decoration: none;
  transition: transform 0.2s;
  max-width: 120px;
  cursor: pointer;
}
.help-icon-item:hover { transform: translateY(-3px); text-decoration: none; }
.help-icon-item i { font-size: 48px; display: block; margin-bottom: 10px; }
.help-icon-item span { font-size: 14px; font-weight: 600; }
.btn-outline-white {
  display: inline-block;
  border: 2px solid #fff;
  color: #fff;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
}
.btn-outline-white:hover { background: rgba(255,255,255,0.15); text-decoration: none; color: #fff; }

/* LATEST NEWS + LIVE FEED */
.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
}
.section-title { font-size: 36px; font-weight: 800; color: #102447; margin-bottom: 24px; display: block; }
.news-item { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e8eef5; }
.news-item:last-of-type { border-bottom: none; }
.news-item h3 a { color: #3b5a7f; font-size: 18px; font-weight: 700; line-height: 1.3; text-decoration: none; }
.news-item h3 a:hover { color: #426de6; text-decoration: underline; }
.news-meta { font-size: 13px; font-weight: 700; color: #333; margin-top: 6px; }
.news-meta .sep { margin: 0 8px; }
.btn-outline-dark {
  display: inline-block;
  border: 2px solid #102447;
  color: #102447;
  padding: 10px 28px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 20px;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-outline-dark:hover { background: #102447; color: #fff; text-decoration: none; }

/* TRADING DASHBOARD */
.trading-dashboard { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
.dashboard-section-title {
  font-size: 14px; font-weight: 700; color: #102447; letter-spacing: 1.5px; text-transform: uppercase;
  margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #426de6;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid #d0dce8;
  border-radius: 6px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(16,36,71,0.06);
}
.stat-card .label { font-size: 11px; font-weight: 700; color: #5a6577; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 8px; }
.stat-card .value { font-size: 26px; font-weight: 700; color: #102447; }
.value.positive { color: #1a7a3a; }
.value.negative { color: #c0392b; }
.value.neutral  { color: #102447; }
.panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.panel { background: #fff; border: 1px solid #d0dce8; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(16,36,71,0.06); margin-bottom: 24px; }
.panel-header { background: #102447; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; }
.panel-header h3 { color: #fff; font-size: 15px; font-weight: 700; }
.count-badge {
  background: #426de6;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #5a6577; background: #f5f7fa; border-bottom: 1px solid #d0dce8; }
.data-table td { padding: 10px 14px; border-bottom: 1px solid #eef1f5; color: #333; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f9fbff; }
.data-table .ticker { font-weight: 700; color: #102447; }
.data-table .positive { color: #1a7a3a; font-weight: 600; }
.data-table .negative { color: #c0392b; font-weight: 600; }
.empty-state { text-align: center; color: #aab3c0; font-style: italic; padding: 24px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border: 1px solid currentColor; }
.badge.buy { color: #1a7a3a; }
.badge.sell { color: #c0392b; }
.badge.open { color: #426de6; }
.badge.commentary { color: #5a6577; }
.badge.partial { color: #e67e22; }
.tweet-item { padding: 16px 20px; border-bottom: 1px solid #eef1f5; }
.tweet-item:last-child { border-bottom: none; }
.tweet-text { font-size: 14px; color: #333; margin-bottom: 8px; line-height: 1.5; }
.tweet-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5a6577; }
.score-bar { display: inline-block; width: 50px; height: 4px; background: #e8eef5; border-radius: 2px; margin-left: 6px; vertical-align: middle; }
.score-bar .fill { display: block; height: 100%; border-radius: 2px; }
.intel-btn { background: none; border: 1px solid #426de6; color: #426de6; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 3px; cursor: pointer; transition: all 0.15s; }
.intel-btn:hover { background: #426de6; color: #fff; }
.intel-row { display: none; }
.intel-row td { font-size: 12px; color: #5a6577; padding: 12px 16px; line-height: 1.6; background: #f5f7fa; }
.briefing-card { padding: 16px 20px; border-bottom: 1px solid #eef1f5; }
.briefing-card:last-child { border-bottom: none; }
.briefing-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.briefing-token { font-size: 13px; font-weight: 700; color: #102447; }
.briefing-score { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 3px; }
.briefing-score.high { background: #426de6; color: #fff; }
.briefing-score.mid  { background: #2b458f; color: #fff; }
.briefing-score.low  { background: #aab3c0; color: #fff; }
.briefing-text { font-size: 13px; color: #5a6577; line-height: 1.6; margin-bottom: 6px; }
.briefing-meta { font-size: 11px; color: #aab3c0; }

/* DESK LOCATIONS */
.office-locations { background: #e5ebf3; padding: 60px 20px; }
.office-locations h2 { text-align: center; font-size: 36px; font-weight: 800; color: #102447; margin-bottom: 40px; }
.offices-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1000px; margin: 0 auto; }
.office-card { background: #fff; border-radius: 6px; padding: 24px 28px; display: flex; align-items: center; gap: 24px; box-shadow: 0 1px 4px rgba(16,36,71,0.08); }
.office-info h3 { font-size: 18px; font-weight: 800; color: #102447; margin-bottom: 8px; }
.office-info p { font-size: 14px; color: #555; line-height: 1.6; }
.office-img { width: 200px; height: 140px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: linear-gradient(135deg, #2B458F, #102447); }

/* FOOTER */
.site-footer { background: #0d162f; padding: 20px; text-align: center; }
.footer-links { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-bottom: 10px; }
.footer-links a { color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 600; text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: #fff; }
.footer-sub { color: rgba(255,255,255,0.35); font-size: 11px; letter-spacing: 0.5px; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .navbar-menu { display: none; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .panels-grid { grid-template-columns: 1fr; }
  .content-section { grid-template-columns: 1fr; gap: 30px; padding: 30px 20px; }
  .offices-grid { grid-template-columns: 1fr; }
  .office-card { flex-direction: column; }
  .hero-carousel { height: 320px; }
  .carousel-caption { left: 20px; bottom: 30px; }
  .carousel-caption h2 { font-size: 20px; }
}
</style>
</head>
<body>

<!-- TOP ALERT BAR -->
<div class="top-alert-bar">
  <span>Trading Desk Status: </span>
  <a href="#dashboard" id="alert-status">Initializing systems...</a>
</div>

<!-- NAVBAR -->
<nav class="site-navbar">
  <div class="navbar-inner">
    <a class="navbar-logo" href="#">
      <div class="navbar-logo-box">
        <div class="navbar-logo-eyebrow">Speaker Emerita</div>
        <div class="navbar-logo-title">Nancy Pelosi</div>
        <div class="navbar-logo-subtitle">Congressional Trading Desk</div>
      </div>
    </a>
    <ul class="navbar-menu">
      <li><a href="#dashboard">Dashboard</a></li>
      <li>
        <a href="#positions-section">Positions</a>
        <ul class="dropdown-menu">
          <li><a href="#positions-section">Active Positions</a></li>
          <li><a href="#trades-section">Trade Ledger</a></li>
        </ul>
      </li>
      <li>
        <a href="#briefings-section">Intelligence</a>
        <ul class="dropdown-menu">
          <li><a href="#briefings-section">Briefings</a></li>
          <li><a href="#discovery-section">Discovery Feed</a></li>
        </ul>
      </li>
      <li><a href="#tweets-section">Communications</a></li>
      <li>
        <span id="mode-badge" class="paper-badge">
          <span class="live-dot"></span>
          PAPER TRADING
        </span>
      </li>
    </ul>
  </div>
</nav>

<!-- HERO CAROUSEL -->
<div class="hero-carousel">
  <div class="carousel-slide active">
    <img class="carousel-slide-bg" src="/img/slide1-bif-signing.jpg" alt="" onerror="this.style.display='none'">
    <div class="carousel-slide-overlay"></div>
    <div class="carousel-caption">
      <h2>Bipartisan Infrastructure Investment</h2>
      <p>The Congressional Trading Desk monitors market-moving legislation and infrastructure investments for strategic positioning opportunities.</p>
    </div>
  </div>
  <div class="carousel-slide">
    <div class="carousel-slide-overlay" style="background:linear-gradient(135deg,rgba(16,36,71,0.9),rgba(43,69,143,0.7))"></div>
    <div class="carousel-caption">
      <h2>Real-Time Intelligence Analysis</h2>
      <p>AI-powered token evaluation with composite scoring across liquidity, momentum, holder distribution, and meme quality indicators.</p>
    </div>
  </div>
  <div class="carousel-slide">
    <div class="carousel-slide-overlay" style="background:linear-gradient(135deg,rgba(13,22,47,0.92),rgba(66,109,230,0.6))"></div>
    <div class="carousel-caption">
      <h2>Classified Trading Operations</h2>
      <p>Automated position management with partial profit-taking, trailing stops, and risk-controlled exposure limits.</p>
    </div>
  </div>
  <div class="carousel-slide">
    <div class="carousel-slide-overlay" style="background:linear-gradient(135deg,rgba(16,36,71,0.88),rgba(26,122,58,0.5))"></div>
    <div class="carousel-caption">
      <h2>Congressional Communications</h2>
      <p>Automated market commentary delivered in the distinguished voice of the Speaker's office. Democracy works.</p>
    </div>
  </div>
  <button class="carousel-btn prev"><i class="fas fa-chevron-left"></i></button>
  <button class="carousel-btn next"><i class="fas fa-chevron-right"></i></button>
  <div class="carousel-indicators">
    <button class="carousel-dot active"></button>
    <button class="carousel-dot"></button>
    <button class="carousel-dot"></button>
    <button class="carousel-dot"></button>
  </div>
</div>

<!-- NEWSLETTER BANNER -->
<div class="newsletter-banner">
  <span class="eyebrow">from the desk of</span>
  <h2>Speaker Pelosi</h2>
  <h3>Trading Intelligence</h3>
</div>

<!-- HOW CAN I HELP -->
<div class="help-section">
  <h2>Trading Desk Operations</h2>
  <div class="help-icons">
    <a class="help-icon-item" href="#dashboard">
      <i class="fas fa-chart-line"></i>
      <span>Portfolio</span>
    </a>
    <a class="help-icon-item" href="#briefings-section">
      <i class="fas fa-file-alt"></i>
      <span>Intel Briefs</span>
    </a>
    <a class="help-icon-item" href="#discovery-section">
      <i class="fas fa-search"></i>
      <span>Discovery</span>
    </a>
    <a class="help-icon-item" href="#trades-section">
      <i class="fas fa-exchange-alt"></i>
      <span>Trade History</span>
    </a>
    <a class="help-icon-item" href="#tweets-section">
      <i class="fas fa-bullhorn"></i>
      <span>Comms</span>
    </a>
    <a class="help-icon-item" href="#positions-section">
      <i class="fas fa-briefcase"></i>
      <span>Positions</span>
    </a>
  </div>
  <a class="btn-outline-white" href="#dashboard">View Full Dashboard</a>
</div>

<!-- LATEST NEWS + LIVE FEED SPLIT -->
<div class="content-section">
  <div>
    <span class="section-title">Latest Intel</span>
    <div id="news-feed">
      <div class="news-item"><h3><a href="#">Awaiting intelligence reports...</a></h3><div class="news-meta">System initializing</div></div>
    </div>
    <a class="btn-outline-dark" href="#briefings-section">View All Briefings</a>
  </div>
  <div>
    <span class="section-title">Live Feed</span>
    <div id="live-feed">
      <div class="news-item"><h3><a href="#">Monitoring PumpPortal for new assets...</a></h3><div class="news-meta">WebSocket connected</div></div>
    </div>
    <a class="btn-outline-dark" href="#discovery-section">View Discovery Feed</a>
  </div>
</div>

<!-- TRADING DASHBOARD -->
<div class="trading-dashboard" id="dashboard">
  <div class="dashboard-section-title"><i class="fas fa-chart-bar"></i>&nbsp; Portfolio Overview</div>
  <div class="stats-grid" id="stats"></div>

  <div class="panels-grid" id="positions-section">
    <div class="panel">
      <div class="panel-header">
        <h3><i class="fas fa-briefcase"></i>&nbsp; Active Positions</h3>
        <span class="count-badge" id="pos-count">0</span>
      </div>
      <table class="data-table">
        <thead><tr><th>Token</th><th>Entry</th><th>Current</th><th>PnL</th><th>Age</th><th>Status</th></tr></thead>
        <tbody id="positions"></tbody>
      </table>
    </div>

    <div class="panel" id="tweets-section">
      <div class="panel-header">
        <h3><i class="fas fa-bullhorn"></i>&nbsp; Congressional Communications</h3>
        <span class="count-badge" id="tweet-count">0</span>
      </div>
      <div id="tweets"></div>
    </div>
  </div>

  <div class="panel" id="briefings-section">
    <div class="panel-header">
      <h3><i class="fas fa-file-alt"></i>&nbsp; Intelligence Briefings</h3>
      <span class="count-badge" id="briefing-count">0</span>
    </div>
    <div id="briefings"></div>
  </div>

  <div class="panel" id="trades-section">
    <div class="panel-header">
      <h3><i class="fas fa-exchange-alt"></i>&nbsp; Trade Ledger</h3>
      <span class="count-badge" id="trade-count">0</span>
    </div>
    <table class="data-table">
      <thead><tr><th>Time</th><th>Token</th><th>Side</th><th>SOL</th><th>Price</th><th>PnL</th><th>Exit Reason</th><th>TX</th></tr></thead>
      <tbody id="trades"></tbody>
    </table>
  </div>

  <div class="panel" id="discovery-section">
    <div class="panel-header">
      <h3><i class="fas fa-search"></i>&nbsp; Token Discovery Feed</h3>
      <span class="count-badge" id="disc-count">0</span>
    </div>
    <table class="data-table">
      <thead><tr><th>Token</th><th>Symbol</th><th>Score</th><th>MCap</th><th>Liquidity</th><th>Status</th><th>Intel</th></tr></thead>
      <tbody id="discovery"></tbody>
    </table>
  </div>
</div>

<!-- DESK LOCATIONS -->
<div class="office-locations">
  <h2>Desk Locations</h2>
  <div class="offices-grid">
    <div class="office-card">
      <div class="office-info">
        <h3>Washington, D.C.</h3>
        <p>Capitol Hill Operations Center<br>Rayburn House Office Building<br>Washington, DC 20515</p>
      </div>
      <div class="office-img" style="background:linear-gradient(135deg,#2B458F,#102447);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:36px"><i class="fas fa-landmark"></i></div>
    </div>
    <div class="office-card">
      <div class="office-info">
        <h3>San Francisco</h3>
        <p>Pacific Trading Bureau<br>Federal Building, 450 Golden Gate Ave<br>San Francisco, CA 94102</p>
      </div>
      <div class="office-img" style="background:linear-gradient(135deg,#426DE6,#2B458F);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:36px"><i class="fas fa-bridge"></i></div>
    </div>
  </div>
</div>

<!-- FOOTER -->
<footer class="site-footer">
  <div class="footer-links">
    <a href="#dashboard">Dashboard</a>
    <a href="#briefings-section">Intelligence</a>
    <a href="#trades-section">Trades</a>
    <a href="#tweets-section">Communications</a>
    <a href="#">Privacy Policy</a>
    <a href="#">Terms of Service</a>
  </div>
  <p class="footer-sub">Congressional Trading Desk &mdash; Classified &mdash; For Official Use Only</p>
</footer>

<script>
/* CAROUSEL */
let cur = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.carousel-dot');
function goTo(n) {
  slides[cur].classList.remove('active');
  dots[cur] && dots[cur].classList.remove('active');
  cur = (n + slides.length) % slides.length;
  slides[cur].classList.add('active');
  dots[cur] && dots[cur].classList.add('active');
}
document.querySelector('.carousel-btn.prev').addEventListener('click', () => goTo(cur - 1));
document.querySelector('.carousel-btn.next').addEventListener('click', () => goTo(cur + 1));
document.querySelectorAll('.carousel-dot').forEach((d, i) => d.addEventListener('click', () => goTo(i)));
setInterval(() => goTo(cur + 1), 5000);

/* DATA */
async function fetchJson(url) {
  try { const r = await fetch(url); return await r.json(); } catch { return null; }
}
function fmt(n, d=2) { return n != null ? Number(n).toFixed(d) : '-'; }
function fmtUsd(n) { return n != null ? '$' + Number(n).toLocaleString(undefined, {maximumFractionDigits:2}) : '-'; }
function pnlClass(n) { return n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral'; }
function timeAgo(ts) {
  const s = Math.floor(Date.now()/1000) - ts;
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}
function scoreColor(s) {
  if (s >= 62) return '#426de6';
  if (s >= 40) return '#2b458f';
  return '#aab3c0';
}
function scoreBadgeClass(s) {
  if (s >= 62) return 'high';
  if (s >= 40) return 'mid';
  return 'low';
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toggleIntel(id) {
  var row = document.getElementById('intel-' + id);
  if (row) row.style.display = row.style.display === 'table-row' ? 'none' : 'table-row';
}

async function refresh() {
  const [stats, positions, trades, tweets, discovery] = await Promise.all([
    fetchJson('/api/stats'),
    fetchJson('/api/positions/open'),
    fetchJson('/api/trades'),
    fetchJson('/api/tweets'),
    fetchJson('/api/discovery'),
  ]);

  /* STATS */
  if (stats) {
    const winRate = stats.wins + stats.losses > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0) : '0';
    document.getElementById('stats').innerHTML = [
      { label: 'Treasury Balance', value: fmt(stats.balance, 3) + ' SOL', cls: 'neutral' },
      { label: 'Total Returns', value: fmt(stats.totalPnl, 4) + ' SOL', cls: pnlClass(stats.totalPnl) },
      { label: 'Daily Returns', value: fmt(stats.dailyPnl, 4) + ' SOL', cls: pnlClass(stats.dailyPnl) },
      { label: 'Win Rate', value: winRate + '%', cls: 'neutral' },
    ].map(function(s) { return '<div class="stat-card"><div class="label">' + s.label + '</div><div class="value ' + s.cls + '">' + s.value + '</div></div>'; }).join('');

    document.getElementById('alert-status').textContent =
      stats.openPositions + ' open positions | ' + stats.totalTrades + ' trades | ' + fmt(stats.totalPnl,4) + ' SOL PnL';
  }

  /* POSITIONS */
  if (positions) {
    document.getElementById('pos-count').textContent = positions.length;
    document.getElementById('positions').innerHTML = positions.map(function(p) {
      var pnl = p.entryPrice > 0 && p.currentPrice ? ((p.currentPrice - p.entryPrice) / p.entryPrice * 100) : null;
      var partial = p.partialTaken ? ' <span class="badge partial">PARTIAL</span>' : '';
      return '<tr><td class="ticker">$' + escapeHtml(p.symbol) + '</td><td>' + fmtUsd(p.entryPrice) + '</td><td>' + fmtUsd(p.currentPrice) + '</td><td class="' + pnlClass(pnl) + '">' + (pnl != null ? (pnl > 0 ? '+' : '') + fmt(pnl,1) + '%' : '-') + '</td><td>' + timeAgo(p.entryTime) + '</td><td><span class="badge open">OPEN</span>' + partial + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="empty-state">No open positions</td></tr>';
  }

  /* TRADES */
  if (trades) {
    document.getElementById('trade-count').textContent = trades.length;
    document.getElementById('trades').innerHTML = trades.slice(0, 30).map(function(t) {
      var txLink = t.txSignature && !t.txSignature.startsWith('paper') ? '<a href="https://solscan.io/tx/' + t.txSignature + '" target="_blank" style="color:#426de6">view</a>' : (t.txSignature ? t.txSignature.slice(0,8) : '-');
      return '<tr><td>' + timeAgo(t.timestamp) + '</td><td class="ticker">$' + escapeHtml(t.symbol) + '</td><td><span class="badge ' + t.side + '">' + t.side + '</span></td><td>' + fmt(t.solAmount, 4) + '</td><td>' + fmtUsd(t.price) + '</td><td class="' + pnlClass(t.pnlPct) + '">' + (t.pnlPct != null ? (t.pnlPct > 0 ? '+' : '') + fmt(t.pnlPct,1) + '%' : '-') + '</td><td>' + (t.exitReason || '-') + '</td><td>' + txLink + '</td></tr>';
    }).join('') || '<tr><td colspan="8" class="empty-state">No trades recorded</td></tr>';
  }

  /* TWEETS */
  if (tweets) {
    document.getElementById('tweet-count').textContent = tweets.length;
    document.getElementById('tweets').innerHTML = tweets.slice(0, 15).map(function(t) {
      return '<div class="tweet-item"><div class="tweet-text">' + escapeHtml(t.text) + '</div><div class="tweet-meta"><span class="badge ' + (t.type && t.type.includes('sell') ? 'sell' : t.type === 'buy' ? 'buy' : 'commentary') + '">' + t.type + '</span> <span>' + timeAgo(t.timestamp) + '</span>' + (t.posted ? '' : ' <span style="color:#e67e22">(pending)</span>') + '</div></div>';
    }).join('') || '<div class="empty-state">No communications issued</div>';
  }

  /* DISCOVERY + BRIEFINGS */
  if (discovery) {
    document.getElementById('disc-count').textContent = discovery.length;

    /* Discovery table */
    document.getElementById('discovery').innerHTML = discovery.slice(0, 30).map(function(d, i) {
      var sc = d.score || 0;
      var barColor = scoreColor(sc);
      var statusHtml = d.rejected
        ? '<span style="color:#c0392b;font-weight:600">REJECTED</span>'
        : sc >= 62
          ? '<span style="color:#1a7a3a;font-weight:600">ACQUIRE</span>'
          : sc >= 40
            ? '<span style="color:#e67e22;font-weight:600">MONITOR</span>'
            : '<span style="color:#5a6577">PASS</span>';
      var intelBtn = d.reasoning
        ? '<button class="intel-btn" onclick="toggleIntel(' + i + ')">VIEW</button>'
        : '<span style="color:#aab3c0;font-size:10px">-</span>';
      var intelRow = d.reasoning
        ? '<tr class="intel-row" id="intel-' + i + '"><td colspan="7">' + escapeHtml(d.reasoning) + '</td></tr>'
        : '';
      return '<tr><td class="ticker">' + escapeHtml((d.name || '?').slice(0,24)) + '</td><td>$' + escapeHtml(d.symbol || '?') + '</td><td>' + sc + '<span class="score-bar"><span class="fill" style="width:' + sc + '%;background:' + barColor + '"></span></span></td><td>' + fmtUsd(d.marketCapUsd) + '</td><td>' + fmt(d.liquiditySol, 1) + ' SOL</td><td>' + statusHtml + '</td><td>' + intelBtn + '</td></tr>' + intelRow;
    }).join('') || '<tr><td colspan="7" class="empty-state">Awaiting token intelligence...</td></tr>';

    /* Intelligence Briefings */
    var briefings = discovery.filter(function(d) { return d.reasoning; }).slice(0, 10);
    document.getElementById('briefing-count').textContent = briefings.length;
    document.getElementById('briefings').innerHTML = briefings.map(function(d) {
      var sc = d.score || 0;
      return '<div class="briefing-card"><div class="briefing-header"><span class="briefing-token">$' + escapeHtml(d.symbol || '?') + ' &mdash; ' + escapeHtml((d.name || '?').slice(0,30)) + '</span><span class="briefing-score ' + scoreBadgeClass(sc) + '">Score: ' + sc + '</span></div><div class="briefing-text">' + escapeHtml(d.reasoning) + '</div><div class="briefing-meta">' + (d.reasoningTimestamp ? timeAgo(d.reasoningTimestamp) : '') + '</div></div>';
    }).join('') || '<div class="empty-state">Intelligence briefings will appear as tokens are evaluated</div>';

    /* Latest Intel sidebar (top 5 briefings) */
    document.getElementById('news-feed').innerHTML = briefings.slice(0, 5).map(function(d) {
      var sc = d.score || 0;
      var rec = sc >= 62 ? 'ACQUIRE' : sc >= 40 ? 'MONITOR' : 'PASS';
      return '<div class="news-item"><h3><a href="#briefings-section">$' + escapeHtml(d.symbol) + ': ' + escapeHtml((d.reasoning || '').slice(0, 80)) + '...</a></h3><div class="news-meta">Score: ' + sc + '<span class="sep">|</span>' + rec + '</div></div>';
    }).join('') || '<div class="news-item"><h3><a href="#">Awaiting intelligence reports...</a></h3><div class="news-meta">Evaluation loop active</div></div>';

    /* Live Feed sidebar (latest 5 discovered) */
    document.getElementById('live-feed').innerHTML = discovery.slice(0, 5).map(function(d) {
      var sc = d.score || 0;
      var status = d.rejected ? 'REJECTED' : sc >= 62 ? 'ACQUIRE' : sc >= 40 ? 'MONITOR' : 'PASS';
      return '<div class="news-item"><h3><a href="#discovery-section">$' + escapeHtml(d.symbol || '?') + ' &mdash; ' + escapeHtml((d.name || '?').slice(0,30)) + '</a></h3><div class="news-meta">Score: ' + sc + '<span class="sep">|</span>' + status + '</div></div>';
    }).join('') || '<div class="news-item"><h3><a href="#">Monitoring PumpPortal...</a></h3><div class="news-meta">WebSocket connected</div></div>';
  }
}

refresh();
setInterval(refresh, 15000);
</script>
</body>
</html>`;
}
