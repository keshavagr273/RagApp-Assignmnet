import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import {
  FileText,
  Layers,
  CheckCircle2,
  Table,
  BarChart3,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'figure'>('table');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-highlight/30">
      {/* Navigation */}
      <header className="border-b border-hairline bg-paper sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-xl tracking-tight text-ink">FolioQ</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded border border-hairline bg-surface text-muted">
              v1.0
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <a href="#how-it-works" className="text-muted hover:text-ink transition-colors">
              Pipeline
            </a>
            <a href="#capabilities" className="text-muted hover:text-ink transition-colors">
              What it Understands
            </a>
            <a href="#accuracy" className="text-muted hover:text-ink transition-colors">
              Accuracy & Citations
            </a>
            <a href="#faq" className="text-muted hover:text-ink transition-colors">
              FAQ
            </a>
            <div className="h-4 w-px bg-hairline" />
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-1.5 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-highlight" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login" className="text-ink font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded text-xs font-medium bg-primary text-surface hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <span className="text-xs font-mono uppercase text-primary font-medium tracking-wider block mb-3">
            High-Precision PDF Intelligence
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-medium tracking-tight text-ink leading-[1.1]">
            Ask questions across your PDFs. Get answers with the page number.
          </h1>
          <p className="mt-6 text-lg text-muted font-sans leading-relaxed">
            FolioQ parses complex documents — financial statements, multi-page tables, data charts, and diagrams — preserving exact cells, series, and coordinates so every factual claim is grounded in the source page.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/register"
              className="px-5 py-3 rounded text-sm font-medium bg-primary text-surface hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <span>Explore Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 rounded text-sm font-medium border border-hairline bg-surface text-ink hover:bg-paper transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Real HTML/CSS Product Screenshot Composition (No stock graphics) */}
        <div className="mt-14 border border-hairline rounded-lg bg-surface shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* Document Side (Left 6 cols) */}
          <div className="md:col-span-6 p-6 border-b md:border-b-0 md:border-r border-hairline bg-paper/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-muted mb-4 border-b border-hairline pb-2">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Financial_Report_Q3_FY2024.pdf</span>
                </span>
                <span>Page 1 of 12</span>
              </div>

              <div className="space-y-3 font-mono text-xs text-ink/80">
                <div className="p-2.5 rounded bg-surface border border-hairline">
                  <span className="font-bold text-ink block mb-1">CONSOLIDATED STATEMENTS OF OPERATIONS</span>
                  <p className="text-[11px] text-muted mb-2">(in USD millions, except per share data)</p>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between border-b border-hairline/60 pb-1">
                      <span>Subscription Revenue</span>
                      <span className="font-semibold text-ink">$342.5</span>
                    </div>
                    <div className="flex justify-between border-b border-hairline/60 pb-1">
                      <span>Professional Services</span>
                      <span>$28.4</span>
                    </div>
                    <div className="flex justify-between bg-highlight/25 p-1 rounded font-bold border border-highlight/40">
                      <span>Total Revenue</span>
                      <span className="text-primary">$370.9</span>
                    </div>
                    <div className="flex justify-between border-b border-hairline/60 pb-1">
                      <span>Gross Profit</span>
                      <span className="font-semibold text-ink">$280.3</span>
                    </div>
                    <div className="flex justify-between border-b border-hairline/60 pb-1">
                      <span>Gross Margin (%)</span>
                      <span className="font-semibold text-ink">75.6%</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded bg-surface border border-hairline text-[11px]">
                  <span className="font-bold text-ink block mb-0.5">Geographical Breakdown:</span>
                  <p className="text-muted">North America: $222.5M (60.0%) | EMEA: $96.4M (26.0%)</p>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-muted pt-4 border-t border-hairline mt-4">
              Native text & tabular layout verified • 150 DPI Page Render
            </div>
          </div>

          {/* Chat Side (Right 6 cols) */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between bg-surface">
            <div>
              {/* Question */}
              <div className="flex justify-end mb-4">
                <div className="bg-paper border border-hairline rounded px-3.5 py-2 text-xs font-sans text-ink">
                  What was the total revenue in Q3 FY2024, and what percentage was subscription revenue?
                </div>
              </div>

              {/* Answer */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-medium text-xs text-primary uppercase tracking-wider">FolioQ Answer</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-hairline">
                    HIGH CONFIDENCE
                  </span>
                </div>

                <p className="text-xs text-ink font-sans leading-relaxed">
                  In Q3 FY2024, total revenue was <strong>$370.9 million</strong>, representing a 28.1% year-over-year increase.{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono rounded border border-hairline bg-highlight/30 text-ink">
                    <FileText className="w-3 h-3 text-primary inline" />
                    Financial_Report_Q3.pdf · p.1
                  </span>
                </p>

                <p className="text-xs text-ink font-sans leading-relaxed">
                  Subscription revenue accounted for <strong>$342.5 million</strong>, or approximately <strong>92.3%</strong> of total quarterly revenue ($342.5M / $370.9M).{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono rounded border border-hairline bg-highlight/30 text-ink">
                    <FileText className="w-3 h-3 text-primary inline" />
                    Financial_Report_Q3.pdf · p.1
                  </span>
                </p>

                {/* Extracted Mini Table */}
                <div className="border border-hairline rounded bg-paper/40 p-2.5 text-[11px] font-mono">
                  <div className="flex justify-between font-bold text-ink border-b border-hairline pb-1 mb-1">
                    <span>Revenue Stream</span>
                    <span>Q3 FY2024</span>
                    <span>Share</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Subscription</span>
                    <span className="text-ink">$342.5M</span>
                    <span>92.3%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Services</span>
                    <span className="text-ink">$28.4M</span>
                    <span>7.7%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-hairline text-xs font-mono text-muted">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Grounded directly in source document. Zero hallucinations.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-hairline bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono uppercase text-primary font-medium tracking-wider block mb-2">
              Ingestion Architecture
            </span>
            <h2 className="font-display text-3xl font-medium text-ink">How FolioQ parses every page faithfully</h2>
            <p className="text-sm text-muted mt-2">
              Naive text extraction fails on multi-column layouts, charts, and tables. FolioQ runs a rigorous multi-stage pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-hairline rounded-lg bg-paper">
              <div className="w-10 h-10 rounded border border-hairline bg-surface flex items-center justify-center text-primary mb-4 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-display font-medium text-lg text-ink">150 DPI Render & Native Extract</h3>
              <p className="text-xs text-muted font-sans mt-2 leading-relaxed">
                Every page is rendered to high-resolution PNG while text items, bounding boxes, and font sizes are extracted. Scanned pages with missing text layers are automatically flagged for OCR.
              </p>
            </div>

            <div className="p-6 border border-hairline rounded-lg bg-paper">
              <div className="w-10 h-10 rounded border border-hairline bg-surface flex items-center justify-center text-primary mb-4 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-display font-medium text-lg text-ink">Vision Understanding & Stitching</h3>
              <p className="text-xs text-muted font-sans mt-2 leading-relaxed">
                Page images and text layers are structured into typed elements: tables with merged cells, charts with numeric series data, and diagrams. Tables continuing across page boundaries are stitched automatically.
              </p>
            </div>

            <div className="p-6 border border-hairline rounded-lg bg-paper">
              <div className="w-10 h-10 rounded border border-hairline bg-surface flex items-center justify-center text-primary mb-4 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-display font-medium text-lg text-ink">Semantic Chunking & Grounded Answering</h3>
              <p className="text-xs text-muted font-sans mt-2 leading-relaxed">
                Elements are preserved as semantic units with section breadcrumbs. Queries trigger hybrid Vector + BM25 retrieval with Reciprocal Rank Fusion, verifying every number against the source page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What it Understands Section */}
      <section id="capabilities" className="py-20 border-t border-hairline bg-paper">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-10">
            <span className="text-xs font-mono uppercase text-primary font-medium tracking-wider block mb-2">
              Multimodal Document Elements
            </span>
            <h2 className="font-display text-3xl font-medium text-ink">What the pipeline understands</h2>
            <p className="text-sm text-muted mt-2">
              Inspect how FolioQ transforms visual PDF artifacts into faithful structured data representations.
            </p>
          </div>

          {/* Element Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 text-xs font-mono rounded border transition-colors flex items-center gap-2 ${
                activeTab === 'table'
                  ? 'bg-primary text-surface border-primary'
                  : 'bg-surface text-ink border-hairline hover:bg-paper'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Multi-Page Tables</span>
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 text-xs font-mono rounded border transition-colors flex items-center gap-2 ${
                activeTab === 'chart'
                  ? 'bg-primary text-surface border-primary'
                  : 'bg-surface text-ink border-hairline hover:bg-paper'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Data Charts & Graphs</span>
            </button>
            <button
              onClick={() => setActiveTab('figure')}
              className={`px-4 py-2 text-xs font-mono rounded border transition-colors flex items-center gap-2 ${
                activeTab === 'figure'
                  ? 'bg-primary text-surface border-primary'
                  : 'bg-surface text-ink border-hairline hover:bg-paper'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Figures & Architecture</span>
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="border border-hairline rounded-lg bg-surface p-6">
            {activeTab === 'table' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-display font-medium text-sm text-ink mb-2">Visual Source Table</h4>
                  <div className="p-4 rounded border border-hairline bg-paper text-xs font-mono">
                    <p className="font-bold mb-2">Hardware Asset Inventory (Pages 1 & 2)</p>
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-hairline font-bold">
                          <th>Server ID</th>
                          <th>Model</th>
                          <th>Region</th>
                          <th>RAM / Storage</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-1">
                        <tr>
                          <td>SRV-101</td>
                          <td>PowerEdge R750</td>
                          <td>us-east-1</td>
                          <td>512 GB / 15.3 TB</td>
                        </tr>
                        <tr>
                          <td>SRV-111</td>
                          <td>AS-2124GQ</td>
                          <td>us-east-1</td>
                          <td>2048 GB / 8x A100</td>
                        </tr>
                        <tr>
                          <td>SRV-113</td>
                          <td>AS-2124GQ</td>
                          <td>eu-west-1</td>
                          <td>2048 GB / 8x A100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="font-display font-medium text-sm text-ink mb-2">Parsed Structured Chunk</h4>
                  <pre className="p-4 rounded border border-hairline bg-paper text-[11px] font-mono overflow-x-auto text-ink">
{`{
  "type": "table",
  "startPage": 1,
  "endPage": 2,
  "caption": "Hardware Server Asset Inventory",
  "stitchedAcrossPages": true,
  "rows": 22,
  "headers": [["Server ID", "Model", "Region", "RAM / Storage", "Status"]]
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'chart' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-display font-medium text-sm text-ink mb-2">ARR Growth Chart (2020-2024)</h4>
                  <div className="p-4 rounded border border-hairline bg-paper text-xs font-mono">
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>2020:</span>
                        <span className="font-bold text-primary">$320M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2021:</span>
                        <span className="font-bold text-primary">$540M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2022:</span>
                        <span className="font-bold text-primary">$820M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2023:</span>
                        <span className="font-bold text-primary">$1,150M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2024:</span>
                        <span className="font-bold text-primary">$1,480M</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-display font-medium text-sm text-ink mb-2">Parsed Chart Object</h4>
                  <pre className="p-4 rounded border border-hairline bg-paper text-[11px] font-mono overflow-x-auto text-ink">
{`{
  "type": "chart",
  "chartType": "bar",
  "title": "Annual Recurring Revenue Trajectory",
  "xAxisLabel": "Year",
  "yAxisLabel": "ARR ($ Millions)",
  "series": [{ "name": "ARR", "data": [
    {"x": "2020", "y": 320},
    {"x": "2024", "y": 1480}
  ]}],
  "summary": "4-year CAGR of 46.7% reaching $1,480M"
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'figure' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-display font-medium text-sm text-ink mb-2">Audit Certificate Stamp</h4>
                  <div className="p-4 rounded border border-hairline bg-paper text-xs font-mono">
                    <span className="text-secondary font-bold uppercase block mb-1">Confidential Audit Badge</span>
                    <p className="text-muted text-[11px]">
                      Apex Security Assurance LLP • Resistance Rating: 98.4 / 100 • TLS 1.3 perimeter enforcement
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-display font-medium text-sm text-ink mb-2">Parsed Figure Representation</h4>
                  <pre className="p-4 rounded border border-hairline bg-paper text-[11px] font-mono overflow-x-auto text-ink">
{`{
  "type": "figure",
  "caption": "Cybersecurity Audit Stamp",
  "description": "Independent security assurance certificate from Apex Assurance rating platform at 98.4/100",
  "containedText": "CONFIDENTIAL AUDIT CERTIFICATE"
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Accuracy Section */}
      <section id="accuracy" className="py-20 border-t border-hairline bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase text-primary font-medium tracking-wider block mb-2">
                Grounding & Verification
              </span>
              <h2 className="font-display text-3xl font-medium text-ink">Every answer cites its source page.</h2>
              <p className="text-sm text-muted font-sans mt-3 leading-relaxed">
                We believe that correctness matters more than conversational fluff. When FolioQ answers your question, every single number and statement is cross-checked against the retrieved chunk and its original rendered page.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-medium text-ink block">Direct Page Links & Highlights</strong>
                    <span className="text-xs text-muted">Clicking any citation instantly loads the document viewer to that exact page with the bounding box highlighted.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-secondary/10 text-secondary mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-medium text-ink block">Honest "Not Found" Behavior</strong>
                    <span className="text-xs text-muted">If your documents don't have the answer, FolioQ says so plainly. It will never invent numbers or extrapolate without evidence.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border border-hairline rounded-lg bg-paper font-mono text-xs space-y-3">
              <span className="text-muted text-[11px] uppercase tracking-wider block">Verification Pass Rules</span>
              <div className="p-3 bg-surface border border-hairline rounded">
                <span className="text-secondary font-bold block mb-1">RULE 1: STRICT CONTEXT GROUNDING</span>
                <p className="text-muted text-[11px]">
                  "Answer ONLY from the provided document context. If absent, reply plainly: 'I cannot find this information in the provided documents.'"
                </p>
              </div>
              <div className="p-3 bg-surface border border-hairline rounded">
                <span className="text-primary font-bold block mb-1">RULE 2: EXACT QUOTING & UNITS</span>
                <p className="text-muted text-[11px]">
                  "Quote numbers, currencies, and scope exactly as in source (e.g. 'FY2024, in USD millions'). State whether chart values are visually estimated."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-hairline bg-paper">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-3xl font-medium text-ink text-center mb-10">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {[
              {
                q: 'How does FolioQ handle scanned PDFs without a text layer?',
                a: 'Stage 2 evaluates text density. If a page has negligible characters, it is flagged as needsOcr and passed to our vision pipeline (and local Tesseract OCR engine) so textual and tabular contents are fully recovered.',
              },
              {
                q: 'Can FolioQ compare data between multiple documents?',
                a: 'Yes. Collections group multiple PDFs into a unified knowledge corpus. Follow-up queries can compare metrics across distinct files (e.g., comparing SLA uptime from an architecture whitepaper with SOC 2 compliance certificates).',
              },
              {
                q: 'How does vector search work without MongoDB Atlas?',
                a: 'FolioQ includes an in-memory cosine similarity store that operates directly over local MongoDB vector arrays. If you enable Atlas, it seamlessly switches to the native Atlas $vectorSearch index.',
              },
              {
                q: 'What is the maximum file size supported?',
                a: 'By default, FolioQ supports PDFs up to 50 MB per file with multi-file drag-and-drop batch ingestion.',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-hairline rounded bg-surface">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between text-sm font-medium text-ink"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4 text-xs font-sans text-muted leading-relaxed border-t border-hairline/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-hairline bg-surface py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <div>
            <span className="font-display font-medium text-ink text-sm">FolioQ</span>
            <span className="ml-2">© 2026. Production document intelligence platform.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-ink">Sign In</Link>
            <Link to="/register" className="hover:text-ink">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
