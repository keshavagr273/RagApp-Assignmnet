import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

const EVAL_DIR = path.resolve('eval');
fs.mkdirSync(EVAL_DIR, { recursive: true });

async function generateReportOverview() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  let page = doc.addPage([595, 842]); // A4
  page.drawText('FolioQ Systems: Enterprise Cloud & SLA Architecture Report', {
    x: 50,
    y: 780,
    size: 16,
    font: bold,
    color: rgb(0.12, 0.3, 0.23),
  });
  page.drawText('Author: Engineering Architecture Team | Scope: FY2024 Global Infrastructure', {
    x: 50,
    y: 755,
    size: 10,
    font,
    color: rgb(0.42, 0.4, 0.36),
  });

  page.drawText('1. Executive Overview and Architecture Strategy', {
    x: 50,
    y: 710,
    size: 13,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  const p1 = `The FolioQ distributed data platform utilizes a multi-region deployment across three active zones:
North America (us-east-1, us-west-2), Europe (eu-west-1), and Asia-Pacific (ap-southeast-1).
Each region maintains an independent storage tier with cross-region eventual consistency guaranteed
within a 250ms replication window. During FY2024, the platform processed 14.8 billion transactions
with a sustained average latency of 14.2 milliseconds across all read operations.`;

  page.drawText(p1, { x: 50, y: 640, size: 10, font, lineHeight: 14, color: rgb(0.11, 0.11, 0.1) });

  page.drawText('2. Service Level Agreements (SLA) & Incident Response Policies', {
    x: 50,
    y: 560,
    size: 13,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  const p2 = `Our Enterprise Tier SLA commits to 99.99% monthly availability for high-priority endpoints.
Failure to maintain availability guarantees service credits according to the following policy:
- 99.90% to 99.98% availability: 10% monthly billing credit
- 99.00% to 99.89% availability: 25% monthly billing credit
- Below 99.00% availability: 50% monthly billing credit

Incident classification defines four operational severity levels:
• Severity 1 (Critical): Core service outage impacting >20% of active sessions. Response SLA: 15 minutes.
• Severity 2 (Major): Degradation of primary ingest or search pipeline. Response SLA: 45 minutes.
• Severity 3 (Moderate): Non-critical feature degradation with workaround. Response SLA: 4 hours.
• Severity 4 (Minor): Cosmetic UI defects or documentation updates. Response SLA: 24 hours.`;

  page.drawText(p2, { x: 50, y: 410, size: 10, font, lineHeight: 14, color: rgb(0.11, 0.11, 0.1) });

  // Page 2
  page = doc.addPage([595, 842]);
  page.drawText('3. Data Retention and Compliance Standards', {
    x: 50,
    y: 780,
    size: 13,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  const p3 = `All enterprise customer documents and extracted chunks are encrypted at rest using AES-256-GCM.
Encryption keys are managed via AWS KMS with automatic annual key rotation.
Backup snapshots are taken every 6 hours and stored across immutable WORM-compliant storage buckets.
Audit logs are retained for a minimum of 7 years to comply with SOC 2 Type II, ISO/IEC 27001:2022,
and HIPAA compliance requirements. Customer data deletion requests through GDPR Chapter III
are executed within 72 hours, resulting in complete cryptographic erasure of all stored chunks.`;

  page.drawText(p3, { x: 50, y: 690, size: 10, font, lineHeight: 14, color: rgb(0.11, 0.11, 0.1) });

  page.drawText('4. Backup Recovery Time Objective (RTO) and Point Objective (RPO)', {
    x: 50,
    y: 610,
    size: 13,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  const p4 = `The formal disaster recovery specifications established for FY2024 are:
- Recovery Point Objective (RPO): Maximum 15 minutes of transactional data loss.
- Recovery Time Objective (RTO): Service restoration within 120 minutes in secondary regions.
- Annual disaster recovery simulation conducted on October 14, 2024 achieved failover in 47 minutes.`;

  page.drawText(p4, { x: 50, y: 530, size: 10, font, lineHeight: 14, color: rgb(0.11, 0.11, 0.1) });

  const bytes = await doc.save();
  const dest = path.join(EVAL_DIR, 'report-overview.pdf');
  fs.writeFileSync(dest, bytes);
  console.log(`Created ${dest} (2 pages)`);
}

async function generateFinancialReport() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);

  page.drawText('FolioQ Global Software Inc. - Q3 FY2024 Financial Performance', {
    x: 50,
    y: 780,
    size: 15,
    font: bold,
    color: rgb(0.12, 0.3, 0.23),
  });
  page.drawText('Report Period: Three Months Ended September 30, 2024 (USD Millions)', {
    x: 50,
    y: 755,
    size: 10,
    font,
    color: rgb(0.42, 0.4, 0.36),
  });

  page.drawText('Consolidated Statement of Operations', {
    x: 50,
    y: 710,
    size: 12,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  // Financial Table
  const tableTop = 680;
  const colX = [50, 220, 320, 420, 500];

  // Header row
  page.drawRectangle({
    x: 48,
    y: tableTop - 5,
    width: 495,
    height: 20,
    color: rgb(0.94, 0.93, 0.9),
  });
  page.drawText('Line Item', { x: colX[0], y: tableTop, size: 9, font: bold });
  page.drawText('Q3 FY2024', { x: colX[1], y: tableTop, size: 9, font: bold });
  page.drawText('Q2 FY2024', { x: colX[2], y: tableTop, size: 9, font: bold });
  page.drawText('Q3 FY2023', { x: colX[3], y: tableTop, size: 9, font: bold });
  page.drawText('YoY Growth', { x: colX[4], y: tableTop, size: 9, font: bold });

  const rows = [
    ['Subscription Revenue', '$342.5', '$318.2', '$265.0', '+29.2%'],
    ['Professional Services', '$28.4', '$26.8', '$24.5', '+15.9%'],
    ['Total Revenue', '$370.9', '$345.0', '$289.5', '+28.1%'],
    ['Cost of Subscription', '$68.5', '$64.1', '$55.2', '+24.1%'],
    ['Cost of Services', '$22.1', '$21.5', '$20.1', '+10.0%'],
    ['Total Cost of Revenue', '$90.6', '$85.6', '$75.3', '+20.3%'],
    ['Gross Profit', '$280.3', '$259.4', '$214.2', '+30.9%'],
    ['Gross Margin (%)', '75.6%', '75.2%', '74.0%', '+160 bps'],
    ['Research & Development', '$84.2', '$78.0', '$67.5', '+24.7%'],
    ['Sales & Marketing', '$105.8', '$98.4', '$85.0', '+24.5%'],
    ['General & Administrative', '$32.4', '$31.0', '$27.8', '+16.5%'],
    ['Total Operating Expenses', '$222.4', '$207.4', '$180.3', '+23.4%'],
    ['Operating Income', '$57.9', '$52.0', '$33.9', '+70.8%'],
    ['Operating Margin (%)', '15.6%', '15.1%', '11.7%', '+390 bps'],
    ['Tax Expense', '$11.6', '$10.4', '$6.8', '+70.6%'],
    ['Net Income', '$46.3', '$41.6', '$27.1', '+70.8%'],
    ['Diluted EPS ($)', '$0.42', '$0.38', '$0.25', '+68.0%'],
  ];

  let currentY = tableTop - 25;
  for (const row of rows) {
    const isTotal = row[0].startsWith('Total') || row[0] === 'Net Income' || row[0] === 'Gross Profit';
    const rowFont = isTotal ? bold : font;

    page.drawText(row[0], { x: colX[0], y: currentY, size: 9, font: rowFont });
    page.drawText(row[1], { x: colX[1], y: currentY, size: 9, font: rowFont });
    page.drawText(row[2], { x: colX[2], y: currentY, size: 9, font: rowFont });
    page.drawText(row[3], { x: colX[3], y: currentY, size: 9, font: rowFont });
    page.drawText(row[4], { x: colX[4], y: currentY, size: 9, font: rowFont });

    // Hairline divider
    page.drawLine({
      start: { x: 48, y: currentY - 5 },
      end: { x: 545, y: currentY - 5 },
      thickness: 0.5,
      color: rgb(0.87, 0.84, 0.79),
    });

    currentY -= 18;
  }

  // Regional Breakdown Note
  currentY -= 20;
  page.drawText('Geographical Revenue Breakdown for Q3 FY2024:', {
    x: 50,
    y: currentY,
    size: 11,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });
  currentY -= 15;
  const geoText = `• North America: $222.5 million (60.0% of total revenue)
• EMEA (Europe, Middle East, Africa): $96.4 million (26.0% of total revenue)
• Asia-Pacific & Japan (APJ): $37.1 million (10.0% of total revenue)
• Latin America: $14.9 million (4.0% of total revenue)`;
  page.drawText(geoText, { x: 50, y: currentY - 35, size: 9.5, font, lineHeight: 14 });

  const bytes = await doc.save();
  const dest = path.join(EVAL_DIR, 'financial-q3.pdf');
  fs.writeFileSync(dest, bytes);
  console.log(`Created ${dest} (1 page)`);
}

async function generateMarketCharts() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);

  page.drawText('Market Growth & Customer Retention Analytics', {
    x: 50,
    y: 780,
    size: 16,
    font: bold,
    color: rgb(0.12, 0.3, 0.23),
  });

  page.drawText('Figure 1: Annual Recurring Revenue (ARR) Trajectory 2020-2024', {
    x: 50,
    y: 740,
    size: 11,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  // Render Bar Chart to image using canvas
  const canvasWidth = 500;
  const canvasHeight = 220;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Axes
  ctx.strokeStyle = '#DDD7CA';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 20);
  ctx.lineTo(60, 180);
  ctx.lineTo(480, 180);
  ctx.stroke();

  // Gridlines & Y-ticks
  ctx.fillStyle = '#6B665C';
  ctx.font = '11px sans-serif';
  const yTicks = [
    { label: '$1,500M', y: 30 },
    { label: '$1,000M', y: 80 },
    { label: '$500M', y: 130 },
    { label: '$0M', y: 180 },
  ];
  for (const t of yTicks) {
    ctx.fillText(t.label, 10, t.y + 4);
    ctx.strokeStyle = '#F0ECE1';
    ctx.beginPath();
    ctx.moveTo(60, t.y);
    ctx.lineTo(480, t.y);
    ctx.stroke();
  }

  // Bars
  const arrData = [
    { year: '2020', val: 320, x: 90 },
    { year: '2021', val: 540, x: 170 },
    { year: '2022', val: 820, x: 250 },
    { year: '2023', val: 1150, x: 330 },
    { year: '2024', val: 1480, x: 410 },
  ];

  for (const d of arrData) {
    const barHeight = (d.val / 1500) * 150;
    const barY = 180 - barHeight;

    ctx.fillStyle = '#1F4D3A'; // Primary forest green
    ctx.fillRect(d.x, barY, 45, barHeight);

    // Value label
    ctx.fillStyle = '#1C1B19';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`$${d.val}M`, d.x + 3, barY - 6);

    // X label
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#6B665C';
    ctx.fillText(d.year, d.x + 8, 198);
  }

  const chartImgBytes = canvas.toBuffer('image/png');
  const chartImg = await doc.embedPng(chartImgBytes);

  page.drawImage(chartImg, {
    x: 50,
    y: 500,
    width: 495,
    height: 220,
  });

  page.drawText('Description of Figure 1:', { x: 50, y: 480, size: 10, font: bold });
  const chartSummary = `The bar chart shows ARR increasing steadily from $320M in 2020 to $540M in 2021, $820M in 2022,
$1,150M in 2023, and reaching $1,480M in 2024. The 4-year Compound Annual Growth Rate (CAGR) is 46.7%.`;
  page.drawText(chartSummary, { x: 50, y: 445, size: 9.5, font, lineHeight: 14 });

  // Figure 2: Customer Retention Pie/Donut Chart
  page.drawText('Figure 2: Net Revenue Retention (NRR) Tier Distribution', {
    x: 50,
    y: 380,
    size: 11,
    font: bold,
    color: rgb(0.11, 0.11, 0.1),
  });

  const canvas2 = createCanvas(500, 160);
  const ctx2 = canvas2.getContext('2d');
  ctx2.fillStyle = '#FFFFFF';
  ctx2.fillRect(0, 0, 500, 160);

  // Draw pie segments
  const centerX = 120;
  const centerY = 80;
  const radius = 60;

  const slices = [
    { label: 'NRR > 130%', pct: 0.45, color: '#1F4D3A' },
    { label: 'NRR 115-130%', pct: 0.35, color: '#2F5D8A' },
    { label: 'NRR 100-114%', pct: 0.15, color: '#C79A2B' },
    { label: 'NRR < 100%', pct: 0.05, color: '#B4532A' },
  ];

  let startAngle = 0;
  for (const s of slices) {
    const endAngle = startAngle + s.pct * 2 * Math.PI;
    ctx2.beginPath();
    ctx2.moveTo(centerX, centerY);
    ctx2.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx2.closePath();
    ctx2.fillStyle = s.color;
    ctx2.fill();
    startAngle = endAngle;
  }

  // Draw legend
  ctx2.font = '12px sans-serif';
  let legY = 35;
  for (const s of slices) {
    ctx2.fillStyle = s.color;
    ctx2.fillRect(240, legY, 14, 14);
    ctx2.fillStyle = '#1C1B19';
    ctx2.fillText(`${s.label}: ${(s.pct * 100).toFixed(0)}% of customer base`, 265, legY + 11);
    legY += 28;
  }

  const chart2Bytes = canvas2.toBuffer('image/png');
  const chart2Img = await doc.embedPng(chart2Bytes);

  page.drawImage(chart2Img, {
    x: 50,
    y: 200,
    width: 495,
    height: 160,
  });

  page.drawText('Description of Figure 2: Net Revenue Retention is 122% overall across enterprise accounts.', {
    x: 50,
    y: 180,
    size: 9.5,
    font,
  });

  const bytes = await doc.save();
  const dest = path.join(EVAL_DIR, 'market-metrics.pdf');
  fs.writeFileSync(dest, bytes);
  console.log(`Created ${dest} (1 page)`);
}

async function generateScannedAudit() {
  const doc = await PDFDocument.create();

  // Create an image of a document with NO text layer (simulates scanned paper)
  const canvas = createCanvas(595, 842);
  const ctx = canvas.getContext('2d');

  // Paper background with slight grain/yellowing
  ctx.fillStyle = '#F5F2EB';
  ctx.fillRect(0, 0, 595, 842);

  // Stamp: "CONFIDENTIAL AUDIT"
  ctx.save();
  ctx.translate(400, 80);
  ctx.rotate(-0.1);
  ctx.strokeStyle = '#B4532A';
  ctx.lineWidth = 3;
  ctx.strokeRect(-10, -20, 160, 40);
  ctx.fillStyle = '#B4532A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('CONFIDENTIAL', 5, 5);
  ctx.restore();

  // Scanned text rendered as bitmap pixels
  ctx.fillStyle = '#201F1D';
  ctx.font = 'bold 18px serif';
  ctx.fillText('INDEPENDENT CYBERSECURITY AUDIT CERTIFICATE', 50, 140);

  ctx.font = '12px serif';
  ctx.fillText('Audit Firm: Apex Security Assurance LLP | Date: November 12, 2024', 50, 170);

  ctx.font = '13px serif';
  const textLines = [
    'Scope of Audit: FolioQ Platform Core Cryptographic and Ingestion Infrastructure',
    '',
    'Audit Results & Findings:',
    '1. Vulnerability Assessment: Zero critical or high-severity vulnerabilities detected in external penetrations.',
    '2. Transport Layer Security: TLS 1.3 enforced across 100% of perimeter API gateways.',
    '3. Access Control: Multi-factor authentication (MFA) compliance verified at 100% for administrative staff.',
    '4. Key Management: Master secret keys rotated every 90 days in compliance with NIST SP 800-57.',
    '5. Penetration Testing Score: Overall security resistance rating of 98.4 out of 100.',
    '',
    'Audit Conclusion:',
    'Apex Security Assurance certifies that the FolioQ production platform adheres in full to SOC 2 Type II',
    'security trust service criteria without any exceptions or corrective action requests noted.',
    '',
    'Lead Auditor Signature: Robert Vance, CISSP, CISA (Apex Security Assurance LLP)',
  ];

  let y = 220;
  for (const line of textLines) {
    if (line.startsWith('Audit Results') || line.startsWith('Audit Conclusion')) {
      ctx.font = 'bold 13px serif';
    } else {
      ctx.font = '12px serif';
    }
    ctx.fillText(line, 50, y);
    y += 24;
  }

  const scannedPng = canvas.toBuffer('image/png');
  const embeddedPng = await doc.embedPng(scannedPng);

  const page = doc.addPage([595, 842]);
  page.drawImage(embeddedPng, { x: 0, y: 0, width: 595, height: 842 });

  const bytes = await doc.save();
  const dest = path.join(EVAL_DIR, 'scanned-audit.pdf');
  fs.writeFileSync(dest, bytes);
  console.log(`Created ${dest} (1 scanned image-only page)`);
}

async function generateContinuingInventory() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const colX = [50, 150, 270, 370, 460];

  const drawHeader = (page: any, isContinued = false) => {
    page.drawText(
      isContinued ? 'Hardware Server Asset Inventory (continued from Page 1)' : 'Hardware Server Asset Inventory - Global Data Centers',
      { x: 50, y: 780, size: 14, font: bold, color: rgb(0.12, 0.3, 0.23) }
    );

    const tableTop = 740;
    page.drawRectangle({
      x: 48,
      y: tableTop - 5,
      width: 495,
      height: 20,
      color: rgb(0.94, 0.93, 0.9),
    });

    page.drawText('Server ID', { x: colX[0], y: tableTop, size: 9, font: bold });
    page.drawText('Model / Spec', { x: colX[1], y: tableTop, size: 9, font: bold });
    page.drawText('Datacenter Region', { x: colX[2], y: tableTop, size: 9, font: bold });
    page.drawText('RAM / Storage', { x: colX[3], y: tableTop, size: 9, font: bold });
    page.drawText('Status', { x: colX[4], y: tableTop, size: 9, font: bold });
    return tableTop - 25;
  };

  // Page 1
  let page = doc.addPage([595, 842]);
  let y = drawHeader(page, false);

  const page1Items = [
    ['SRV-101', 'Dell PowerEdge R750', 'us-east-1 (N. Virginia)', '512 GB / 15.3 TB NVMe', 'Active'],
    ['SRV-102', 'Dell PowerEdge R750', 'us-east-1 (N. Virginia)', '512 GB / 15.3 TB NVMe', 'Active'],
    ['SRV-103', 'Dell PowerEdge R750', 'us-west-2 (Oregon)', '512 GB / 15.3 TB NVMe', 'Active'],
    ['SRV-104', 'Dell PowerEdge R750', 'us-west-2 (Oregon)', '512 GB / 15.3 TB NVMe', 'Active'],
    ['SRV-105', 'HPE ProLiant DL380', 'eu-west-1 (Ireland)', '256 GB / 7.6 TB NVMe', 'Active'],
    ['SRV-106', 'HPE ProLiant DL380', 'eu-west-1 (Ireland)', '256 GB / 7.6 TB NVMe', 'Active'],
    ['SRV-107', 'HPE ProLiant DL380', 'ap-southeast-1 (Singapore)', '256 GB / 7.6 TB NVMe', 'Active'],
    ['SRV-108', 'HPE ProLiant DL380', 'ap-southeast-1 (Singapore)', '256 GB / 7.6 TB NVMe', 'Maintenance'],
    ['SRV-109', 'Cisco UCS B200 M6', 'us-east-1 (N. Virginia)', '1024 GB / 30 TB NVMe', 'Active'],
    ['SRV-110', 'Cisco UCS B200 M6', 'us-west-2 (Oregon)', '1024 GB / 30 TB NVMe', 'Active'],
    ['SRV-111', 'Supermicro AS-2124GQ', 'us-east-1 (N. Virginia)', '2048 GB / 8x A100 GPU', 'Active (AI)'],
    ['SRV-112', 'Supermicro AS-2124GQ', 'us-west-2 (Oregon)', '2048 GB / 8x A100 GPU', 'Active (AI)'],
  ];

  for (const item of page1Items) {
    page.drawText(item[0], { x: colX[0], y, size: 8.5, font });
    page.drawText(item[1], { x: colX[1], y, size: 8.5, font });
    page.drawText(item[2], { x: colX[2], y, size: 8.5, font });
    page.drawText(item[3], { x: colX[3], y, size: 8.5, font });
    page.drawText(item[4], { x: colX[4], y, size: 8.5, font });

    page.drawLine({
      start: { x: 48, y: y - 4 },
      end: { x: 545, y: y - 4 },
      thickness: 0.5,
      color: rgb(0.87, 0.84, 0.79),
    });
    y -= 18;
  }

  page.drawText('(Table continues on Page 2)', { x: 50, y: y - 10, size: 9, font: bold, color: rgb(0.42, 0.4, 0.36) });

  // Page 2
  page = doc.addPage([595, 842]);
  y = drawHeader(page, true);

  const page2Items = [
    ['SRV-113', 'Supermicro AS-2124GQ', 'eu-west-1 (Ireland)', '2048 GB / 8x A100 GPU', 'Active (AI)'],
    ['SRV-114', 'Supermicro AS-2124GQ', 'ap-southeast-1 (Singapore)', '2048 GB / 8x A100 GPU', 'Active (AI)'],
    ['SRV-115', 'Dell PowerEdge R650', 'us-east-1 (N. Virginia)', '128 GB / 3.8 TB NVMe', 'Active'],
    ['SRV-116', 'Dell PowerEdge R650', 'us-west-2 (Oregon)', '128 GB / 3.8 TB NVMe', 'Active'],
    ['SRV-117', 'Dell PowerEdge R650', 'eu-west-1 (Ireland)', '128 GB / 3.8 TB NVMe', 'Standby'],
    ['SRV-118', 'Dell PowerEdge R650', 'ap-southeast-1 (Singapore)', '128 GB / 3.8 TB NVMe', 'Standby'],
    ['SRV-119', 'NetApp AFF A400', 'us-east-1 (N. Virginia)', '256 GB / 250 TB SAN', 'Active (Storage)'],
    ['SRV-120', 'NetApp AFF A400', 'us-west-2 (Oregon)', '256 GB / 250 TB SAN', 'Active (Storage)'],
    ['SRV-121', 'NetApp AFF A400', 'eu-west-1 (Ireland)', '256 GB / 150 TB SAN', 'Active (Storage)'],
    ['SRV-122', 'NetApp AFF A400', 'ap-southeast-1 (Singapore)', '256 GB / 150 TB SAN', 'Active (Storage)'],
  ];

  for (const item of page2Items) {
    page.drawText(item[0], { x: colX[0], y, size: 8.5, font });
    page.drawText(item[1], { x: colX[1], y, size: 8.5, font });
    page.drawText(item[2], { x: colX[2], y, size: 8.5, font });
    page.drawText(item[3], { x: colX[3], y, size: 8.5, font });
    page.drawText(item[4], { x: colX[4], y, size: 8.5, font });

    page.drawLine({
      start: { x: 48, y: y - 4 },
      end: { x: 545, y: y - 4 },
      thickness: 0.5,
      color: rgb(0.87, 0.84, 0.79),
    });
    y -= 18;
  }

  page.drawText('Total Active Fleet Size: 22 Physical Host Nodes Across 4 Global Regions.', {
    x: 50,
    y: y - 20,
    size: 10,
    font: bold,
    color: rgb(0.12, 0.3, 0.23),
  });

  const bytes = await doc.save();
  const dest = path.join(EVAL_DIR, 'continuing-inventory.pdf');
  fs.writeFileSync(dest, bytes);
  console.log(`Created ${dest} (2 pages)`);
}

async function main() {
  console.log('Generating Golden Evaluation PDF dataset in /eval ...');
  await generateReportOverview();
  await generateFinancialReport();
  await generateMarketCharts();
  await generateScannedAudit();
  await generateContinuingInventory();
  console.log('Successfully generated all 5 evaluation PDFs!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

