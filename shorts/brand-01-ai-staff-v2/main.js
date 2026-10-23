// AIWORKS LAB 브랜드 쇼츠 #1 — 전체 타임라인
// 모든 움직임은 GSAP 마스터 타임라인 하나에 들어 있고, window.__seek(t) 로 임의의 시각을 정확히 그릴 수 있습니다.
// 효과음 큐(window.__sfx)도 여기서 같이 기록되므로 화면과 소리가 어긋나지 않습니다.
(async () => {
  const [script, narr] = await Promise.all([
    fetch('script.json').then(r => r.json()),
    fetch('audio/narration_cues.json').then(r => r.json()).catch(() => null),
  ]);
  // 폰트 폭이 확정된 뒤에 타임라인을 만들어야 모든 프레임에서 위치가 같습니다.
  await Promise.all([
    ...['400', '500', '600', '700', '800', '900'].map(w => document.fonts.load(`${w} 40px Pretendard`, '한글 AI 09:00 출근')),
    ...['600', '700', '900'].map(w => document.fonts.load(`${w} 40px "Noto Serif KR"`, '한글 AI 출근')),
    document.fonts.load('400 100px Anton', '0123456789 AI REPLY'),
    document.fonts.load('italic 800 60px "Playfair Display"', 'good morning, AI, works. review'),
    document.fonts.load('900 60px "Playfair Display"', 'Approve.'),
    document.fonts.load('500 20px "IBM Plex Mono"', 'MON 08:12 AI STAFF'),
    document.fonts.load('600 20px "IBM Plex Mono"', 'MON 08:12 AI STAFF'),
  ]);
  await document.fonts.ready;
  const S = script.scenes, D = script.duration, BEAT = 60 / script.bpm, E1 = script.scenes.chaos[1];
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // ───────── 아이콘 ─────────
  const ICONS = {
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    insta: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    yt: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  };
  const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
  $$('[data-ic]').forEach(e => { e.innerHTML = ic(e.dataset.ic); });

  // ───────── 유틸 ─────────
  const rng = (seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20261023);
  const R = (a, b) => a + (b - a) * rng();
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  const sfx = []; window.__sfx = sfx;
  const fx = (name, t, v = 1, extra = {}) => sfx.push({ name, t: +t.toFixed(3), v, ...extra });
  const cam = $('#cam');
  const line = id => (narr || script.lines).find(l => l.id === id);
  const at = (id, f) => { const l = line(id); const end = l.end || l.start + 4; return l.start + (end - l.start) * f; };
  // 문장 안 덩어리(쉼으로 나뉜 구간)의 실제 시작·끝. 가이드 음성처럼 덩어리 정보가 없으면 문장 길이를 균등 분할합니다.
  const NCH = { L1: 1, L2: 2, L3: 3, L4: 2, L5: 2, L6: 2, L7: 3 };
  const chk = (id, k) => {
    const l = line(id);
    if (l.chunks && l.chunks[k]) return l.chunks[k];
    const n = NCH[id], end = l.end || l.start + 4, w = (end - l.start) / n;
    return { start: l.start + w * k, end: l.start + w * (k + 1) };
  };

  // 카드 위를 한 번 지나가는 빛 (입체감·고급감)
  $$('.node, .row, .apr, #doc, #o-th, #o-mg, #o-yt').forEach(e => { const h = document.createElement('div'); h.className = 'sheen'; h.innerHTML = '<i></i>'; e.appendChild(h); });
  const sheen = (sel, t, d = .9) => tl.fromTo(`${sel} > .sheen > i`, { left: '-60%' }, { left: '140%', duration: d, ease: 'power2.inOut', immediateRender: false }, t);
  // 카메라 펀치 / 흔들림
  const punch = (t, a = 0.03, d = 0.42) => tl.fromTo(cam, { scale: 1 + a }, { scale: 1, duration: d, ease: 'power3.out', immediateRender: false }, t);
  const shake = (t, a = 14, d = 0.4) => tl.fromTo(cam, { x: R(-a, a), y: R(-a, a), rotation: R(-.5, .5) }, { x: 0, y: 0, rotation: 0, duration: d, ease: 'elastic.out(1,0.35)', immediateRender: false }, t);
  const flash = (t, a = .85, d = .22, c = '#fff') => tl.fromTo('#flash', { opacity: a, backgroundColor: c }, { opacity: 0, duration: d, ease: 'power2.out', immediateRender: false }, t);

  // 장면 표시 / 숨김
  const showScene = (id, a, b) => { tl.set(id, { autoAlpha: 1 }, a); tl.set(id, { autoAlpha: 0 }, b); };
  showScene('#s1', 0, S.chaos[1] + .02);
  showScene('#s2', S.checkin[0], S.checkin[1] + .05);
  showScene('#s3', S.team[0] - .05, S.team[1] + .02);
  showScene('#s4', S.content[0] - .05, S.content[1] + .6);
  showScene('#s5', S.approve[0], S.approve[1] + .02);
  showScene('#s6', S.brand[0], D + 1);
  [['#s1', 0, S.chaos[1]], ['#s4', S.content[0], S.content[1]], ['#s6', S.brand[0], D]].forEach(([id, a, b]) =>
    tl.fromTo(id, { scale: 1 }, { scale: 1.035, duration: b - a, ease: 'none', immediateRender: false }, a));

  // 와이프(비스듬한 패널) 전환: 중앙 시각 tMid에 화면이 완전히 덮임
  function swipe(tMid, color, dir = 1, dur = .46) {
    const a = tMid - dur / 2;
    const from = dir > 0 ? -2100 : 1400, to = dir > 0 ? 1400 : -2100;
    tl.set('#w1 .er', { opacity: dir > 0 ? 1 : 0 }, a - .01);   // 금색은 진행 방향 앞쪽 가장자리 띠로만 사용
    tl.set('#w1 .el', { opacity: dir > 0 ? 0 : 1 }, a - .01);
    tl.fromTo('#w1', { left: from, backgroundColor: color }, { left: to, duration: dur, ease: 'power3.inOut', immediateRender: false }, a);
    fx('whoosh', a + .02, 1);
  }

  // ═════════════════════════════════════════════
  // S1  밀린 업무가 쏟아진다 (훅)
  //   v2: 납작한 흰 카드 더미 대신 — 거대한 금색 숫자 + 크기·깊이가 다른 작은 알림 알약이 사방에서 날아와 쌓이고,
  //       뒤에는 외곽선 타이포가 흐릅니다. 마지막엔 모두 중심으로 빨려 들어갑니다.
  // ═════════════════════════════════════════════
  const chips = [
    ['chat', '카톡 문의', '견적 가능한가요?', '#d9a21c', '12'],
    ['mail', '거래처 메일', '회신 부탁드립니다', '#3a5bd9', '3'],
    ['doc', '블로그 오늘 글은?', '발행 마감 18:00', '#1fb5a0', '1'],
    ['image', '인스타 업로드', '카드뉴스 아직…', '#e0446e', '4'],
    ['card', '세금계산서', '발행 요청', '#7b5cff', '2'],
    ['search', '경쟁사 조사', '다음 주 회의 자료', '#d9a21c', '1'],
    ['chat', '리뷰 답글', '미답변 8건', '#1fb5a0', '8'],
    ['user', '고객 응대', '대기 중 5명', '#e8564a', '5'],
    ['doc', '견적서 수정', '버전 7 · 급해요', '#3a5bd9', '2'],
    ['mail', '광고 문의', '미확인 9건', '#6b7aa8', '9'],
    ['chat', '단체방 공지', '오늘 중 부탁드려요', '#d9a21c', '6'],
    ['search', '자료 정리', '어제 요청하신 것', '#7b5cff', '1'],
    ['mail', '주문 확인', '배송 문의 4건', '#3a5bd9', '4'],
    ['image', '상세페이지', '사진 교체 필요', '#e0446e', '1'],
    ['card', '입금 확인', '미확인 3건', '#1fb5a0', '3'],
    ['user', '직원 일정', '오늘 변경 2건', '#e8564a', '2'],
  ];
  // [x, y, 기울기, 크기(깊이)] — 숫자 둘레에 흩뿌리듯 배치
  const slots = [
    [70, 400, -7, 1.0], [560, 385, 6, .9], [30, 560, 5, 1.15], [500, 615, -8, 1.0],
    [100, 795, -4, .88], [560, 830, 8, 1.1], [20, 990, 6, 1.0], [430, 1010, -6, .95],
    [300, 470, 3, 1.28], [620, 300, -10, .84], [180, 690, -11, .86], [610, 1100, -5, 1.0],
    [320, 900, 7, 1.18], [60, 1160, -3, .9], [520, 1190, 4, 1.05], [250, 1250, -6, .92],
  ];
  const gaps = [.34, .3, .28, .26, .24, .22, .2, .19, .18, .17, .16, .15, .15, .14, .14];
  const targets = [3, 7, 12, 16, 21, 25, 29, 32, 35, 38, 40, 42, 44, 45, 46, 47];
  const cnt = { v: 0 }, cntEl = $('#cnt-num');
  const pile = $('#pile');
  const arrive = [];
  let ct = .12;
  chips.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'chip';
    d.innerHTML = `<i style="background:${c[3]}">${ic(c[0])}</i><div><b>${c[1]}</b><span>${c[2]}</span></div><em>${c[4]}</em>`;
    pile.appendChild(d);
    const [sx, sy, rot, sc] = slots[i], w = d.offsetWidth;
    const xx = Math.max(-20, Math.min(sx, 1080 - w * sc - 16 + (sc - 1) * w / 2));
    gsap.set(d, { left: xx, top: sy, transformOrigin: '50% 50%' });
    if (sc < .95) gsap.set(d, { filter: 'blur(1.4px)' });
    const side = i % 2 ? 1 : -1, fromY = (i % 4 === 1) ? -900 : (i % 4 === 3 ? 900 : 0), fromX = fromY ? 0 : side * 1300;
    tl.fromTo(d, { x: fromX, y: fromY, rotation: rot + side * 38, scale: sc * 1.25, opacity: 1 },
      { x: 0, y: 0, rotation: rot, scale: sc, duration: .4, ease: 'back.out(1.25)', immediateRender: true }, ct);
    tl.to(cnt, { v: targets[i], duration: .28, ease: 'none', onUpdate() { cntEl.textContent = Math.round(cnt.v); } }, ct + .12);
    shake(ct + .22, 7 + i * 1.1, .35);
    fx('pop', ct + .2, .7 + i * .03);
    if (i > 4) fx('ping', ct + .26, .5);
    arrive.push({ d, dx: 540 - (xx + w / 2), dy: 800 - (sy + 48) });
    ct += gaps[Math.min(i, gaps.length - 1)];
  });
  // 뒤에서 흐르는 외곽선 타이포
  tl.fromTo('#mq1', { x: 0 }, { x: -1100, duration: E1, ease: 'none' }, 0);
  tl.fromTo('#mq2', { x: -1100 }, { x: 0, duration: E1, ease: 'none' }, 0);
  tl.to(['#mq1', '#mq2'], { opacity: 0, duration: .3 }, E1 - .5);
  tl.fromTo('#s1 .redglow', { opacity: 0 }, { opacity: 1, duration: E1 - 1.0, ease: 'power2.in', immediateRender: false }, .5);
  tl.fromTo('#cnt-num', { scale: 1 }, { scale: 1.035, duration: .5, repeat: 7, yoyo: true, ease: 'sine.inOut', immediateRender: false, transformOrigin: '50% 50%' }, .8);
  tl.fromTo(['#s1-meta', '#s1-lab'], { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .5 }, .2);
  // 알림 배지
  [[120, 520, '99+'], [900, 780, '17'], [160, 1080, '24'], [860, 1170, '8'], [90, 760, '5'], [930, 470, '31'],
   [880, 960, '12'], [100, 940, '9'], [820, 560, '3'], [190, 1250, '14']].forEach((b, i) => {
    const p = document.createElement('div'); p.className = 'ping'; p.textContent = b[2]; p.style.left = b[0] + 'px'; p.style.top = b[1] + 'px'; $('#s1').appendChild(p);
    const t = 1.5 + i * .27;
    tl.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .3, ease: 'back.out(2.2)' }, t);
    fx('ping', t + .05, .6);
    tl.to(p, { scale: 0, opacity: 0, duration: .2, ease: 'power2.in' }, E1 - .6);
  });
  fx('riser', E1 - 3.0, 1, { dur: 3.0 });
  tl.to('.chip', { x: '+=5', duration: .05, repeat: 17, yoyo: true, ease: 'none', stagger: .006 }, 3.2);
  // 후반부 경보 펄스 (박자에 맞춰 붉게 번쩍)
  [3.0, 3.5, 4.0].forEach((t, i) => { flash(t, .26, .36, '#ff5a4d'); punch(t, .03 + i * .008, .32); fx('tick', t, .8); });
  // 정점: 모두 중심으로 빨려 들어가며 숫자가 터지듯 커진다
  arrive.forEach((a, i) => tl.to(a.d, { x: a.dx, y: a.dy, scale: .1, rotation: '+=160', opacity: 0, duration: .46, ease: 'power3.in' }, E1 - .62 + i * .012));
  tl.to('#cnt-num', { scale: 1.16, duration: .5, ease: 'power3.in', transformOrigin: '50% 50%' }, E1 - .6);
  tl.to(['#s1-meta', '#s1-lab'], { opacity: 0, duration: .2 }, E1 - .4);
  shake(E1 - .6, 22, .5);
  fx('fall', E1 - .54, 1);
  // 전환 → S2
  flash(E1 - .22, .9, .3);
  swipe(S.checkin[0], '#1d3bb0', 1);
  fx('impact', S.checkin[0] - .02, 1);

  // ═════════════════════════════════════════════
  // S2  AI 직원 출근
  // ═════════════════════════════════════════════
  const s2 = S.checkin[0];
  tl.fromTo('#bigclock', { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: 'power3.out', immediateRender: true }, s2 + .1);
  tl.fromTo('#s2-greet', { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', immediateRender: true }, s2 + .15);
  tl.to('#rays2', { rotation: 50, duration: S.checkin[1] - s2 + 1, ease: 'none' }, s2);
  const tL2 = line('L2').start, tH = chk('L2', 1).start;      // "그런데 오늘," 시작 / "AI 직원이" 시작
  tl.set('#clk', { textContent: '09:00' }, tL2);
  tl.fromTo('#bigclock', { scale: 1.07 }, { scale: 1, duration: .3, immediateRender: false }, tL2);
  flash(tL2, .5, .3);
  fx('ding', tL2, 1);
  fx('tick', s2 + .1, .6); fx('tick', s2 + .35, .6);
  tl.to('#bigclock', { scale: 1.7, opacity: 0, duration: .3, ease: 'power3.in' }, tH - .05);
  tl.to('#s2-greet', { opacity: 0, y: -40, duration: .3, ease: 'power2.in' }, tH - .08);
  tl.fromTo('#s2-ring', { scale: 0, opacity: 0, rotation: -90 }, { scale: 1, opacity: 1, rotation: 0, duration: .7, ease: 'back.out(1.8)', immediateRender: true }, tH + .1);
  tl.to('#s2-ring svg', { rotation: 360, duration: 8, ease: 'none' }, tH);
  tl.fromTo('#s2-pill', { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: .45 }, tH);
  // 헤드라인 슬램: "AI 직원이" → "출근했습니다"
  tl.fromTo('#s2-h1 span', { yPercent: 110 }, { yPercent: 0, duration: .5, ease: 'expo.out' }, tH);
  fx('hit', tH, .9); punch(tH, .035);
  tl.fromTo('#s2-h2 span', { yPercent: 110 }, { yPercent: 0, duration: .5, ease: 'expo.out' }, tH + .85);
  fx('hit', tH + .85, 1); punch(tH + .85, .05); shake(tH + .85, 12, .4);
  // 출근 행
  $$('#rows .row').forEach((r, i) => {
    const t = tH + .5 + i * .5;
    tl.fromTo(r, { x: 160, opacity: 0, scale: .94, rotationY: -22, transformPerspective: 1200 }, { x: 0, opacity: 1, scale: 1, rotationY: 0, duration: .55, ease: 'back.out(1.5)' }, t);
    sheen('#rows .row:nth-child(' + (i + 1) + ')', t + .35, .8);
    fx('pop', t + .05, .8);
    const st = r.querySelector('.st');
    tl.to(st, { backgroundColor: 'rgba(227,174,59,.95)', color: '#0d1230', borderColor: '#f6d27c', duration: .2 }, t + .3);
    tl.fromTo(st, { scale: 1 }, { scale: 1.12, duration: .15, yoyo: true, repeat: 1 }, t + .3);
    fx('chime', t + .3, .8, { n: i });
  });
  // 전환 → S3 (줌 스루)
  tl.to('#s2', { scale: 1.5, opacity: 0, duration: .3, ease: 'power3.in' }, S.team[0] - .3);
  fx('whoosh', S.team[0] - .32, .9);

  // ═════════════════════════════════════════════
  // S3  역할을 나눠 일하는 AI 조직
  // ═════════════════════════════════════════════
  const s3 = S.team[0];
  tl.fromTo('#s3', { scale: .78, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: 'power3.out', immediateRender: true }, s3 - .05);
  tl.fromTo('#s3-head', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, s3 + .15);
  tl.fromTo('#s3-ring', { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: .9, ease: 'power3.out', immediateRender: true }, s3 + .2);
  tl.to('#s3-ring svg', { rotation: 70, duration: S.team[1] - s3, ease: 'none' }, s3);
  tl.fromTo('#floor3', { backgroundPositionY: 0 }, { backgroundPositionY: 660, duration: S.team[1] - s3, ease: 'none' }, s3);
  const popNode = (sel, t) => { tl.fromTo(sel, { scale: .6, opacity: 0, y: 40, rotationX: -28, transformPerspective: 1100 }, { scale: 1, opacity: 1, y: 0, rotationX: 0, duration: .6, ease: 'back.out(1.6)', immediateRender: true }, t); fx('pop', t + .08, .9); sheen(sel, t + .4); };
  popNode('#n-mgr', s3 + .12);
  popNode('#n-res', s3 + .6);
  popNode('#n-con', s3 + .75);
  // 연결선
  ['#p1', '#p2'].forEach((p, i) => {
    const el = $(p), L = el.getTotalLength();
    gsap.set(el, { strokeDasharray: `${L} ${L}`, strokeDashoffset: L });
    tl.to(el, { strokeDashoffset: 0, duration: .55, ease: 'power2.inOut' }, s3 + .8 + i * .1);
  });
  // 상태 헬퍼
  const setText = (node, txt, t) => tl.set(`${node} .tx`, { textContent: txt }, t);
  const ring = (node, t, d = 1.6) => { tl.fromTo(`${node} .ring`, { opacity: 0 }, { opacity: 1, duration: .25 }, t); tl.to(`${node} .ring`, { opacity: 0, duration: .4 }, t + d); };
  const done = (node, txt, t) => {
    setText(node, txt, t);
    tl.set(`${node} .ck`, { display: 'flex' }, t);
    tl.to(`${node} .bar`, { backgroundColor: 'rgba(63,217,160,.5)', duration: .3 }, t);
    tl.fromTo(`${node} .ck`, { scale: 0 }, { scale: 1, duration: .35, ease: 'back.out(3)', immediateRender: false }, t);
    fx('success', t, 1);
  };
  // "매니저가 나누고" / "리서처가 조사하고" / "콘텐츠가 만듭니다"
  const tM = chk('L3', 0).start, tR = chk('L3', 1).start, tC = chk('L3', 2).start;
  ring('#n-mgr', tM, 1.5); setText('#n-mgr', '업무 47건 배분 중…', tM);
  for (let k = 0; k < 3; k++) {
    const pr = document.createElement('div'); pr.className = 'pr'; $('#s3').insertBefore(pr, $('#n-mgr'));
    tl.fromTo(pr, { scale: .5, opacity: .7 }, { scale: 4.2, opacity: 0, duration: 1.3, ease: 'power2.out', immediateRender: false }, tM + k * .32);
  }
  tl.fromTo('#n-mgr .bar', { width: 0 }, { width: '100%', duration: 1.4, ease: 'power1.inOut', immediateRender: false }, tM);
  punch(tM, .02);
  // 일 카드가 선을 타고 이동
  const dots = $('#dots');
  [['#p1', 0], ['#p2', 0], ['#p1', .22], ['#p2', .22], ['#p1', .44], ['#p2', .44]].forEach(([pid, dl], i) => {
    const path = $(pid), L = path.getTotalLength();
    const d = document.createElement('div'); d.className = 'dotp'; dots.appendChild(d);
    const o = { p: 0 }, t0 = tM + .55 + dl + (i % 2) * .04;
    gsap.set(d, { opacity: 0 });
    tl.set(d, { opacity: 1 }, t0);
    tl.to(o, { p: 1, duration: .62, ease: 'power2.inOut', onUpdate() { const pt = path.getPointAtLength(o.p * L); d.style.left = pt.x + 'px'; d.style.top = pt.y + 'px'; } }, t0);
    tl.set(d, { opacity: 0 }, t0 + .62);
    fx('tick', t0 + .6, .5);
  });
  // 커서 — 매니저가 업무를 나눠 주는 손길 (히어로 영상의 커서 모티프)
  const curTo = (x, y, t, d = .55) => tl.to('#cursor', { left: x - 7, top: y - 4, duration: d, ease: 'power3.inOut' }, t);
  tl.fromTo('#cursor', { left: 560, top: 650, opacity: 0, scale: 1 }, { opacity: 1, duration: .2, immediateRender: true }, tM + .25);
  curTo(300, 930, tM + .35); fx('click', tM + .95, .45);
  tl.fromTo('#cursor', { scale: 1 }, { scale: .82, duration: .1, yoyo: true, repeat: 1, immediateRender: false }, tM + .9);
  curTo(790, 930, tM + 1.15); fx('click', tM + 1.75, .45);
  tl.fromTo('#cursor', { scale: 1 }, { scale: .82, duration: .1, yoyo: true, repeat: 1, immediateRender: false }, tM + 1.7);
  tl.to('#cursor', { opacity: 0, duration: .25 }, tM + 2.0);
  done('#n-mgr', '배분 완료', tM + 1.55);
  ring('#n-res', tR, 1.7); setText('#n-res', '자료 조사 중…', tR); punch(tR, .025); fx('hit', tR, .5);
  tl.fromTo('#n-res .bar', { width: 0 }, { width: '100%', duration: 1.5, ease: 'power1.inOut', immediateRender: false }, tR);
  done('#n-res', '카드를 완료했습니다', tR + 1.55);
  ring('#n-con', tC, 1.8); setText('#n-con', '원고 작성 중…', tC); punch(tC, .025); fx('hit', tC, .5);
  tl.fromTo('#n-con .bar', { width: 0 }, { width: '100%', duration: 1.7, ease: 'power1.inOut', immediateRender: false }, tC);
  done('#n-con', '초안 완료', tC + 1.75);
  // 역할 칩
  const tRole = line('L3').end;
  tl.fromTo('#roles', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, tRole);
  $$('#roles .rr div').forEach((d, i) => {
    const t = tRole + .25 + i * .45;
    tl.to(d, { backgroundColor: 'rgba(227,174,59,.96)', color: '#0d1230', borderColor: '#f6d27c', duration: .18 }, t);
    tl.set(d.querySelector('svg'), { display: 'block' }, t);
    tl.fromTo(d, { scale: 1.12 }, { scale: 1, duration: .3, ease: 'back.out(2)', immediateRender: false }, t);
    fx('tick', t, .9);
  });
  // 전환 → S4
  swipe(S.content[0], '#101a4a', -1);
  tl.to('#s3', { y: -160, opacity: 0, duration: .24, ease: 'power2.in' }, S.team[1] - .26);

  // ═════════════════════════════════════════════
  // S4  글 하나가 카드뉴스·SNS·영상이 된다
  // ═════════════════════════════════════════════
  const s4 = S.content[0];
  tl.fromTo('#s4-head', { opacity: 0 }, { opacity: 1, duration: .4 }, s4 + .3);
  tl.fromTo('#doc', { y: 120, scale: .7, rotation: -8, opacity: 0, rotationX: 25, transformPerspective: 1300 }, { y: 0, scale: 1, rotation: 0, opacity: 1, rotationX: 0, duration: .7, ease: 'back.out(1.5)', immediateRender: true }, s4 + .15);
  sheen('#doc', s4 + .8);
  fx('pop', s4 + .3, 1);
  tl.fromTo('#doc .ln', { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: .35, stagger: .09, ease: 'power2.out', immediateRender: true }, s4 + .6);
  // 문서가 작아지며 중앙으로 → 산출물 폭발
  const burst = (sel, t, from, tilt, extra = {}) => {      // tilt = [rotationY, rotationX] 로 살짝 기울어진 채 안착
    tl.fromTo(sel, { x: from[0], y: from[1], scale: .2, rotation: from[2], opacity: 0, rotationY: tilt[0] * -5, rotationX: 20, transformPerspective: 1300 },
      { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, rotationY: tilt[0], rotationX: tilt[1], duration: .7, ease: 'back.out(1.4)', immediateRender: true, ...extra }, t);
    fx('pop', t + .1, 1); fx('whoosh', t - .03, .5); punch(t + .1, .02);
    if (sel !== '#o-ig') sheen(sel, t + .5);
  };
  const c7 = chk('L4', 0), c8 = chk('L4', 1);              // "글 하나가 카드뉴스, SNS," / "영상이 됩니다"
  const T4 = [c7.start + .8, c7.start + 1.7, c8.start, c8.start + .8];
  tl.to('#doc', { scale: .5, y: 40, rotation: 0, duration: .5, ease: 'power3.inOut' }, T4[0] - .15);
  tl.to('#doc', { opacity: 0, duration: .25 }, T4[0] + .1);
  burst('#o-ig', T4[0], [300, 380, -25], [9, -3]);
  burst('#o-th', T4[1], [-300, 380, 20], [-9, -3]);
  burst('#o-yt', T4[2], [-250, -380, -18], [-8, 3]);
  burst('#o-mg', T4[3], [380, -380, 22], [9, 3]);
  // 떠다니는 느낌
  ['#o-ig', '#o-th', '#o-mg'].forEach((s, i) => tl.to(s, { y: (i % 2 ? 14 : -14), duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: 2 }, T4[i] + .7));
  // 이 영상도 AI와 함께 — 유튜브 카드가 화면 중앙으로 확대
  const tV = chk('L5', 0).start, tSticker = chk('L5', 1).start;   // "이 영상도," / "AI와 함께 만들었습니다"
  tl.to(['#o-ig', '#o-th', '#o-mg'], { opacity: .16, scale: .92, filter: 'blur(6px)', duration: .45, ease: 'power2.out' }, tV);
  tl.to('#o-yt', { x: -(640 + 125 - 540), y: -(860 + 222 - 790), scale: 1.78, rotationY: 0, rotationX: 0, duration: .6, ease: 'power3.inOut' }, tV);
  fx('whoosh', tV, .8);
  tl.fromTo('#madewith', { y: 40, opacity: 0, scale: .8 }, { y: 0, opacity: 1, scale: 1, duration: .5, ease: 'back.out(2)', immediateRender: true }, tSticker);
  fx('hit', tSticker, .8); shake(tSticker, 12, .4);
  // 재생 시간 올라가기 (영상 속 영상)
  const ytp = { v: 0 };
  tl.to(ytp, { v: 1, duration: S.approve[0] - tV, ease: 'none', onUpdate() {        // 실제 재생 위치를 그대로 표시
    const now = tV + ytp.v * (S.approve[0] - tV);
    $('#yt-prog').style.width = (now / D * 100) + '%';
    $('#yt-tm').textContent = `0:${String(Math.round(now)).padStart(2, '0')}`;
  } }, tV);
  // 전환 → S5 (아이리스)
  const tI = S.approve[0];
  tl.to('#o-yt', { scale: 2.3, duration: .5, ease: 'power3.in' }, tI - .2);
  tl.to('#madewith', { opacity: 0, y: -30, duration: .25 }, tI - .15);
  tl.fromTo('#s5', { clipPath: 'circle(0px at 540px 960px)' }, { clipPath: 'circle(1900px at 540px 960px)', duration: .75, ease: 'power3.inOut', immediateRender: true }, tI - .05);
  fx('swoosh', tI - .05, 1);

  // ═════════════════════════════════════════════
  // S5  사장님은 확인하고 승인만
  // ═════════════════════════════════════════════
  const s5 = S.approve[0];
  tl.set('#vig', { opacity: 0 }, s5 - .02); tl.to('#vig', { opacity: 1, duration: .4, ease: 'power1.in' }, S.brand[0] - .1);
  tl.fromTo('#s5-head', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: .45 }, s5 + .45);
  const rows5 = $$('#s5 .apr');
  rows5.forEach((r, i) => {
    const t = s5 + .7 + i * .22;
    tl.fromTo(r, { x: 160, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: 'back.out(1.4)', immediateRender: true }, t);
    fx('pop', t + .05, .7);
  });
  tl.fromTo('#apbtn', { y: 50, opacity: 0, scale: .92 }, { y: 0, opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.8)', immediateRender: true }, s5 + 1.5);
  fx('pop', s5 + 1.55, .8);
  // 탭 동작
  tl.fromTo('#s5-wm', { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 1.4, ease: 'power3.out', immediateRender: true }, s5 + .3);
  const tTap = chk('L6', 1).start + .1;                    // "승인만 하세요"
  gsap.set('#tapring', { left: 575, top: 1160 });
  tl.fromTo('#cursor5', { left: 840, top: 1480, opacity: 0, scale: 1 }, { left: 568, top: 1156, opacity: 1, duration: .6, ease: 'power3.inOut', immediateRender: true }, tTap - .8);
  tl.to('#cursor5', { scale: .82, duration: .12, ease: 'power2.in' }, tTap - .12);
  tl.to('#cursor5', { scale: 1, duration: .3, ease: 'back.out(3)' }, tTap);
  tl.to('#cursor5', { opacity: 0, y: 40, duration: .4, ease: 'power2.in' }, tTap + .55);
  tl.to('#apbtn', { scale: .965, duration: .12, ease: 'power2.in' }, tTap - .12);
  tl.to('#apbtn', { scale: 1, duration: .3, ease: 'back.out(3)' }, tTap);
  tl.fromTo('#tapring', { scale: .4, opacity: .9 }, { scale: 3.2, opacity: 0, duration: .6, ease: 'power2.out', immediateRender: false }, tTap);
  fx('click', tTap, 1);
  flash(tTap, .18, .25);
  rows5.forEach((r, i) => {
    const t = tTap + .12 + i * .22;
    const b = r.querySelector('.badge');
    tl.to(b, { backgroundColor: 'rgba(63,217,160,.22)', color: '#0a7a56', borderColor: 'rgba(63,217,160,.7)', duration: .15 }, t);
    tl.set(b.querySelector('span'), { textContent: '승인됨' }, t);
    tl.set(b.querySelector('svg'), { display: 'block' }, t);
    tl.fromTo(b, { scale: 1.18 }, { scale: 1, duration: .3, ease: 'back.out(3)', immediateRender: false }, t);
    fx('success', t, .9, { n: i });
  });
  // 미처리 47 → 0
  const c5 = { v: 47 }, c5El = $('#cnt5');
  tl.to(c5, { v: 0, duration: 1.5, ease: 'power2.inOut', onUpdate() { c5El.textContent = Math.round(c5.v); } }, tTap + .2);
  tl.to('#cnt5', { color: '#17b982', duration: .3 }, tTap + 1.6);
  tl.fromTo('#cnt5', { scale: 1.2 }, { scale: 1, duration: .5, ease: 'back.out(3)', transformOrigin: '100% 50%', immediateRender: false }, tTap + 1.6);
  fx('ding', tTap + 1.7, 1);
  // 큰 문구로 교체
  const tB = tTap + 1.9;
  tl.to(['#s5 .apr', '#apbtn'], { y: -70, opacity: 0, duration: .3, ease: 'power2.in', stagger: .05 }, tB - .1);
  tl.to('#s5-head', { opacity: 0, y: -30, duration: .25 }, tB - .1);
  tl.fromTo('#s5-big .w:nth-child(1) span', { yPercent: 115 }, { yPercent: 0, duration: .55, ease: 'expo.out', immediateRender: true }, tB + .2);
  tl.fromTo('#s5-big .w:nth-child(2) span', { yPercent: 115 }, { yPercent: 0, duration: .55, ease: 'expo.out', immediateRender: true }, tB + .7);
  tl.fromTo('#s5-big p', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, immediateRender: true }, tB + 1.3);
  tl.fromTo('#okbig', { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: .6, ease: 'back.out(2.2)', immediateRender: true }, tB + 1.5);
  fx('success', tB + 1.55, 1);
  fx('hit', tB + .2, .8); fx('hit', tB + .7, 1); punch(tB + .2, .02); punch(tB + .7, .035);
  // 전환 → S6 (아래에서 올라오는 잉크 와이프)
  const t6 = S.brand[0];
  tl.to('#s5', { scale: .94, opacity: .6, duration: .45, ease: 'power3.in' }, t6 - .3);
  tl.fromTo('#s6', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .5, ease: 'power4.inOut', immediateRender: true }, t6 - .3);
  fx('swoosh', t6 - .32, 1);

  // ═════════════════════════════════════════════
  // S6  브랜드 락업
  // ═════════════════════════════════════════════
  tl.fromTo('#s6 .glow.a', { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', immediateRender: true }, t6 + .1);
  tl.fromTo('#s6-logo .lw', { clipPath: 'inset(0 100% 0 0)', scale: .9 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: .55, ease: 'expo.out', immediateRender: true }, t6 + .3);
  tl.fromTo('#s6-logo .sweep', { left: -220 }, { left: 900, duration: .8, ease: 'power2.inOut', immediateRender: true }, t6 + .6);
  fx('impact', t6 + .3, 1); punch(t6 + .35, .04); shake(t6 + .35, 10, .4);
  tl.fromTo('#s6-ital', { opacity: 0, y: 30, scale: .92 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'power3.out', immediateRender: true }, t6 + .7);
  tl.fromTo('#s6-kr', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5 }, t6 + .9);
  tl.to('#rays6', { rotation: 45, duration: D - t6 + 1, ease: 'none' }, t6);
  tl.fromTo('#floor6', { backgroundPositionY: 0 }, { backgroundPositionY: 900, duration: D - t6, ease: 'none' }, t6);
  tl.fromTo('#s6 .glow.b', { opacity: 0 }, { opacity: 1, duration: 1.4 }, t6 + .4);
  // 태그라인 (나레이션과 동기)
  const tA = chk('L7', 0).start, tBb = chk('L7', 1).start, tLab = chk('L7', 2).start;
  tl.fromTo('#s6-tag .a', { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .5, immediateRender: true }, tA + .3);
  tl.fromTo('#s6-tag .b', { opacity: 0, y: 60, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: 'back.out(1.6)', immediateRender: true }, tBb);
  fx('hit', tBb, 1); punch(tBb, .04); shake(tBb, 12, .4);
  // 태그라인이 물러나고 → 제목 두 줄 → CTA
  const tOut = chk('L7', 1).end + .3;
  tl.to('#s6-tag', { opacity: 0, y: -50, duration: .28, ease: 'power2.in' }, tOut);
  tl.fromTo('#s6-title .t1', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .5, immediateRender: true }, tOut + .3);
  const tT2 = tOut + .8;
  tl.fromTo('#s6-title .t2', { opacity: 0, y: 70, scale: .92 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.7)', immediateRender: true }, tT2);
  fx('pop', tOut + .3, .7); fx('hit', tT2, 1); punch(tT2, .035);
  // "아이웍스랩." — LAB 글자가 한 번 반짝
  tl.fromTo('#s6-kr', { scale: 1 }, { scale: 1.16, color: '#f6d27c', duration: .25, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, tLab);
  fx('pop', tLab, .8);
  const tCta = S.checkin[0] + 2 * Math.ceil((tT2 + 1.0 - S.checkin[0]) / 2);   // 마지막 코드가 마디 첫 박에 오도록
  tl.fromTo('#s6-cta div', { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .55, ease: 'back.out(2.4)', immediateRender: true }, tCta);
  tl.fromTo('#s6-cta div', { boxShadow: '0 0 0 0 rgba(227,174,59,.6), 0 26px 70px rgba(227,174,59,.35)' }, { boxShadow: '0 0 0 46px rgba(227,174,59,0), 0 26px 70px rgba(227,174,59,.35)', duration: .9, repeat: 1, ease: 'power2.out', immediateRender: false }, tCta + .5);
  fx('pop', tCta + .05, 1); fx('shimmer', tCta, 1);
  fx('final', tCta, 1);

  // ───────── 자막 ─────────
  // 음성 덩어리(쉼으로 나뉜 구간)마다 자막 한 장. 덩어리 정보가 없는 가이드 음성은 쉼표 기준으로 문장 길이를 나눕니다.
  const capEl = $('#cap');
  const addCap = (html, t0, t1) => {
    const d = document.createElement('div'); d.className = 'line';
    d.innerHTML = html;
    capEl.appendChild(d);
    gsap.set(d, { xPercent: -50 });
    const w = d.scrollWidth;                                       // 길면 글자 크기를 줄여 화면 안에 넣습니다
    if (w > 980) d.style.fontSize = (58 * 980 / w) + 'px';
    tl.fromTo(d, { opacity: 0, y: 26, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .22, ease: 'back.out(1.8)', immediateRender: true }, t0);
    tl.to(d, { opacity: 0, y: -10, duration: .16, ease: 'power1.in' }, t1);
  };
  const emph = t => t.replace(/\[\[(.*?)\]\]/g, '<em>$1</em>').replace(/,$/, '');
  (narr || script.lines).forEach(l => {
    if (l.id === 'L7') return;                                     // 마지막 문장은 화면 문구가 대신함
    if (l.chunks) {
      l.chunks.forEach((c, k) => {
        const next = l.chunks[k + 1];
        addCap(emph(c.text), c.start - .04, next ? Math.max(c.end, next.start - .2) : c.end + .4);   // 다음 자막이 뜨기 전에 먼저 사라지게
      });
      return;
    }
    let chunks = l.text.split(/(?<=,)\s*/).filter(Boolean);
    chunks = chunks.reduce((acc, c) => { if (acc.length && acc[acc.length - 1].replace(/\[\[|\]\]|,/g, '').length < 5) acc[acc.length - 1] += ' ' + c; else acc.push(c); return acc; }, []);
    const start = l.start, end = l.end || start + 3.5;
    const total = chunks.reduce((a, c) => a + c.replace(/\[\[|\]\]/g, '').length, 0);
    let t = start;
    chunks.forEach((c, i) => {
      const dur = (end - start) * c.replace(/\[\[|\]\]/g, '').length / total;
      addCap(emph(c), t, t + dur + (i === chunks.length - 1 ? .5 : -.02));
      t += dur;
    });
  });

  tl.duration(D);

  // ───────── 외부 제어 ─────────
  const grain = $('#grain');
  window.__duration = D;
  window.__seek = t => {
    tl.time(t, false);
    const f = Math.round(t * script.fps);
    grain.style.transform = `translate(${(f * 37) % 128}px, ${(f * 91) % 128}px)`;
  };
  await Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
  window.__seek(0);
  window.__ready = true;
})();
