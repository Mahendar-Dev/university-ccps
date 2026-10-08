// pdfCertificate.js
// Generates a formal, printable degree certificate as a PDF Buffer using pdfkit.
// Pulls fields straight from a DEGREE_ISSUANCE block's payload (plus the
// blockchain block metadata) so the certificate is a direct visual representation
// of what's actually recorded on-chain.

const PDFDocument = require('pdfkit');

const INK = '#0B1220';
const GOLD = '#B8860B';
const GOLD_LIGHT = '#E7B65C';
const SLATE = '#5B6478';
const REVOKED_RED = '#B23B3B';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function drawOrnateBorder(doc, margin) {
  const { width, height } = doc.page;
  const outer = margin;
  const inner = margin + 14;

  doc.save();
  doc.lineWidth(2.2).strokeColor(GOLD)
    .rect(outer, outer, width - outer * 2, height - outer * 2)
    .stroke();
  doc.lineWidth(0.75).strokeColor(GOLD_LIGHT)
    .rect(inner, inner, width - inner * 2, height - inner * 2)
    .stroke();

  // corner flourishes
  const cornerLen = 22;
  doc.lineWidth(2.2).strokeColor(GOLD);
  const corners = [
    [outer, outer, 1, 1],
    [width - outer, outer, -1, 1],
    [outer, height - outer, 1, -1],
    [width - outer, height - outer, -1, -1]
  ];
  corners.forEach(([x, y, dx, dy]) => {
    doc.moveTo(x, y + dy * cornerLen).lineTo(x, y).lineTo(x + dx * cornerLen, y).stroke();
  });
  doc.restore();
}

function drawSeal(doc, x, y, radius, label = 'VERIFIED') {
  doc.save();
  doc.lineWidth(1.4).strokeColor(GOLD);
  doc.circle(x, y, radius).stroke();
  doc.circle(x, y, radius - 6).stroke();
  doc.fontSize(7.5).fillColor(GOLD).font('Helvetica-Bold');
  doc.text('ATTESTLY', x - radius + 8, y - 9, { width: (radius - 8) * 2, align: 'center' });
  doc.fontSize(6.5).fillColor(GOLD);
  doc.text(label, x - radius + 8, y + 1, { width: (radius - 8) * 2, align: 'center' });
  doc.fontSize(5.5).fillColor(SLATE);
  doc.text('ON-CHAIN', x - radius + 8, y + 10, { width: (radius - 8) * 2, align: 'center' });
  doc.restore();
}

/**
 * Build a degree certificate PDF.
 * @param {Object} opts
 * @param {Object} opts.degree - the DEGREE_ISSUANCE payload (degreeId, degreeHash, universityName, studentName, program, degreeDate, issuedBy, status)
 * @param {Object} opts.block - { index, hash, previousHash, timestamp }
 * @param {boolean} opts.revoked
 * @param {Object} [opts.revocation] - { reason, revokedBy, timestamp } if revoked
 * @returns {Promise<Buffer>}
 */
