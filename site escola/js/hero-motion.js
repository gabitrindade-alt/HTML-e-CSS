(() => {
    const canvas = document.getElementById('heroMotionCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let previousTime = 0;
    const clouds = [
        { x: 0.08, y: 0.23, scale: 1.0, speed: 0.004 },
        { x: 0.52, y: 0.14, scale: 0.7, speed: 0.006 },
        { x: 0.82, y: 0.30, scale: 0.85, speed: 0.003 }
    ];
    const motes = Array.from({ length: 28 }, (_, i) => ({
        x: ((i * 73) % 997) / 997,
        y: 0.38 + ((i * 47) % 550) / 1000,
        phase: i * 1.7,
        size: 1 + (i % 3) * 0.55
    }));

    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        draw(0);
    }

    function drawCloud(x, y, size) {
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.54, size * 0.13, 0, 0, Math.PI * 2);
        ctx.ellipse(x - size * 0.22, y - size * 0.055, size * 0.25, size * 0.16, 0, 0, Math.PI * 2);
        ctx.ellipse(x + size * 0.07, y - size * 0.10, size * 0.32, size * 0.23, 0, 0, Math.PI * 2);
        ctx.ellipse(x + size * 0.31, y - size * 0.035, size * 0.22, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBuilding() {
        const cx = width * 0.5;
        const base = height * 0.91;
        const scale = Math.min(width / 880, height / 470, 1.16);
        const buildingWidth = 680 * scale;
        const buildingHeight = 185 * scale;
        const left = cx - buildingWidth / 2;
        const top = base - buildingHeight;
        const wingWidth = buildingWidth * 0.31;

        ctx.fillStyle = 'rgba(19,39,54,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, base + 10 * scale, buildingWidth * 0.77, 22 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e9e4d7';
        ctx.fillRect(left, top + 36 * scale, buildingWidth, buildingHeight - 36 * scale);
        ctx.fillStyle = '#f7f2e7';
        ctx.fillRect(cx - wingWidth * 0.36, top + 4 * scale, wingWidth * 0.72, buildingHeight - 4 * scale);

        ctx.fillStyle = '#172f49';
        ctx.beginPath();
        ctx.moveTo(left - 18 * scale, top + 39 * scale);
        ctx.lineTo(left + wingWidth * 0.5, top);
        ctx.lineTo(left + wingWidth + 12 * scale, top + 39 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - wingWidth * 0.45, top + 10 * scale);
        ctx.lineTo(cx, top - 35 * scale);
        ctx.lineTo(cx + wingWidth * 0.45, top + 10 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(left + buildingWidth - wingWidth - 12 * scale, top + 39 * scale);
        ctx.lineTo(left + buildingWidth - wingWidth * 0.5, top);
        ctx.lineTo(left + buildingWidth + 18 * scale, top + 39 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#d7c7a5';
        ctx.fillRect(left, base - 7 * scale, buildingWidth, 9 * scale);
        const rows = [top + 63 * scale, top + 111 * scale];
        rows.forEach((row, rowIndex) => {
            for (let col = 0; col < 9; col++) {
                const x = left + 29 * scale + col * ((buildingWidth - 58 * scale) / 8);
                if (col > 3 && col < 5) continue;
                ctx.fillStyle = (col + rowIndex) % 4 === 0 ? '#f2c878' : '#8fa5ab';
                ctx.fillRect(x, row, 23 * scale, 27 * scale);
                ctx.fillStyle = 'rgba(255,255,255,0.48)';
                ctx.fillRect(x + 2 * scale, row + 2 * scale, 2 * scale, 23 * scale);
            }
        });
        ctx.fillStyle = '#b38c58';
        ctx.fillRect(cx - 20 * scale, base - 49 * scale, 40 * scale, 43 * scale);
        ctx.fillStyle = '#263c50';
        ctx.fillRect(cx - 13 * scale, base - 42 * scale, 26 * scale, 36 * scale);

        ctx.fillStyle = '#183c40';
        for (let i = 0; i < 7; i++) {
            const x = width * (0.07 + i * 0.14);
            const treeHeight = (58 + (i % 3) * 14) * scale;
            ctx.fillRect(x - 3 * scale, base - treeHeight * 0.42, 6 * scale, treeHeight * 0.55);
            ctx.beginPath();
            ctx.arc(x, base - treeHeight * 0.62, treeHeight * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function draw(time) {
        if (!width || !height) return;
        const seconds = time / 1000;
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#102b49');
        sky.addColorStop(0.48, '#4e7182');
        sky.addColorStop(1, '#d3a979');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        const sunX = width * 0.78;
        const sunY = height * 0.31;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, height * 0.44);
        sunGlow.addColorStop(0, 'rgba(255,218,154,0.48)');
        sunGlow.addColorStop(1, 'rgba(255,218,154,0)');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255,230,184,0.82)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, Math.max(22, height * 0.047), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(229,240,241,0.28)';
        clouds.forEach(cloud => {
            const x = ((cloud.x + seconds * cloud.speed) % 1.35 - 0.15) * width;
            drawCloud(x, cloud.y * height, width * 0.12 * cloud.scale);
        });

        ctx.fillStyle = 'rgba(30,68,74,0.48)';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.78);
        ctx.quadraticCurveTo(width * 0.24, height * 0.61, width * 0.48, height * 0.78);
        ctx.quadraticCurveTo(width * 0.76, height * 0.63, width, height * 0.76);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        drawBuilding();
        motes.forEach(mote => {
            const alpha = 0.17 + (Math.sin(seconds * 0.8 + mote.phase) + 1) * 0.19;
            const x = ((mote.x + seconds * (0.004 + mote.size * 0.0007)) % 1) * width;
            const y = (mote.y + Math.sin(seconds * 0.42 + mote.phase) * 0.012) * height;
            ctx.fillStyle = `rgba(255,218,146,${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, mote.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function animate(time) {
        if (document.hidden) return;
        if (time - previousTime > 32) {
            draw(time);
            previousTime = time;
        }
        requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !reduceMotion) requestAnimationFrame(animate);
    });
    resize();
    if (!reduceMotion) requestAnimationFrame(animate);

    const institutionVideo = document.getElementById('institutionVideo');
    const videoToggle = document.getElementById('institutionVideoToggle');
    if (institutionVideo && canvas.captureStream) {
        institutionVideo.srcObject = canvas.captureStream(24);
        institutionVideo.play().catch(() => {});
        videoToggle?.addEventListener('click', () => {
            if (institutionVideo.paused) {
                institutionVideo.play().catch(() => {});
                videoToggle.innerHTML = '<i class="fas fa-pause"></i>';
                videoToggle.setAttribute('aria-label', 'Pausar vídeo institucional');
                videoToggle.title = 'Pausar vídeo';
            } else {
                institutionVideo.pause();
                videoToggle.innerHTML = '<i class="fas fa-play"></i>';
                videoToggle.setAttribute('aria-label', 'Reproduzir vídeo institucional');
                videoToggle.title = 'Reproduzir vídeo';
            }
        });
    }
})();
