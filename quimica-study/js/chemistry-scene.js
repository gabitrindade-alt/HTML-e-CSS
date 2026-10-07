(function () {
    const canvas = document.getElementById('chemistry-scene');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const toggle = document.getElementById('scene-toggle');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let paused = reducedMotion;
    let animationId;

    const dust = Array.from({ length: 44 }, (_, i) => ({
        x: (i * 73 % 101) / 101,
        y: (i * 47 % 97) / 97,
        size: 1 + (i % 3) * 0.6,
        phase: i * 1.7
    }));

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw();
    }

    function atom(x, y, radius, color, label, sublabel) {
        const glow = ctx.createRadialGradient(x, y, radius * .15, x, y, radius * 2.5);
        glow.addColorStop(0, color + '50');
        glow.addColorStop(1, color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        const fill = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
        fill.addColorStop(0, '#fff8ff');
        fill.addColorStop(.45, color);
        fill.addColorStop(1, '#5c3780');
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.72)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${Math.max(10, radius * .8)}px system-ui`;
        ctx.fillText(label, x, y - (sublabel ? 3 : 0));
        if (sublabel) {
            ctx.fillStyle = 'rgba(255,255,255,.78)';
            ctx.font = `600 ${Math.max(7, radius * .38)}px system-ui`;
            ctx.fillText(sublabel, x, y + radius * .34);
        }
    }

    function bond(x1, y1, x2, y2, phase) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239,167,217,.72)';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 13;
        ctx.shadowColor = 'rgba(232,104,183,.55)';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const t = (phase % 1);
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        ctx.fillStyle = '#ffe8f7';
        ctx.beginPath();
        ctx.arc(px, py, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function draw() {
        if (!width || !height) return;
        const t = frame / 90;
        ctx.clearRect(0, 0, width, height);

        dust.forEach(p => {
            const alpha = .16 + (Math.sin(t + p.phase) + 1) * .13;
            ctx.fillStyle = `rgba(250,220,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        const scale = Math.min(width / 590, height / 360);
        ctx.save();
        ctx.translate((width - 590 * scale) / 2, (height - 360 * scale) / 2);
        ctx.scale(scale, scale);

        const water = { x: 286 + Math.sin(t * .65) * 8, y: 157 + Math.cos(t * .8) * 7 };
        const h1 = { x: water.x - 65, y: water.y - 48 + Math.sin(t * 1.1) * 6 };
        const h2 = { x: water.x + 68, y: water.y - 38 + Math.cos(t * 1.0) * 7 };
        bond(water.x, water.y, h1.x, h1.y, (t * .36) % 1);
        bond(water.x, water.y, h2.x, h2.y, (t * .36 + .4) % 1);
        atom(water.x, water.y, 31, '#dd5ba7', 'O', '8');
        atom(h1.x, h1.y, 19, '#8d68db', 'H', '1');
        atom(h2.x, h2.y, 19, '#8d68db', 'H', '1');

        const carbon = { x: 460 + Math.sin(t * .55) * 7, y: 260 + Math.cos(t * .7) * 8 };
        const satellites = [
            { x: carbon.x - 48, y: carbon.y - 22 }, { x: carbon.x + 48, y: carbon.y - 22 },
            { x: carbon.x - 4, y: carbon.y - 58 }, { x: carbon.x + 3, y: carbon.y + 57 }
        ];
        satellites.forEach((point, i) => bond(carbon.x, carbon.y, point.x, point.y, (t * .28 + i * .22) % 1));
        atom(carbon.x, carbon.y, 24, '#e28b83', 'C', '6');
        satellites.forEach(point => atom(point.x, point.y, 14, '#8d68db', 'H', '1'));

        ctx.restore();
    }

    function animate() {
        if (paused) return;
        frame++;
        draw();
        animationId = window.requestAnimationFrame(animate);
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            paused = !paused;
            toggle.textContent = paused ? '▶' : 'Ⅱ';
            toggle.setAttribute('aria-label', paused ? 'Reproduzir animação' : 'Pausar animação');
            if (!paused) animate();
            else window.cancelAnimationFrame(animationId);
        });
        if (reducedMotion) {
            toggle.textContent = '▶';
            toggle.setAttribute('aria-label', 'Reproduzir animação');
        }
    }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();
    if (!paused) animate();
})();