function generateCertificatePDF({ degree, block, revoked, revocation }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: `Degree Certificate - ${degree.studentName}`,
        Author: degree.universityName,
        Subject: degree.program,
        Keywords: 'degree, certificate, blockchain, attestation'
      }
    });

    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { width, height } = doc.page;
    const margin = 26;

    // background
    doc.rect(0, 0, width, height).fill('#FBFAF6');

    drawOrnateBorder(doc, margin);

    // Revoked watermark
    if (revoked) {
      doc.save();
      doc.fillColor(REVOKED_RED).opacity(0.16);
      doc.fontSize(120).font('Helvetica-Bold');
      doc.rotate(-28, { origin: [width / 2, height / 2] });
      doc.text('REVOKED', 0, height / 2 - 70, { width, align: 'center' });
      doc.rotate(28, { origin: [width / 2, height / 2] });
      doc.opacity(1);
      doc.restore();
    }

    let y = margin + 38;

    // University name (header)
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(13);
    doc.text(degree.universityName.toUpperCase(), 0, y, { width, align: 'center', characterSpacing: 1.5 });

    y += 22;
    doc.font('Helvetica').fontSize(9.5).fillColor(SLATE);
    doc.text('PRIVATE BLOCKCHAIN DEGREE ATTESTATION NETWORK', 0, y, { width, align: 'center', characterSpacing: 1 });

    // Gold rule
    y += 22;
    doc.moveTo(width / 2 - 90, y).lineTo(width / 2 + 90, y).lineWidth(1).strokeColor(GOLD).stroke();

    y += 26;
    doc.font('Helvetica-Bold').fontSize(30).fillColor(INK);
    doc.text('Certificate of Degree', 0, y, { width, align: 'center', characterSpacing: 0.5 });

    y += 46;
    doc.font('Helvetica').fontSize(11.5).fillColor(SLATE);
    doc.text('This is to certify that', 0, y, { width, align: 'center' });

    y += 28;
    doc.font('Helvetica-Bold').fontSize(26).fillColor(INK);
    doc.text(degree.studentName, 0, y, { width, align: 'center' });

    y += 38;
    doc.font('Helvetica').fontSize(11.5).fillColor(SLATE);
    doc.text('has successfully fulfilled all requirements prescribed for the degree of', 0, y, { width, align: 'center' });

    y += 26;
    doc.font('Helvetica-Bold').fontSize(19).fillColor(GOLD);
    doc.text(degree.program, 0, y, { width, align: 'center' });

    y += 30;
    doc.font('Helvetica').fontSize(11).fillColor(SLATE);
    doc.text(`conferred on ${formatDate(degree.degreeDate)}`, 0, y, { width, align: 'center' });

    // Footer block: signatures + hash + seal
    const footerY = height - margin - 118;

    // Left: issuing official signature line
    const sigX = margin + 70;
    doc.moveTo(sigX, footerY + 46).lineTo(sigX + 200, footerY + 46).lineWidth(0.8).strokeColor(SLATE).stroke();
    doc.font('Helvetica').fontSize(9).fillColor(INK);
    doc.text(degree.issuedBy || 'Authorized Registrar', sigX, footerY + 50, { width: 200, align: 'center' });
    doc.fontSize(7.5).fillColor(SLATE);
    doc.text('Issuing Authority', sigX, footerY + 64, { width: 200, align: 'center' });

    // Center: date line
    const dateX = width / 2 - 100;
    doc.moveTo(dateX, footerY + 46).lineTo(dateX + 200, footerY + 46).lineWidth(0.8).strokeColor(SLATE).stroke();
    doc.font('Helvetica').fontSize(9).fillColor(INK);
    doc.text(formatDate(degree.degreeDate), dateX, footerY + 50, { width: 200, align: 'center' });
    doc.fontSize(7.5).fillColor(SLATE);
    doc.text('Date of Conferral', dateX, footerY + 64, { width: 200, align: 'center' });

    // Right: seal
    drawSeal(doc, width - margin - 95, footerY + 35, 42, revoked ? 'REVOKED' : 'VERIFIED');

    // Bottom strip: on-chain proof details
    const proofY = height - margin - 34;
    doc.moveTo(margin + 30, proofY - 10).lineTo(width - margin - 30, proofY - 10).lineWidth(0.5).strokeColor('#D9D4C6').stroke();

    doc.font('Helvetica').fontSize(7).fillColor(SLATE);
    doc.text(
      `Degree ID: ${degree.degreeId}    |    Block #${block.index}    |    Block Hash: ${block.hash}`,
      margin + 30, proofY, { width: width - margin * 2 - 60, align: 'center' }
    );
    doc.fontSize(7).fillColor(SLATE);
    doc.text(
      `Degree Hash (verify at issuing network): ${degree.degreeHash}`,
      margin + 30, proofY + 11, { width: width - margin * 2 - 60, align: 'center' }
    );

    if (revoked && revocation) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(REVOKED_RED);
      doc.text(
        `REVOKED on ${formatDate(new Date(revocation.timestamp).toISOString())} by ${revocation.revokedBy} — Reason: ${revocation.reason}`,
        margin + 30, proofY + 22, { width: width - margin * 2 - 60, align: 'center' }
      );
    }

    doc.end();
  });
}

module.exports = { generateCertificatePDF };
