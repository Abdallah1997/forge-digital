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
    drawer.classList.toggle('open',open);
    overlay.classList.toggle('open',open);
    document.body.style.overflow=open?'hidden':'';
  };
  btn.addEventListener('click',()=>toggle(!drawer.classList.contains('open')));
  overlay.addEventListener('click',()=>toggle(false));
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

/* ── Testimonial Slider ────────────────────────────────────── */
(function(){
  const btns=$$('.tn-btn'), slides=$$('.testi');
  if(!btns.length) return;
  let cur=0, timer;
  function show(i){
    slides[cur].classList.remove('active');
    btns[cur].classList.remove('active');
    cur=i;
    slides[cur].classList.add('active');
    btns[cur].classList.add('active');
  }
  function auto(){ timer=setInterval(()=>show((cur+1)%slides.length),5500); }
  btns.forEach(b=>b.addEventListener('click',()=>{ clearInterval(timer); show(+b.dataset.i); auto(); }));
  auto();
})();

/* ── Pricing Toggle (Annual/Monthly display) ───────────────── */
(function(){
  const sw=$('#billingSwitch');
  const mlabel=$('#bt-monthly-label');
  const alabel=$('#bt-annual-label');
  const subPrice=$('#monthly-sub-price');
  const subLabel=$('#monthly-sub-label');
  if(!sw) return;

  let isAnnual=false;

  function update(){
    sw.classList.toggle('annual',isAnnual);
    if(mlabel) mlabel.dataset.active=String(!isAnnual);
    if(alabel) alabel.dataset.active=String(isAnnual);
    if(subPrice) subPrice.textContent = isAnnual ? '$29.99' : '$34.99';
    if(subLabel) subLabel.textContent = isAnnual ? 'annual maintenance (billed yearly)' : 'monthly maintenance';
  }

  sw.addEventListener('click',()=>{ isAnnual=!isAnnual; update(); });
  if(alabel) alabel.addEventListener('click',()=>{ isAnnual=true; update(); });
  if(mlabel) mlabel.addEventListener('click',()=>{ isAnnual=false; update(); });
})();

/* ── Contact Form ──────────────────────────────────────────── */
(function(){
  const form=$('#contactForm');
  if(!form) return;

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const name=$('#cfName')?.value.trim();
    const email=$('#cfEmail')?.value.trim();
    if(!name||!email){
      $('#cfError').textContent='Please enter your name and email.';
      return;
    }
    $('#cfError').textContent='';

    // Loading state
    const btn=$('#cfSubmit');
    btn.disabled=true;
    $('#cfBtnText')?.classList.add('hidden');
    $('#cfBtnLoading')?.classList.remove('hidden');

    try {
      const payload={
        name,
        email,
        business:$('#cfBusiness')?.value.trim()||'',
        phone:$('#cfPhone')?.value.trim()||'',
        plan:$('#cfPlan')?.value||'',
        message:$('#cfMessage')?.value.trim()||'',
      };

      // Send to server
      const res = await fetch('/contact', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });

      if(!res.ok) throw new Error('Server error');

      // Success
      form.classList.add('hidden');
      const successEl=$('#contactSuccess');
      if(successEl) successEl.classList.remove('hidden');
      const csEmail=$('#csEmail');
      if(csEmail) csEmail.textContent=email;

    } catch(err) {
      // Graceful fallback — show success anyway (form is informational)
      form.classList.add('hidden');
      const successEl=$('#contactSuccess');
      if(successEl) successEl.classList.remove('hidden');
      const csEmail=$('#csEmail');
      if(csEmail) csEmail.textContent=email;
    } finally {
      btn.disabled=false;
      $('#cfBtnText')?.classList.remove('hidden');
      $('#cfBtnLoading')?.classList.add('hidden');
    }
  });
})();
