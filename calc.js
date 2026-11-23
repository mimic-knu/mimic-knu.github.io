/* 실험실 계산기: 계산 정의 (화면과 분리, node로도 시험 가능) */
(function (root) {
  'use strict';
  const SUP = {'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  const UNSUP = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));
  const sup = s => String(s).split('').map(c => SUP[c] || c).join('');

  // 숫자 읽기: 1,000 / 0,1(소수점 쉼표) / 1e6 / 1.5×10^6 / 1.5x10⁶ / 10^8
  function parseNum(raw) {
    let s = String(raw ?? '').trim().replace(/\s+/g, '').replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + m.split('').map(c => UNSUP[c]).join(''));
    if (s === '') return NaN;
    if (s.includes(',') && !s.includes('.')) s = /^[-+]?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    else s = s.replace(/,/g, '');
    s = s.replace(/^10\^/, '1e').replace(/[×xX*]10\^/, 'e').replace(/[×xX*]10(?=[-+]?\d)/, 'e').replace(/\^/g, '');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  const fmt = (x, sig = 5) => {
    if (!Number.isFinite(x)) return '–';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e7 || a < 1e-3) return sci(x, 3);
    const r = +x.toPrecision(sig);
    const dec = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(r))));
    return r.toLocaleString('ko-KR', {maximumFractionDigits: dec});
  };
  function sci(x, sig) {
    const a = Math.abs(x); let e = Math.floor(Math.log10(a)); let m = +(x / 10 ** e).toPrecision(sig);
    if (Math.abs(m) >= 10) { m = +(m / 10).toPrecision(sig); e += 1; }
    return `${m} × 10${sup(e)}`;
  }
  const fsci = x => !Number.isFinite(x) ? '–' : (x !== 0 && (Math.abs(x) >= 1000 || Math.abs(x) < 1e-3)) ? sci(x, 3) : fmt(x, 3);
  const fint = x => Math.round(x).toLocaleString('ko-KR');
  const f2 = x => x.toFixed(2);
  const fi = x => fmt(x, 6); // 계산 과정에 입력값을 그대로 보여 줄 때
  const pos = (...xs) => xs.every(x => Number.isFinite(x) && x > 0);
  const vol = L => { const a = Math.abs(L); return a >= 1 ? [L, 'L'] : a >= 1e-3 ? [L * 1e3, 'mL'] : [L * 1e6, 'μL']; };
  const volUL = uL => vol(uL * 1e-6);
  const mass = g => { const a = Math.abs(g); return a >= 0.1 ? [g, 'g'] : a >= 1e-3 ? [g * 1e3, 'mg'] : [g * 1e6, 'μg']; };
  const molar = M => { const a = Math.abs(M); return a >= 1 ? [M, 'M'] : a >= 1e-3 ? [M * 1e3, 'mM'] : a >= 1e-6 ? [M * 1e6, 'μM'] : [M * 1e9, 'nM']; };
  const massConc = gL => { const a = Math.abs(gL); return a >= 0.1 ? [gL, 'mg/mL'] : a >= 1e-4 ? [gL * 1e3, 'μg/mL'] : [gL * 1e6, 'ng/mL']; };
  const EMPTY = '빈 칸이나 숫자가 아닌 값이 있어요. 숫자를 넣으면 계산돼요.';
  const E = m => ({err: m || EMPTY});
  const PIPETTE = '1 μL보다 적어서 피펫 오차가 커요. 먼저 중간 희석을 만들어 쓰세요.';
  const pip = L => (L > 0 && L < 1e-6 ? PIPETTE : '');
  const PMC = n => [`논문 예 ${n}`, `https://pmc.ncbi.nlm.nih.gov/articles/${n}/`];
  const LM = ['Lab Manager', 'https://www.labmanager.com/how-to-make-and-dilute-aqueous-solutions-28309'];

  const U = {
    molar: [['M', 1], ['mM', 1e-3], ['μM', 1e-6], ['nM', 1e-9]],
    vol: [['L', 1], ['mL', 1e-3], ['μL', 1e-6]],
    uL: [['μL', 1], ['mL', 1000]],
    mass: [['g', 1], ['mg', 1e-3], ['μg', 1e-6]],
    time: [['분', 1], ['시간', 60]],
    dna: [['pg', 1e-6], ['ng', 1e-3], ['μg', 1]],
    ngug: [['ng', 1], ['μg', 1000]],
    massConc: [['mg/mL', 1], ['μg/mL', 1e-3], ['ng/μL', 1e-3], ['g/L', 1], ['mg/L (ppm)', 1e-3], ['% (w/v)', 10]],
    any: [['M', 1, 'mol'], ['mM', 1e-3, 'mol'], ['μM', 1e-6, 'mol'], ['nM', 1e-9, 'mol'],
      ['mg/mL', 1, 'mass'], ['μg/mL', 1e-3, 'mass'], ['ng/μL', 1e-3, 'mass'], ['ng/mL', 1e-6, 'mass'],
      ['ppm (mg/L)', 1e-3, 'mass'], ['ppb (μg/L)', 1e-6, 'mass'], ['%', 1, 'pct'], ['X', 1, 'x'],
      ['CFU/mL', 1, 'cfu'], ['cells/mL', 1, 'cell'], ['copies/μL', 1, 'cp']]
  };
  const MW_CHIPS = [['NaCl', {mw: '58.44'}], ['KCl', {mw: '74.55'}], ['Tris base', {mw: '121.14'}], ['Na₂EDTA·2H₂O', {mw: '372.24'}],
    ['MgCl₂·6H₂O', {mw: '203.30'}], ['CaCl₂·2H₂O', {mw: '147.01'}], ['NaOH', {mw: '40.00'}], ['포도당', {mw: '180.16'}], ['SDS', {mw: '288.38'}], ['IPTG', {mw: '238.30'}]];

  const CATS = [
    {id: 'sol', name: '용액'},
    {id: 'dil', name: '희석'},
    {id: 'dna', name: 'DNA·RNA'},
    {id: 'pcr', name: 'PCR·클로닝'},
    {id: 'prot', name: '단백질'},
    {id: 'cult', name: '균·세포'},
    {id: 'spin', name: '원심분리'}
  ];

  const CALCS = [
    // ================= 용액
    {id: 'mol', cat: 'sol', short: '몰농도', sub: '가루로 용액', title: '몰농도 용액 만들기', icon: 'scale',
      kw: 'molar 몰 M mM 무게 g 분자량 MW FW 시약 가루 NaCl 버퍼 buffer 용액 만들기 DMSO 약물 바이알 stock 녹이기 용매',
      modes: [{id: 'mass', label: '무게 구하기', formula: '무게(g) = 몰농도(M) × 부피(L) × 분자량(g/mol)'},
        {id: 'vol', label: '용매 부피 구하기', formula: '용매 부피(L) = 가루 무게(g) ÷ (몰농도(M) × 분자량(g/mol))'}],
      fields: [
        {id: 'g', label: '가진 가루 무게', small: '바이알에 적힌 양', v: '5', units: U.mass, uv: 1, modes: ['vol']},
        {id: 'm', label: '만들 몰농도', v: '0.5', units: U.molar},
        {id: 'V', label: '만들 부피', v: '200', units: U.vol, uv: 1, modes: ['mass']},
        {id: 'mw', label: '분자량', small: 'g/mol', v: '58.44', unit: 'g/mol'}],
      chips: [{label: '분자량 넣기', items: MW_CHIPS}],
      calc(v, mode) {
        if (!pos(v.m, v.mw)) return E();
        if (mode === 'vol') {
          if (!pos(v.g)) return E();
          const L = v.g * v.g_u / (v.m * v.m_u * v.mw), [n, u] = vol(L);
          return {lbl: '넣을 용매 부피', n, u, also: `${fi(v.g)} ${v.g_n}을 녹이면 ${fi(v.m)} ${v.m_n}`,
            work: `${fi(v.g * v.g_u)} g ÷ (${fi(v.m * v.m_u)} M × ${fi(v.mw)} g/mol) = ${fmt(L)} L`, msg: pip(L)};
        }
        if (!pos(v.V)) return E();
        const g = v.m * v.m_u * v.V * v.V_u * v.mw, [n, u] = mass(g);
        return {lbl: '저울에 올릴 양', n, u, also: u === 'g' ? '' : `= <b>${fmt(g)}</b> g`,
          work: `${fi(v.m * v.m_u)} M × ${fi(v.V * v.V_u)} L × ${fi(v.mw)} g/mol = ${fmt(g)} g`};
      },
      notes: ['물을 다 넣지 말고 녹인 다음, 마지막에 눈금까지 채우세요.', '수화물이나 염 형태는 분자량이 달라요. 시약병 라벨의 FW(Formula Weight)가 우선이에요.'],
      abbr: 'MW(Molecular Weight), EDTA(Ethylenediaminetetraacetic acid), SDS(Sodium Dodecyl Sulfate), IPTG(Isopropyl β-D-1-thiogalactopyranoside), DMSO(Dimethyl sulfoxide)',
      src: [LM, ['GraphPad 몰농도 계산기', 'https://www.graphpad.com/quickcalcs/molarityform/'], PMC('PMC12254588')]},

    {id: 'pct', cat: 'sol', short: '% 농도', sub: 'w/v, v/v', title: '% 농도 용액 만들기', icon: 'flask',
      kw: '퍼센트 % w/v v/v 아가로스 agarose 에탄올 ethanol 70% 젤 식염수 펩톤 배지 g/L LB',
      modes: [{id: 'wv', label: 'w/v 가루', formula: 'w/v %는 100 mL에 몇 g'}, {id: 'vv', label: 'v/v 액체', formula: 'v/v %는 100 mL에 몇 mL'}],
      fields: [
        {id: 'p', label: '만들 농도', v: '1', unit: '%', modes: ['wv']},
        {id: 'V', label: '최종 부피', v: '50', units: U.vol, uv: 1, modes: ['wv']},
        {id: 'pt', label: '만들 농도', v: '70', unit: '%', modes: ['vv']},
        {id: 'Vt', label: '최종 부피', v: '100', units: U.vol, uv: 1, modes: ['vv']},
        {id: 'ps', label: '갖고 있는 원액', small: '순수하면 100', v: '95', unit: '%', modes: ['vv']}],
      calc(v, mode) {
        if (mode === 'wv') {
          if (!pos(v.p, v.V)) return E();
          const mL = v.V * v.V_u * 1000, g = v.p / 100 * mL, [n, u] = mass(g);
          return {lbl: '넣을 가루', n, u, also: `물을 채워 최종 <b>${fi(v.V)}</b> ${v.V_n} (= ${fmt(v.p * 10)} g/L)`, work: `${fi(v.p)} ÷ 100 × ${fi(mL)} mL = ${fmt(g)} g`};
        }
        if (!pos(v.pt, v.Vt, v.ps)) return E();
        if (v.pt > v.ps) return E('만들 농도가 원액보다 진해요. 희석으로는 만들 수 없어요.');
        const L = v.pt * v.Vt * v.Vt_u / v.ps, [n, u] = vol(L);
        return {lbl: '넣을 원액', n, u, also: `물을 채워 최종 <b>${fi(v.Vt)}</b> ${v.Vt_n}`, work: `${fi(v.pt)}% × ${fi(v.Vt)} ${v.Vt_n} ÷ ${fi(v.ps)}% = ${fmt(n)} ${u}`};
      },
      notes: ['g/L로 적힌 배지 가루(예: LB 25 g/L)는 2.5% w/v와 같아요.', '에탄올과 물은 섞으면 부피가 조금 줄어요. 원액을 재고 마지막에 물로 눈금까지 채우세요.', '아가로스는 끓이면서 증발한 만큼 물로 다시 채우세요.'],
      src: [LM, ['Addgene 전기영동', 'https://www.addgene.org/protocols/gel-electrophoresis/'], PMC('PMC12254588')]},

    {id: 'conv', cat: 'sol', short: '농도 변환', sub: 'mg/mL ↔ mM', title: '농도 단위 바꾸기', icon: 'swap',
      kw: '변환 단위 mg/mL mM μM uM μg/mL g/L ppm 몰 질량 분자량 convert 염산 HCl 황산 질산 아세트산 암모니아 진한 산 w/w 밀도 항생제',
      modes: [{id: 'm2c', label: '질량 → 몰', formula: '몰농도(M) = 질량 농도(g/L) ÷ 분자량(g/mol)'},
        {id: 'c2m', label: '몰 → 질량', formula: '질량 농도(g/L) = 몰농도(M) × 분자량(g/mol)'},
        {id: 'acid', label: '진한 산 % → M', formula: '몰농도(M) = % (w/w) ÷ 100 × 밀도(g/mL) × 1,000 ÷ 분자량'}],
      fields: [
        {id: 'c', label: '질량 농도', v: '5.844', units: U.massConc, modes: ['m2c']},
        {id: 'cm', label: '몰농도', v: '100', units: U.molar, uv: 1, modes: ['c2m']},
        {id: 'mw', label: '분자량', v: '58.44', unit: 'g/mol', modes: ['m2c', 'c2m']},
        {id: 'pw', label: '농도', small: '병에 적힌 % (w/w)', v: '37', unit: '%', modes: ['acid']},
        {id: 'dens', label: '밀도', v: '1.19', unit: 'g/mL', modes: ['acid']},
        {id: 'mwa', label: '분자량', v: '36.46', unit: 'g/mol', modes: ['acid']}],
      chips: [{label: '분자량 넣기', modes: ['m2c', 'c2m'], items: [['NaCl', {mw: '58.44'}], ['앰피실린 Na', {mw: '371.4'}], ['카나마이신 황산염', {mw: '582.6'}], ['클로람페니콜', {mw: '323.13'}], ['IPTG', {mw: '238.30'}]]},
        {label: '병 불러오기', modes: ['acid'], items: [['염산 37%', {pw: '37', dens: '1.19', mwa: '36.46'}], ['황산 98%', {pw: '98', dens: '1.84', mwa: '98.08'}], ['질산 70%', {pw: '70', dens: '1.41', mwa: '63.01'}], ['아세트산 99.7%', {pw: '99.7', dens: '1.049', mwa: '60.05'}], ['암모니아수 28%', {pw: '28', dens: '0.90', mwa: '17.03'}]]}],
      calc(v, mode) {
        if (mode === 'acid') {
          if (!pos(v.pw, v.dens, v.mwa)) return E();
          if (v.pw > 100) return E('%는 100을 넘을 수 없어요.');
          const M = v.pw / 100 * v.dens * 1000 / v.mwa;
          return {lbl: '원액 몰농도', n: M, u: 'M', also: '이 값을 <b>희석</b> 계산기의 C1에 넣으세요',
            work: `${fi(v.pw)} ÷ 100 × ${fi(v.dens)} g/mL × 1,000 ÷ ${fi(v.mwa)} g/mol = ${fmt(M)} M`};
        }
        if (!pos(v.mw)) return E();
        if (mode === 'm2c') {
          if (!pos(v.c)) return E();
          const gL = v.c * v.c_u, M = gL / v.mw, [n, u] = molar(M);
          return {lbl: '몰농도', n, u, work: `${fi(gL)} g/L ÷ ${fi(v.mw)} g/mol = ${fmt(M)} M`,
            msg: v.c_i === 5 && v.c >= 10 ? '진한 산·암모니아수는 % (w/v)가 아니라 % (w/w)예요. \'진한 산 % → M\'으로 계산하세요.' : ''};
        }
        if (!pos(v.cm)) return E();
        const M = v.cm * v.cm_u, gL = M * v.mw, [n, u] = massConc(gL);
        return {lbl: '질량 농도', n, u, also: u === 'μg/mL' || u === 'ng/mL' ? '' : `= <b>${fmt(gL * 1000)}</b> μg/mL`, work: `${fi(M)} M × ${fi(v.mw)} g/mol = ${fmt(gL)} g/L`};
      },
      notes: ['mg/mL와 g/L는 같은 값이고, μg/mL와 ng/μL도 같은 값이에요. ppm은 mg/L예요.', '같은 약도 염 형태(Na염, 황산염)나 수화물이면 분자량이 달라요. 라벨 값을 넣으세요.', '진한 산은 % (w/w)와 밀도로 계산해야 해요. 37% 염산은 약 12 M이에요.'],
      src: [LM, ['PubChem', 'https://pubchem.ncbi.nlm.nih.gov/'], PMC('PMC9421121')]},

    {id: 'buf', cat: 'sol', short: '버퍼 pH', sub: '산형 · 염기형 비율', title: '완충액 pH 맞추기', icon: 'drop',
      kw: '버퍼 buffer 완충액 pH pKa Henderson Hasselbalch 헨더슨 하셀바흐 인산 phosphate PB Tris 트리스 HEPES MOPS MES 산 염기 비율',
      formula: 'pH = pKa + log(염기형 ÷ 산형)',
      fields: [
        {id: 'ph', label: '목표 pH', v: '7.4'},
        {id: 'pka', label: 'pKa', small: '25°C', v: '6.8'},
        {id: 'c', label: '만들 농도', small: '산형 + 염기형', v: '100', units: [['mM', 1e-3], ['M', 1]]},
        {id: 'V', label: '만들 부피', v: '100', units: U.vol, uv: 1},
        {id: 's', label: '스톡 농도', small: '산형, 염기형 같은 농도', v: '1', units: [['M', 1], ['mM', 1e-3]]}],
      chips: [{label: 'pKa 넣기 (25°C)', items: [['인산 6.8', {pka: '6.8'}], ['Tris 8.06', {pka: '8.06'}], ['HEPES 7.48', {pka: '7.48'}], ['MOPS 7.20', {pka: '7.20'}], ['MES 6.10', {pka: '6.10'}]]}],
      calc(v) {
        if (!Number.isFinite(v.ph) || !Number.isFinite(v.pka) || !pos(v.c, v.V, v.s)) return E();
        if (v.ph < 0 || v.ph > 14 || v.pka < 0 || v.pka > 14) return E('pH와 pKa는 0에서 14 사이로 넣어 주세요.');
        const C = v.c * v.c_u, S = v.s * v.s_u, L = v.V * v.V_u;
        if (C > S) return E('스톡이 만들 농도보다 묽어요. 더 진한 스톡이 필요해요.');
        const ratio = 10 ** (v.ph - v.pka), fb = ratio / (1 + ratio), tot = C * L / S, b = tot * fb, a = tot - b, w = L - tot;
        const [bn, bu] = vol(b), [an, au] = vol(a), [wn, wu] = vol(w), [cb, cbu] = molar(C * fb), [ca, cau] = molar(C * (1 - fb));
        const far = Math.abs(v.ph - v.pka) > 1;
        return {lbl: '넣을 염기형 스톡', n: bn, u: bu, also: `산형 스톡 <b>${fmt(an)}</b> ${au}, 물로 채워 총 ${fi(v.V)} ${v.V_n}`,
          work: `10^(${fi(v.ph)} − ${fi(v.pka)}) = ${fmt(ratio, 4)} → 염기형 ${fmt(fb * 100, 3)}%, 산형 ${fmt((1 - fb) * 100, 3)}%`,
          msg: far ? '목표 pH가 pKa에서 1 넘게 떨어져 있어요. 완충 능력이 약하니 pKa가 더 가까운 버퍼를 고르세요.' : (pip(b) || pip(a)),
          table: {head: ['넣을 것', '양', '최종 농도'], rows: [['염기형 스톡', `${fmt(bn)} ${bu}`, `${fmt(cb)} ${cbu}`], ['산형 스톡', `${fmt(an)} ${au}`, `${fmt(ca)} ${cau}`], ['물', `${fmt(wn)} ${wu}`, '']]}};
      },
      notes: ['계산값은 출발점이에요. 섞은 뒤 pH 미터로 확인하고 맞추세요.', '염기형은 Na₂HPO₄나 Tris base, 산형은 NaH₂PO₄나 Tris-HCl 같은 쪽이에요.', '인산은 겉보기 pKa 6.8로 계산해요. 시그마의 0.1 M 인산 완충액 표(25°C, pH 5.8~8.0)와 염기형 비율이 2%p 안에서 맞아요.', 'Tris는 온도에 민감해요. pKa가 20°C 8.20, 25°C 8.06, 37°C 7.72라서 쓸 온도에서 맞춰야 해요.'],
      abbr: 'pKa(산 해리 상수 Ka의 −log 값), Tris(Tris(hydroxymethyl)aminomethane), HEPES(4-(2-Hydroxyethyl)-1-piperazineethanesulfonic acid), MOPS(3-(N-Morpholino)propanesulfonic acid), MES(2-(N-Morpholino)ethanesulfonic acid)',
      src: [['Sigma 버퍼 자료', 'https://www.sigmaaldrich.com/US/en/technical-documents/protocol/protein-biology/protein-concentration-and-buffer-exchange/buffer-reference-center']]},

    // ================= 희석
    {id: 'c1v1', cat: 'dil', short: 'C1V1 희석', sub: '농도 낮추기', title: '원액을 원하는 농도로 희석', icon: 'dilute',
      kw: 'C1V1 C2V2 희석 dilution 원액 stock 농도 맞추기 묽히기 ppm ppb mg/L 검량선 표준용액 약물 DMSO 세포 처리 접종 CFU copies cells 시딩',
      formula: '원액 농도 × 넣을 양 = 원하는 농도 × 총량',
      fields: [
        {id: 'c1', label: '원액 농도 C1', v: '1', units: U.any},
        {id: 'c2', label: '원하는 농도 C2', v: '50', units: U.any, uv: 1},
        {id: 'v2', label: '만들 총량 V2', v: '500', units: U.vol, uv: 1}],
      calc(v) {
        if (!pos(v.c1, v.c2, v.v2)) return E();
        const u1 = U.any[v.c1_i], u2 = U.any[v.c2_i];
        if (u1[2] !== u2[2]) return E(`${u1[0]} 단위와 ${u2[0]} 단위는 서로 바꿀 수 없어요. 같은 종류의 단위로 맞춰 주세요.`);
        const C1 = v.c1 * u1[1], C2 = v.c2 * u2[1];
        if (C2 > C1) return E('원하는 농도가 원액보다 진해요. 희석으로는 만들 수 없어요.');
        const V2 = v.v2 * v.v2_u, V1 = C2 * V2 / C1, [n, u] = vol(V1), [b, bu] = vol(V2 - V1);
        const fold = C1 / C2;
        return {lbl: '넣을 원액 V1', n, u, also: `용매 <b>${fmt(b)}</b> ${bu}를 더해 총 ${fi(v.v2)} ${v.v2_n} (${fmt(fold)}배 희석)`,
          work: `${fi(C1 / u2[1])} ${u2[0]} × V1 = ${fi(v.c2)} ${u2[0]} × ${fi(v.v2)} ${v.v2_n} → V1 = ${fmt(n)} ${u}`,
          msg: pip(V1) || (fold > 1000 ? `${fmt(fold)}배 희석은 한 번에 하기보다 연속 희석으로 나눠서 하세요.` : '')};
      },
      notes: ['C1과 C2는 같은 종류의 단위끼리만 계산돼요(몰농도끼리, 질량농도끼리, CFU끼리).', 'V2는 넣을 용매 양이 아니라 다 섞은 최종 부피예요.'],
      src: [LM, PMC('PMC4671544')]},

    {id: 'xstock', cat: 'dil', short: 'X배 스톡', sub: '10X · 1000X', title: '배수(X) 스톡 희석', icon: 'bottle',
      kw: '10X 5X 1X 1000X 스톡 stock 버퍼 buffer 항생제 antibiotic 앰피실린 ampicillin 카나마이신 kanamycin 클로람페니콜 로딩 다이 loading dye 6X TAE TBE PBS 배수 희석',
      modes: [{id: 'tot', label: '총량 맞추기', formula: '넣을 스톡 = 최종 부피 × 원하는 배수 ÷ 스톡 배수'}, {id: 'add', label: '있는 양에 더하기', formula: '더할 스톡 = 지금 부피 × 원하는 배수 ÷ (스톡 배수 − 원하는 배수)'}],
      fields: [
        {id: 's', label: '스톡 배수', v: '10', unit: 'X'},
        {id: 't', label: '원하는 배수', v: '1', unit: 'X'},
        {id: 'V', label: '최종 부피', v: '1', units: U.vol, uv: 0, modes: ['tot']},
        {id: 'W', label: '지금 부피', small: '배지나 시료', v: '400', units: U.vol, uv: 1, modes: ['add']}],
      chips: [{label: '예시', items: [
        ['10X TAE로 1 L', {_mode: 'tot', s: '10', t: '1', V: '1', V_u: 0}],
        ['5X 버퍼로 PCR 20 μL', {_mode: 'tot', s: '5', t: '1', V: '20', V_u: 2}],
        ['항생제 1000X를 배지 400 mL에', {_mode: 'add', s: '1000', t: '1', W: '400', W_u: 1}],
        ['6X 로딩 다이를 시료 10 μL에', {_mode: 'add', s: '6', t: '1', W: '10', W_u: 2}]]}],
      calc(v, mode) {
        if (!pos(v.s, v.t)) return E();
        if (v.t >= v.s) return E('원하는 배수가 스톡과 같거나 높아요. 스톡 배수를 확인해 주세요.');
        if (mode === 'add') {
          if (!pos(v.W)) return E();
          const WL = v.W * v.W_u, x = WL * v.t / (v.s - v.t), [n, u] = vol(x);
          return {lbl: '더할 스톡', n, u, also: `${fi(v.W)} ${v.W_n}에 넣으면 ${fi(v.t)}X`, work: `${fi(v.W)} ${v.W_n} × ${fi(v.t)} ÷ (${fi(v.s)} − ${fi(v.t)}) = ${fmt(n)} ${u}`, msg: pip(x)};
        }
        if (!pos(v.V)) return E();
        const VL = v.V * v.V_u, SL = VL * v.t / v.s, [n, u] = vol(SL), [b, bu] = vol(VL - SL);
        return {lbl: '넣을 스톡', n, u, also: `물이나 시료 <b>${fmt(b)}</b> ${bu}를 더해 총 ${fi(v.V)} ${v.V_n}`, work: `${fi(v.V)} ${v.V_n} × ${fi(v.t)}X ÷ ${fi(v.s)}X = ${fmt(n)} ${u}`, msg: pip(SL)};
      },
      notes: ['효소 반응은 버퍼와 물을 먼저 넣고 효소는 마지막에 넣으세요.', '항생제는 오토클레이브한 배지가 50~55°C 정도로 식은 뒤에 넣으세요.', '6X 로딩 다이는 다이 1 : 시료 5예요(NEB: 최종 부피의 1/6).', '항생제 작업 농도는 자료마다 달라요. 앰피실린 50~100, 카나마이신 30~50, 클로람페니콜 25~34 μg/mL.'],
      abbr: 'TAE(Tris-Acetate-EDTA), PCR(Polymerase Chain Reaction)',
      src: [['Addgene 항생제 표', 'https://www.addgene.org/mol-bio-reference/antibiotics/'], ['NEB 로딩 다이', 'https://www.neb.com/en/protocols/protocol-for-all-dna-loading-dyes-b7024'], PMC('PMC12810670'), PMC('PMC10821221')]},

    {id: 'serial', cat: 'dil', short: '연속 희석', sub: '단계별 희석', title: '연속 희석(serial dilution)', icon: 'tubes',
      kw: '연속 희석 serial dilution 10배 단계 단계희석 표준곡선 standard curve qPCR CFU 도말 튜브 검량선 용량 반응 dose MIC half-log 2배',
      formula: '옮길 양 = 튜브 부피 ÷ 희석 배수, 희석액 = 튜브 부피 − 옮길 양',
      fields: [
        {id: 'df', label: '단계마다 희석 배수', v: '10', unit: '배'},
        {id: 'n', label: '단계 수', v: '6', unit: '단계'},
        {id: 'V', label: '튜브마다 최종 부피', v: '1000', units: U.uL},
        {id: 'd0', label: '시작 시료가 이미 희석된 배수', small: '10 g + 90 mL면 10', v: '1', unit: '배'},
        {id: 'c0', label: '시작 농도', small: '있으면 단계별 농도도', v: '', ph: '예: 1e9', units: [['CFU/mL', 1], ['copies/μL', 1], ['ng/μL', 1], ['μg/mL', 1], ['μM', 1], ['mg/L', 1], ['cells/mL', 1]], opt: true, sci: true, wide: true}],
      chips: [{label: '자주 쓰는 조합', items: [['100 μL + 900 μL', {df: '10', V: '1000', V_u: 0}], ['20 μL + 180 μL', {df: '10', V: '200', V_u: 0}], ['2배씩 100 μL', {df: '2', V: '200', V_u: 0}], ['half-log', {df: '3.162', V: '1000', V_u: 0}]]}],
      calc(v) {
        if (!pos(v.df, v.n, v.V)) return E();
        if (v.df < 1.0001) return E('희석 배수는 1보다 커야 해요.');
        if (!Number.isInteger(v.n) || v.n > 12) return E('단계 수는 1~12 사이 정수로 넣어 주세요.');
        const d0 = pos(v.d0) ? v.d0 : 1, uL = v.V * v.V_u, tr = uL / v.df, dl = uL - tr;
        const p10 = x => Math.abs(Math.log10(x) - Math.round(Math.log10(x))) < 1e-9;
        const lab = i => { const F = d0 * v.df ** i; return F === 1 ? '원액' : (p10(F) ? `10${sup(-Math.round(Math.log10(F)))}` : `1/${fmt(F, 3)}`); };
        const hasC = pos(v.c0), rows = [];
        if (hasC) rows.push(['시작', lab(0), `${fsci(v.c0)} ${v.c0_n}`]);
        for (let i = 1; i <= v.n; i++) rows.push([`${i}번 튜브`, lab(i), hasC ? `${fsci(v.c0 / v.df ** i)} ${v.c0_n}` : '']);
        const [tn, tu] = volUL(tr), [dn, du] = volUL(dl);
        return {lbl: '앞 튜브에서 옮길 양', n: tn, u: tu, also: `튜브마다 희석액 <b>${fmt(dn)}</b> ${du}를 먼저 넣어 두기. 마지막 튜브는 <b>${lab(v.n)}</b>`,
          work: `${fi(uL)} μL ÷ ${fi(v.df)} = ${fmt(tr)} μL 옮기기, 희석액 ${fmt(dl)} μL`,
          table: {head: ['튜브', '전체 희석', hasC ? '농도' : ''], rows}, msg: tr < 1 ? '옮길 양이 1 μL보다 적어요. 튜브 부피를 늘리면 피펫 오차가 줄어요.' : ''};
      },
      notes: ['단계마다 새 팁으로 바꾸고 충분히 섞은 뒤 다음 튜브로 옮기세요.', 'qPCR(quantitative PCR) 표준곡선은 보통 10배씩 5~9단계로 만들어요.', '숫자는 1e9, 1.5×10^9처럼 넣을 수 있어요.'],
      src: [['ASM 연속 희석 프로토콜', 'https://asm.org/protocols/serial-dilution-protocols'], PMC('PMC11729654'), ['qPCR 표준곡선 예 PMC7310081', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7310081/']]},

    // ================= DNA·RNA
    {id: 'abs', cat: 'dna', short: '흡광도', sub: '농도·순도', title: 'A260 농도와 260/280 순도', icon: 'cuvette',
      kw: 'A260 A280 A230 흡광도 나노드롭 nanodrop 농도 순도 purity 260/280 260/230 DNA RNA 큐벳 cuvette 정량 단백질 페놀 구아니딘',
      modes: [{id: 'abs', label: '흡광도 값', formula: '농도(μg/mL) = A260 × 계수 × 희석 배수, 순도 = A260 ÷ A280'}, {id: 'ratio', label: '비율만 (나노드롭)', formula: 'DNA는 260/280 약 1.8, RNA는 약 2.0, 260/230은 2.0~2.2'}],
      fields: [
        {id: 'k', label: '시료 종류', select: [['dsDNA, 계수 50', 50], ['RNA, 계수 40', 40], ['ssDNA, 계수 33', 33]]},
        {id: 'a260', label: 'A260', v: '1.25', modes: ['abs']},
        {id: 'd', label: '희석 배수', small: '안 했으면 1', v: '1', unit: '배', modes: ['abs']},
        {id: 'a280', label: 'A280', small: '순도 보려면', v: '0.68', opt: true, modes: ['abs']},
        {id: 'a230', label: 'A230', small: '있으면', v: '0.60', opt: true, modes: ['abs']},
        {id: 'r1', label: '260/280', v: '1.84', modes: ['ratio']},
        {id: 'r2', label: '260/230', small: '있으면', v: '2.08', opt: true, modes: ['ratio']}],
      calc(v, mode) {
        const rna = v.k === 40;
        const b280 = r => rna ? (r < 1.8 ? ['낮음, 단백질·페놀 의심', 'bad'] : r > 2.2 ? ['높음, 보통 문제 없음', ''] : ['양호', 'ok'])
          : (r < 1.7 ? ['낮음, 단백질·페놀 의심', 'bad'] : r > 2.0 ? ['높음, RNA가 섞였을 수 있음', ''] : ['양호', 'ok']);
        const b230 = r => r < 1.5 ? ['낮음, 염·구아니딘·페놀·다당류 의심', 'bad'] : r < 1.8 ? ['조금 낮음', ''] : r > 2.5 ? ['높음, 블랭크·받침대 확인', ''] : ['양호', 'ok'];
        if (mode === 'ratio') {
          if (!pos(v.r1)) return E();
          return {pair: [{lbl: '260/280', n: v.r1, f: 'f2', badge: b280(v.r1)}, pos(v.r2) ? {lbl: '260/230', n: v.r2, f: 'f2', badge: b230(v.r2)} : {lbl: '260/230', n: NaN, badge: ['값을 넣으면 판정돼요', '']}]};
        }
        if (!pos(v.d) || !Number.isFinite(v.a260) || v.a260 < 0) return E();
        const c = v.a260 * v.k * v.d, checks = [];
        let work = `${fi(v.a260)} × ${v.k} × ${fi(v.d)} = ${fmt(c)} μg/mL`;
        if (pos(v.a280)) { const r = v.a260 / v.a280; checks.push({lbl: '260/280', val: f2(r), badge: b280(r)}); work += `<br>${fi(v.a260)} ÷ ${fi(v.a280)} = ${f2(r)}`; }
        if (pos(v.a230)) { const r = v.a260 / v.a230; checks.push({lbl: '260/230', val: f2(r), badge: b230(r)}); work += `<br>${fi(v.a260)} ÷ ${fi(v.a230)} = ${f2(r)}`; }
        return {lbl: '원래 시료 농도', n: c, u: 'ng/μL', also: `= <b>${fmt(c)}</b> μg/mL`, checks, work,
          msg: v.a260 < 0.1 ? 'A260이 0.1보다 낮으면 농도와 비율 모두 오차가 커요.' : (v.a260 > 1.5 && v.d === 1 ? '큐벳 측정이면 A260이 0.1~1 사이가 되게 희석해서 다시 재 보세요.' : '')};
      },
      notes: ['나노드롭은 농도와 비율을 바로 보여 줘요. 그 비율은 \'비율만\'에 넣어 판정을 보세요.', '260/280이 낮으면 페놀이나 시약 잔여, 또는 시료가 너무 묽은 경우예요. 높은 값은 보통 문제가 아니에요.', '260/230은 1.8~2.2를 기대해요. 낮으면 염, 구아니딘, 페놀, 다당류(식물·토양 시료의 휴믹산 등)가 남았을 수 있어요.', 'ssDNA 계수는 자료에 따라 33~37로 달라요. 올리고는 서열별 흡광계수를 쓰세요.'],
      abbr: 'dsDNA(double-stranded DNA), ssDNA(single-stranded DNA), DNA(Deoxyribonucleic Acid), RNA(Ribonucleic Acid)',
      src: [['Thermo NanoDrop 핵산 가이드', 'https://documents.thermofisher.com/TFS-Assets/CAD/Warranties/Thermo-Scientific-NanoDrop-Products-Nucleic-Acid-Technical-Guide-EN.pdf'], ['Thermo 순도 기술 노트', 'https://documents.thermofisher.com/TFS-Assets/CAD/Product-Bulletins/TN52646-E-0215M-NucleicAcid.pdf'], ['QIAGEN 분광 정량', 'https://www.qiagen.com/us/knowledge-and-support/knowledge-hub/technology-and-research/plasmid-resource-center/reliability%20of%20dna%20quantification%20by%20spectrophotometry'], PMC('PMC3040777'), PMC('PMC13564854')]},

    {id: 'dnadil', cat: 'dna', short: 'DNA·RNA 희석', sub: '양·농도 맞추기', title: 'DNA·RNA를 원하는 농도·양으로', icon: 'helix',
      kw: 'DNA RNA 희석 ng/μL ng/ul 농도 맞추기 주형 template 정규화 normalize ng 넣기 플라스미드 gDNA cDNA 역전사 RT 1 μg Qubit 여러 시료 표 배치 batch 라이브러리',
      modes: [{id: 'amt', label: '필요한 양만큼', formula: '넣을 부피 = 필요한 양 ÷ 지금 농도'}, {id: 'conc', label: '농도 맞추기', formula: '넣을 부피 = 원하는 농도 × 만들 부피 ÷ 지금 농도'}, {id: 'batch', label: '여러 시료 한 번에', formula: '시료마다 넣을 부피 = 필요한 양 ÷ 농도, 물 = 총 부피 − 시료 부피'}],
      fields: [
        {id: 's', label: '지금 농도', v: '125', unit: 'ng/μL', modes: ['amt', 'conc']},
        {id: 'need', label: '필요한 양', v: '50', units: U.ngug, modes: ['amt']},
        {id: 'mx', label: '넣을 수 있는 최대 부피', small: '있으면', v: '', ph: '선택', unit: 'μL', opt: true, modes: ['amt']},
        {id: 't', label: '원하는 농도', v: '10', unit: 'ng/μL', modes: ['conc']},
        {id: 'V', label: '만들 부피', v: '50', unit: 'μL', modes: ['conc']},
        {id: 'list', label: '시료 농도 (ng/μL, 줄마다 하나)', area: true, v: '125\n57.6\n88.2\n12.4', modes: ['batch'], wide: true},
        {id: 'need2', label: '시료마다 필요한 양', v: '1', units: U.ngug, uv: 1, modes: ['batch']},
        {id: 'Vb', label: '총 부피', small: '물로 채움, 선택', v: '10', unit: 'μL', opt: true, modes: ['batch']}],
      calc(v, mode) {
        if (mode === 'batch') {
          const vals = String(v.raw.list || '').split(/[\n;\t]+|\s{2,}/).map(s => s.trim()).filter(Boolean).map(parseNum);
          if (!vals.length || vals.some(x => !pos(x)) || !pos(v.need2)) return E('시료 농도를 줄마다 하나씩 숫자로 넣어 주세요.');
          if (vals.length > 96) return E('한 번에 96개까지 계산돼요.');
          const ng = v.need2 * v.need2_u, Vb = pos(v.Vb) ? v.Vb : NaN; let bad = 0, low = 0;
          const rows = vals.map((c, i) => { const d = ng / c; if (Number.isFinite(Vb) && d > Vb) bad++; if (d < 1) low++;
            return [`${i + 1}`, fmt(c), Number.isFinite(Vb) && d > Vb ? '부족' : fmt(d, 3), Number.isFinite(Vb) ? (d > Vb ? '–' : fmt(Vb - d, 3)) : '']; });
          const msgs = [];
          if (bad) msgs.push(`${bad}개 시료는 농도가 낮아서 총 부피 안에 다 못 넣어요.`);
          if (low) msgs.push(`${low}개 시료는 1 μL보다 적게 넣어야 해요. 먼저 희석하면 정확해요.`);
          return {lbl: '계산한 시료', n: vals.length, f: 'int', u: '개', also: `시료마다 <b>${fmt(v.need2)} ${v.need2_n}</b>씩${Number.isFinite(Vb) ? `, 물로 채워 총 ${fi(Vb)} μL` : ''}`,
            table: {head: ['#', 'ng/μL', '시료 μL', Number.isFinite(Vb) ? '물 μL' : ''], rows}, msg: msgs.join(' ')};
        }
        if (mode === 'conc') {
          if (!pos(v.s, v.t, v.V)) return E();
          if (v.t > v.s) return E('원하는 농도가 지금보다 진해요. 농축하지 않으면 만들 수 없어요.');
          const d = v.t * v.V / v.s;
          return {lbl: '넣을 시료', n: d, u: 'μL', also: `물이나 TE <b>${fmt(v.V - d)}</b> μL를 더해 총 ${fi(v.V)} μL`, work: `${fi(v.t)} ng/μL × ${fi(v.V)} μL ÷ ${fi(v.s)} ng/μL = ${fmt(d)} μL`, msg: d < 1 ? PIPETTE : ''};
        }
        if (!pos(v.s, v.need)) return E();
        const ng = v.need * v.need_u, d = ng / v.s;
        return {lbl: '넣을 시료', n: d, u: 'μL', work: `${fi(ng)} ng ÷ ${fi(v.s)} ng/μL = ${fmt(d)} μL`,
          msg: pos(v.mx) && d > v.mx ? `최대 ${fi(v.mx)} μL보다 많아요. 시료를 농축하거나 필요한 양을 줄이세요.` : (d < 1 ? PIPETTE : '')};
      },
      notes: ['오래 둘 DNA는 물보다 TE(Tris-EDTA)나 10 mM Tris-HCl(pH 8.0~8.5)에 두는 게 안정적이에요.', 'ng/μL와 μg/mL는 같은 값이에요.', '여러 시료는 엑셀에서 농도 열을 복사해 붙여 넣으면 돼요.'],
      src: [['NEBioCalculator 희석', 'https://nebiocalculator.neb.com/#!/dilution'], PMC('PMC10295270'), PMC('PMC10609274')]},

    {id: 'copies', cat: 'dna', short: '카피 수', sub: 'qPCR 표준', title: 'DNA 양으로 카피 수 계산', icon: 'curve',
      kw: '카피 copy number copies qPCR 표준곡선 standard curve 아보가드로 avogadro 플라스미드 gBlock 정량 Ct Cq SYBR 16S',
      formula: '카피/μL = 농도(ng/μL) × 6.022×10²³ ÷ (길이 × 질량/염기 × 10⁹)',
      fields: [
        {id: 'c', label: 'DNA 농도', v: '2.5', unit: 'ng/μL'},
        {id: 'L', label: '길이', small: '플라스미드는 전체 길이', v: '3000', unit: 'bp'},
        {id: 'k', label: '종류', select: [['dsDNA, 660 g/mol/bp (IDT·Thermo)', 660], ['dsDNA, 650 g/mol/bp', 650], ['ssDNA, 330 g/mol/nt (IDT)', 330], ['RNA, 320.5 g/mol/nt (Thermo)', 320.5]]},
        {id: 'tg', label: '목표 카피 수', small: '있으면 희석 배수도', v: '', ph: '예: 1e8', unit: 'copies/μL', opt: true, sci: true, wide: true}],
      calc(v) {
        if (!pos(v.c, v.L)) return E();
        const cp = v.c * 6.022e23 / (v.L * v.k * 1e9);
        let also = '';
        if (pos(v.tg)) also = cp >= v.tg ? `목표 ${fsci(v.tg)}로 만들려면 <b>${fmt(cp / v.tg, 4)}</b>배 희석` : '목표가 지금보다 진해요.';
        return {lbl: '카피 수', n: cp, f: 'sci', u: 'copies/μL', also, work: `${fi(v.c)} × 6.022×10²³ ÷ (${fint(v.L)} × ${v.k} × 10⁹) = ${fsci(cp)}`};
      },
      notes: ['IDT와 Thermo는 염기쌍 하나를 660 g/mol로 계산해요. 650을 쓰는 논문도 있어요(차이 약 1.5%). 논문에는 쓴 값을 적으세요.', '플라스미드 표준은 insert만이 아니라 벡터를 포함한 전체 길이를 넣으세요.', '목표 농도까지 한 번에 희석하기보다 연속 희석으로 단계를 나누세요. 숫자는 1e8, 1×10^8처럼 넣을 수 있어요.'],
      src: [['IDT ng → 카피 수', 'https://www.idtdna.com/pages/education/decoded/article/calculations-converting-from-nanograms-to-copy-number'], ['Thermo 표준곡선 노트', 'https://documents.thermofisher.com/TFS-Assets/LSG/Application-Notes/cms_042486.pdf'], ['논문 예 PMC11596038 (650)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11596038/'], ['논문 예 PMC11205478 (660)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11205478/']]},

    {id: 'pmol', cat: 'dna', short: 'DNA 몰 수', sub: 'ng ↔ pmol · nM', title: 'dsDNA 질량과 몰 수 바꾸기', icon: 'pair',
      kw: 'pmol fmol ng 몰 mole 변환 Gibson HiFi assembly 조립 dsDNA 질량 nM 라이브러리 library 풀링 pooling 시퀀싱 Illumina',
      modes: [{id: 'n2p', label: 'ng → pmol', formula: 'pmol = ng × 1,000 ÷ (bp × 615.94 + 36.04)'}, {id: 'p2n', label: 'pmol → ng', formula: 'ng = pmol × (bp × 615.94 + 36.04) ÷ 1,000'}, {id: 'nm', label: 'ng/μL → nM', formula: 'nM = ng/μL × 10⁶ ÷ (660 × 평균 길이 bp)'}],
      fields: [
        {id: 'ng', label: 'DNA 양', v: '50', unit: 'ng', modes: ['n2p']},
        {id: 'pm', label: '원하는 양', v: '0.05', unit: 'pmol', modes: ['p2n']},
        {id: 'cc', label: '농도', v: '18.5', unit: 'ng/μL', modes: ['nm']},
        {id: 'L', label: '길이', small: '라이브러리는 평균 길이', v: '3000', unit: 'bp'}],
      calc(v, mode) {
        if (!pos(v.L)) return E();
        if (mode === 'nm') {
          if (!pos(v.cc)) return E();
          const nM = v.cc * 1e6 / (660 * v.L);
          return {lbl: '몰 농도', n: nM, u: 'nM', work: `${fi(v.cc)} × 10⁶ ÷ (660 × ${fint(v.L)}) = ${fmt(nM)} nM`};
        }
        const mw = v.L * 615.94 + 36.04;
        if (mode === 'n2p') {
          if (!pos(v.ng)) return E();
          const p = v.ng * 1000 / mw;
          return {lbl: 'DNA 몰 수', n: p, u: 'pmol', also: `= <b>${fmt(p * 1000)}</b> fmol`, work: `${fi(v.ng)} ng × 1,000 ÷ (${fint(v.L)} × 615.94 + 36.04) = ${fmt(p)} pmol`};
        }
        if (!pos(v.pm)) return E();
        const ng = v.pm * mw / 1000;
        return {lbl: '필요한 DNA', n: ng, u: 'ng', work: `${fi(v.pm)} pmol × ${fint(mw)} ÷ 1,000 = ${fmt(ng)} ng`};
      },
      notes: ['ng↔pmol은 현재 NEBioCalculator(NEB, New England Biolabs)와 같은 식이에요. bp × 650이나 660으로 계산하는 자료와는 최대 7% 정도 차이가 나요.', 'ng/μL → nM은 IDT·Thermo와 같은 660 g/mol/bp 기준이에요.', 'Gibson·HiFi 조립은 조각마다 0.02~0.5 pmol 정도를 넣어요.'],
      src: [['NEBioCalculator dsDNA', 'https://nebiocalculator.neb.com/#!/dsdnaamt'], ['NEB 핵산 데이터', 'https://www.neb.com/en-us/tools-and-resources/usage-guidelines/nucleic-acid-data'], PMC('PMC10493593')]},

    {id: 'qeff', cat: 'dna', short: 'qPCR 효율', sub: '기울기 · Cq', title: 'qPCR 표준곡선 효율과 정량', icon: 'growth',
      kw: 'qPCR 효율 efficiency 기울기 slope 표준곡선 standard curve Ct Cq 절편 intercept 정량 카피 real-time',
      modes: [{id: 'eff', label: '효율', formula: '효율(%) = (10^(−1/기울기) − 1) × 100'}, {id: 'cq', label: 'Cq → 카피', formula: '카피 = 10^((Cq − 절편) ÷ 기울기)'}],
      fields: [
        {id: 'sl', label: '표준곡선 기울기', small: '음수', v: '-3.32'},
        {id: 'b', label: '절편', small: 'y절편', v: '38.0', modes: ['cq']},
        {id: 'cq', label: '시료 Cq', v: '24.5', modes: ['cq']}],
      calc(v, mode) {
        if (!Number.isFinite(v.sl) || v.sl >= 0) return E('기울기는 음수로 넣어 주세요 (예: −3.32).');
        const eff = (10 ** (-1 / v.sl) - 1) * 100;
        if (mode === 'eff') return {lbl: '증폭 효율', n: eff, u: '%', also: `증폭 배수 <b>${fmt(10 ** (-1 / v.sl), 4)}</b>배/사이클`, work: `(10^(−1 ÷ ${fi(v.sl)}) − 1) × 100 = ${fmt(eff, 4)}%`,
          msg: eff < 90 || eff > 110 ? '흔히 90~110%를 좋은 표준곡선으로 봐요. 희석 단계나 억제제를 확인해 보세요.' : ''};
        if (!Number.isFinite(v.b) || !Number.isFinite(v.cq)) return E();
        const cp = 10 ** ((v.cq - v.b) / v.sl);
        return {lbl: '시료 카피 수', n: cp, f: 'sci', u: 'copies/반응', also: `효율 ${fmt(eff, 3)}%`, work: `10^((${fi(v.cq)} − ${fi(v.b)}) ÷ ${fi(v.sl)}) = ${fsci(cp)}`};
      },
      notes: ['기울기 −3.32가 효율 100%예요.', '표준곡선 범위 밖의 Cq는 추정값이라 믿기 어려워요.'],
      src: [PMC('PMC7310081')]},

    {id: 'ddct', cat: 'dna', short: 'ΔΔCt', sub: '상대 발현량', title: 'ΔΔCt 상대 정량', icon: 'bars',
      kw: 'ddCt ΔΔCt delta delta Ct Cq 2^-ΔΔCt Livak Pfaffl 상대 정량 relative quantification 발현 배수 fold change qPCR RT-qPCR 기준 유전자 reference housekeeping 16S GAPDH',
      modes: [{id: 'livak', label: '2^−ΔΔCt', formula: '배수 = 2^−ΔΔCt, ΔΔCt = (타깃 − 기준)처리군 − (타깃 − 기준)대조군'},
        {id: 'pfaffl', label: '효율 보정', formula: '배수 = E타깃^(대조군 Ct − 처리군 Ct) ÷ E기준^(대조군 Ct − 처리군 Ct)'}],
      fields: [
        {id: 'ct', label: '대조군 타깃 Ct', v: '25.0'},
        {id: 'cr', label: '대조군 기준 유전자 Ct', v: '18.0'},
        {id: 'tt', label: '처리군 타깃 Ct', v: '23.0'},
        {id: 'tr', label: '처리군 기준 유전자 Ct', v: '18.1'},
        {id: 'et', label: '타깃 증폭 효율', v: '95', unit: '%', modes: ['pfaffl']},
        {id: 'er', label: '기준 유전자 증폭 효율', v: '102', unit: '%', modes: ['pfaffl']}],
      calc(v, mode) {
        if (!pos(v.ct, v.cr, v.tt, v.tr)) return E();
        const dC = v.ct - v.cr, dT = v.tt - v.tr, dd = dT - dC;
        const dir = x => x >= 1 ? '' : `, 대조군의 <b>1/${fmt(1 / x, 3)}</b>로 감소`;
        if (mode === 'pfaffl') {
          if (!pos(v.et, v.er)) return E();
          const Et = 1 + v.et / 100, Er = 1 + v.er / 100, r = Et ** (v.ct - v.tt) / Er ** (v.cr - v.tr);
          return {lbl: '발현 배수 (처리군 ÷ 대조군)', n: +r.toPrecision(4), u: '배', also: `효율이 둘 다 100%일 때는 <b>${fmt(2 ** -dd, 3)}</b>배${dir(r)}`,
            work: `E타깃 = 1 + ${fi(v.et)}% = ${fmt(Et, 4)}, E기준 = ${fmt(Er, 4)}<br>${fmt(Et, 4)}^(${fi(v.ct)} − ${fi(v.tt)}) ÷ ${fmt(Er, 4)}^(${fi(v.cr)} − ${fi(v.tr)}) = ${fmt(r, 4)}`,
            msg: [v.et, v.er].some(x => x < 90 || x > 110) ? '증폭 효율은 흔히 90~110%를 좋은 범위로 봐요. 표준곡선을 다시 확인해 보세요.' : ''};
        }
        const fold = 2 ** -dd;
        return {lbl: '발현 배수 (처리군 ÷ 대조군)', n: +fold.toPrecision(4), u: '배', also: `ΔΔCt <b>${fmt(dd, 4)}</b>${dir(fold)}`,
          work: `ΔCt 대조군 = ${fi(v.ct)} − ${fi(v.cr)} = ${fmt(dC, 4)}<br>ΔCt 처리군 = ${fi(v.tt)} − ${fi(v.tr)} = ${fmt(dT, 4)}<br>ΔΔCt = ${fmt(dT, 4)} − ${fmt(dC, 4)} = ${fmt(dd, 4)}, 2^−(${fmt(dd, 4)}) = ${fmt(fold, 4)}`};
      },
      notes: ['Ct는 반복 측정의 평균을 넣으세요.', '2^−ΔΔCt는 타깃과 기준 유전자의 증폭 효율이 둘 다 100%에 가깝고 서로 비슷할 때 쓰는 방법이에요. 다르면 효율 보정으로 계산하세요.', '효율은 표준곡선 기울기에서 구해요. qPCR 효율 계산기에서 나온 % 값을 그대로 넣으면 돼요.', '기준 유전자는 처리해도 발현이 변하지 않는 유전자여야 해요.'],
      abbr: 'Ct(Cycle threshold), Cq(Quantification cycle)와 같은 값',
      src: [['Livak·Schmittgen 2001', 'https://pubmed.ncbi.nlm.nih.gov/11846609/'], ['Pfaffl 2001', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC55695/']]},

    // ================= PCR·클로닝
    {id: 'primer', cat: 'pcr', short: '프라이머', sub: '100 μM 스톡', title: '프라이머 녹이기와 작업액', icon: 'tube',
      kw: '프라이머 primer oligo 올리고 nmol 100 μM uM 10 μM 녹이기 resuspend 스톡 작업액 IDT 마크로젠 바이오니아',
      formula: '넣을 물(μL) = nmol × 1,000 ÷ 만들 농도(μM)',
      fields: [
        {id: 'n', label: '튜브에 적힌 양', v: '31.2', unit: 'nmol'},
        {id: 'c', label: '만들 스톡 농도', v: '100', unit: 'μM'},
        {id: 'wc', label: '작업액 농도', v: '10', unit: 'μM'},
        {id: 'wv', label: '작업액 부피', v: '100', unit: 'μL'}],
      calc(v) {
        if (!pos(v.n, v.c)) return E();
        const uL = v.n * 1000 / v.c;
        const out = {lbl: '튜브에 넣을 물(또는 TE)', n: uL, u: 'μL', work: `${fi(v.n)} nmol × 1,000 ÷ ${fi(v.c)} μM = ${fmt(uL)} μL`};
        if (pos(v.wc, v.wv)) {
          if (v.wc > v.c) out.second = {lbl: '작업액에 넣을 스톡', n: NaN, u: 'μL', also: '작업액이 스톡보다 진해요.'};
          else { const s = v.wc * v.wv / v.c; out.second = {lbl: '작업액에 넣을 스톡', n: s, u: 'μL', also: `물 <b>${fmt(v.wv - s)}</b> μL를 더해 총 ${fi(v.wv)} μL`, work: `${fi(v.wc)} μM × ${fi(v.wv)} μL ÷ ${fi(v.c)} μM = ${fmt(s)} μL`}; if (s < 1) out.msg = PIPETTE; }
        }
        return out;
      },
      notes: ['녹이기 전에 튜브를 스핀다운하세요. 가루가 뚜껑에 붙어 있어요.', '라벨의 OD나 μg가 아니라 nmol 숫자를 넣으세요.', '스톡은 IDTE(TE)나 nuclease-free 물에 녹이고, 잘 안 녹으면 55°C에 잠깐 두세요.'],
      src: [['IDT 올리고 녹이기', 'https://www.idtdna.com/page/support-and-education/decoded-plus/tips-for-resuspending-and-diluting-your-oligonucleotides'], ['IDT FAQ', 'https://www.idtdna.com/pages/support/faqs/how-do-i-dilute-my-primers-'], PMC('PMC13073342')]},

    {id: 'tm', cat: 'pcr', short: '프라이머 Tm', sub: 'GC% · 역상보', title: '프라이머 Tm과 GC%', icon: 'thermo',
      kw: 'Tm melting temperature 녹는 온도 프라이머 primer GC GC% 길이 역상보 reverse complement 상보 서열 annealing 어닐링 nearest neighbor SantaLucia',
      formula: 'Tm = ΔH ÷ (ΔS + R × ln(프라이머 농도 ÷ 4)) − 273.15',
      fields: [
        {id: 'seq', label: '프라이머 서열', small: '5′ → 3′, A C G T', v: 'AGAGTTTGATCCTGGCTCAG', wide: true, sci: true},
        {id: 'pc', label: '프라이머 농도', small: '반응액에서', v: '500', unit: 'nM'},
        {id: 'na', label: '1가 양이온', small: 'Na⁺, K⁺', v: '50', unit: 'mM'}],
      calc(v) {
        const seq = String(v.raw.seq || '').toUpperCase().replace(/[53]['′’]/g, '').replace(/[^A-Z]/g, '');
        if (!seq) return E('서열을 넣어 주세요 (예: AGAGTTTGATCCTGGCTCAG).');
        if (/[^ACGT]/.test(seq)) return E('A, C, G, T만 넣어 주세요. N, R, Y 같은 섞인 염기는 계산하지 못해요.');
        if (seq.length < 8) return E('8 nt 이상인 서열을 넣어 주세요.');
        if (!pos(v.pc, v.na)) return E();
        const N = seq.length, gc = (seq.match(/[GC]/g) || []).length;
        const rc = seq.split('').reverse().map(b => ({A: 'T', T: 'A', G: 'C', C: 'G'})[b]).join('');
        const NN = {AA: [-7.9, -22.2], TT: [-7.9, -22.2], AT: [-7.2, -20.4], TA: [-7.2, -21.3], CA: [-8.5, -22.7], TG: [-8.5, -22.7], GT: [-8.4, -22.4], AC: [-8.4, -22.4],
          CT: [-7.8, -21.0], AG: [-7.8, -21.0], GA: [-8.2, -22.2], TC: [-8.2, -22.2], CG: [-10.6, -27.2], GC: [-9.8, -24.4], GG: [-8.0, -19.9], CC: [-8.0, -19.9]};
        let dH = 0, dS = 0;
        for (const e of [seq[0], seq[N - 1]]) { const t = e === 'G' || e === 'C' ? [0.1, -2.8] : [2.3, 4.1]; dH += t[0]; dS += t[1]; }
        for (let i = 0; i < N - 1; i++) { const t = NN[seq.slice(i, i + 2)]; dH += t[0]; dS += t[1]; }
        const self = seq === rc; if (self) dS += -1.4;
        dS += 0.368 * (N - 1) * Math.log(v.na / 1000);
        const tm = dH * 1000 / (dS + 1.987 * Math.log(v.pc * 1e-9 / (self ? 1 : 4))) - 273.15;
        return {lbl: 'Tm', n: Math.round(tm * 10) / 10, u: '°C', also: `길이 <b>${N}</b> nt, GC <b>${fmt(gc / N * 100, 3)}</b>% (G+C ${gc}개)`,
          work: `ΔH = ${fmt(dH, 4)} kcal/mol, ΔS = ${fmt(dS, 4)} cal/(K·mol)<br>역상보 5′-${rc}-3′`,
          msg: N > 60 ? '60 nt가 넘으면 이 방식의 오차가 커져요.' : (self ? '자기 자신과 상보적인 서열이에요. 프라이머끼리 붙을 수 있어요.' : '')};
      },
      notes: ['최근접 이웃법(SantaLucia 1998)에 Na⁺ 보정을 넣은 값이에요. 같은 조건에서 Primer3와 같은 값이 나와요.', '같은 서열도 계산 방식과 염, 프라이머 농도에 따라 Tm이 몇 °C씩 달라요. 어닐링 온도는 쓰는 중합효소 회사의 계산기로 정하세요.', 'Mg²⁺와 dNTP 보정은 넣지 않았어요.'],
      abbr: 'Tm(Melting temperature, 이중 가닥의 절반이 풀리는 온도), GC%(G와 C의 비율), nt(nucleotide)',
      src: [['SantaLucia 1998', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC19045/'], ['Primer3 설명서', 'https://primer3.org/manual.html']]},

    {id: 'mmix', cat: 'pcr', short: '마스터믹스', sub: 'n개 + 여유분', title: 'PCR 마스터믹스 만들기', icon: 'rack',
      kw: '마스터믹스 master mix PCR 반응 여러 개 reaction 여유분 extra 프라이머 2X Taq Q5 qPCR 세팅 RT 역전사 cDNA 제한효소 digest colony PCR 96',
      formula: '시약별 총량 = 반응 1개 양 × 반응 수 × (1 + 여유분)',
      fields: [
        {id: 'n', label: '시료 수', small: '대조군 포함', v: '8', unit: '개'},
        {id: 'rep', label: '반복', v: '1', unit: '번'},
        {id: 'ex', label: '여유분', v: '10', unit: '%'},
        {id: 'V', label: '반응 1개 부피', v: '20', unit: 'μL'},
        {id: 'mm', label: '믹스·버퍼', small: '예: 2X 마스터믹스', v: '10', unit: 'μL'},
        {id: 'pc', label: '프라이머 스톡', v: '10', unit: 'μM'},
        {id: 'f', label: '프라이머 F', v: '1', unit: 'μL'},
        {id: 'r', label: '프라이머 R', v: '1', unit: 'μL'},
        {id: 'oth', label: '기타 시약', small: '있으면', v: '', ph: '0', unit: 'μL', opt: true},
        {id: 'tp', label: '주형', small: '튜브마다 따로', v: '1', unit: 'μL'}],
      chips: [{label: 'NEB 프로토콜', items: [['Q5 2X 20 μL', {V: '20', mm: '10', pc: '10', f: '1', r: '1', tp: '1'}], ['Q5 2X 50 μL', {V: '50', mm: '25', pc: '10', f: '2.5', r: '2.5', tp: '1'}], ['Taq 2X 25 μL', {V: '25', mm: '12.5', pc: '10', f: '0.5', r: '0.5', tp: '1'}]]}],
      calc(v) {
        if (!pos(v.n, v.V, v.mm) || !(v.ex >= 0) || [v.f, v.r, v.tp].some(x => !(x >= 0))) return E();
        const rep = pos(v.rep) ? v.rep : 1, oth = pos(v.oth) ? v.oth : 0, w = v.V - (v.mm + v.f + v.r + v.tp + oth);
        if (w < -1e-9) return E('반응 1개 부피보다 넣는 양이 많아요. 시약 양을 확인해 주세요.');
        const N = v.n * rep, k = N * (1 + v.ex / 100), per = v.V - v.tp;
        const rows = [['믹스·버퍼', fmt(v.mm), fmt(v.mm * k)], ['프라이머 F', fmt(v.f), fmt(v.f * k)], ['프라이머 R', fmt(v.r), fmt(v.r * k)]];
        if (oth) rows.push(['기타 시약', fmt(oth), fmt(oth * k)]);
        rows.push(['물', fmt(w), fmt(w * k)], ['합계', fmt(per), fmt(per * k)]);
        const fin = pos(v.pc) ? `, 프라이머 최종 <b>${fmt(v.f * v.pc / v.V, 3)}</b> μM` : '';
        return {lbl: '마스터믹스 총량', n: per * k, u: 'μL', also: `튜브마다 마스터믹스 <b>${fmt(per)}</b> μL + 주형 ${fi(v.tp)} μL${fin}`,
          work: `${fi(v.n)}개 × ${fi(rep)}번 × (1 + ${fi(v.ex)}%) = ${fmt(k)}개 분량`, table: {head: ['시약', '1개 (μL)', '총량 (μL)'], rows}};
      },
      notes: ['주형은 튜브마다 따로 넣고, 음성 대조군 NTC(No Template Control)에는 주형 대신 물을 넣으세요.', '여유분은 피펫 손실을 메우는 몫이에요. Eppendorf는 10% 이상(10개면 11개분)을 권해요.', '프라이머 최종 농도는 효소마다 달라요. Q5는 0.5 μM, Taq은 0.2 μM이 기본이에요.'],
      src: [['NEB Q5 2X', 'https://www.neb.com/en/protocols/protocol-for-q5-high-fidelity-2x-master-mix-m0492'], ['NEB Taq 2X', 'https://www.neb.com/en/protocols/protocol-for-taq-2x-master-mix-m0270'], ['Eppendorf 마스터믹스', 'https://www.eppendorf.com/fi-en/lab-academy/life-science/molecular-biology/what-should-be-considered-when-pipetting-pcr-mixtures'], PMC('PMC12644955')]},

    {id: 'lig', cat: 'pcr', short: '라이게이션', sub: 'insert 양', title: '라이게이션 insert 양', icon: 'ligate',
      kw: '라이게이션 ligation insert vector 벡터 몰비 ratio 3:1 클로닝 cloning T4',
      formula: 'insert ng = 몰비 × vector ng × (insert bp ÷ vector bp)',
      fields: [
        {id: 'vb', label: 'vector 길이', v: '3000', unit: 'bp'},
        {id: 'vn', label: 'vector 양', v: '50', unit: 'ng'},
        {id: 'ib', label: 'insert 길이', v: '1000', unit: 'bp'},
        {id: 'r', label: '몰비 insert : vector', v: '3', unit: ': 1'},
        {id: 'ic', label: 'insert 농도', small: '있으면 부피도', v: '25', unit: 'ng/μL', opt: true}],
      chips: [{label: '몰비', items: [['1 : 1', {r: '1'}], ['2 : 1', {r: '2'}], ['3 : 1', {r: '3'}], ['5 : 1', {r: '5'}], ['7 : 1', {r: '7'}]]}],
      calc(v) {
        if (!pos(v.vb, v.vn, v.ib, v.r)) return E();
        const ng = v.r * v.vn * (v.ib / v.vb);
        const out = {lbl: '넣을 insert', n: ng, u: 'ng', work: `${fi(v.r)} × ${fi(v.vn)} ng × (${fint(v.ib)} ÷ ${fint(v.vb)}) = ${fmt(ng)} ng`};
        if (pos(v.ic)) { const uL = ng / v.ic; out.also = `${fi(v.ic)} ng/μL 기준 <b>${fmt(uL)}</b> μL`; if (uL < 1) out.msg = PIPETTE; }
        return out;
      },
      notes: ['insert : vector = 3 : 1이 흔한 시작점이에요. NEB 프로토콜은 같은 뜻을 vector : insert = 1 : 3으로 적어요.', 'vector는 20~30 fmol(4 kb 기준 약 50 ng), 반응 전체 DNA는 1~10 ng/μL가 좋아요.'],
      src: [['NEBioCalculator 라이게이션', 'https://nebiocalculator.neb.com/#!/ligation'], ['NEB T4 ligase 프로토콜', 'https://www.neb.com/en/protocols/dna-ligation-with-t4-dna-ligase-m0202'], PMC('PMC13032867')]},

    {id: 'teff', cat: 'pcr', short: '형질전환 효율', sub: 'CFU/μg', title: '형질전환 효율', icon: 'plasmid',
      kw: '형질전환 transformation 효율 efficiency competent cell 컴피턴트 CFU/μg pUC19 콜로니',
      formula: '효율(CFU/μg) = 콜로니 수 ÷ 판에 올라간 DNA(μg)',
      fields: [
        {id: 'col', label: '콜로니 수', v: '150', unit: '개'},
        {id: 'dna', label: '넣은 DNA', v: '100', units: U.dna, uv: 0},
        {id: 'tot', label: '회복 후 전체 부피', small: '세포 + SOC', v: '300', unit: 'μL'},
        {id: 'pl', label: '도말한 부피', v: '30', unit: 'μL'},
        {id: 'dil', label: '도말 전 희석 배수', small: '안 했으면 1', v: '100', unit: '배'}],
      calc(v) {
        if (!pos(v.col, v.dna, v.tot, v.pl, v.dil)) return E();
        if (v.pl > v.tot) return E('도말한 부피가 전체 부피보다 커요.');
        const ug = v.dna * v.dna_u * (v.pl / v.tot) / v.dil, eff = v.col / ug;
        return {lbl: '형질전환 효율', n: eff, f: 'sci', u: 'CFU/μg', also: `판에 올라간 DNA <b>${fsci(ug)}</b> μg`,
          work: `${fint(v.col)} ÷ (${fi(v.dna * v.dna_u)} μg × ${fi(v.pl)}/${fi(v.tot)} ÷ ${fi(v.dil)}) = ${fsci(eff)} CFU/μg`,
          msg: v.col < 30 || v.col > 300 ? '콜로니가 30~300개 범위 밖이에요. 범위에 든 판으로 세면 더 정확해요.' : ''};
      },
      notes: ['예시 숫자는 NEB 예시예요(pUC19 100 pg, 세포+SOC 300 μL, 10 μL를 1 mL로 희석해 30 μL 도말).', '전체 부피는 SOC만이 아니라 세포 + SOC예요.', '라이게이션 산물은 온전한 플라스미드보다 콜로니가 10~100배 적게 나와요.'],
      src: [['NEB 효율 계산', 'https://www.neb.com/en-us/faqs/how-should-i-calculate-the-transformation-efficiency-c2992'], ['Thermo DH5α 설명서', 'https://documents.thermofisher.com/TFS-Assets/LSG/manuals/MAN0018520_DH5alpha_competent_cells_UG.pdf'], ['Promega TB095', 'https://www.promega.com/-/media/files/resources/protocols/technical-bulletins/0/e-coli-competent-cells-protocol.pdf'], PMC('PMC7349126')],
      abbr: 'SOC(Super Optimal broth with Catabolite repression)'},

    // ================= 단백질
    {id: 'page', cat: 'prot', short: 'SDS-PAGE 겔', sub: '겔 조성', title: 'SDS-PAGE 겔 만들기', icon: 'gel',
      kw: 'SDS-PAGE SDS PAGE 겔 gel 아크릴아마이드 acrylamide 분리겔 resolving separating 농축겔 stacking 웨스턴 western 단백질 전기영동 APS TEMED Tris Laemmli',
      modes: [{id: 'res', label: '분리겔', formula: '아크릴아마이드(mL) = 겔 % ÷ 스톡 % × 만들 부피'}, {id: 'stk', label: '농축겔', formula: '아크릴아마이드(mL) = 겔 % ÷ 스톡 % × 만들 부피'}],
      fields: [
        {id: 'p', label: '분리겔 농도', v: '12', unit: '%', modes: ['res']},
        {id: 'ps', label: '농축겔 농도', v: '4', unit: '%', modes: ['stk']},
        {id: 'V', label: '만들 부피', v: '10', unit: 'mL'},
        {id: 'st', label: '아크릴아마이드 스톡', select: [['30% 아크릴아마이드/비스', 30], ['40% 아크릴아마이드/비스', 40]]},
        {id: 'ts', label: '농축겔용 Tris 스톡', select: [['0.5 M Tris-HCl pH 6.8', 0.5], ['1.0 M Tris-HCl pH 6.8', 1]], modes: ['stk']}],
      chips: [{label: '분리겔 농도', modes: ['res'], items: [['8%', {p: '8'}], ['10%', {p: '10'}], ['12%', {p: '12'}], ['15%', {p: '15'}]]}],
      calc(v, mode) {
        const stk = mode === 'stk', p = stk ? v.ps : v.p;
        if (!pos(p, v.V)) return E();
        const acr = p / v.st * v.V, tris = stk ? 0.125 * v.V / v.ts : v.V / 4, sds = v.V / 100, aps = v.V / 100, tem = v.V / 1000, w = v.V - acr - tris - sds - aps - tem;
        if (w < -1e-9) return E('이 스톡으로는 그 농도를 만들 수 없어요. 겔 농도를 낮추거나 더 진한 스톡을 쓰세요.');
        const q = mL => mL >= 1 ? `${fmt(mL, 3)} mL` : `${fmt(mL * 1000, 3)} μL`;
        const trisName = stk ? `${v.ts === 1 ? '1.0' : '0.5'} M Tris-HCl pH 6.8` : '1.5 M Tris-HCl pH 8.8';
        return {lbl: `넣을 ${v.st}% 아크릴아마이드`, n: +acr.toPrecision(3), u: 'mL', also: `${stk ? '농축겔' : '분리겔'} <b>${fi(p)}</b>%, 총 ${fi(v.V)} mL`,
          work: `${fi(p)}% ÷ ${v.st}% × ${fi(v.V)} mL = ${fmt(acr, 3)} mL`,
          table: {head: ['넣는 순서', '양'], rows: [['물', q(w)], [`${v.st}% 아크릴아마이드/비스`, q(acr)], [trisName, q(tris)], ['10% SDS', q(sds)], ['10% APS', q(aps)], ['TEMED', q(tem)], ['합계', q(v.V)]]}};
      },
      notes: ['APS와 TEMED는 맨 마지막에 넣으세요. 넣으면 바로 굳기 시작해요.', 'TEMED 양은 프로토콜마다 10 mL당 4~10 μL로 달라요. 여기서는 시그마 표를 따라 10 μL로 계산해요.', '분리겔은 최종 0.375 M Tris pH 8.8, 농축겔은 0.125 M Tris pH 6.8, SDS와 APS는 각각 0.1%가 되게 계산해요.', '굳기 전의 아크릴아마이드는 신경독성이 있어요. 장갑을 끼고 다루세요.'],
      abbr: 'SDS-PAGE(Sodium Dodecyl Sulfate–Polyacrylamide Gel Electrophoresis), APS(Ammonium Persulfate), TEMED(N,N,N′,N′-Tetramethylethylenediamine)',
      src: [['Sigma SDS-PAGE', 'https://www.sigmaaldrich.com/US/en/technical-documents/protocol/protein-biology/gel-electrophoresis/sds-page'], PMC('PMC4889332')]},

    // ================= 균 배양
    {id: 'cfu', cat: 'cult', short: 'CFU', sub: '균 수 세기', title: 'CFU 계산', icon: 'dish',
      kw: 'CFU CFU/g colony forming unit 콜로니 균 수 도말 plating 희석 평판 spot 스팟 식품 일반세균 표준평판 집락',
      modes: [{id: 'one', label: '한 희석 단계', formula: 'CFU = 콜로니 수 × 10ⁿ ÷ 도말량(mL)'}, {id: 'two', label: '두 단계 가중평균', formula: 'N = 콜로니 합 ÷ ((앞 단계 판 수 + 0.1 × 뒤 단계 판 수) × 10⁻ⁿ × 도말량)'}],
      fields: [
        {id: 'per', label: '시료', select: [['액체 시료 (CFU/mL)', 'mL'], ['고체 시료 (CFU/g)', 'g']]},
        {id: 'n1', label: '센 콜로니 수', v: '152', unit: '개', modes: ['one']},
        {id: 'n2', label: '같은 희석 판 하나 더', small: '있으면', v: '', ph: '선택', unit: '개', opt: true, modes: ['one']},
        {id: 'd', label: '희석 단계 n', small: '10⁻ⁿ의 n, 10⁻⁶이면 6', v: '6', pre: '10⁻'},
        {id: 'a1', label: '10⁻ⁿ 판 1', v: '232', unit: '개', modes: ['two']},
        {id: 'a2', label: '10⁻ⁿ 판 2', small: '있으면', v: '244', unit: '개', opt: true, modes: ['two']},
        {id: 'b1', label: '10⁻⁽ⁿ⁺¹⁾ 판 1', v: '33', unit: '개', modes: ['two']},
        {id: 'b2', label: '10⁻⁽ⁿ⁺¹⁾ 판 2', small: '있으면', v: '28', unit: '개', opt: true, modes: ['two']},
        {id: 'p', label: '도말량', v: '100', units: [['μL', 1e-3], ['mL', 1]]}],
      calc(v, mode) {
        const unit = `CFU/${v.per}`;
        if (!Number.isFinite(v.d)) return E();
        if (!Number.isInteger(Math.abs(v.d))) return E('희석 단계는 정수로 넣어 주세요 (10⁻⁶이면 6).');
        const dn = Math.abs(v.d);
        if (!pos(v.p)) return E();
        const mL = v.p * v.p_u, spot = mL <= 0.02;
        if (mode === 'two') {
          const A = [v.a1, v.a2].filter((x, i) => i === 0 || v.raw.a2 !== ''), B = [v.b1, v.b2].filter((x, i) => i === 0 || v.raw.b2 !== '');
          if (A.concat(B).some(x => !(x >= 0))) return E();
          const sum = A.concat(B).reduce((s, x) => s + x, 0), N = sum / ((A.length + 0.1 * B.length) * 10 ** -dn * mL);
          return {lbl: '가중평균 균 수', n: N, f: 'sci', u: unit, also: `보고할 때는 두 자리로 <b>${sci(N, 2)}</b>`,
            work: `${sum} ÷ ((${A.length} + 0.1 × ${B.length}) × 10${sup(-dn)} × ${fi(mL)} mL) = ${fsci(N)} ${unit}`,
            msg: !spot && A.concat(B).some(x => x < 15 || x > 300) ? '15~300개 범위 밖인 판이 있어요. 기준에 맞는 판만 넣으세요.' : ''};
        }
        if (!Number.isFinite(v.n1) || v.n1 < 0) return E();
        if (v.raw.n2 !== '' && !(v.n2 >= 0)) return E('두 번째 판 콜로니 수를 숫자로 넣거나 비워 주세요.');
        const two = v.raw.n2 !== '', n = two ? (v.n1 + v.n2) / 2 : v.n1;
        if (n === 0) {
          const lim = 10 ** dn / mL / (two ? 2 : 1);
          return {lbl: '검출 한계 미만 (<)', n: lim, f: 'sci', u: unit, also: `콜로니가 없으면 "< ${fsci(lim)} ${unit}"로 적어요`, work: `1 ÷ (${two ? '2 × ' : ''}10${sup(-dn)} × ${fi(mL)} mL) = ${fsci(lim)}`};
        }
        const cfu = n * 10 ** dn / mL;
        return {lbl: '원래 시료의 균 수', n: cfu, f: 'sci', u: unit, also: two ? `두 판 평균 <b>${fmt(n)}</b>개로 계산` : '',
          work: `${two ? `(${fi(v.n1)} + ${fi(v.n2)}) ÷ 2` : fi(v.n1)} × 10${sup(dn)} ÷ ${fi(mL)} mL = ${fsci(cfu)} ${unit}`,
          msg: !spot && [v.n1].concat(two ? [v.n2] : []).some(x => x < 30 || x > 300) ? '30~300개 범위 밖인 판이 있어요. 기준(30~300, 25~250, 15~300)에 맞는 희석 단계 판을 세면 더 정확해요.' : ''};
      },
      notes: ['셀 판 범위는 기준마다 달라요. ASM·USDA 30~300, APHA 25~250, ISO와 FDA BAM(2025 개정)은 15~300이에요.', '고체 시료는 10 g + 희석액 90 mL가 10⁻¹이에요. 그 다음부터 단계를 세어 n에 넣으세요.', '두 단계 가중평균은 ISO 4833과 식품공전 표준평판법 방식이에요.'],
      abbr: 'CFU(Colony Forming Unit)',
      src: [['ASM 연속 희석·CFU', 'https://asm.org/protocols/serial-dilution-protocols'], ['FDA BAM 3장', 'https://www.fda.gov/food/laboratory-methods-food/bam-chapter-3-aerobic-plate-count'], PMC('PMC11729654')]},

    {id: 'od', cat: 'cult', short: 'OD 맞추기', sub: '접종 OD', title: '배양액을 목표 OD로 접종', icon: 'culture',
      kw: 'OD OD600 접종 inoculum back dilution 시작 OD 0.05 흡광도 생장곡선 성장곡선 growth curve LB 배지 배양 overnight',
      formula: '넣을 배양액 = 목표 OD × 최종 부피 ÷ (지금 OD × 잴 때 희석 배수)',
      fields: [
        {id: 'od', label: '지금 OD600', small: '기계에 뜬 값', v: '0.6'},
        {id: 'rd', label: '잴 때 희석 배수', small: '안 했으면 1', v: '1', unit: '배'},
        {id: 't', label: '목표 OD600', v: '0.05'},
        {id: 'V', label: '최종 배지 부피', v: '50', units: U.vol, uv: 1}],
      chips: [{label: '목표 OD', items: [['0.01', {t: '0.01'}], ['0.05', {t: '0.05'}], ['0.1', {t: '0.1'}]]}],
      calc(v) {
        if (!pos(v.od, v.rd, v.t, v.V)) return E();
        const act = v.od * v.rd;
        if (v.t > act) return E('목표 OD가 지금 배양액보다 높아요. 더 키운 뒤에 접종하세요.');
        const VL = v.V * v.V_u, x = v.t * VL / act, [n, u] = vol(x), [b, bu] = vol(VL - x);
        return {lbl: '넣을 배양액', n, u, also: `새 배지 <b>${fmt(b)}</b> ${bu}에 넣기 (실제 OD ${fmt(act)})`,
          work: `${fi(v.t)} × ${fi(v.V)} ${v.V_n} ÷ (${fi(v.od)} × ${fi(v.rd)}) = ${fmt(n)} ${u}`,
          msg: v.od > 1 ? '측정값이 1을 넘으면 기기의 직선 범위를 벗어났을 수 있어요. 배지로 10배 희석해서 다시 재고 희석 배수에 넣으세요.' : pip(x)};
      },
      notes: ['같은 배지를 블랭크로 재세요.', '직선 범위는 기기마다 달라요. 진한 배양액은 희석해서 재는 게 안전해요.', 'OD와 세포 수의 관계는 균주와 기기마다 달라요.'],
      abbr: 'OD600(Optical Density at 600 nm)',
      src: [['Thermo 배양액 측정 기술 노트', 'https://documents.thermofisher.com/TFS-Assets/CAD/Product-Bulletins/T041-T041-Comparing-Microvolume-and-Cuvette-Based-Measurements-of-Microbial-Cell-Cultures.pdf'], PMC('PMC3911131'), PMC('PMC10986536')]},

    {id: 'dbl', cat: 'cult', short: '세대 시간', sub: 'doubling time', title: '세대 시간(doubling time)', icon: 'growth',
      kw: '세대 시간 doubling time generation time 성장 속도 growth rate 비성장속도 OD 증식 생장곡선 성장곡선 growth curve 세포 수 cell 배가 시간',
      formula: '세대 시간 = 경과 시간 × ln 2 ÷ ln(나중 값 ÷ 처음 값)',
      fields: [
        {id: 'o1', label: '처음 값', small: 'OD600 또는 세포 수', v: '0.1', sci: true},
        {id: 'o2', label: '나중 값', small: '같은 단위로', v: '0.4', sci: true},
        {id: 'dt', label: '두 측정 사이 시간', v: '60', units: U.time}],
      calc(v) {
        if (!pos(v.o1, v.o2, v.dt)) return E();
        if (v.o2 <= v.o1) return E('나중 값이 처음보다 커야 계산돼요.');
        const min = v.dt * v.dt_u, td = min * Math.LN2 / Math.log(v.o2 / v.o1), mu = Math.log(v.o2 / v.o1) / (min / 60);
        return {lbl: '세대 시간', n: td >= 120 ? td / 60 : td, u: td >= 120 ? '시간' : '분',
          also: `세대 수 <b>${fmt(Math.log2(v.o2 / v.o1), 4)}</b>, 성장 속도 μ <b>${fmt(mu, 4)}</b> /h`,
          work: `${fi(min)}분 × 0.693 ÷ ln(${fi(v.o2)} ÷ ${fi(v.o1)}) = ${fmt(td, 4)}분`};
      },
      notes: ['대수 증식기(exponential phase)에 잰 두 값만 넣어야 맞아요. 지연기나 정지기가 섞이면 길게 나와요.', 'OD라면 두 값 모두 기기의 직선 범위 안에서 잰 값이어야 해요.'],
      src: [['OpenStax 미생물학 9.1', 'https://openstax.org/books/microbiology/pages/9-1-how-microbes-grow'], PMC('PMC3430339'), PMC('PMC10986536')]},

    {id: 'hemo', cat: 'cult', short: '혈구계산판', sub: '세포 수 · 시딩', title: '혈구계산판 세포 수와 시딩', icon: 'grid',
      kw: '혈구계산판 hemocytometer haemocytometer 헤모사이토미터 세포 수 cell count counting 트리판 블루 trypan blue 생존율 viability 시딩 seeding 웰 well plate 계대 passage Neubauer',
      modes: [{id: 'count', label: '세포 농도', formula: 'cells/mL = 큰 칸 평균 × 희석 배수 × 10⁴'}, {id: 'seed', label: '시딩 부피', formula: '넣을 세포액 = 웰당 세포 수 × 웰 수 ÷ 세포 농도'}],
      fields: [
        {id: 'live', label: '살아 있는 세포 합계', small: '센 칸 전체', v: '187', unit: '개', modes: ['count']},
        {id: 'dead', label: '죽은 세포 합계', small: '파랗게 염색, 있으면', v: '11', ph: '선택', unit: '개', opt: true, modes: ['count']},
        {id: 'sq', label: '센 큰 칸 수', small: '1 mm × 1 mm 칸', v: '4', unit: '칸', modes: ['count']},
        {id: 'df', label: '희석 배수', small: '트리판 블루 1:1이면 2', v: '2', unit: '배', modes: ['count']},
        {id: 'conc', label: '세포 농도', v: '9.35e5', unit: 'cells/mL', sci: true, wide: true, modes: ['seed']},
        {id: 'per', label: '웰당 세포 수', v: '2e5', unit: '개', sci: true, modes: ['seed']},
        {id: 'wells', label: '웰 수', v: '6', unit: '개', modes: ['seed']},
        {id: 'wv', label: '웰당 부피', v: '2', unit: 'mL', modes: ['seed']},
        {id: 'ex', label: '여유분', v: '10', unit: '%', modes: ['seed']}],
      calc(v, mode) {
        if (mode === 'seed') {
          if (!pos(v.conc, v.per, v.wells, v.wv) || !(v.ex >= 0)) return E();
          const k = v.wells * (1 + v.ex / 100), cells = v.per * k, tot = v.wv * k, s = cells / v.conc, med = tot - s;
          if (med < -1e-9) return E('세포 농도가 낮아서 이 부피 안에 다 못 넣어요. 원심분리해서 더 적은 부피에 풀어 주세요.');
          const [n, u] = vol(s / 1000), [mn, mu] = vol(med / 1000);
          return {lbl: '넣을 세포액', n, u, also: `배지 <b>${fmt(mn)}</b> ${mu}와 섞어 총 ${fmt(tot)} mL, 웰마다 ${fi(v.wv)} mL씩`,
            work: `${fsci(v.per)}개 × ${fi(v.wells)}웰 × (1 + ${fi(v.ex)}%) = ${fsci(cells)}개<br>${fsci(cells)}개 ÷ ${fsci(v.conc)} cells/mL = ${fmt(s)} mL`, msg: pip(s / 1000)};
        }
        if (!(v.live >= 0) || !pos(v.sq, v.df)) return E();
        if (v.raw.dead !== '' && !(v.dead >= 0)) return E('죽은 세포 수를 숫자로 넣거나 비워 주세요.');
        const avg = v.live / v.sq, conc = avg * v.df * 1e4, hasDead = v.raw.dead !== '' && v.live + v.dead > 0;
        return {lbl: '살아 있는 세포 농도', n: conc, f: 'sci', u: 'cells/mL', also: `큰 칸 평균 <b>${fmt(avg, 4)}</b>개${hasDead ? `, 생존율 <b>${fmt(v.live / (v.live + v.dead) * 100, 3)}</b>%` : ''}`,
          work: `${fi(v.live)} ÷ ${fi(v.sq)}칸 × ${fi(v.df)} × 10⁴ = ${fsci(conc)} cells/mL`};
      },
      notes: ['큰 칸 하나는 1 mm × 1 mm에 깊이 0.1 mm라서 부피가 0.1 μL예요. 그래서 10⁴을 곱하면 mL당 개수가 돼요.', '네 모서리의 큰 칸(각각 작은 칸 16개)을 세는 게 기본이에요.', '트리판 블루에 파랗게 물든 세포가 죽은 세포예요. 살아 있는 세포만 세어 넣으세요.', '경계선에 걸친 세포는 위쪽과 왼쪽 선만 세는 식으로 규칙을 정해 두세요.'],
      src: [['Abcam 혈구계산판', 'https://www.abcam.com/en-us/technical-resources/protocols/counting-cells-using-a-haemocytometer']]},

    {id: 'moi', cat: 'cult', short: 'MOI', sub: '파지 넣을 양', title: 'MOI로 파지 넣을 양 계산', icon: 'phage',
      kw: 'MOI multiplicity of infection 감염 다중도 파지 phage 박테리오파지 bacteriophage PFU plaque 플라크 역가 titer 푸아송 Poisson',
      modes: [{id: 'vol', label: '넣을 파지 양', formula: '넣을 파지(mL) = MOI × 세균 수 ÷ 파지 역가(PFU/mL)'}, {id: 'titer', label: '플라크 → 역가', formula: 'PFU/mL = 플라크 수 × 10ⁿ ÷ 도말량(mL)'}],
      fields: [
        {id: 'moi', label: '목표 MOI', small: '파지 ÷ 세균', v: '0.1', modes: ['vol']},
        {id: 'cells', label: '세균 농도', v: '1e8', unit: 'CFU/mL', sci: true, wide: true, modes: ['vol']},
        {id: 'cv', label: '세균 배양액 부피', v: '10', units: U.vol, uv: 1, modes: ['vol']},
        {id: 'titer', label: '파지 역가', v: '1e10', unit: 'PFU/mL', sci: true, wide: true, modes: ['vol']},
        {id: 'pl', label: '센 플라크 수', v: '85', unit: '개', modes: ['titer']},
        {id: 'd', label: '희석 단계 n', small: '10⁻ⁿ의 n, 10⁻⁷이면 7', v: '7', pre: '10⁻', modes: ['titer']},
        {id: 'p', label: '도말한 파지 희석액', v: '100', units: [['μL', 1e-3], ['mL', 1]], modes: ['titer']}],
      calc(v, mode) {
        if (mode === 'titer') {
          if (!(v.pl >= 0) || !Number.isFinite(v.d) || !pos(v.p)) return E();
          if (!Number.isInteger(Math.abs(v.d))) return E('희석 단계는 정수로 넣어 주세요 (10⁻⁷이면 7).');
          const dn = Math.abs(v.d), mL = v.p * v.p_u, t = v.pl * 10 ** dn / mL;
          return {lbl: '파지 역가', n: t, f: 'sci', u: 'PFU/mL', work: `${fi(v.pl)} × 10${sup(dn)} ÷ ${fi(mL)} mL = ${fsci(t)} PFU/mL`};
        }
        if (!pos(v.moi, v.cells, v.cv, v.titer)) return E();
        const bact = v.cells * v.cv * v.cv_u * 1000, pfu = v.moi * bact, L = pfu / v.titer / 1000, [n, u] = vol(L), p0 = Math.exp(-v.moi);
        return {lbl: '넣을 파지 원액', n, u, also: `세균 ${fsci(bact)}개에 파지 <b>${fsci(pfu)}</b> PFU`,
          work: `${fi(v.moi)} × ${fsci(v.cells)} CFU/mL × ${fmt(v.cv * v.cv_u * 1000)} mL ÷ ${fsci(v.titer)} PFU/mL = ${fmt(L * 1000)} mL<br>파지가 하나도 안 붙는 세균 e^−${fi(v.moi)} = ${fmt(p0 * 100, 3)}%`,
          msg: pip(L)};
      },
      notes: ['여기서 MOI는 넣은 파지 수 ÷ 세균 수예요. 실제로 세균에 붙은 파지는 이보다 적을 수 있어요.', '파지가 고르게 다 붙는다고 보면, MOI가 m일 때 파지가 하나도 안 붙는 세균의 비율이 e^−m이에요(푸아송 분포).', '세균 농도는 OD가 아니라 CFU/mL로 넣으세요. OD와 CFU의 관계는 균주와 기기마다 달라요.', '역가 계산은 CFU 계산과 같은 식이에요. 플라크 수 × 희석 배수 ÷ 도말량.'],
      abbr: 'MOI(Multiplicity of Infection, 감염 다중도), PFU(Plaque Forming Unit), CFU(Colony Forming Unit)',
      src: [['Abedon 2016', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5056779/']]},

    // ================= 원심분리
    {id: 'rcf', cat: 'spin', short: 'rpm ↔ ×g', sub: '원심분리', title: 'rpm과 ×g 바꾸기', icon: 'rotor',
      kw: 'rpm g xg ×g RCF 원심분리 원심 centrifuge 로터 rotor 반지름 회전',
      modes: [{id: 'g', label: '×g 구하기', formula: '×g = 0.00001118 × r(cm) × rpm²'}, {id: 'r', label: 'rpm 구하기', formula: 'rpm = √(×g ÷ (0.00001118 × r(cm)))'}],
      fields: [
        {id: 'r', label: '로터 반지름 r', small: 'rmax, cm', v: '8', unit: 'cm'},
        {id: 'rpm', label: '돌릴 rpm', v: '13000', unit: 'rpm', modes: ['g']},
        {id: 'g', label: '프로토콜의 ×g', v: '5000', unit: '×g', modes: ['r']}],
      calc(v, mode) {
        if (!pos(v.r)) return E();
        const warn = v.r < 2 ? '반지름이 너무 작아요. 단위가 cm인지 확인해 주세요(mm면 10으로 나누기).' : v.r > 40 ? '반지름이 너무 커요. 단위가 cm인지 확인해 주세요(mm면 10으로 나누기).' : '';
        if (mode === 'g') {
          if (!pos(v.rpm)) return E();
          const g = 1.118e-5 * v.r * v.rpm ** 2;
          return {lbl: '걸리는 힘', n: g, f: 'int', u: '×g', work: `0.00001118 × ${fi(v.r)} cm × ${fint(v.rpm)}² = ${fint(g)} ×g`, msg: warn};
        }
        if (!pos(v.g)) return E();
        const rpm = Math.sqrt(v.g / (1.118e-5 * v.r));
        return {lbl: '맞춰야 할 회전수', n: rpm, f: 'int', u: 'rpm', work: `√(${fint(v.g)} ÷ (0.00001118 × ${fi(v.r)} cm)) = ${fint(rpm)} rpm`, msg: warn};
      },
      notes: ['논문과 프로토콜은 rpm이 아니라 ×g로 적는 게 원칙이에요.', '반지름은 로터 매뉴얼이나 뚜껑에 적힌 최대 반지름(rmax)을 cm로 넣으세요.'],
      abbr: 'RCF(Relative Centrifugal Force), ×g와 같은 뜻',
      src: [['Thermo 원심분리 속도 노트', 'https://documents.thermofisher.com/TFS-Assets/LSG/Application-Notes/TR0040-Centrifuge-speed.pdf'], ['Beckman RCF', 'https://mybeckman.vn/resources/technologies/centrifugation/principles/relative-centrifugal-field'], PMC('PMC13618828')]}
  ];

  const ALIAS = {a260: 'abs', purity: 'abs'};
  const API = {CATS, CALCS, ALIAS, parseNum, fmt, fsci, fint, f2, sup};
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.LabCalc = API;
})(this);
