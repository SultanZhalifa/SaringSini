import { getAnalysis } from '../core/analysis.js';
import { RISK_COLORS, riskLevel } from '../core/risk.js';

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (context.measureText(testLine).width > maxWidth && n > 0) {
            context.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, currentY);
}

/** Draws the shareable summary card (800x500) for an analysis. */
function drawInfographic(analysis) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Draw Clean Light Background
    const grad = ctx.createRadialGradient(400, 250, 100, 400, 250, 500);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Decorative border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 788, 488);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 768, 468);

    // Draw Header Logo & Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Outfit, system-ui';
    ctx.fillText('SaringSini', 50, 70);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Plus Jakarta Sans, system-ui';
    ctx.fillText('RINGKASAN INDIKASI AWAL BERBANTUAN AI', 50, 95);

    // Draw Hoax Meter Gauge
    const percent = analysis.hoaxPercentage || 0;
    const cX = 180;
    const cY = 270;
    const cR = 75;

    ctx.beginPath();
    ctx.arc(cX, cY, cR, Math.PI, 0, false);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cX, cY, cR, Math.PI, Math.PI + (percent / 100) * Math.PI, false);

    const gaugeColor = RISK_COLORS[riskLevel(percent)];

    ctx.strokeStyle = gaugeColor;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Outfit, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${percent}%`, cX, cY - 10);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px Plus Jakarta Sans, system-ui';
    ctx.fillText('SKOR INDIKASI AI', cX, cY + 22);

    // Draw Status Pill/Badge
    ctx.textAlign = 'left';
    const badgeText = `AI: ${analysis.statusBadge || 'Perlu verifikasi'}`.toUpperCase();

    const bX = 320;
    const bY = 160;
    const bW = 160;
    const bH = 34;
    const bRad = 6;

    ctx.beginPath();
    ctx.roundRect(bX, bY, bW, bH, bRad);
    ctx.fillStyle = gaugeColor + '15';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = gaugeColor;
    ctx.stroke();

    ctx.fillStyle = gaugeColor;
    ctx.font = 'bold 12px Plus Jakarta Sans, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, bX + (bW / 2), bY + 21);

    // Kategori Pill
    const catText = `KATEGORI: ${(analysis.category || 'Berita').toUpperCase()}`;
    ctx.beginPath();
    ctx.roundRect(bX + 175, bY, 200, bH, bRad);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px Plus Jakarta Sans, system-ui';
    ctx.fillText(catText, bX + 175 + 100, bY + 21);

    // Draw Summary
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Outfit, system-ui';
    ctx.fillText('Ringkasan Indikasi AI:', bX, 235);

    ctx.fillStyle = '#475569';
    ctx.font = '500 15px Plus Jakarta Sans, system-ui';
    wrapText(ctx, analysis.summary || '', bX, 265, 410, 24);

    // Draw Footer Branding
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Plus Jakarta Sans, system-ui';
    ctx.fillText('Alat bantu literasi digital keluarga Indonesia', 50, 440);
    ctx.fillText('Hasil AI dapat salah; verifikasi melalui sumber otoritatif', 50, 455);

    return canvas;
}

export function initInfographic() {
    document.getElementById('download-card-btn').addEventListener('click', () => {
        const analysis = getAnalysis();
        if (!analysis) return;

        const link = document.createElement('a');
        link.download = 'SaringSini_Indikasi_Awal.png';
        link.href = drawInfographic(analysis).toDataURL('image/png');
        link.click();
    });
}
