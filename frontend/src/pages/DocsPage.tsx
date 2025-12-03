import React from "react";
import { Link } from "react-router-dom";
import "./DocsPage.css";

const DocsPage: React.FC = () => {
  const demoVideoUrl =
    "https://drive.google.com/file/d/1XRyKFQLRIb4qXo6zigrpK9SRxzl2ao0Y/view?usp=sharing";

  // Convert Google Drive link to embeddable format
  const getEmbedUrl = (url: string) => {
    const fileId = url.match(/\/d\/([^/]+)/)?.[1];
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
  };

  return (
    <div className="docs-page">
      {/* Navigation Bar */}
      <nav className="docs-nav">
        <div className="nav-brand">
          <Link to="/">
            BELTWAYS<span className="brand-accent">RTIIS</span>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/demo" className="nav-link">
            Dashboard
          </Link>
          <Link to="/map" className="nav-link">
            Map View
          </Link>
          <Link to="/status" className="nav-link">
            System Status
          </Link>
        </div>
      </nav>

      {/* Hero Section with Video */}
      <section className="docs-hero">
        <div className="docs-hero-content">
          <h1>Project Documentation</h1>
          <p>
            Complete technical documentation and live demo video for the
            Beltways RTIIS platform
          </p>
        </div>
      </section>

      {/* Demo Video Section - Featured at Top */}
      <section className="video-section featured">
        <div className="section-container">
          <div className="video-header">
            <div className="video-badge">LIVE DEMO</div>
            <h2>Watch the System in Action</h2>
            <p>
              A complete walkthrough of the RTIIS platform demonstrating
              real-time incident detection and AI-powered analysis
            </p>
          </div>
          <div className="video-container">
            <iframe
              src={getEmbedUrl(demoVideoUrl)}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="RTIIS Demo Video"
            ></iframe>
          </div>
          <div className="video-actions">
            <a
              href={demoVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open in Google Drive
            </a>
            <Link to="/demo" className="btn-secondary">
              Try Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* PDF Documentation Section */}
      <section className="pdf-section">
        <div className="section-container">
          <div className="pdf-header">
            <div className="pdf-badge">FULL DOCUMENTATION</div>
            <h2>Project Documentation (PDF)</h2>
            <p>
              Complete technical documentation including system architecture,
              API specifications, and implementation details
            </p>
          </div>
          <div className="pdf-container">
            <iframe
              src="/Beltways-RTIIS.pdf"
              width="100%"
              height="100%"
              title="Beltways RTIIS Documentation PDF"
            ></iframe>
          </div>
          <div className="pdf-actions">
            <a
              href="/Beltways-RTIIS.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open PDF in New Tab
            </a>
            <a
              href="/Beltways-RTIIS.pdf"
              download="Beltways-RTIIS.pdf"
              className="btn-secondary"
            >
              Download PDF
            </a>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="docs-content">
        <div className="section-container">
          <h2>Technical Documentation</h2>

          <div className="docs-grid">
            {/* System Overview */}
            <div className="doc-card">
              <div className="doc-icon overview-icon"></div>
              <h3>System Overview</h3>
              <p>
                RTIIS is a real-time roadway incident intelligence system that
                monitors highway sensors, detects traffic incidents
                automatically, and provides AI-powered analysis for traffic
                operators.
              </p>
              <ul>
                <li>Real-time sensor data processing</li>
                <li>Automatic incident detection</li>
                <li>AI-generated insights and recommendations</li>
                <li>Geographic visualization</li>
              </ul>
            </div>

            {/* Architecture */}
            <div className="doc-card">
              <div className="doc-icon arch-icon"></div>
              <h3>Architecture</h3>
              <p>
                Modern microservices architecture designed for scalability and
                reliability.
              </p>
              <ul>
                <li>
                  <strong>Backend:</strong> FastAPI + Python
                </li>
                <li>
                  <strong>Frontend:</strong> React + TypeScript
                </li>
                <li>
                  <strong>Database:</strong> SQLite / PostgreSQL
                </li>
                <li>
                  <strong>AI:</strong> OpenAI GPT Integration
                </li>
              </ul>
            </div>

            {/* API Reference */}
            <div className="doc-card">
              <div className="doc-icon api-icon"></div>
              <h3>API Reference</h3>
              <p>RESTful API endpoints for all system operations.</p>
              <ul>
                <li>
                  <code>GET /api/segments/</code> - Road segments
                </li>
                <li>
                  <code>GET /api/incidents/</code> - All incidents
                </li>
                <li>
                  <code>POST /api/readings/</code> - Sensor data
                </li>
                <li>
                  <code>GET /api/system/status</code> - Health check
                </li>
              </ul>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="doc-link"
              >
                View Full API Docs →
              </a>
            </div>

            {/* Features */}
            <div className="doc-card">
              <div className="doc-icon features-icon"></div>
              <h3>Key Features</h3>
              <p>Comprehensive incident management capabilities.</p>
              <ul>
                <li>Live dashboard with 3-second refresh</li>
                <li>Interactive map with color-coded segments</li>
                <li>Scenario simulation for testing</li>
                <li>Incident timeline and history</li>
              </ul>
            </div>
          </div>

          {/* Quick Start */}
          <div className="quickstart-section">
            <h3>Quick Start</h3>
            <div className="code-block">
              <pre>
                {`# Clone and start the application
cd betways
./start.sh

# Access the application
Frontend: http://localhost:3001
Backend:  http://localhost:8000
API Docs: http://localhost:8000/docs`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Video Link */}
      <section className="docs-footer-video">
        <div className="section-container">
          <div className="footer-video-content">
            <h3>Haven't watched the demo yet?</h3>
            <p>
              See the complete RTIIS platform in action with a guided
              walkthrough
            </p>
            <a
              href={demoVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary large"
            >
              Watch Demo Video
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="docs-footer">
        <p>Beltways RTIIS • Real-Time Incident Intelligence System</p>
        <p className="footer-sub">
          FastAPI • React • TypeScript • OpenAI • PostgreSQL
        </p>
      </footer>
    </div>
  );
};

export default DocsPage;
