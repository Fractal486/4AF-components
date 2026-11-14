const { seg, lerp, eo, eio, clamp01 } = kit;
const DW_NS = 'http://www.w3.org/2000/svg';
const DW_CAM = [
{t:0,cx:705,cy:285,z:3.7},{t:2.3,cx:718,cy:287,z:3.5},
{t:4.2,cx:895,cy:315,z:2.05},{t:5.0,cx:900,cy:320,z:2.0},
{t:7.2,cx:535,cy:560,z:1.8},{t:7.8,cx:535,cy:560,z:1.78},
{t:9.2,cx:850,cy:530,z:.998},{t:13,cx:850,cy:530,z:.988}];
kit.scene('drawing', {
  init(kit) {
    kit.css('.dw-svg .dt{font-size:11px;fill:var(--main);paint-order:stroke;stroke:var(--ground);stroke-width:4px;stroke-linejoin:round}' +
      '.dw-svg .dts{font-size:9.5px;fill:color-mix(in srgb,var(--second) 75%,var(--ground));letter-spacing:.06em;paint-order:stroke;stroke:var(--ground);stroke-width:3px}' +
      '.dw-svg .sl{font-size:9px;fill:color-mix(in srgb,var(--second) 75%,var(--ground));letter-spacing:.08em}' +
      '.dw-svg .nt{font-size:11.5px;fill:var(--main);letter-spacing:.06em}.dw-svg .nth{font-size:13px;font-weight:700;fill:var(--main);letter-spacing:.06em}' +
      '.dw-svg .vt{font-size:12px;fill:var(--main);letter-spacing:.1em}.dw-svg .nbt{font-size:9.5px;fill:var(--main)}' +
      '.dw-svg .th{font-size:10.5px;fill:var(--main);letter-spacing:.05em}.dw-svg .tc{font-size:10.5px;fill:var(--main);text-transform:none}');
    const root = kit.h('<div class="ground"><div class="dw-cam"></div></div>');
    kit.stage.append(root);
    const camEl = root.querySelector('.dw-cam');
    this.cam = camEl.style;
    const svg = document.createElementNS(DW_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1700 1060'); svg.setAttribute('width', '1700'); svg.setAttribute('height', '1060'); svg.setAttribute('class', 'dw-svg');
    camEl.appendChild(svg);
    const REG = this.reg = []; let sv = svg, CUR = { a: 0, s: 0, d: .6, i: 0 }, noreg = 0;
    const at = (a, s, d) => { CUR = { a: a, s: s || 0, d: d || .6, i: 0 }; };
    const kind = (e, t) => { if (t === 'text') return 'f'; const c = ' ' + (e.getAttribute('class') || '') + ' ';
      if (/ (slot|ph|cl|env|hs) /.test(c) || (e.getAttribute('fill') || '').indexOf('url') === 0) return 'f'; return 'd'; };
    function mk(t, a, p) { const e = document.createElementNS(DW_NS, t); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); (p || sv).appendChild(e);
      if (!noreg && t !== 'g') { const s = CUR.a + CUR.i * CUR.s; CUR.i++; const k = kind(e, t); if (k === 'd') e.setAttribute('pathLength', '1'); e.style.opacity = 0; REG.push({ e: e, a: s, b: s + CUR.d, k: k, last: -1 }); }
      return e; }
    function tx(x, y, s, c, a, p) { const t = mk('text', Object.assign({ x: x, y: y, class: c || 'dt' }, a || {}), p); t.textContent = s; return t; }
    noreg = 1; const d = mk('defs', {}); const m = mk('marker', { id: 'dwar', viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }, d);
    mk('path', { d: 'M0,1.7 L10,5 L0,8.3 z', class: 'arrow' }, m);
    const pt = mk('pattern', { id: 'dwhat', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d); mk('line', { x1: 0, y1: 0, x2: 0, y2: 5, class: 'hl' }, pt); noreg = 0;
    const A = 'url(#dwar)', HAT = 'url(#dwhat)';
    function dimH(x1, x2, y, e1, e2, l, o) { o = o || {}; [[x1, e1], [x2, e2]].forEach(([x, e]) => { if (e == null) return; const s = Math.sign(y - e) || 1; mk('line', { x1: x, y1: e + s * 3, x2: x, y2: y + s * 5, class: 'ext' }); });
      if (x2 - x1 >= 28) mk('line', { x1: x1, y1: y, x2: x2, y2: y, class: 'dl', 'marker-start': A, 'marker-end': A }); else { mk('line', { x1: x1 - 13, y1: y, x2: x1, y2: y, class: 'dl', 'marker-end': A }); mk('line', { x1: x2 + 13, y1: y, x2: x2, y2: y, class: 'dl', 'marker-end': A }); }
      tx((x1 + x2) / 2 + (o.dx || 0), (o.below ? y + 13 : y - 4) + (o.dy || 0), l, o.c || 'dt', { 'text-anchor': 'middle' }); }
    function dimV(y1, y2, x, e1, e2, l, o) { o = o || {}; [[y1, e1], [y2, e2]].forEach(([y, e]) => { if (e == null) return; const s = Math.sign(x - e) || 1; mk('line', { x1: e + s * 3, y1: y, x2: x + s * 5, y2: y, class: 'ext' }); });
      if (y2 - y1 >= 28) mk('line', { x1: x, y1: y1, x2: x, y2: y2, class: 'dl', 'marker-start': A, 'marker-end': A }); else { mk('line', { x1: x, y1: y1 - 13, x2: x, y2: y1, class: 'dl', 'marker-end': A }); mk('line', { x1: x, y1: y2 + 13, x2: x, y2: y2, class: 'dl', 'marker-end': A }); }
      const c = (y1 + y2) / 2; if (o.side) { const r = o.side === 'r'; tx(r ? x + 6 : x - 6, c + 4, l, o.c || 'dt', { 'text-anchor': r ? 'start' : 'end' }); } else tx(x - 5, c, l, o.c || 'dt', { 'text-anchor': 'middle', transform: 'rotate(-90 ' + (x - 5) + ' ' + c + ')' }); }
    function callout(px, py, ex, ey, l, dir, c) { const s = dir || (ex >= px ? 1 : -1); mk('circle', { cx: px, cy: py, r: 1.8, class: 'dot' }); mk('polyline', { points: px + ',' + py + ' ' + ex + ',' + ey + ' ' + (ex + s * 10) + ',' + ey, class: 'lead' }); tx(ex + s * 14, ey + 4, l, c || 'dt', { 'text-anchor': s > 0 ? 'start' : 'end' }); }
    function rad(cx, cy, r, c, l, L) { const sx = c.indexOf('l') > -1 ? -1 : 1, sy = c.indexOf('t') > -1 ? -1 : 1; const ox = cx - sx * r, oy = cy - sy * r; callout(ox + sx * r * Math.SQRT1_2, oy + sy * r * Math.SQRT1_2, ox + sx * r * Math.SQRT1_2 + sx * L, oy + sy * r * Math.SQRT1_2 + sy * L, l, sx); }
    function nb(x, y, n) { mk('rect', { x: x - 6, y: y - 6, width: 12, height: 12, class: 'nb' }); tx(x, y + 3.5, String(n), 'nbt', { 'text-anchor': 'middle' }); }
    function rr(x, y, w, h, r, c, p) { return mk('rect', { x: x, y: y, width: w, height: h, rx: r, class: c }, p); }
    function slotLabel(x, y, w, h, l, al, p) { tx(al === 'l' ? x + 6 : x + w / 2, y + h / 2 + 3.2, l, 'sl', { 'text-anchor': al === 'l' ? 'start' : 'middle' }, p); }
    function title(x, y, t, s) { tx(x, y, t, 'vt', { 'text-anchor': 'middle' }); if (s) tx(x, y + 14, s, 'dts', { 'text-anchor': 'middle' }); }
    function xbox(x, y, w, h, p) { mk('rect', { x: x, y: y, width: w, height: h, class: 'thin' }, p); mk('path', { d: 'M' + x + ',' + y + ' l' + w + ',' + h + ' M' + (x + w) + ',' + y + ' l' + (-w) + ',' + h, class: 'thin' }, p); }
    function detailRef(cx, cy, r, lbl, lx, ly) { mk('circle', { cx: cx, cy: cy, r: r, class: 'ph' }); const a = Math.atan2(ly - cy, lx - cx); mk('line', { x1: cx + r * Math.cos(a), y1: cy + r * Math.sin(a), x2: lx, y2: ly, class: 'lead' }); tx(lx + (lx < cx ? -4 : 4), ly + 4, lbl, 'dts', { 'text-anchor': lx < cx ? 'end' : 'start' }); }
    function table(x, y, ttl, rows) { const ws = [38, 105, 145], rh = 21; tx(x, y - 8, ttl, 'vt'); [['Code', 'Variable', 'Value']].concat(rows).forEach((r, i) => { let c2 = x; r.forEach((c, j) => { mk('rect', { x: c2, y: y + i * rh, width: ws[j], height: rh, class: 'thin' }); tx(c2 + (j ? ws[j] / 2 : 6), y + i * rh + 12, c, i ? 'tc' : 'th', { 'text-anchor': j ? 'middle' : 'start' }); c2 += ws[j]; }); }); return y + (rows.length + 1) * rh + 36; }
    function notes(list) { tx(50, 58, 'Notes:', 'nth'); tx(112, 58, '(unless otherwise specified)', 'nt'); list.forEach(([n, t], i) => { const y = 88 + i * 24; nb(56, y - 4, n); tx(72, y, t, 'nt'); }); }

    // Source: button.variants.ts, button.tsx, app/globals.css, registry/lib/motion.ts.
    // W is content dependent: the nominal width below is a schematic, never a dimension.
    const W=150,H=34,k=4,PX=620,PY=240,X=v=>PX+v*k,Y=v=>PY+v*k;
    const r=(x,y,w,h,rx,c,l)=>{rr(X(x),Y(y),w*k,h*k,rx*k,c);if(l)slotLabel(X(x),Y(y),w*k,h*k,l);};
    at(-.6,0,2.0);r(0,0,W,H,8,'obj');
    at(.2,.09,.6);xbox(X(12),Y(9),64,64);
    at(.85,.05,.6);r(38,7,98,20,0,'slot','LABEL SLOT · HUG');
    at(1.5,.015,.4);dimH(X(0),X(12),Y(-9),Y(0),Y(9),'S2');dimH(X(12),X(28),Y(-9),null,Y(9),'I1');dimH(X(28),X(38),Y(-9),null,Y(7),'S3');
    at(2.5,.02,.5);dimH(X(38),X(136),Y(-9),null,Y(7),'HUG');dimH(X(136),X(150),Y(-9),null,Y(0),'S1');
    at(2.8,.02,.5);dimV(Y(0),Y(H),X(-11),X(0),X(0),'H1');dimV(Y(9),Y(25),X(160),X(150),X(150),'I1',{side:'r'});
    at(3.1,.03,.5);dimH(X(0),X(W),Y(-23),Y(-13),Y(-13),'W · CONTENT DEPENDENT [TBD]');
    at(3.35,.04,.45);mk('line',{x1:X(-6),y1:Y(17),x2:X(156),y2:Y(17),class:'cl'});rad(X(W),Y(H),32,'br','R1',24);nb(X(3),Y(40),1);nb(X(23),Y(40),2);
    at(3.6,.03,.5);title(920,440,'PLAN · LEADING ICON + LABEL','SCALE 4:1 IN HEIGHT · WIDTH SCHEMATIC · MD');
    at(3.85,.04,.45);detailRef(X(12),Y(17),45,'DETAIL A',735,415);tx(920,465,'W = S2 + I1 + S3 + LABEL HUG + S1','dts',{'text-anchor':'middle'});

    // Lift the outline surface, retained content, and absolute loader from the plan.
    const sc=3,TX=290,TY=630,gap=64,ia=.94*sc,ib=.17*sc,ic=-.34*sc,id=.47*sc;
    const P=(x,y,z)=>[TX+ia*x+ic*y,TY+ib*x+id*y-z];
    const G=z=>{const g=mk('g',{transform:'matrix('+[ia,ib,ic,id,TX,TY-z].join(',')+')'});g.style.setProperty('--u',1/Math.sqrt(ia*id-ib*ic));return g};
    at(5.6,.03,.8);let g=G(0);rr(-5,-5,160,44,0,'ph',g);
    noreg=1;const MG=this.morph=[];
    const mg=(z,a)=>{const g=mk('g',{});g.style.opacity=0;MG.push({g,z,a});return g};
    let q=mg(gap,5.0);rr(0,0,W,H,8,'obj',q);
    q=mg(gap*2,5.12);xbox(12,9,16,16,q);rr(38,7,98,20,0,'slot',q);
    q=mg(gap*3,5.24);rr(67,9,16,16,0,'hug',q);mk('circle',{cx:75,cy:17,r:5,class:'thin'},q);
    noreg=0;this.flat=[k,0,0,k,PX,PY];this.iso=[ia,ib,ic,id,TX,TY];
    at(6.55,.01,.5);[[0,0],[W,0],[W,H],[0,H]].forEach(([x,y])=>{const a=P(x,y,0),b=P(x,y,gap*3);mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:'ph'})});
    at(6.8,.025,.5);[[0,'L0 · PARENT','MD TEXT: DRAWN HIT BOX'],[gap,'L1 · SURFACE','NO LAYOUT BORDER'],[gap*2,'L2 · CONTENT','RETAINED DURING LOADING'],[gap*3,'L3 · LOADER','ABSOLUTE · CENTERED · I1']].forEach(([z,t,s])=>{const p=P(0,H,z);mk('line',{x1:240,y1:p[1],x2:p[0],y2:p[1],class:'lead'});tx(230,p[1]-3,t,'vt',{'text-anchor':'end'});tx(230,p[1]+12,s,'dts',{'text-anchor':'end'})});
    at(7.1,.06,.5);title(465,790,'EXPLODED · LOADING COMPOSITION','AXONOMETRIC · LAYER SEPARATION SCHEMATIC [TBD]');

    at(7.65,0,1.0);rr(20,20,1660,1020,16,'border');
    at(8,.007,.4);notes([[1,'LABEL HUGS; WHITESPACE DOES NOT WRAP.'],[2,'ICON EDGE PADDING = S1 − 2 CSS PX.'],[3,'LOADING RETAINS LABEL GEOMETRY.'],[4,'40 PX HIT AREA APPLIES TO COMPACT SIZES.'],[5,'PRESS SCALE P1 = .95; LAYOUT IS STABLE.'],[6,'OUTLINE SHADOW HAS NO BORDER BOX COST.']]);
    at(8.3,.001,.35);let yy=table(1345,82,'MD GEOMETRY',[['H1','drawn-height','34'],['S1','label-pad-x','14'],['S2','icon-edge-pad','S1 − 2 = 12'],['S3','content-gap','10'],['I1','icon / loader','16'],['R1','corner','8'],['R2','pill','H1 ÷ 2 = 17'],['W','text-width','HUG · [TBD]']]);
    yy=table(1345,yy,'INTERACTION',[['T1','expanded-hit','40'],['S4','icon-inset','(H1−I1)÷2 = 9'],['P1','pressed-scale','0.95'],['F1','focus-ring','2'],['F2','ring-offset','2'],['D1','disabled-alpha','0.5'],['B','layout-border','0']]);
    yy=table(1345,yy,'OUTLINE SHADOW · LIGHT',[['Y','ambient-y','2'],['BL','ambient-blur','4'],['SP','ambient-spread','0'],['E1','top-envelope','BL+SP−Y = 2'],['E2','side-envelope','BL+SP = 4'],['E3','bottom-envelope','BL+SP+Y = 6']]);
    table(1345,yy,'SCHEMATIC',[['Z','layer-lift','[TBD]'],['W','label-width','[TBD]']]);

    // State comparison: same schematic width, all actual height and radius geometry.
    at(8.6,.009,.4);
    const sx=775,sy=535,sw=190,sh=68;
    [['REST',0],['PRESSED',230],['LOADING',0],['DISABLED',230]].forEach(([name,dx],i)=>{const y=sy+(i>1?126:0),x=sx+dx;rr(x,y,sw,sh,16,'ph');if(i===1){rr(x+sw*.025,y+sh*.025,sw*.95,sh*.95,16*.95,'obj');}else rr(x,y,sw,sh,16,'obj',i===3?mk('g',{opacity:'.5'}):undefined);if(i===2){xbox(x+79,y+18,32,32);}else{const e=rr(x+28,y+22,134,24,0,'slot',i===3?mk('g',{opacity:'.5'}):undefined);if(i===3)e.setAttribute('opacity','.5');}tx(x+sw/2,y+87,name,'dts',{'text-anchor':'middle'});});
    tx(1100,645,'P1 · CENTER ORIGIN','dts',{'text-anchor':'middle'});nb(1210,680,3);nb(1210,550,5);title(985,815,'STATE ENVELOPES','HEIGHT SCALE 2:1 · WIDTHS SCHEMATIC');

    at(8.8,.015,.45);
    const footprint=rr(78,296,324,84,20,'hs');footprint.setAttribute('fill',HAT);rr(86,300,308,68,16,'obj');rr(78,296,324,84,20,'env');dimV(296,300,64,78,86,'E1',{side:'l'});dimH(78,86,390,380,368,'E2',{dx:-7});dimV(368,380,422,394,402,'E3',{side:'r'});nb(387,290,6);title(245,420,'SHADOW ENVELOPE','SCALE 2:1 · AMBIENT GEOMETRIC REFERENCE');
    rr(455,300,68,68,16,'obj');rr(447,292,84,84,24,'thin');rr(451,296,76,76,20,'thin');callout(447,310,438,275,'F1 + F2',-1);title(490,403,'FOCUS','RING + OFFSET');
    at(9.0,.015,.45);
    const ax=85,ay=873;rr(ax-9,ay-9,120,120,0,'env');rr(ax,ay,102,102,24,'obj');xbox(ax+27,ay+27,48,48);mk('line',{x1:ax-18,y1:ay+51,x2:ax+120,y2:ay+51,class:'cl'});
    dimV(ay-9,ay+111,ax-24,ax-9,ax-9,'T1');dimH(ax,ax+27,ay-20,ay,ay+27,'S4');dimH(ax+27,ax+75,ay-20,null,ay+27,'I1');nb(ax+119,ay+10,4);title(145,1013,'A · ICON TARGET','SCALE 3:1 · SIZE ICON');

    at(9.15,.015,.45);
    mk('path',{d:'M700,90 V74 A16,16 0 0 1 716,58 H748',class:'thin'});callout(705,62,762,57,'R1',1);title(735,112,'CORNER · SCALE 2:1');
    rr(1000,54,180,68,34,'obj');slotLabel(1000,54,180,68,'LABEL SLOT · HUG');callout(1178,72,1210,60,'R2',1);
    at(9.25,.009,.4);title(590,850,'SIZE FAMILY','SCALE 2:1 · ALL WIDTHS SCHEMATIC');
    [['XS',24,6,'H2'],['SM',30,6,'H3'],['MD',34,8,'H1'],['LG',38,8,'H4']].forEach(([n,h,r,c],i)=>{const x=320+i*146,y=980-h*2;rr(x,y,116,h*2,r*2,'obj');rr(x+20,y+h-10,76,20,0,'slot');dimV(y,980,x-13,x,x,c);tx(x+58,1003,n,'dts',{'text-anchor':'middle'})});
    at(9.5,.001,.35);table(928,868,'SIZE MAP · XS / SM / MD / LG',[['H#','H2/H3/H1/H4','24 / 30 / 34 / 38'],['S1','pad-x','10 / 12 / 14 / 20'],['S3','gap','8 / 8 / 10 / 12'],['I1','icon','14 / 14 / 16 / 16'],['R1','radius','6 / 6 / 8 / 8']]);
    at(9.65,.01,.4);tx(1345,1002,'SHADOW: RING + LIFT + AMBIENT','dts');tx(1345,1018,'DARK: 1 PX RING ONLY. GRAYSCALE.','dts');
  },
  render(t) {
    t = t / 0.85;
    let i = 0; while (i < DW_CAM.length - 2 && t > DW_CAM[i + 1].t) i++;
    const c0 = DW_CAM[i], c1 = DW_CAM[i + 1], p = eio(seg(t, c0.t, c1.t));
    const z = Math.exp(lerp(Math.log(c0.z), Math.log(c1.z), p)), cx = lerp(c0.cx, c1.cx, p), cy = lerp(c0.cy, c1.cy, p);
    this.cam.transform = 'translate(' + (960 - cx * z) + 'px,' + (540 - cy * z) + 'px) scale(' + z + ')';
    for (const it of this.reg) {
      let v = clamp01((t - it.a) / (it.b - it.a)); v = Math.round(v * 400) / 400;
      if (v === it.last) continue; it.last = v; const s = it.e.style;
      if (it.k === 'f') { s.opacity = eo(v); continue; }
      const e = eio(v); s.opacity = Math.min(1, v * 6);
      if (v >= 1) { s.strokeDasharray = ''; s.strokeDashoffset = ''; } else { s.strokeDasharray = '1 2'; s.strokeDashoffset = 1 - e; }
      s.fillOpacity = eo(seg(v, .55, 1));
    }
    const F = this.flat, I = this.iso;
    this.morph.forEach((m) => {
      const v = eio(seg(t, m.a, m.a + 1.5)), M = F.map((f, n) => lerp(f, I[n], v));
      M[5] -= m.z * v;
      m.g.style.opacity = eo(seg(t, m.a + 0.05, m.a + 0.5));
      const fo = eo(seg(t, m.a + 0.55, m.a + 1.25)); if (fo !== m.fo) { m.fo = fo; m.fills = m.fills || m.g.querySelectorAll('.obj,.well,.hug'); m.fills.forEach(e => { e.style.fillOpacity = fo; }); }
      m.g.setAttribute('transform', 'matrix(' + M.join(',') + ')');
      m.g.style.setProperty('--u', 1 / Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])));
    });
  },
});
