/* ============================================================
   FORGE DIGITAL — Main JS
   ============================================================ */

const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

/* ── Custom Cursor ─────────────────────────────────────────── */
(function(){
  const dot = $('#cursorDot');
  if (!dot || window.matchMedia('(hover:none)').matches) return;
  document.addEventListener('mousemove', e=>{
    dot.style.cssText=`left:${e.clientX}px;top:${e.clientY}px`;
  });
})();

/* ── Nav Scroll ────────────────────────────────────────────── */
(function(){
  const nav=$('#nav');
  const fn=()=>nav.classList.toggle('scrolled',scrollY>50);
  addEventListener('scroll',fn,{passive:true}); fn();
})();

/* ── Mobile Drawer ─────────────────────────────────────────── */
(function(){
  const btn=$('#hamburger'),drawer=$('#drawer'),overlay=$('#drawerOverlay');
  if(!btn) return;
  const toggle=open=>{
    btn.classList.toggle('open',open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.classList.toggle('open',open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    overlay.classList.toggle('open',open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow=open?'hidden':'';
    if(open) { const first=drawer.querySelector('a'); if(first) first.focus(); }
  };
  btn.addEventListener('click',()=>toggle(!drawer.classList.contains('open')));
  overlay.addEventListener('click',()=>toggle(false));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && drawer.classList.contains('open')) toggle(false); });
  $$('.drawer-link,.drawer-cta').forEach(l=>l.addEventListener('click',()=>toggle(false)));
})();

/* ── Hero Word Reveal ──────────────────────────────────────── */
(function(){
  $$('.hw').forEach(w=>{
    const line=w.closest('.h-line');
    const baseDelay=parseInt(line?.style.getPropertyValue('--d')||'0');
    const idx=[...line.querySelectorAll('.hw')].indexOf(w);
    setTimeout(()=>w.classList.add('vis'), baseDelay + idx*90);
  });
})();

/* ── Scroll Reveal ─────────────────────────────────────────── */
(function(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target, d=parseInt(el.dataset.delay||0);
      setTimeout(()=>el.classList.add('in-view'),d);
      obs.unobserve(el);
    });
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  $$('[data-reveal]').forEach(el=>obs.observe(el));
})();

/* ── Counter Animation ─────────────────────────────────────── */
(function(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el=e.target, target=+el.dataset.target, dur=1800, t0=performance.now();
      (function tick(now){
        const p=Math.min((now-t0)/dur,1), ease=1-Math.pow(1-p,3);
        el.textContent=Math.round(ease*target);
        if(p<1) requestAnimationFrame(tick);
      })(t0);
    });
  },{threshold:.5});
  $$('.counter').forEach(c=>obs.observe(c));
})();

/* ── Portfolio 3D Tilt Cards ───────────────────────────────── */
(function(){
  $$('[data-tilt]').forEach(card=>{
    const shine=card.querySelector('.port-shine');
    card.addEventListener('mousemove', e=>{
      const r=card.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width;
      const py=(e.clientY-r.top)/r.height;
      const rotX=(py-.5)*-14;
      const rotY=(px-.5)*16;
      card.style.transform=`perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
      if(shine){
        shine.style.setProperty('--px',`${px*100}%`);
        shine.style.setProperty('--py',`${py*100}%`);
      }
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform='perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      card.style.transition='transform .7s var(--ease-out)';
      setTimeout(()=>card.style.transition='',700);
    });
  });
})();

/* ── Stripe Checkout ───────────────────────────────────────── */
(function(){
  const btns = $$('.checkout-btn');
  const errEl = $('#checkoutError');
  if(!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.plan;

      // Loading state
      btn.disabled = true;
      const txtEl  = btn.querySelector('.btn-text');
      const loadEl = btn.querySelector('.btn-loading');
      if(txtEl)  txtEl.classList.add('hidden');
      if(loadEl) loadEl.classList.remove('hidden');
      if(errEl)  errEl.classList.add('hidden');

      try {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();

        if(!res.ok || !data.url) {
          throw new Error(data.error || 'Could not start checkout. Please try again.');
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;

      } catch(err) {
        if(errEl) {
          errEl.textContent = err.message || 'Something went wrong. Please refresh and try again.';
          errEl.classList.remove('hidden');
        }
        btn.disabled = false;
        if(txtEl)  txtEl.classList.remove('hidden');
        if(loadEl) loadEl.classList.add('hidden');
      }
    });
  });
})();
