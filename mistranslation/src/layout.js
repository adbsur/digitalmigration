(function () {
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      document.documentElement.classList.add('no-svg-filter');
    }

    const IMG_W = 1632, IMG_H = 1076;
  
    // Region that must always be fully visible
    const BORDER = { x1: 95, y1: 280, x2: 830, y2: 860 };
    // Active screen area the window sits over
    const SCREEN = { x1: 230, y1: 400, x2: 690, y2: 720 };
  
    function update() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
  
      const bw = BORDER.x2 - BORDER.x1; // 720
      const bh = BORDER.y2 - BORDER.y1; // 560
  
      // Scale so border area fits entirely (contain for that sub-region)
      const scale = Math.min(vw / bw, vh / bh);
  
      const rendW = IMG_W * scale;
      const rendH = IMG_H * scale;
  
      // Offset so border area is centred in the viewport
      const bgX = -BORDER.x1 * scale;
      const bgY = (vh - bh * scale) / 2 - BORDER.y1 * scale;
  
      // Window bounds in viewport space
      const winL = SCREEN.x1 * scale + bgX;
      const winT = SCREEN.y1 * scale + bgY;
      const winW = (SCREEN.x2 - SCREEN.x1) * scale;
      const winH = (SCREEN.y2 - SCREEN.y1) * scale;
  
      const r = document.documentElement;
      r.style.setProperty('--bg-size', `${rendW}px ${rendH}px`);
      r.style.setProperty('--bg-pos',  `${bgX}px ${bgY}px`);
      r.style.setProperty('--win-left',   `${winL}px`);
      r.style.setProperty('--win-top',    `${winT}px`);
      r.style.setProperty('--win-width',  `${winW}px`);
      r.style.setProperty('--win-height', `${winH}px`);
    }
  
    window.addEventListener('resize', update);
    update();
  })();