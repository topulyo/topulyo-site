// ページを開いたときにふわっと表示、移動するときにふわっと消す
document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('ready'));
  document.querySelectorAll('a[href$=".html"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { location.href = a.href; }, 500);
    });
  });
});
// 「戻る」で戻ったときに真っ黒のままにならないように
window.addEventListener('pageshow', () => {
  document.body.classList.remove('leaving');
  document.body.classList.add('ready');
});


// works：仕事の名前を押すと開く（ほかに開いているものは閉じる）
document.querySelectorAll('.work-head').forEach(btn => {
  btn.addEventListener('click', () => {
    const work = btn.closest('.work');
    const willOpen = !work.classList.contains('open');
    const startTop = work.getBoundingClientRect().top + scrollY; // 閉じる前の位置
    // 上で開いていたものが閉じると、その分だけ位置が上にずれる
    let shift = 0;
    document.querySelectorAll('.work.open').forEach(w => {
      if (w.compareDocumentPosition(work) & Node.DOCUMENT_POSITION_FOLLOWING) shift += w.querySelector('.work-body').offsetHeight;
      w.classList.remove('open');
      w.querySelector('.work-head').setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
      work.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      // 開いた仕事の名前が、メニューのすぐ下に来るように自動でスクロール
      const menu = document.querySelector('header.menu');
      const top = startTop - shift - (menu ? menu.offsetHeight : 0) - 12;
      // 開く動き（0.5秒）でページが伸びるのに合わせて、自前でなめらかに動かす
      const from = scrollY, to = Math.max(0, top), t0 = performance.now(), dur = 700;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        scrollTo(0, from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  });
});

// スマホ：右上の三本線でメニューを開け閉めする
document.querySelectorAll('header.menu').forEach(header => {
  const btn = document.createElement('button');
  btn.className = 'menu-btn';
  btn.setAttribute('aria-label', 'menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(btn);
  btn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
});

// スクロールで文章を出すアニメーション（about / quiet scenes / teaching）
// 1 = ふわっと浮かび上がる、3 = 行ごとに下からせり上がる
(() => {
  const mode = new URLSearchParams(location.search).get('anim') || document.body.dataset.anim;
  if (!mode || !document.body.classList.contains('reveal-page')) return;
  const texts = [...document.querySelectorAll('main .lead, main .tagline, main .topic, main .text > p, main .rate-head, main .rate-sub, main .rate-note, main .buy, main .sky-text > p, main .band-site')];
  const others = [...document.querySelectorAll('main h2, main img, main .rates li')].filter(el => !el.closest('.sky-photo')); // live footage の大きい写真は最初から出す
  document.body.classList.add('anim-' + mode);

  // 3：単語ごとに「窓」をつけて、行ごとに時間差で下から出す
  const splitWords = el => {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const m = document.createElement('span'); m.className = 'm';
          const w = document.createElement('span'); w.className = 'w'; w.textContent = t;
          m.append(w); frag.append(m);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') splitWords(n);
    });
  };
  const setLineDelays = el => {
    let top = null, line = -1;
    el.querySelectorAll('.w').forEach(w => {
      const t = w.parentNode.offsetTop;
      if (t !== top) { top = t; line++; }
      w.style.transitionDelay = (line * 0.09) + 's';
    });
  };

  const targets = mode === '3' ? texts : texts.concat(others);
  if (mode === '3') { texts.forEach(splitWords); others.forEach(el => el.classList.add('rv')); }
  targets.forEach(el => el.classList.add('rv'));
  const all = mode === '3' ? texts.concat(others) : targets;

  // 画面の下から 8% のところまで来たものを順に出す
  let pending = all.slice();
  const check = () => {
    const line = innerHeight * 0.92;
    let i = 0;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top > line) return true;
      if (mode === '3' && el.querySelector('.w')) setLineDelays(el);
      else el.style.transitionDelay = (i++ * 0.12) + 's';
      el.classList.add('in');
      return false;
    });
    if (!pending.length) { removeEventListener('scroll', check); removeEventListener('resize', check); }
  };
  // data-anim-delay="1" のページは、開いてから1秒たってから文章を出す
  setTimeout(() => {
    addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    check();
  }, (parseFloat(document.body.dataset.animDelay) || 0) * 1000);
})();
