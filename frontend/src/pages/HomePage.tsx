import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const goToDemo = () => {
    navigate("/demo");
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="home-nav">
        <div className="nav-brand">
          BELTWAYS<span className="brand-accent">RTIIS</span>
        </div>
        <div className="nav-links">
          <Link to="/demo" className="nav-link">
            Dashboard
          </Link>
          <Link to="/map" className="nav-link">
            Map View
          </Link>
          <Link to="/status" className="nav-link">
            System Status
          </Link>
          <Link to="/docs" className="nav-link">
            Docs
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-grid"></div>
          <div className="hero-glow"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            REAL-TIME TRAFFIC INTELLIGENCE
          </div>
          <h1 className="hero-title">
            Transform Highway Safety with
            <span className="gradient-text">
              {" "}
              AI-Powered Incident Detection
            </span>
          </h1>
          <p className="hero-subtitle">
            Detect incidents in under 60 seconds. Get AI-generated insights
            instantly.
          </p>
          <p className="hero-description">
            RTIIS monitors highway sensors across Cincinnati, automatically
            detects congestion and stopped vehicles, and delivers operator-ready
            intelligence powered by advanced AI analysis.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">&lt;60s</span>
              <span className="stat-label">Detection Time</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">4</span>
              <span className="stat-label">Highway Segments</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-value">AI</span>
              <span className="stat-label">Powered Analysis</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className="btn-primary" onClick={goToDemo}>
              <span className="btn-icon">▶</span>
              Launch Live Demo
            </button>
            <Link to="/map" className="btn-secondary">
              View Map
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <span className="preview-dot red"></span>
              <span className="preview-dot yellow"></span>
              <span className="preview-dot green"></span>
              <span className="preview-title">RTIIS Dashboard</span>
            </div>
            <div className="preview-content">
              <div className="preview-sidebar">
                <div className="preview-incident high">
                  <div className="incident-indicator"></div>
                  <div className="incident-text">
                    <span className="incident-type">CONGESTION</span>
                    <span className="incident-loc">I-71 North</span>
                  </div>
                </div>
                <div className="preview-incident medium">
                  <div className="incident-indicator"></div>
                  <div className="incident-text">
                    <span className="incident-type">STOPPED</span>
                    <span className="incident-loc">I-75 South</span>
                  </div>
                </div>
                <div className="preview-incident clear">
                  <div className="incident-indicator"></div>
                  <div className="incident-text">
                    <span className="incident-type">CLEAR</span>
                    <span className="incident-loc">I-275 East</span>
                  </div>
                </div>
              </div>
              <div className="preview-main">
                <div className="preview-map">
                  <div className="map-marker marker-1"></div>
                  <div className="map-marker marker-2"></div>
                  <div className="map-marker marker-3"></div>
                  <div className="map-road road-1"></div>
                  <div className="map-road road-2"></div>
                </div>
                <div className="preview-ai">
                  <div className="ai-header">
                    <span className="ai-badge">AI</span>
                    <span>Incident Analysis</span>
                  </div>
                  <div className="ai-text-line"></div>
                  <div className="ai-text-line short"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-card card-1">
            <div className="fc-icon alert"></div>
            <span>New Incident Detected</span>
          </div>
          <div className="floating-card card-2">
            <div className="fc-icon success"></div>
            <span>AI Analysis Complete</span>
          </div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="problem-solution">
        <div className="section-header">
          <h2>The Challenge & Our Solution</h2>
          <p>
            Transforming highway incident management through intelligent
            automation
          </p>
        </div>
        <div className="ps-grid">
          <div className="ps-card problem">
            <div className="ps-icon-shape problem-icon"></div>
            <h3>The Problem</h3>
            <ul>
              <li>
                <span className="bullet">●</span>
                Delayed incident detection (5–10 minutes average)
              </li>
              <li>
                <span className="bullet">●</span>
                Operators overwhelmed by raw sensor data
              </li>
              <li>
                <span className="bullet">●</span>
                Secondary accidents during delayed response
              </li>
              <li>
                <span className="bullet">●</span>
                No actionable intelligence from alerts
              </li>
            </ul>
          </div>
          <div className="ps-card solution">
            <div className="ps-icon-shape solution-icon"></div>
            <h3>Our Solution</h3>
            <ul>
              <li>
                <span className="bullet">●</span>
                Real-time incident detection from live sensor data
              </li>
              <li>
                <span className="bullet">●</span>
                Rule-based detection + AI-generated summaries
              </li>
              <li>
                <span className="bullet">●</span>
                Intuitive dashboard for traffic operators
              </li>
              <li>
                <span className="bullet">●</span>
                Sub-minute detection with actionable insights
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack">
        <div className="section-header">
          <h2>Built with Modern Technology</h2>
          <p>Production-ready architecture designed for scale</p>
        </div>
        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-icon-shape backend-icon"></div>
            <h4>Backend</h4>
            <p>FastAPI + Python</p>
            <span className="tech-detail">High-performance async API</span>
          </div>
          <div className="tech-card">
            <div className="tech-icon-shape database-icon"></div>
            <h4>Database</h4>
            <p>PostgreSQL / Supabase</p>
            <span className="tech-detail">Scalable data storage</span>
          </div>
          <div className="tech-card">
            <div className="tech-icon-shape ai-icon"></div>
            <h4>AI Layer</h4>
            <p>OpenAI GPT</p>
            <span className="tech-detail">Intelligent analysis</span>
          </div>
          <div className="tech-card">
            <div className="tech-icon-shape frontend-icon"></div>
            <h4>Frontend</h4>
            <p>React + TypeScript</p>
            <span className="tech-detail">Modern operator UI</span>
          </div>
        </div>
        <p className="tech-tagline">
          "Built like a real Beltways-style production system, in miniature."
        </p>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How the Demo Works</h2>
          <p>Experience the full incident detection pipeline</p>
        </div>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sensor Simulation</h4>
            <p>
              The simulator sends realistic traffic data (flow, speed, stopped
              vehicles) to the backend.
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Incident Detection</h4>
            <p>
              The backend analyzes patterns and detects congestion or
              stopped-vehicle incidents.
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>AI Analysis</h4>
            <p>
              The AI module generates human-readable summaries, causes, and
              recommendations.
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Live Dashboard</h4>
            <p>
              Explore incidents in real-time, view metrics, and resolve
              incidents.
            </p>
          </div>
        </div>
        <div className="cta-section">
          <button className="btn-primary large" onClick={goToDemo}>
            Launch Live Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>Beltways RTIIS Demo</p>
        <p className="footer-sub">
          FastAPI • React • TypeScript • OpenAI • PostgreSQL
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
