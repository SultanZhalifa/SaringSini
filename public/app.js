// SaringSini Frontend Interactive Logic (Light Mode, Emoji-Free, & Premium Features)

// -------------------------------------------------------------
// Global Error Boundary (basic user-facing error handling)
// Catches uncaught errors and unhandled promise rejections so the UI
// never silently dies. Surfaces friendly toast + logs to console
// for ops debugging.
// -------------------------------------------------------------
(function setupErrorBoundary() {
    const showFriendlyError = (msg) => {
        try {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = msg;
                toast.classList.remove('toast-safe', 'toast-warning');
                toast.classList.add('toast-danger', 'show');
                setTimeout(() => toast.classList.remove('show'), 3500);
            }
        } catch (_) { /* ignore */ }
    };

    window.addEventListener('error', (event) => {
        // Filter out benign cross-origin script errors
        if (event && event.message && /Script error/i.test(event.message)) return;
        console.error('[SaringSini] Uncaught error:', event.error || event.message);
        showFriendlyError('Terjadi kesalahan kecil. Coba muat ulang halaman.');
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('[SaringSini] Unhandled promise rejection:', event.reason);
        showFriendlyError('Permintaan gagal di latar belakang. Coba lagi.');
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // Generate/Retrieve Persistent Client ID for Upvote tracking
    let clientId = localStorage.getItem('saringsini_client_id');
    if (!clientId) {
        clientId = 'client_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('saringsini_client_id', clientId);
    }

    // Force light theme — dark mode removed per design decision
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.removeItem('saringsini_theme'); } catch (e) { /* ignore */ }

    // DOM Elements
    const tabText = document.getElementById('tab-text');
    const tabImage = document.getElementById('tab-image');
    const groupText = document.getElementById('group-text');
    const groupImage = document.getElementById('group-image');
    
    // [NEW] Navigation Elements (Unifying Bottom Nav & Desktop Sidebar)
    const navBtns = document.querySelectorAll('.bottom-nav-btn, .sidebar-nav-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // [NEW] Tab Panel Switching Function
    const switchPanel = (tabName) => {
        // Update active class on nav buttons (syncing both bottom nav & sidebar)
        navBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update active class on panels
        tabPanels.forEach(panel => {
            if (panel.id === `panel-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Scroll panel content to top
        const contentArea = document.querySelector('.app-content');
        if (contentArea) {
            contentArea.scrollTop = 0;
        }
    };

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchPanel(tabName);
        });
    });

    // [NEW] Quick Actions on Beranda Dashboard
    const actionGoPeriksa = document.getElementById('action-go-periksa');
    const actionGoSimulator = document.getElementById('action-go-simulator');
    const actionGoKomunitas = document.getElementById('action-go-komunitas');
    const actionGoEdukasi = document.getElementById('action-go-edukasi');

    if (actionGoPeriksa) actionGoPeriksa.addEventListener('click', () => switchPanel('periksa'));
    if (actionGoSimulator) actionGoSimulator.addEventListener('click', () => switchPanel('simulator'));
    if (actionGoKomunitas) actionGoKomunitas.addEventListener('click', () => switchPanel('komunitas'));
    if (actionGoEdukasi) actionGoEdukasi.addEventListener('click', () => switchPanel('edukasi'));

    
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');
    
    // [NEW] AI Deepfake elements
    const tabDeepfake = document.getElementById('tab-deepfake');
    const groupDeepfake = document.getElementById('group-deepfake');
    const fileInputDeepfake = document.getElementById('file-input-deepfake');
    const dropZoneDeepfake = document.getElementById('drop-zone-deepfake');
    const imagePreviewContainerDeepfake = document.getElementById('image-preview-container-deepfake');
    const imagePreviewDeepfake = document.getElementById('image-preview-deepfake');
    const videoPreviewDeepfake = document.getElementById('video-preview-deepfake');
    const removeImageBtnDeepfake = document.getElementById('remove-image-deepfake');
    
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnSpinner = document.getElementById('btn-spinner');
    
    const resultView = document.getElementById('result-view');
    const resultEmpty = document.getElementById('result-empty');
    const resultLoading = document.getElementById('result-loading');
    const resultContent = document.getElementById('result-content');
    
    // Result elements
    const gaugeFillArc = document.getElementById('gauge-fill-arc');
    const gaugeValueText = document.getElementById('gauge-value-text');
    const resBadge = document.getElementById('res-badge');
    const resCategory = document.getElementById('res-category');
    const resStatusTitle = document.getElementById('res-status-title');
    const resSummary = document.getElementById('res-summary');
    const resClaimsList = document.getElementById('res-claims-list');
    const resMitigationBox = document.getElementById('res-mitigation-box');
    const resMitigationActions = document.getElementById('res-mitigation-actions');
    
    const sopanText = document.getElementById('sopan-text');
    const santaiText = document.getElementById('santai-text');
    const humorText = document.getElementById('humor-text');
    
    const downloadCardBtn = document.getElementById('download-card-btn');
    const toast = document.getElementById('toast');
    
    // Simulator elements
    const chatBox = document.getElementById('chat-box');
    const simInput = document.getElementById('chat-simulator-input');
    const simSendBtn = document.getElementById('chat-send-btn');
    const resetChatBtn = document.getElementById('reset-chat-btn');
    
    // Community Feed Elements (Victory Update!)
    const communityFeedContainer = document.getElementById('community-feed-container');
    const communitySearch = document.getElementById('community-search');
    const commTabs = document.querySelectorAll('.comm-tab');
    
    // State variables
    let activeTab = 'text'; // 'text', 'image', or 'deepfake'
    let selectedFile = null;
    let selectedFileDeepfake = null;
    let currentAnalysis = null; // Stores last analysis result
    
    let communityReportsList = []; // Loaded from server
    let activeCategoryFilter = 'all';
    let searchQuery = '';

    // -------------------------------------------------------------
    // [NEW] API Backend Sync for Community Feed (Victory Feature!)
    // -------------------------------------------------------------
    const loadCommunityFeed = async () => {
        try {
            const res = await fetch('/api/community');
            if (res.ok) {
                communityReportsList = await res.json();
                renderCommunityFeed();
            }
        } catch (error) {
            console.error("Failed to load community feed from server:", error);
        }
    };

    // Render Community Feed with Search & Category filters
    const renderCommunityFeed = () => {
        communityFeedContainer.innerHTML = '';
        
        // Filter list
        let filtered = [...communityReportsList];
        
        if (activeCategoryFilter !== 'all') {
            const filterLower = activeCategoryFilter.toLowerCase();
            filtered = filtered.filter(item => 
                (item.category || '').toLowerCase().includes(filterLower) || 
                (item.badge || '').toLowerCase().includes(filterLower)
            );
        }
        
        if (searchQuery) {
            const queryLower = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                (item.text || '').toLowerCase().includes(queryLower) || 
                (item.author || '').toLowerCase().includes(queryLower)
            );
        }

        if (filtered.length === 0) {
            communityFeedContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.8rem;">
                    Tidak ada laporan hoaks yang cocok.
                </div>
            `;
            return;
        }

        filtered.forEach(post => {
            const item = document.createElement('div');
            item.className = 'community-item';
            
            // Check if already upvoted by this client
            const hasUpvoted = post.upvotedClients && post.upvotedClients.includes(clientId);
            const upvoteClass = hasUpvoted ? 'community-upvote-btn upvoted' : 'community-upvote-btn';
            const upvoteText = hasUpvoted ? 'Sudah Didukung' : 'Dukung Klarifikasi';
            
            item.innerHTML = `
                <div class="community-item-header">
                    <span class="community-author">${post.author}</span>
                    <span class="community-badge ${post.badgeClass}">${post.percentage}% ${post.badge}</span>
                </div>
                <p class="community-text">${post.text}</p>
                <div class="community-actions">
                    <span class="community-date">${post.time}</span>
                    <button class="${upvoteClass}" data-id="${post.id}" ${hasUpvoted ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <span>${post.upvotes} ${upvoteText}</span>
                    </button>
                </div>
            `;
            communityFeedContainer.appendChild(item);
        });
        
        // Add upvote click listeners
        document.querySelectorAll('.community-upvote-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                handleCommunityUpvote(id);
            });
        });
    };
    
    const handleCommunityUpvote = async (id) => {
        try {
            const res = await fetch(`/api/community/${id}/upvote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });
            
            if (res.ok) {
                toast.textContent = 'Dukungan verifikasi berhasil ditambahkan';
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 2000);
                
                // Reload feed
                loadCommunityFeed();
            } else {
                const err = await res.json();
                showToast(err.error || "Gagal memberikan upvote.", 'warning');
            }
        } catch (error) {
            console.error("Upvote request failed:", error);
            showToast('Koneksi gagal. Coba lagi.', 'danger');
        }
    };
    
    // [NEW] Search & Category Filter click handlers (Victory Update!)
    communitySearch.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderCommunityFeed();
    });
    
    commTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            commTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            activeCategoryFilter = this.getAttribute('data-cat');
            renderCommunityFeed();
        });
    });

    // Initial Community Load
    loadCommunityFeed();

    // Set simulator timestamp to current time
    const setInitialTimestamps = () => {
        const timeEl = document.getElementById('sim-time-1');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    };
    setInitialTimestamps();

    // -------------------------------------------------------------
    // Input Tab Toggling (Teks / Screenshot / Deepfake / URL)
    // -------------------------------------------------------------
    const tabUrl = document.getElementById('tab-url');
    const groupUrl = document.getElementById('group-url');
    const urlInput = document.getElementById('url-input');

    const inputTabs = [
        { btn: tabText, group: groupText, name: 'text' },
        { btn: tabImage, group: groupImage, name: 'image' },
        { btn: tabDeepfake, group: groupDeepfake, name: 'deepfake' },
        { btn: tabUrl, group: groupUrl, name: 'url' }
    ];

    const setActiveInputTab = (name) => {
        activeTab = name;
        inputTabs.forEach(t => {
            if (!t.btn || !t.group) return;
            const isActive = t.name === name;
            t.btn.classList.toggle('active', isActive);
            t.btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            t.group.classList.toggle('hidden', !isActive);
        });
    };

    inputTabs.forEach(t => {
        if (t.btn) t.btn.addEventListener('click', () => setActiveInputTab(t.name));
    });

    // -------------------------------------------------------------
    // Image Upload Handling (Drag & Drop & Click)
    // -------------------------------------------------------------
    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('#remove-image')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // [NEW] Deepfake Drag & Drop & Click Handling
    dropZoneDeepfake.addEventListener('click', (e) => {
        if (e.target.closest('#remove-image-deepfake')) return;
        fileInputDeepfake.click();
    });

    fileInputDeepfake.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelectDeepfake(e.target.files[0]);
        }
    });

    // Screenshot Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    // Deepfake Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneDeepfake.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZoneDeepfake.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    // Deepfake dragleave & drop
    ['dragleave', 'drop'].forEach(eventName => {
        dropZoneDeepfake.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZoneDeepfake.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    dropZoneDeepfake.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileSelectDeepfake(files[0]);
        }
    });

    const handleFileSelectDeepfake = (file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            showToast('Format berkas tidak didukung. Hanya gambar atau video.', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran berkas terlalu besar. Maksimal 5MB.', 'warning');
            return;
        }
        
        selectedFileDeepfake = file;
        
        if (isImage) {
            imagePreviewDeepfake.classList.remove('hidden');
            videoPreviewDeepfake.classList.add('hidden');
            videoPreviewDeepfake.src = '';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewDeepfake.src = e.target.result;
                imagePreviewContainerDeepfake.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else if (isVideo) {
            videoPreviewDeepfake.classList.remove('hidden');
            imagePreviewDeepfake.classList.add('hidden');
            imagePreviewDeepfake.src = '#';
            
            const objectUrl = URL.createObjectURL(file);
            videoPreviewDeepfake.src = objectUrl;
            imagePreviewContainerDeepfake.classList.remove('hidden');
        }
    };

    removeImageBtnDeepfake.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFileDeepfake = null;
        fileInputDeepfake.value = '';
        imagePreviewDeepfake.src = '#';
        imagePreviewDeepfake.classList.add('hidden');
        videoPreviewDeepfake.src = '';
        videoPreviewDeepfake.classList.add('hidden');
        imagePreviewContainerDeepfake.classList.add('hidden');
    });

    const handleFileSelect = (file) => {
        if (!file.type.startsWith('image/')) {
            showToast('Format berkas tidak didukung. Hanya gambar.', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran gambar terlalu besar. Maksimal 5MB.', 'warning');
            return;
        }
        
        selectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    };

    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        imagePreview.src = '#';
        imagePreviewContainer.classList.add('hidden');
    });

    // -------------------------------------------------------------
    // Gemini API Request Execution
    // -------------------------------------------------------------
    analyzeBtn.addEventListener('click', async () => {
        const textVal = messageInput.value.trim();
        const urlVal = urlInput ? urlInput.value.trim() : '';

        if (activeTab === 'text' && !textVal) {
            showToast('Mohon masukkan teks pesan atau berita terlebih dahulu', 'warning');
            return;
        }
        if (activeTab === 'image' && !selectedFile) {
            showToast('Mohon pilih atau unggah tangkapan layar chat', 'warning');
            return;
        }
        if (activeTab === 'deepfake' && !selectedFileDeepfake) {
            showToast('Mohon pilih atau unggah foto atau video rekayasa AI', 'warning');
            return;
        }
        if (activeTab === 'url') {
            if (!urlVal) {
                showToast('Mohon tempel URL yang ingin diperiksa', 'warning');
                return;
            }
            try { new URL(urlVal); } catch (_) {
                showToast('Format URL tidak valid. Pastikan diawali http:// atau https://', 'warning');
                return;
            }
        }

        analyzeBtn.disabled = true;
        btnSpinner.classList.remove('hidden');
        resultEmpty.classList.add('hidden');
        resultContent.classList.add('hidden');
        resultLoading.classList.remove('hidden');

        const formData = new FormData();
        formData.append('clientId', clientId);

        if (activeTab === 'text') {
            formData.append('message', textVal);
        } else if (activeTab === 'image') {
            formData.append('screenshot', selectedFile);
            if (textVal) {
                formData.append('message', textVal);
            }
        } else if (activeTab === 'deepfake') {
            formData.append('screenshot', selectedFileDeepfake);
            formData.append('checkType', 'deepfake');
            if (textVal) {
                formData.append('message', textVal);
            }
        } else if (activeTab === 'url') {
            formData.append('message', urlVal);
            formData.append('checkType', 'url');
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Terjadi kesalahan sistem saat menganalisis berita.');
            }

            const data = await response.json();
            currentAnalysis = data;
            
            renderAnalysisResults(data);

            // Auto scroll down to the loaded result cards smoothly
            setTimeout(() => {
                const element = document.getElementById('result-view');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 150);

        } catch (error) {
            console.error(error);
            showToast(error.message || 'Koneksi gagal. Coba lagi sebentar.', 'danger');
            resultEmpty.classList.remove('hidden');
            resultContent.classList.add('hidden');
        } finally {
            analyzeBtn.disabled = false;
            btnSpinner.classList.add('hidden');
            resultLoading.classList.add('hidden');
        }
    });

    // -------------------------------------------------------------
    // Render Results & Animate Speedometer Gauge
    // -------------------------------------------------------------
    const renderAnalysisResults = (data) => {
        resultContent.classList.remove('hidden');
        
        // Reset dynamic glow effects
        resultView.classList.remove('glow-safe-pulse', 'glow-warning-pulse', 'glow-danger-pulse');
        
        // 1. Animate Speedometer SVG Gauge
        const hoaxPercentage = data.hoaxPercentage || 0;
        const dashArray = 125.6;
        const targetOffset = dashArray - (hoaxPercentage / 100) * dashArray;
        
        gaugeFillArc.style.strokeDashoffset = targetOffset;
        
        let count = 0;
        const duration = 1000; // ms
        const stepTime = Math.max(Math.floor(duration / hoaxPercentage), 10);
        
        const counterInterval = setInterval(() => {
            if (hoaxPercentage === 0) {
                gaugeValueText.textContent = '0%';
                clearInterval(counterInterval);
                return;
            }
            count++;
            gaugeValueText.textContent = `${count}%`;
            if (count >= hoaxPercentage) {
                clearInterval(counterInterval);
            }
        }, stepTime);

        // 2. Set Status Badge, Color Class & Dynamic Glowing Pulse (Victory Update!)
        resBadge.textContent = `Indikasi AI: ${data.statusBadge || 'Perlu verifikasi'}`;
        resBadge.className = 'status-badge'; 
        
        let headerColor = '#0f172a';
        if (hoaxPercentage < 30) {
            resBadge.classList.add('safe');
            resultView.classList.add('glow-safe-pulse'); // Glow green
            resStatusTitle.textContent = 'Indikasi Risiko Rendah';
            headerColor = '#059669'; 
        } else if (hoaxPercentage < 70) {
            resBadge.classList.add('warning');
            resultView.classList.add('glow-warning-pulse'); // Glow yellow
            resStatusTitle.textContent = 'Indikasi Perlu Verifikasi';
            headerColor = '#d97706'; 
        } else {
            resBadge.classList.add('danger');
            resultView.classList.add('glow-danger-pulse'); // Glow red pulsing
            resStatusTitle.textContent = 'Indikasi Risiko Tinggi';
            headerColor = '#dc2626'; 
        }
        resStatusTitle.style.color = headerColor;
        
        resCategory.textContent = data.category || 'Berita';
        resSummary.textContent = data.summary || 'Hasil analisis selesai.';

        // 3. Dynamic Mitigation Action suggestions based on Category & Hoax Level
        resMitigationActions.innerHTML = '';
        if (hoaxPercentage >= 40) {
            resMitigationBox.classList.remove('hidden');
            
            const cat = (data.category || '').toLowerCase();
            const mitigations = [];
            
            if (cat.includes('scam') || cat.includes('penipuan') || cat.includes('keuangan')) {
                mitigations.push({
                    title: 'Verifikasi Nomor Rekening',
                    url: 'https://cekrekening.id/',
                    sub: 'cekrekening.id (Kementerian Kominfo)',
                    colorClass: 'red-action'
                });
                mitigations.push({
                    title: 'Lapor Patroli Siber POLRI',
                    url: 'https://patrolisiber.id/',
                    sub: 'Aduan Tindak Pidana Penipuan Siber',
                    colorClass: 'red-action'
                });
            } else if (cat.includes('kesehatan') || cat.includes('medis')) {
                mitigations.push({
                    title: 'Cari Info Sehat Kemenkes',
                    url: 'https://kemkes.go.id/',
                    sub: 'Portal Resmi Kementerian Kesehatan',
                    colorClass: 'emerald-action'
                });
            }
            
            mitigations.push({
                title: 'Laporkan Hoaks Kominfo',
                url: 'https://aduankonten.id/',
                sub: 'aduankonten.id (Klarifikasi Konten Negatif)',
                colorClass: 'emerald-action'
            });
            mitigations.push({
                title: 'Cek di TurnBackHoax.id',
                url: 'https://turnbackhoax.id/',
                sub: 'Portal Pemeriksa Fakta Mafindo',
                colorClass: 'emerald-action'
            });
            
            mitigations.slice(0, 4).forEach(mit => {
                const btn = document.createElement('a');
                btn.className = `mitigation-btn ${mit.colorClass}`;
                btn.href = mit.url;
                btn.target = '_blank';
                btn.innerHTML = `
                    <div style="text-align: left;">
                        <span style="display: block;">${mit.title}</span>
                        <span style="font-size: 0.65rem; font-weight: 500; opacity: 0.75; display: block;">${mit.sub}</span>
                    </div>
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                `;
                resMitigationActions.appendChild(btn);
            });
        } else {
            resMitigationBox.classList.add('hidden');
        }

        // 4. Claims Listing using clean SVGs (NO EMOJI)
        resClaimsList.innerHTML = '';
        if (data.claims && data.claims.length > 0) {
            data.claims.forEach(item => {
                const claimCard = document.createElement('div');
                claimCard.className = 'claim-card';
                
                const isFactual = item.isFactual;
                const statusText = isFactual ? 'Indikasi faktual' : 'Perlu verifikasi';
                const titleColor = isFactual ? 'var(--emerald)' : 'var(--red)';
                
                const iconSvg = isFactual 
                    ? `<svg viewBox="0 0 24 24" class="claim-status-icon text-emerald" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg viewBox="0 0 24 24" class="claim-status-icon text-red" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                
                claimCard.innerHTML = `
                    <div class="claim-header-row">
                        <div class="claim-status-icon">${iconSvg}</div>
                        <div style="flex: 1;">
                            <span class="claim-title" style="color: ${titleColor};">[${statusText}]</span>
                            <span class="claim-title" style="color: var(--text-primary);"> ${item.claim}</span>
                        </div>
                    </div>
                    <p class="claim-explanation">${item.explanation}</p>
                `;
                resClaimsList.appendChild(claimCard);
            });
        } else {
            resClaimsList.innerHTML = '<p class="claim-explanation">Tidak ditemukan klaim spesifik.</p>';
        }

        // 5. Populate Polite Replies cards (Strictly Clean Text - NO EMOJI)
        sopanText.textContent = cleanEmojiText(data.politeReplies.sopan);
        santaiText.textContent = cleanEmojiText(data.politeReplies.santai);
        humorText.textContent = cleanEmojiText(data.politeReplies.humor);
        
        // 6. Automatically sync newly injected server-side community feed reports (Victory Update!)
        setTimeout(() => {
            loadCommunityFeed();
        }, 600);
    };

    // Helper to strip any accidentally generated emojis from strings
    const cleanEmojiText = (str) => {
        if (!str) return '';
        return str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');
    };

    // -------------------------------------------------------------
    // Copy-to-Clipboard & Toast Alerts
    // -------------------------------------------------------------
    const copyToClipboard = (text) => {
        const proceed = () => {
            simInput.value = text;
            // Auto-redirect to Simulator tab for immediate testing
            setTimeout(() => switchPanel('simulator'), 550);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.__saringSiniToast) window.__saringSiniToast('Balasan disalin & dipindah ke Simulator', 'safe');
                proceed();
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                if (window.__saringSiniToast) window.__saringSiniToast('Clipboard tidak tersedia. Tetap dipindah ke Simulator.', 'warning');
                proceed();
            });
        } else {
            // Fallback for older browsers / insecure contexts
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                if (window.__saringSiniToast) window.__saringSiniToast('Balasan disalin & dipindah ke Simulator', 'safe');
            } catch (_) {
                if (window.__saringSiniToast) window.__saringSiniToast('Tidak bisa salin otomatis. Dipindah ke Simulator.', 'warning');
            }
            proceed();
        }
    };

    document.querySelectorAll('.copyable').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger when clicking on WA share or other action buttons inside the card
            if (e.target.closest('.wa-share-btn')) return;
            const targetId = this.getAttribute('data-target');
            const el = document.getElementById(targetId);
            if (!el) return;
            const textToCopy = (el.textContent || '').trim();
            if (!textToCopy || textToCopy === 'Memuat template...') return;
            copyToClipboard(textToCopy);
        });
    });

    // -------------------------------------------------------------
    // Downloadable Infographic Card PNG Generator
    // -------------------------------------------------------------
    downloadCardBtn.addEventListener('click', () => {
        if (!currentAnalysis) return;
        
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
        const percent = currentAnalysis.hoaxPercentage || 0;
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
        
        let gaugeColor = '#059669'; 
        if (percent >= 30 && percent < 70) gaugeColor = '#d97706'; 
        if (percent >= 70) gaugeColor = '#dc2626'; 
        
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
        const badgeText = `AI: ${currentAnalysis.statusBadge || 'Perlu verifikasi'}`.toUpperCase();
        
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
        const catText = `KATEGORI: ${(currentAnalysis.category || 'Berita').toUpperCase()}`;
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
        wrapText(ctx, currentAnalysis.summary || '', bX, 265, 410, 24);
        
        // Draw Footer Branding
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 12px Plus Jakarta Sans, system-ui';
        ctx.fillText('Alat bantu literasi digital keluarga Indonesia', 50, 440);
        ctx.fillText('Hasil AI dapat salah; verifikasi melalui sumber otoritatif', 50, 455);
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'SaringSini_Indikasi_Awal.png';
        link.href = dataUrl;
        link.click();
    });

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, currentY);
    }

    // -------------------------------------------------------------
    // Digital Literacy Accordion Logic
    // -------------------------------------------------------------
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', function() {
            const item = this.parentElement;
            const isActive = item.classList.contains('active');
            
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // -------------------------------------------------------------
    // Family Chat Simulator (Strictly Emoji-Free & SVGs)
    // -------------------------------------------------------------
    const appendMessage = (sender, content, type, senderNameColor = '#0f766e') => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (type === 'received') {
            bubble.innerHTML = `
                <div class="sender-name" style="color: ${senderNameColor};">${sender}</div>
                <p class="message-content">${content}</p>
                <span class="message-time">${timeStr}</span>
            `;
        } else {
            bubble.innerHTML = `
                <p class="message-content">${content}</p>
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 2px; margin-top: 2px;">
                    <span class="message-time">${timeStr}</span>
                    <svg viewBox="0 0 24 24" width="13" height="13" style="color: #53bdeb; margin-left: 2px;" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path><path d="M16 6l-6.85 7.15L8.5 12.5"></path></svg>
                </div>
            `;
        }
        
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    simSendBtn.addEventListener('click', () => {
        const text = simInput.value.trim();
        if (!text) return;
        
        appendMessage('Anda', text, 'sent');
        simInput.value = '';
        
        simulateFamilyResponse(text);
    });

    simInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            simSendBtn.click();
        }
    });

    // Show inline typing indicator inside chat-box (natural WhatsApp-style)
    const showTypingIndicator = (senderName) => {
        if (!chatBox) return null;
        const node = document.createElement('div');
        node.className = 'chat-typing-indicator';
        node.setAttribute('data-typing-for', senderName);
        node.innerHTML = `
            <span>${escapeHtml ? escapeHtml(senderName) : senderName} sedang mengetik</span>
            <span class="chat-typing-dots"><span></span><span></span><span></span></span>
        `;
        chatBox.appendChild(node);
        chatBox.scrollTop = chatBox.scrollHeight;
        return node;
    };

    const removeTypingIndicator = (node) => {
        if (node && node.parentNode) node.parentNode.removeChild(node);
    };

    const simulateFamilyResponse = (userText) => {
        // Show typing indicator inline
        const typingNode = showTypingIndicator('Mama');

        setTimeout(() => {
            if (typingNode) typingNode.querySelector('span').textContent = 'Papa sedang mengetik';

            setTimeout(() => {
                removeTypingIndicator(typingNode);
                
                let sender = 'Mama';
                let reply = '';
                let nameColor = '#B8392E'; // pink/rose for mama
                
                const cleanText = userText.toLowerCase().trim();
                
                if (cleanText === 'p' || cleanText === 'ping') {
                    sender = 'Papa';
                    nameColor = '#5C8374';
                    reply = 'Nak, dibiasakan kalau memulai obrolan dengan orang tua mengucapkan salam ya, jangan cuma huruf P saja, kurang sopan.';
                } else if (cleanText === 'woi' || cleanText === 'woy' || cleanText === 'oi' || cleanText === 'oy') {
                    sender = 'Mama';
                    nameColor = '#B8392E';
                    reply = 'Astagfirullah nak, bahasanya yang sopan ya di grup keluarga. Ada Om dan Tante juga di sini.';
                } else if (cleanText.includes('assalamualaikum') || cleanText.includes('assalamu\'alaikum')) {
                    sender = 'Mama';
                    nameColor = '#B8392E';
                    reply = 'Waalaikumsalam warahmatullah. Ada kabar atau info penting apa nak hari ini? Semoga kita sekeluarga selalu sehat ya.';
                } else if (cleanText === 'halo' || cleanText === 'hallo' || cleanText === 'hai' || cleanText === 'hi') {
                    sender = 'Tante Rosa';
                    nameColor = '#7A4A8E';
                    reply = 'Halo juga keponakanku yang baik. Ada informasi menarik atau kabar apa hari ini?';
                } else if (currentAnalysis && userText.length > 25) {
                    const percent = currentAnalysis.hoaxPercentage || 0;
                    
                    if (percent >= 60) {
                        const responses = [
                            {
                                name: 'Mama',
                                color: '#B8392E',
                                text: 'Ya ampun nak, Mama baru saja mau membagikan info ini ke grup arisan warga RT dan teman sekolah Mama. Untung kamu cepat memberikan klarifikasi ini. Terima kasih banyak ya sayang, nanti sepulang kerja Mama buatkan makanan kesukaanmu.'
                            },
                            {
                                name: 'Papa',
                                color: '#5C8374', 
                                text: 'Oh begitu ya nak, untung Papa membaca penjelasan bijakmu dulu di grup ini. Memang sekarang banyak sekali disinformasi menyebar secara sembarangan di internet. Papa bantu teruskan penjelasan ini ke teman-teman di kantor.'
                            },
                            {
                                name: 'Om Heri',
                                color: '#D97706', 
                                text: 'Waduh, ternyata ini tidak benar ya. Om mendapatkan pesan ini dari teman kantor yang katanya langsung dari dinas terkait. Tapi ya sudahlah kalau sistem AI kamu sudah memastikan ini salah. Terima kasih infonya keponakanku.'
                            }
                        ];
                        const chosen = responses[Math.floor(Math.random() * responses.length)];
                        sender = chosen.name;
                        nameColor = chosen.color;
                        reply = cleanEmojiText(chosen.text);
                    } else if (percent < 30) {
                        const responses = [
                            {
                                name: 'Papa',
                                color: '#5C8374',
                                text: 'Info yang sangat baik nak. Penjelasannya terstruktur dan berdasarkan fakta ilmiah. Langsung Papa sebarkan ke grup angkatan alumni sekolah biar semua tahu. Terima kasih banyak.'
                            },
                            {
                                name: 'Mama',
                                color: '#B8392E',
                                text: 'Terima kasih banyak ya anakku sayang untuk info penting ini. Jaga kondisi tubuhmu baik-baik di sana, jangan lupa istirahat teratur dan kurangi minum es.'
                            }
                        ];
                        const chosen = responses[Math.floor(Math.random() * responses.length)];
                        sender = chosen.name;
                        nameColor = chosen.color;
                        reply = cleanEmojiText(chosen.text);
                    } else {
                        const responses = [
                            {
                                name: 'Tante Rosa',
                                color: '#7A4A8E', 
                                text: 'Terima kasih banyak nak atas bantuannya meluruskan informasi ini. Memang kita harus menyaring dulu setiap berita sebelum ikut membagikannya ke orang lain ya.'
                            },
                            {
                                name: 'Mama',
                                color: '#B8392E',
                                text: 'Ternyata beritanya kurang akurat ya nak. Terima kasih ya sudah membantu membedah kebenarannya. Sangat membantu Mama memahami isi beritanya.'
                            }
                        ];
                        const chosen = responses[Math.floor(Math.random() * responses.length)];
                        sender = chosen.name;
                        nameColor = chosen.color;
                        reply = cleanEmojiText(chosen.text);
                    }
                } else {
                    const genericResponses = [
                        {
                            name: 'Mama',
                            color: '#B8392E',
                            text: 'Iya nak, terima kasih. Jangan lupa nanti pas pulang mampir belikan kebutuhan bumbu dapur dulu ya, Mama mau memasak makan malam.'
                        },
                        {
                            name: 'Papa',
                            color: '#5C8374',
                            text: 'Info yang bagus sekali nak. Terima kasih banyak.'
                        },
                        {
                            name: 'Tante Rosa',
                            color: '#7A4A8E',
                            text: 'Semoga kita sekeluarga selalu diberikan kesehatan, kelancaran rezeki, dan perlindungan dari segala mara bahaya.'
                        }
                    ];
                    // Prevent repeating the same response if possible
                    let lastGenericIndex = parseInt(localStorage.getItem('saringsini_last_gen_idx')) || 0;
                    let nextIndex = (lastGenericIndex + 1) % genericResponses.length;
                    localStorage.setItem('saringsini_last_gen_idx', nextIndex);
                    
                    const chosen = genericResponses[nextIndex];
                    sender = chosen.name;
                    nameColor = chosen.color;
                    reply = cleanEmojiText(chosen.text);
                }
                
                appendMessage(sender, reply, 'received', nameColor);
            }, 1000);
        }, 1000);
    };

    resetChatBtn.addEventListener('click', () => {
        chatBox.innerHTML = `
            <div class="chat-day-divider"><span>Hari ini</span></div>
            <div class="chat-bubble received">
                <div class="sender-name sender-om">Om Heri</div>
                <p class="message-content">Tolong sebarkan ke keluarga kita! Info penting bahaya makan kangkung yang didalamnya ada lintah air yang hidup meskipun direbus. Kemarin ada tetangga pingsan masuk rumah sakit gara-gara makan kangkung lintah!</p>
                <span class="message-time" id="sim-time-1">08:00</span>
            </div>
        `;
        setInitialTimestamps();
        simInput.value = '';
        if (window.__saringSiniToast) window.__saringSiniToast('Percakapan disetel ulang', 'safe');
    });

    // Quick suggestion chips
    document.querySelectorAll('.chat-quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.getAttribute('data-chip');
            if (text && simInput) {
                simInput.value = text;
                simInput.focus();
            }
        });
    });

    // Paste latest sopan reply from Periksa tab
    const chatPasteBtn = document.getElementById('chat-paste-from-periksa');
    if (chatPasteBtn) {
        chatPasteBtn.addEventListener('click', () => {
            const sopan = document.getElementById('sopan-text');
            const txt = sopan ? (sopan.textContent || '').trim() : '';
            if (!txt || txt === 'Memuat template...') {
                if (window.__saringSiniToast) window.__saringSiniToast('Belum ada balasan sopan. Periksa hoaks dulu.', 'warning');
                return;
            }
            if (simInput) {
                simInput.value = txt;
                simInput.focus();
                if (window.__saringSiniToast) window.__saringSiniToast('Balasan sopan tertempel. Tekan kirim.', 'safe');
            }
        });
    }

    // =============================================================
    // v2.0 NEW FEATURES: Toast Manager, Voice Input, WA Share,
    // PDF Export, Language Regenerate, URL Checker integration
    // =============================================================

    // ------------ Toast Manager (replaces alert()) ------------
    let toastTimer = null;
    function showToast(message, variant) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('show', 'toast-safe', 'toast-warning', 'toast-danger');
        if (variant === 'safe') toast.classList.add('toast-safe');
        else if (variant === 'warning') toast.classList.add('toast-warning');
        else if (variant === 'danger') toast.classList.add('toast-danger');
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    }
    // Expose globally for any inline reuse
    window.__saringSiniToast = showToast;

    // ------------ Voice Input (Web Speech API) ------------
    const voiceBtn = document.getElementById('voice-input-btn');
    const voiceStatusText = voiceBtn ? voiceBtn.querySelector('.voice-status-text') : null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    let recognition = null;
    let isRecording = false;

    if (voiceBtn) {
        if (!SpeechRecognition) {
            voiceBtn.disabled = true;
            voiceBtn.title = 'Browser tidak mendukung input suara';
            voiceBtn.setAttribute('aria-disabled', 'true');
        } else {
            recognition = new SpeechRecognition();
            recognition.lang = 'id-ID';
            recognition.interimResults = true;
            recognition.continuous = false;
            recognition.maxAlternatives = 1;

            let interimText = '';

            recognition.onstart = () => {
                isRecording = true;
                voiceBtn.classList.add('recording');
                if (voiceStatusText) voiceStatusText.textContent = 'Stop';
                voiceBtn.setAttribute('aria-label', 'Hentikan rekaman suara');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                interimText = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimText += transcript;
                    }
                }
                if (finalTranscript) {
                    const current = messageInput.value.trim();
                    messageInput.value = (current ? current + ' ' : '') + finalTranscript.trim();
                }
            };

            recognition.onerror = (event) => {
                console.warn('Voice recognition error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    showToast('Izin mikrofon ditolak. Aktifkan di pengaturan browser.', 'warning');
                } else if (event.error === 'no-speech') {
                    showToast('Tidak ada suara terdeteksi. Coba lagi.', 'warning');
                } else if (event.error !== 'aborted') {
                    showToast('Input suara gagal. Coba ketik manual.', 'warning');
                }
            };

            recognition.onend = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                if (voiceStatusText) voiceStatusText.textContent = 'Bicara';
                voiceBtn.setAttribute('aria-label', 'Rekam suara untuk pesan');
            };

            voiceBtn.addEventListener('click', () => {
                if (isRecording) {
                    try { recognition.stop(); } catch (_) { /* ignore */ }
                } else {
                    // Switch to text tab if user is on another input tab
                    if (activeTab !== 'text') setActiveInputTab('text');
                    try {
                        recognition.start();
                        showToast('Mulai bicara dalam Bahasa Indonesia', 'safe');
                    } catch (e) {
                        console.warn('Cannot start recognition:', e);
                    }
                }
            });
        }
    }

    // ------------ WhatsApp Share Buttons ------------
    document.querySelectorAll('.wa-share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const el = document.getElementById(targetId);
            if (!el) return;
            const text = (el.textContent || '').trim();
            if (!text || text === 'Memuat template...') {
                showToast('Hasilkan template balasan dulu.', 'warning');
                return;
            }
            const intro = 'Halo, ini info verifikasi dari SaringSini:\n\n';
            const url = 'https://wa.me/?text=' + encodeURIComponent(intro + text);
            window.open(url, '_blank', 'noopener');
        });
    });

    // ------------ Language Regenerate (Bahasa Daerah) ------------
    const langSelector = document.getElementById('lang-selector');
    const regenBtn = document.getElementById('regen-lang-btn');

    const updateRegenBtnState = () => {
        if (!regenBtn) return;
        const hasResult = !!currentAnalysis && !!currentAnalysis.politeReplies;
        const isDifferent = langSelector && langSelector.value && langSelector.value !== 'indonesia';
        regenBtn.disabled = !(hasResult && isDifferent);
    };

    if (langSelector) {
        langSelector.addEventListener('change', updateRegenBtnState);
    }

    if (regenBtn) {
        regenBtn.addEventListener('click', async () => {
            if (!currentAnalysis || !langSelector) return;
            const lang = langSelector.value;
            if (lang === 'indonesia') return;

            regenBtn.classList.add('loading');
            regenBtn.disabled = true;

            try {
                const res = await fetch('/api/translate-replies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        replies: currentAnalysis.politeReplies,
                        language: lang,
                        clientId
                    })
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Gagal mengonversi bahasa.');
                }

                const data = await res.json();
                if (data.politeReplies) {
                    sopanText.textContent = cleanEmojiText(data.politeReplies.sopan || '');
                    santaiText.textContent = cleanEmojiText(data.politeReplies.santai || '');
                    humorText.textContent = cleanEmojiText(data.politeReplies.humor || '');
                    currentAnalysis.politeReplies = data.politeReplies;
                    const langLabels = {
                        jawa: 'Jawa Krama',
                        sunda: 'Sunda Halus',
                        minang: 'Minang',
                        batak: 'Batak'
                    };
                    showToast(`Balasan dikonversi ke Bahasa ${langLabels[lang] || lang}`, 'safe');
                }
            } catch (error) {
                console.error('Translate error:', error);
                showToast(error.message || 'Konversi bahasa gagal.', 'danger');
            } finally {
                regenBtn.classList.remove('loading');
                updateRegenBtnState();
            }
        });
    }

    // ------------ PDF Report Export (lazy-load jsPDF) ------------
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    let jsPdfLoadPromise = null;

    const loadJsPdf = () => {
        if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
        if (jsPdfLoadPromise) return jsPdfLoadPromise;
        jsPdfLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.async = true;
            script.onload = () => {
                if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
                else reject(new Error('jsPDF gagal dimuat.'));
            };
            script.onerror = () => reject(new Error('Gagal memuat library PDF. Periksa koneksi.'));
            document.head.appendChild(script);
        });
        return jsPdfLoadPromise;
    };

    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            if (!currentAnalysis) {
                showToast('Lakukan pemeriksaan dulu sebelum ekspor PDF.', 'warning');
                return;
            }
            const originalLabel = downloadPdfBtn.innerHTML;
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.textContent = 'Menyiapkan PDF...';

            try {
                const jsPDF = await loadJsPdf();
                const doc = new jsPDF({ unit: 'pt', format: 'a4' });
                const pageW = doc.internal.pageSize.getWidth();
                const margin = 48;
                const contentW = pageW - margin * 2;
                let y = margin;

                const percent = currentAnalysis.hoaxPercentage || 0;
                let accent = [107, 142, 78]; // olive (safe)
                if (percent >= 30 && percent < 70) accent = [217, 119, 6]; // amber
                if (percent >= 70) accent = [184, 57, 46]; // brick

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
                doc.setFillColor(accent[0], accent[1], accent[2]);
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
                const statusText = `Indikasi AI: ${currentAnalysis.statusBadge || 'Perlu verifikasi'}`;
                doc.text(statusText, margin + 140, y + 28);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(122, 106, 90);
                doc.text(`Kategori: ${currentAnalysis.category || 'Berita'}`, margin + 140, y + 48);

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
                const sumLines = doc.splitTextToSize(cleanEmojiText(currentAnalysis.summary || '-'), contentW);
                doc.text(sumLines, margin, y);
                y += sumLines.length * 14 + 16;

                // Claims
                if (currentAnalysis.claims && currentAnalysis.claims.length) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(13);
                    doc.setTextColor(61, 40, 23);
                    doc.text('Daftar Indikasi Klaim', margin, y);
                    y += 16;
                    doc.setFontSize(10);
                    currentAnalysis.claims.forEach((c, i) => {
                        if (y > 740) { doc.addPage(); y = margin; }
                        const isFact = !!c.isFactual;
                        doc.setFillColor(isFact ? 107 : 184, isFact ? 142 : 57, isFact ? 78 : 46);
                        doc.circle(margin + 6, y - 3, 4, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(61, 40, 23);
                        const claimTitle = `[${isFact ? 'Indikasi faktual' : 'Perlu verifikasi'}] ${cleanEmojiText(c.claim || '')}`;
                        const claimLines = doc.splitTextToSize(claimTitle, contentW - 18);
                        doc.text(claimLines, margin + 18, y);
                        y += claimLines.length * 13 + 2;
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(90, 70, 52);
                        const explLines = doc.splitTextToSize(cleanEmojiText(c.explanation || ''), contentW - 18);
                        doc.text(explLines, margin + 18, y);
                        y += explLines.length * 12 + 10;
                    });
                    y += 6;
                }

                // Polite Replies
                if (currentAnalysis.politeReplies) {
                    if (y > 660) { doc.addPage(); y = margin; }
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(13);
                    doc.setTextColor(61, 40, 23);
                    doc.text('Template Balasan Sopan', margin, y);
                    y += 16;

                    const replies = [
                        { label: 'Sopan & Hormat (Orang Tua)', text: currentAnalysis.politeReplies.sopan },
                        { label: 'Santai & Akrab (Sebaya)', text: currentAnalysis.politeReplies.santai },
                        { label: 'Mencairkan Suasana', text: currentAnalysis.politeReplies.humor }
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
                        const rLines = doc.splitTextToSize(cleanEmojiText(r.text || ''), contentW);
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

                doc.save(`SaringSini_Indikasi_Awal_${Date.now()}.pdf`);
                showToast('Laporan PDF berhasil diunduh', 'safe');
            } catch (e) {
                console.error('PDF export error:', e);
                showToast(e.message || 'Gagal membuat PDF.', 'danger');
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.innerHTML = originalLabel;
            }
        });
    }

    // Re-evaluate regen button when new analysis comes in
    const observeAnalysis = new MutationObserver(() => updateRegenBtnState());
    if (resBadge) observeAnalysis.observe(resBadge, { childList: true, characterData: true, subtree: true });

    // ------------ Animated number counters for hero stats ------------
    const animateCounter = (el, target, duration) => {
        if (!el) return;
        const start = 0;
        const startTime = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.floor(start + (target - start) * eased);
            el.textContent = target >= 1000 ? value.toLocaleString('id-ID') : String(value);
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    document.querySelectorAll('[data-count-to]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count-to'), 10);
        if (!isNaN(target)) animateCounter(el, target, 1200);
    });

    // Hero stats counters (one-shot on load)
    const heroStreakEl = document.querySelector('.streak-stat .hero-stat-val');
    const heroPointsEl = document.querySelector('.points-stat .hero-stat-val');
    if (heroStreakEl) animateCounter(heroStreakEl, parseInt(heroStreakEl.textContent, 10) || 12, 900);
    if (heroPointsEl) animateCounter(heroPointsEl, parseInt(heroPointsEl.textContent.replace(/\D/g, ''), 10) || 934, 1300);

    // ------------ PWA Service Worker registration + Install prompt ------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.warn('Service Worker registration failed:', err);
            });
        });
    }

    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaAcceptBtn = document.getElementById('pwa-install-accept');
    const pwaDismissBtn = document.getElementById('pwa-install-dismiss');
    let deferredInstallPrompt = null;

    const isDismissedRecently = () => {
        try {
            const ts = parseInt(localStorage.getItem('saringsini_pwa_dismissed_at') || '0', 10);
            return ts && (Date.now() - ts) < 7 * 24 * 60 * 60 * 1000;
        } catch (_) { return false; }
    };

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (pwaBanner && !isDismissedRecently()) {
            setTimeout(() => pwaBanner.hidden = false, 4000);
        }
    });

    if (pwaAcceptBtn) {
        pwaAcceptBtn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) {
                if (pwaBanner) pwaBanner.hidden = true;
                return;
            }
            pwaBanner.hidden = true;
            deferredInstallPrompt.prompt();
            try {
                const choice = await deferredInstallPrompt.userChoice;
                if (choice.outcome === 'accepted') showToast('SaringSini berhasil dipasang', 'safe');
            } catch (_) { /* ignore */ }
            deferredInstallPrompt = null;
        });
    }

    if (pwaDismissBtn) {
        pwaDismissBtn.addEventListener('click', () => {
            if (pwaBanner) pwaBanner.hidden = true;
            try { localStorage.setItem('saringsini_pwa_dismissed_at', String(Date.now())); } catch (_) {}
        });
    }

    window.addEventListener('appinstalled', () => {
        if (pwaBanner) pwaBanner.hidden = true;
        deferredInstallPrompt = null;
    });

    // ------------ Read URL ?tab= shortcut for PWA shortcuts ------------
    try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['beranda', 'periksa', 'simulator', 'komunitas', 'edukasi'].includes(tab)) {
            switchPanel(tab);
        }
    } catch (_) { /* ignore */ }

    // ------------ Keyboard shortcuts ------------
    document.addEventListener('keydown', (e) => {
        // Escape closes any toast
        if (e.key === 'Escape' && toast && toast.classList.contains('show')) {
            toast.classList.remove('show');
        }
    });

    // =============================================================
    // v2.1 ANALYTICS DASHBOARD - Live stats + chart + AI insight
    // =============================================================

    const renderAnalytics = (reports) => {
        if (!Array.isArray(reports) || reports.length === 0) reports = [];

        // Stat: total hoax detected (non-safe)
        const totalHoax = reports.filter(r => r.badgeClass !== 'safe').length;
        const totalUpvotes = reports.reduce((s, r) => s + (r.upvotes || 0), 0);
        const avgDanger = reports.length > 0
            ? Math.round(reports.reduce((s, r) => s + (r.percentage || 0), 0) / reports.length)
            : 0;

        // Categorize
        const categoryMap = {};
        reports.forEach(r => {
            const cat = (r.category || 'Lainnya').split('/')[0].trim();
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const topCat = sortedCats[0] || ['Belum ada', 0];
        const topCatPct = reports.length > 0 ? Math.round((topCat[1] / reports.length) * 100) : 0;

        // Update stat cards
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (typeof val === 'number') {
                animateCounter(el, val, 1100);
            } else {
                el.textContent = val;
            }
        };

        setVal('stat-total-hoax', totalHoax);
        setVal('stat-families', 9842 + Math.floor(totalUpvotes * 1.7) + reports.length * 3);
        setVal('stat-top-category', topCat[0]);
        const topCatPctEl = document.getElementById('stat-top-category-pct');
        if (topCatPctEl) topCatPctEl.textContent = `${topCatPct}% dari total laporan`;
        const avgEl = document.getElementById('stat-avg-danger');
        if (avgEl) {
            animateCounter(avgEl, avgDanger, 1100);
            // Append % after animation
            setTimeout(() => { avgEl.textContent = `${avgDanger}%`; }, 1150);
        }

        // Category bar chart
        const chartEl = document.getElementById('chart-category-bars');
        if (chartEl) {
            chartEl.innerHTML = '';
            const maxVal = Math.max(...sortedCats.map(([_, v]) => v), 1);
            sortedCats.slice(0, 5).forEach(([cat, count], idx) => {
                const pct = Math.round((count / maxVal) * 100);
                const fillClass = idx === 0 ? 'fill-danger' : idx === 1 ? 'fill-warning' : idx === 2 ? '' : 'fill-success';
                const row = document.createElement('div');
                row.className = 'chart-bar-row';
                row.innerHTML = `
                    <span class="chart-bar-label">${escapeHtml(cat)}</span>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill ${fillClass}" style="width: 0%;" data-target-width="${pct}%"></div>
                    </div>
                    <span class="chart-bar-count">${count}</span>
                `;
                chartEl.appendChild(row);
            });
            // Animate bars
            setTimeout(() => {
                chartEl.querySelectorAll('.chart-bar-fill').forEach(b => {
                    b.style.width = b.getAttribute('data-target-width');
                });
            }, 150);
        }

        // AI Daily Insight (pre-computed based on data, no extra API call)
        const insightEl = document.getElementById('ai-daily-insight');
        if (insightEl) {
            insightEl.textContent = generateInsight(reports, topCat[0], topCatPct, avgDanger);
        }
    };

    const generateInsight = (reports, topCategory, topPct, avgDanger) => {
        if (reports.length === 0) {
            return 'Belum ada data laporan. Lakukan pemeriksaan pertama Anda di tab Periksa untuk membuka analitik.';
        }
        const danger = avgDanger >= 60 ? 'sangat tinggi' : avgDanger >= 40 ? 'sedang' : 'rendah';
        const trend = topPct >= 40 ? 'mendominasi' : 'paling sering muncul';
        const advisory = topCategory.toLowerCase().includes('scam') || topCategory.toLowerCase().includes('penipuan')
            ? 'Waspadai pesan WhatsApp berisi link APK atau permintaan transfer dana.'
            : topCategory.toLowerCase().includes('kesehatan')
            ? 'Cek setiap klaim kesehatan via portal Kemenkes sebelum disebarkan.'
            : topCategory.toLowerCase().includes('keluarga')
            ? 'Hoaks keluarga sering memicu kepanikan. Cross-check dengan media resmi.'
            : 'Selalu verifikasi sumber sebelum membagikan informasi.';
        return `Kategori ${topCategory} ${trend} dengan ${topPct}% dari total laporan. Tingkat bahaya rata-rata ${danger} (${avgDanger}%). ${advisory}`;
    };

    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));

    // Hook into community feed: re-render analytics whenever feed loads
    const originalLoadFeed = loadCommunityFeed;
    // (already defined above, we will just re-render after each call via observer pattern)
    // Trigger initial render once analytics tab is rendered
    setTimeout(() => renderAnalytics(communityReportsList), 800);

    // Re-render analytics every time community feed updates (after upvote / new report)
    const renderFeedAndAnalytics = () => {
        renderCommunityFeed();
        renderAnalytics(communityReportsList);
        renderHoaxMap(communityReportsList);
    };
    // Patch to also update on load
    const _origLoadFn = loadCommunityFeed;
    // We can't fully monkey-patch the const, but we can listen to render via interval
    let _lastReportsLength = 0;
    setInterval(() => {
        if (communityReportsList.length !== _lastReportsLength) {
            _lastReportsLength = communityReportsList.length;
            renderAnalytics(communityReportsList);
            renderHoaxMap(communityReportsList);
        }
    }, 1500);

    // =============================================================
    // v2.1 HOAX MAP INDONESIA - SVG region heatmap
    // =============================================================

    // Deterministic mapping from report id -> region (so render is stable)
    const REGIONS = ['Sumatera', 'Jawa', 'Kalimantan', 'Sulawesi', 'Bali-NTB-NTT', 'Maluku', 'Papua'];
    const POPULATION_WEIGHT = { 'Jawa': 5, 'Sumatera': 3, 'Sulawesi': 2, 'Kalimantan': 2, 'Bali-NTB-NTT': 2, 'Papua': 1, 'Maluku': 1 };

    const hashCode = (str) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    };

    const assignRegion = (report) => {
        // Weighted assignment based on population
        const weightedList = [];
        Object.entries(POPULATION_WEIGHT).forEach(([region, w]) => {
            for (let i = 0; i < w; i++) weightedList.push(region);
        });
        return weightedList[hashCode(report.id || report.text || '') % weightedList.length];
    };

    const renderHoaxMap = (reports) => {
        if (!Array.isArray(reports)) reports = [];
        const counts = {};
        REGIONS.forEach(r => counts[r] = 0);
        reports.forEach(r => {
            const region = assignRegion(r);
            counts[region] = (counts[region] || 0) + 1;
        });

        const regionEls = document.querySelectorAll('.map-region');
        regionEls.forEach(el => {
            const region = el.getAttribute('data-region');
            const count = counts[region] || 0;
            el.setAttribute('data-count', String(count));

            el.classList.remove('intensity-low', 'intensity-mid', 'intensity-high', 'intensity-critical');
            if (count >= 5) el.classList.add('intensity-critical');
            else if (count >= 3) el.classList.add('intensity-high');
            else if (count >= 1) el.classList.add('intensity-mid');
            else el.classList.add('intensity-low');
        });
    };

    // Map region click handler
    document.querySelectorAll('.map-region').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.map-region').forEach(r => r.classList.remove('active-region'));
            el.classList.add('active-region');
            const region = el.getAttribute('data-region');
            const count = parseInt(el.getAttribute('data-count') || '0', 10);
            const detailEl = document.getElementById('map-detail-panel');
            if (detailEl) {
                const regionLabel = detailEl.querySelector('.map-detail-region');
                const countLabel = detailEl.querySelector('.map-detail-count');
                if (regionLabel) regionLabel.textContent = region.replace(/-/g, ' / ');
                if (countLabel) {
                    countLabel.textContent = count === 0
                        ? 'Belum ada entri demo yang dialokasikan ke wilayah ini.'
                        : `${count} entri demo dialokasikan secara sintetis ke wilayah ini.`;
                }
            }
        });
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `Wilayah ${el.getAttribute('data-region').replace(/-/g, ' ')}`);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });

    // Initial map render
    setTimeout(() => renderHoaxMap(communityReportsList), 800);

    // =============================================================
    // v2.1 EDUCATIONAL QUIZ MODE - 10 real Indonesian hoax samples
    // =============================================================

    const QUIZ_QUESTIONS = [
        {
            text: 'Beredar info: Minum air es setelah makan akan membekukan minyak di lambung dan menyebabkan kanker.',
            answer: 'hoax',
            explanation: 'Hoaks klasik. Suhu lambung 37°C lebih tinggi dari air es, sehingga air es tidak membekukan apapun. Asam lambung mencerna lemak makanan secara alami.'
        },
        {
            text: 'Vaksin COVID-19 mengandung chip 5G untuk melacak penerimanya secara global.',
            answer: 'hoax',
            explanation: 'Hoaks total. Vaksin terbuat dari mRNA/protein dan tidak mengandung perangkat elektronik. Chip 5G tidak bisa dimasukkan ke jarum suntik berukuran mikrometer.'
        },
        {
            text: 'WHO merekomendasikan cuci tangan minimal 20 detik dengan sabun untuk mencegah penyebaran virus.',
            answer: 'fact',
            explanation: 'Fakta. Panduan resmi WHO menyatakan cuci tangan dengan sabun selama 20-30 detik secara efektif menghilangkan kuman dan virus dari permukaan kulit.'
        },
        {
            text: 'Kemendikbud membagikan kuota internet gratis 150GB. Klik link di bawah untuk daftar.',
            answer: 'hoax',
            explanation: 'Scam phising. Kemendikbud tidak pernah membagikan kuota via link random WhatsApp. Tautan tersebut mencuri data login dan info perbankan.'
        },
        {
            text: 'UU ITE Pasal 28 ayat 1 mengatur sanksi pidana hingga 6 tahun penjara untuk penyebar berita bohong.',
            answer: 'fact',
            explanation: 'Fakta. Pasal 28 ayat 1 UU ITE memang mengatur tindak pidana penyebaran kebohongan yang merugikan, dengan ancaman pidana hingga 6 tahun.'
        },
        {
            text: 'Daun sirsak rebusan menyembuhkan kanker stadium 4 dalam 7 hari tanpa kemoterapi.',
            answer: 'hoax',
            explanation: 'Hoaks berbahaya. Belum ada bukti ilmiah klinis bahwa daun sirsak menyembuhkan kanker. Menunda pengobatan medis bisa memperparah kondisi.'
        },
        {
            text: 'Bank Indonesia menerbitkan uang pecahan Rp 1.000.000 berwarna ungu pada tahun 2024.',
            answer: 'hoax',
            explanation: 'Hoaks. BI tidak pernah menerbitkan uang pecahan satu juta. Pecahan tertinggi resmi adalah Rp 100.000. Selalu cek bi.go.id.'
        },
        {
            text: 'Mafindo (Masyarakat Anti Fitnah Indonesia) adalah organisasi pemeriksa fakta terdaftar di Indonesia.',
            answer: 'fact',
            explanation: 'Fakta. Mafindo terdaftar resmi dan berkolaborasi dengan platform digital untuk verifikasi hoaks. Sumber rujukan: turnbackhoax.id.'
        },
        {
            text: 'Foto pejabat negara X membagi sembako di pasar Y sebenarnya hasil rekayasa Photoshop.',
            answer: 'hoax',
            explanation: 'Manipulasi gambar adalah taktik umum. Gunakan reverse image search (Google Lens) untuk verifikasi keaslian foto sebelum percaya dan menyebarkan.'
        },
        {
            text: 'Aplikasi WhatsApp menyediakan fitur "Cek Fakta" resmi untuk memeriksa pesan berantai.',
            answer: 'fact',
            explanation: 'Fakta. WhatsApp memang menyediakan fitur "Search the Web" (ikon kaca pembesar) untuk pesan yang diteruskan berkali-kali, membantu pengguna verifikasi konteks.'
        }
    ];

    let quizState = {
        questions: [],
        currentIndex: 0,
        score: 0,
        correctCount: 0,
        answered: false
    };

    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const showQuizState = (state) => {
        ['quiz-intro', 'quiz-active', 'quiz-result'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', id !== `quiz-${state}`);
        });
    };

    const renderQuizQuestion = () => {
        const q = quizState.questions[quizState.currentIndex];
        if (!q) return;
        quizState.answered = false;

        document.getElementById('quiz-current-num').textContent = String(quizState.currentIndex + 1);
        document.getElementById('quiz-total-num').textContent = String(quizState.questions.length);
        document.getElementById('quiz-current-score').textContent = String(quizState.score);
        document.getElementById('quiz-question-text').textContent = q.text;

        const fillEl = document.getElementById('quiz-progress-fill');
        if (fillEl) fillEl.style.width = `${((quizState.currentIndex) / quizState.questions.length) * 100}%`;

        // Reset answer buttons
        document.querySelectorAll('.quiz-answer-btn').forEach(b => {
            b.disabled = false;
            b.classList.remove('correct-flash', 'wrong-flash');
        });

        // Hide explanation
        const expl = document.getElementById('quiz-explanation');
        if (expl) expl.classList.add('hidden');
    };

    const handleQuizAnswer = (answer) => {
        if (quizState.answered) return;
        const q = quizState.questions[quizState.currentIndex];
        if (!q) return;
        quizState.answered = true;

        const isCorrect = q.answer === answer;
        document.querySelectorAll('.quiz-answer-btn').forEach(b => { b.disabled = true; });

        const clickedBtn = document.querySelector(`.quiz-answer-btn[data-answer="${answer}"]`);
        if (clickedBtn) clickedBtn.classList.add(isCorrect ? 'correct-flash' : 'wrong-flash');

        if (isCorrect) {
            quizState.score += 10;
            quizState.correctCount += 1;
            document.getElementById('quiz-current-score').textContent = String(quizState.score);
        }

        const explHeader = document.getElementById('quiz-explanation-header');
        const explText = document.getElementById('quiz-explanation-text');
        const expl = document.getElementById('quiz-explanation');
        if (explHeader) {
            explHeader.textContent = isCorrect ? 'Tepat!' : 'Belum tepat.';
            explHeader.className = 'quiz-explanation-header ' + (isCorrect ? 'correct' : 'wrong');
        }
        if (explText) explText.textContent = q.explanation;
        if (expl) expl.classList.remove('hidden');

        const fillEl = document.getElementById('quiz-progress-fill');
        if (fillEl) fillEl.style.width = `${((quizState.currentIndex + 1) / quizState.questions.length) * 100}%`;
    };

    const finishQuiz = () => {
        showQuizState('result');
        const total = quizState.questions.length;
        const percent = total > 0 ? Math.round((quizState.correctCount / total) * 100) : 0;

        document.getElementById('quiz-result-correct').textContent = String(quizState.correctCount);
        document.getElementById('quiz-result-score').textContent = String(quizState.score);
        document.getElementById('quiz-result-percent').textContent = `${percent}%`;

        const title = document.getElementById('quiz-result-title');
        const msg = document.getElementById('quiz-result-message');
        if (percent >= 90) {
            if (title) title.textContent = 'Master Pahlawan Fakta!';
            if (msg) msg.textContent = 'Luar biasa! Kamu siap menjadi penjaga kebenaran keluarga Indonesia.';
        } else if (percent >= 70) {
            if (title) title.textContent = 'Pejuang Fakta Andal';
            if (msg) msg.textContent = 'Sangat baik. Sedikit latihan lagi dan kamu jadi master.';
        } else if (percent >= 50) {
            if (title) title.textContent = 'Sedang Berlatih';
            if (msg) msg.textContent = 'Kamu di jalur yang benar. Pelajari trik di tab Edukasi.';
        } else {
            if (title) title.textContent = 'Tetap Semangat!';
            if (msg) msg.textContent = 'Hoaks memang licik. Pakai SaringSini sebagai senjatamu.';
        }
    };

    const startQuiz = () => {
        quizState = {
            questions: shuffleArray(QUIZ_QUESTIONS),
            currentIndex: 0,
            score: 0,
            correctCount: 0,
            answered: false
        };
        showQuizState('active');
        renderQuizQuestion();
    };

    const quizStartBtn = document.getElementById('quiz-start-btn');
    if (quizStartBtn) quizStartBtn.addEventListener('click', startQuiz);

    document.querySelectorAll('.quiz-answer-btn').forEach(btn => {
        btn.addEventListener('click', () => handleQuizAnswer(btn.getAttribute('data-answer')));
    });

    const quizNextBtn = document.getElementById('quiz-next-btn');
    if (quizNextBtn) {
        quizNextBtn.addEventListener('click', () => {
            quizState.currentIndex += 1;
            if (quizState.currentIndex >= quizState.questions.length) {
                finishQuiz();
            } else {
                renderQuizQuestion();
            }
        });
    }

    const quizRetryBtn = document.getElementById('quiz-retry-btn');
    if (quizRetryBtn) quizRetryBtn.addEventListener('click', startQuiz);

    const quizShareBtn = document.getElementById('quiz-share-btn');
    if (quizShareBtn) {
        quizShareBtn.addEventListener('click', () => {
            const total = quizState.questions.length;
            const percent = total > 0 ? Math.round((quizState.correctCount / total) * 100) : 0;
            const shareText = `Saya berhasil deteksi ${quizState.correctCount}/${total} hoaks (skor ${quizState.score} - ${percent}%) di tantangan SaringSini. Ayo uji kemampuanmu juga!`;
            const url = 'https://wa.me/?text=' + encodeURIComponent(shareText);
            window.open(url, '_blank', 'noopener');
        });
    }

    // =============================================================
    // v2.1 FAMILY ONBOARDING TOUR - first-time interactive guide
    // =============================================================

    const ONBOARDING_STEPS = [
        {
            title: 'Selamat Datang di SaringSini',
            description: 'Alat bantu literasi digital keluarga Indonesia yang memberikan indikasi awal berbantuan AI dan latihan komunikasi.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M2 13h20"/><path d="M2 17h20"/><path d="M6 21h12"/></svg>'
        },
        {
            title: 'Periksa Pesan Mencurigakan',
            description: 'Tempel teks, unggah media, dikte suara, atau masukkan link untuk memperoleh indikasi awal dari Gemini. Hasil dapat salah dan perlu diverifikasi.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
        },
        {
            title: 'Balasan Sopan Otomatis',
            description: 'Dapatkan 3 template balasan (Sopan/Santai/Humor) plus konversi ke Bahasa Jawa, Sunda, Minang, atau Batak. Kirim langsung via WhatsApp.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        },
        {
            title: 'Jelajahi Fitur Demonstrasi',
            description: 'Coba feed komunitas, kuis, leaderboard, dan peta dengan data simulasi. Angka yang ditampilkan bukan metrik penggunaan atau dampak nyata.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'
        }
    ];

    let onboardingStep = 0;
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    const onboardingTitle = document.getElementById('onboarding-title');
    const onboardingDesc = document.getElementById('onboarding-description');
    const onboardingIllu = document.getElementById('onboarding-illustration');
    const onboardingDots = document.getElementById('onboarding-dots');
    const onboardingNextBtn = document.getElementById('onboarding-next');
    const onboardingSkipBtn = document.getElementById('onboarding-skip');

    const renderOnboardingStep = () => {
        const step = ONBOARDING_STEPS[onboardingStep];
        if (!step) return;
        if (onboardingTitle) onboardingTitle.textContent = step.title;
        if (onboardingDesc) onboardingDesc.textContent = step.description;
        if (onboardingIllu) onboardingIllu.innerHTML = step.icon;
        if (onboardingDots) {
            onboardingDots.querySelectorAll('.onboarding-dot').forEach((d, i) => {
                d.classList.toggle('active', i === onboardingStep);
            });
        }
        if (onboardingNextBtn) {
            onboardingNextBtn.textContent = onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Mulai' : 'Lanjut';
        }
    };

    const closeOnboarding = () => {
        if (onboardingOverlay) onboardingOverlay.hidden = true;
        try { localStorage.setItem('saringsini_onboarded', '1'); } catch (_) {}
    };

    if (onboardingOverlay) {
        const hasOnboarded = (() => {
            try { return localStorage.getItem('saringsini_onboarded') === '1'; } catch (_) { return false; }
        })();

        if (!hasOnboarded) {
            setTimeout(() => {
                onboardingOverlay.hidden = false;
                renderOnboardingStep();
            }, 800);
        }
    }

    if (onboardingNextBtn) {
        onboardingNextBtn.addEventListener('click', () => {
            if (onboardingStep < ONBOARDING_STEPS.length - 1) {
                onboardingStep += 1;
                renderOnboardingStep();
            } else {
                closeOnboarding();
                showToast('Selamat memeriksa hoaks. Tetap waspada keluarga Indonesia.', 'safe');
            }
        });
    }

    if (onboardingSkipBtn) {
        onboardingSkipBtn.addEventListener('click', closeOnboarding);
    }

    // Allow Escape to close onboarding
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && onboardingOverlay && !onboardingOverlay.hidden) {
            closeOnboarding();
        }
    });

    // =============================================================
    // v2.2 CONFETTI CELEBRATION - canvas-based, lightweight
    // =============================================================
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

    const resizeConfettiCanvas = () => {
        if (!confettiCanvas) return;
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    };
    if (confettiCanvas) {
        resizeConfettiCanvas();
        window.addEventListener('resize', resizeConfettiCanvas);
    }

    const CONFETTI_COLORS = ['#C84B31', '#5C8374', '#E8A87C', '#6B8E4E', '#D97706', '#B8392E', '#D17A4A'];

    const fireConfetti = (durationMs = 2200) => {
        if (!confettiCtx || !confettiCanvas) return;
        // Skip if user prefers reduced motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const particles = [];
        const burstCount = 110;
        for (let i = 0; i < burstCount; i++) {
            particles.push({
                x: confettiCanvas.width * 0.5,
                y: confettiCanvas.height * 0.5,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 1.2) * 18,
                size: Math.random() * 7 + 3,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                gravity: 0.45 + Math.random() * 0.15,
                alpha: 1,
                shape: Math.random() < 0.5 ? 'rect' : 'circle'
            });
        }

        const start = performance.now();
        const animate = (now) => {
            const elapsed = now - start;
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

            let alive = 0;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.rotation += p.rotationSpeed;
                if (elapsed > durationMs * 0.55) {
                    p.alpha = Math.max(0, p.alpha - 0.02);
                }
                if (p.alpha <= 0 || p.y > confettiCanvas.height + 30) return;
                alive += 1;

                confettiCtx.save();
                confettiCtx.globalAlpha = p.alpha;
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.rotation);
                confettiCtx.fillStyle = p.color;
                if (p.shape === 'rect') {
                    confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    confettiCtx.beginPath();
                    confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    confettiCtx.fill();
                }
                confettiCtx.restore();
            });

            if (alive > 0 && elapsed < durationMs + 1000) {
                requestAnimationFrame(animate);
            } else {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            }
        };
        requestAnimationFrame(animate);
    };

    // Expose for other modules
    window.__saringSiniConfetti = fireConfetti;

    // Hook into quiz finish (perfect or >= 80%) — patch finishQuiz logic
    const originalFinishQuiz = finishQuiz;
    // We added confetti directly inside finishQuiz earlier? No, let's wrap via event
    // Easier: poll for result visibility and trigger once
    let confettiFiredForQuiz = false;
    setInterval(() => {
        const quizResult = document.getElementById('quiz-result');
        const isResultVisible = quizResult && !quizResult.classList.contains('hidden');
        const correctEl = document.getElementById('quiz-result-correct');
        const correct = correctEl ? parseInt(correctEl.textContent, 10) || 0 : 0;
        if (isResultVisible && correct >= 8 && !confettiFiredForQuiz) {
            confettiFiredForQuiz = true;
            fireConfetti(2400);
        }
        if (!isResultVisible) confettiFiredForQuiz = false;
    }, 600);

    // Also fire confetti on successful upvote (small celebration)
    const _origHandleUpvote = handleCommunityUpvote;
    // Wrap by intercepting clicks
    document.addEventListener('click', (e) => {
        const upBtn = e.target.closest('.community-upvote-btn');
        if (upBtn && !upBtn.disabled) {
            // Delayed small confetti after server responds
            setTimeout(() => {
                if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                // Tiny burst only — reuse fire with shorter duration
                fireConfetti(1200);
            }, 350);
        }
    });

    // =============================================================
    // v2.2 DEMONSTRATION ACTIVITY INDICATOR
    // Simulates activity for UI demonstration; not real usage data.
    // Uses smooth random walk so number feels organic, not robotic
    // =============================================================
    const liveCountEl = document.getElementById('live-activity-count');
    if (liveCountEl) {
        let liveCurrent = 12 + Math.floor(Math.random() * 18); // start 12-30
        const liveMin = 8;
        const liveMax = 47;

        const setLiveCount = (val) => {
            liveCurrent = Math.max(liveMin, Math.min(liveMax, val));
            // Smooth animate
            const start = parseInt(liveCountEl.textContent, 10) || 0;
            const startTime = performance.now();
            const duration = 700;
            const step = (now) => {
                const t = Math.min(1, (now - startTime) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                const cur = Math.floor(start + (liveCurrent - start) * eased);
                liveCountEl.textContent = String(cur);
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        // Initial reveal
        setTimeout(() => setLiveCount(liveCurrent), 600);

        // Random walk every 4-9 seconds
        const tickLive = () => {
            const drift = Math.random() < 0.55 ? 1 : -1;
            const magnitude = Math.floor(Math.random() * 3) + 1;
            setLiveCount(liveCurrent + drift * magnitude);
            setTimeout(tickLive, 4000 + Math.random() * 5000);
        };
        setTimeout(tickLive, 6000);

        // Bump up briefly when user does action
        const bumpLive = () => setLiveCount(liveCurrent + Math.floor(Math.random() * 2) + 1);
        document.addEventListener('click', (e) => {
            if (e.target.closest('#analyze-btn') || e.target.closest('.quiz-answer-btn')) {
                bumpLive();
            }
        });
    }

    // Branded console signature
    const sigCss = 'background:linear-gradient(135deg,#C84B31,#5C8374);color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:bold';
    console.log('%c SaringSini v2.3 ', sigCss, ' Asisten Anti-Hoaks Keluarga Indonesia');
});
