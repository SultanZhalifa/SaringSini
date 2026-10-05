import { getAnalysis } from '../core/analysis.js';
import { riskLevel } from '../core/risk.js';
import { showToast } from '../core/toast.js';
import { claimStatusLabel } from './results.js';

const JSPDF_URL = '/vendor/jspdf.umd.min.js';
// Brand palette per risk level, as RGB for jsPDF.
const ACCENT_RGB = {
    safe: [107, 142, 78],
    warning: [217, 119, 6],
    danger: [184, 57, 46]
};

let loading = null;

/** jsPDF is only needed on export, so it is fetched (from our own origin) the first time. */
function loadJsPdf() {
    if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    loading ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = JSPDF_URL;
        script.async = true;
        script.onload = () => (window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF gagal dimuat.')));
        script.onerror = () => reject(new Error('Gagal memuat library PDF. Periksa koneksi.'));
        document.head.append(script);
    });
    return loading;
}

function buildReport(jsPDF, analysis) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const percent = analysis.hoaxPercentage || 0;
    const accent = ACCENT_RGB[riskLevel(percent)];

    // Header band
    doc.setFillColor(200, 75, 49);
    doc.rect(0, 0, pageW, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SaringSini', margin, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Ringkasan Indikasi Awal Berbantuan AI', margin, 60);
    doc.setFontSize(9);
    const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(tanggal, pageW - margin, 42, { align: 'right' });

    y = 110;
    doc.setTextColor(61, 40, 23);

    // Score block
    doc.setFillColor(...accent);
    doc.roundedRect(margin, y, 120, 90, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.text(`${percent}%`, margin + 60, y + 50, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('SKOR INDIKASI AI', margin + 60, y + 70, { align: 'center' });

    // Status + Category
    doc.setTextColor(61, 40, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const statusText = `Indikasi AI: ${analysis.statusBadge || 'Perlu verifikasi'}`;
    doc.text(statusText, margin + 140, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(122, 106, 90);
    doc.text(`Kategori: ${analysis.category || 'Berita'}`, margin + 140, y + 48);

    y += 110;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(61, 40, 23);
    doc.text('Ringkasan Indikasi AI', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90, 70, 52);
    const sumLines = doc.splitTextToSize(analysis.summary || '-', contentW);
    doc.text(sumLines, margin, y);
    y += sumLines.length * 14 + 16;

    // Claims
    if (analysis.claims && analysis.claims.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(61, 40, 23);
        doc.text('Daftar Indikasi Klaim', margin, y);
        y += 16;
        doc.setFontSize(10);
        analysis.claims.forEach((c) => {
            if (y > 740) { doc.addPage(); y = margin; }
            const isFact = !!c.isFactual;
            doc.setFillColor(...ACCENT_RGB[isFact ? 'safe' : 'danger']);
            doc.circle(margin + 6, y - 3, 4, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(61, 40, 23);
            const claimTitle = `${claimStatusLabel(isFact)} ${c.claim || ''}`;
            const claimLines = doc.splitTextToSize(claimTitle, contentW - 18);
            doc.text(claimLines, margin + 18, y);
            y += claimLines.length * 13 + 2;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(90, 70, 52);
            const explLines = doc.splitTextToSize(c.explanation || '', contentW - 18);
            doc.text(explLines, margin + 18, y);
            y += explLines.length * 12 + 10;
        });
        y += 6;
    }

    // Polite Replies
    if (analysis.politeReplies) {
        if (y > 660) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(61, 40, 23);
        doc.text('Template Balasan Sopan', margin, y);
        y += 16;

        const replies = [
            { label: 'Sopan & Hormat (Orang Tua)', text: analysis.politeReplies.sopan },
            { label: 'Santai & Akrab (Sebaya)', text: analysis.politeReplies.santai },
            { label: 'Mencairkan Suasana', text: analysis.politeReplies.humor }
        ];
        replies.forEach(r => {
            if (y > 720) { doc.addPage(); y = margin; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(200, 75, 49);
            doc.text(r.label, margin, y);
            y += 14;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(61, 40, 23);
            const rLines = doc.splitTextToSize(r.text || '', contentW);
            doc.text(rLines, margin, y);
            y += rLines.length * 12 + 10;
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150, 130, 110);
        doc.text('SaringSini - Hasil AI dapat salah; verifikasi sumber penting', margin, 825);
        doc.text(`Halaman ${p} dari ${pageCount}`, pageW - margin, 825, { align: 'right' });
    }

    return doc;
}

export function initPdfReport() {
    const button = document.getElementById('download-pdf-btn');

    button.addEventListener('click', async () => {
        const analysis = getAnalysis();
        if (!analysis) {
            showToast('Lakukan pemeriksaan dulu sebelum ekspor PDF.', 'warning');
            return;
        }

        const originalLabel = button.innerHTML;
        button.disabled = true;
        button.textContent = 'Menyiapkan PDF...';

        try {
            const doc = buildReport(await loadJsPdf(), analysis);
            doc.save(`SaringSini_Indikasi_Awal_${Date.now()}.pdf`);
            showToast('Laporan PDF berhasil diunduh', 'safe');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast(error.message || 'Gagal membuat PDF.', 'danger');
        } finally {
            button.disabled = false;
            button.innerHTML = originalLabel;
        }
    });
}
