const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 0, size: 'A4' });
doc.pipe(fs.createWriteStream('beautiful-report.pdf'));

// Colors
const colors = {
  bg: '#f8fafc',
  primary: '#f97316',
  primaryLight: '#fdba74',
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#ef4444',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
  boxBg: '#f1f5f9'
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// Helper for rounded rect
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.fill();
}

// Background
doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(colors.bg);

// Main Card
const margin = 40;
const cardWidth = PAGE_WIDTH - margin * 2;

// Draw Card Background
doc.fillColor(colors.white);
roundedRect(doc, margin, margin, cardWidth, 220, 10);
doc.lineWidth(1).strokeColor(colors.border).roundedRect(margin, margin, cardWidth, 220, 10).stroke();

// Header inside Card
doc.fillColor(colors.boxBg);
roundedRect(doc, margin, margin, cardWidth, 50, 10); // Header bg
// Fix bottom corners to be square
doc.rect(margin, margin + 40, cardWidth, 10).fill(colors.boxBg);
doc.moveTo(margin, margin + 50).lineTo(margin + cardWidth, margin + 50).lineWidth(1).strokeColor(colors.border).stroke();

// URL Text
doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.text).text('https://www.example.com', margin + 20, margin + 18);

// Score Section
doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.text).text('Overall Site Score', margin + 20, margin + 80);
doc.font('Helvetica').fontSize(12).fillColor(colors.muted).text('A very good score is between 60 and 80. For best\nresults, you should strive for 70 and above.', margin + 20, margin + 110, { width: 250, lineGap: 4 });

// Donut Chart
const cx = margin + cardWidth - 100;
const cy = margin + 130;
const r = 55;
const score = 62;

// Draw background circle
doc.lineWidth(12).strokeColor(colors.border).circle(cx, cy, r).stroke();

// Draw score arc
const angle = (score / 100) * 2 * Math.PI;
doc.lineWidth(12).strokeColor(colors.primary)
   .path(`M ${cx} ${cy-r} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${cx + r*Math.sin(angle)} ${cy - r*Math.cos(angle)}`)
   .stroke();

// Score Text
doc.font('Helvetica-Bold').fontSize(36).fillColor(colors.primary).text(score.toString(), cx - 35, cy - 15, { width: 70, align: 'center' });
doc.font('Helvetica').fontSize(14).fillColor(colors.muted).text('/ 100', cx + 15, cy + 2);
doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.primary).text('Very Good!', cx - 40, cy + 25, { width: 80, align: 'center' });

// Boxes below
const boxY = margin + 240;
const boxWidth = (cardWidth - 20) / 3;

function drawMetricBox(x, y, w, h, number, label, color) {
  doc.fillColor(colors.white);
  roundedRect(doc, x, y, w, h, 8);
  doc.lineWidth(1).strokeColor(colors.border).roundedRect(x, y, w, h, 8).stroke();
  
  // Left border accent
  doc.fillColor(color);
  doc.rect(x, y + 8, 4, h - 16).fill();
  
  doc.font('Helvetica-Bold').fontSize(24).fillColor(color).text(number.toString(), x + 15, y + 15);
  doc.font('Helvetica').fontSize(12).fillColor(colors.muted).text('of', x + 15 + doc.widthOfString(number.toString()) + 5, y + 25);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.text).text(label, x + 15, y + 45);
}

drawMetricBox(margin, boxY, boxWidth, 70, 5, 'Critical Issues', colors.destructive);
drawMetricBox(margin + boxWidth + 10, boxY, boxWidth, 70, 3, 'Warnings', colors.warning);
drawMetricBox(margin + boxWidth*2 + 20, boxY, boxWidth, 70, 13, 'Info / Good', colors.success);

doc.end();
