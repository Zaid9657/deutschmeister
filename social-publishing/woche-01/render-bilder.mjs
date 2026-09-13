// Rendert alle Bilder der Woche 1 aus den Design-Tokens.
// Aufruf aus dem Repo-Root: node social-publishing/woche-01/render-bilder.mjs
import sharp from 'sharp';
const OUT = '/home/user/deutschmeister/social-publishing/woche-01/bilder/';

// Tokens — src/data/design-tokens.js
const paper='#FCFCFA', ink='#14201D', graphite='#5A6360',
      rule='#E2E7E5', siegel='#0F766E', siegelDeep='#0B5A54', siegelWash='#E6F2F0',
      gold='#FBBF24';
const NOM={line:'#378ADD',wash:'#E6F1FB',ink:'#0C447C',abbr:'NOM'};
const AKK={line:'#D85A30',wash:'#FAECE7',ink:'#712B13',abbr:'AKK'};

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const D='Fraunces', B='DejaVu Sans';

// ---- square 1080 -----------------------------------------------------------
// kind: 'cover' (dark) | 'card' (light)
function square({kind='card', label='', title=[], en='', lines=[], footer='deutsch-meister.de', accent=null}){
  const bg   = kind==='cover' ? siegelDeep : paper;
  const fg   = kind==='cover' ? paper      : ink;
  const sub  = kind==='cover' ? '#CFE3E0'  : graphite;
  const acc  = accent ? accent.line : gold;
  const band = accent ? accent.wash : siegelWash;

  const measure = (ts, strongStep, softStep) => {
    let h = title.length*(ts+16) + 40 + 74 + (en ? 62 : 0);
    lines.forEach(l => { h += l==='' ? 24 : (/^[*#]/.test(l) ? strongStep : softStep); });
    return h;
  };
  let tSizePre = title.length>2 ? 78 : 92, strongStep = 78, softStep = 66;
  if (measure(tSizePre, strongStep, softStep) > 660) {
    tSizePre = title.length>2 ? 70 : 80; strongStep = 70; softStep = 58;
  }
  const blockH = measure(tSizePre, strongStep, softStep);
  let y = 250 + Math.max(0, (670 - blockH)/2);
  let out = `<rect width="1080" height="1080" fill="${bg}"/>`;
  if (kind==='card') out += `<rect x="0" y="0" width="1080" height="14" fill="${acc}"/>`;
  if (label){
    out += `<rect x="88" y="118" width="${44+label.length*22}" height="52" rx="10" fill="${kind==='cover'?'#0F766E':band}"/>`;
    out += `<text x="${110}" y="153" font-family="${B}" font-weight="700" font-size="26" letter-spacing="4" fill="${kind==='cover'?paper:(accent?accent.ink:siegelDeep)}">${esc(label)}</text>`;
  }
  const tSize = tSizePre;
  title.forEach((t,i)=>{
    out += `<text x="88" y="${y + i*(tSize+16)}" font-family="${D}" font-weight="700" font-size="${tSize}" letter-spacing="-2" fill="${fg}">${esc(t)}</text>`;
  });
  y += title.length*(tSize+16) + 12;
  if (en){
    out += `<text x="88" y="${y+20}" font-family="${B}" font-weight="400" font-style="italic" font-size="38" fill="${kind==='cover'?'#9FC4BF':graphite}">${esc(en)}</text>`;
    y += 62;
  }
  y += 28;
  out += `<rect x="88" y="${y}" width="150" height="7" rx="3.5" fill="${acc}"/>`;
  y += 74;
  lines.forEach(l=>{
    if (l === '') { y += 24; return; }
    if (l.startsWith('#')) {
      const [a,b] = l.slice(1).split('|');
      const cs = strongStep < 78 ? 48 : 54;
      out += `<text x="88" y="${y}" font-family="${D}" font-weight="700" font-size="${cs}" fill="${fg}">${esc(a)}</text>`;
      out += `<text x="600" y="${y}" font-family="${D}" font-weight="700" font-size="${cs}" fill="${fg}">${esc(b)}</text>`;
      y += strongStep; return;
    }
    const strong = l.startsWith('*');
    const txt = strong ? l.slice(1) : l;
    out += `<text x="88" y="${y}" font-family="${strong?D:B}" font-weight="${strong?700:400}" font-size="${strong?(strongStep<78?48:54):(softStep<66?40:44)}" fill="${strong?fg:sub}">${esc(txt)}</text>`;
    y += strong ? strongStep : softStep;
  });
  out += `<rect x="88" y="948" width="904" height="2" fill="${kind==='cover'?'#1A6B65':rule}"/>`;
  out += `<text x="88" y="1010" font-family="${B}" font-weight="700" font-size="30" letter-spacing="2" fill="${kind==='cover'?gold:siegel}">${esc(footer)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">${out}</svg>`;
}

// ---- youtube thumbnail 1280x720 -------------------------------------------
function thumb({kicker, title=[], en='', level}){
  let out = `<rect width="1280" height="720" fill="${siegelDeep}"/>
  <rect x="0" y="0" width="18" height="720" fill="${gold}"/>
  <text x="86" y="132" font-family="${B}" font-weight="700" font-size="30" letter-spacing="6" fill="${gold}">${esc(kicker)}</text>`;
  const size = title.length>2 ? 92 : 110;
  title.forEach((t,i)=>{
    out += `<text x="86" y="${268 + i*(size+14)}" font-family="${D}" font-weight="700" font-size="${size}" letter-spacing="-3" fill="${paper}">${esc(t)}</text>`;
  });
  if (en) out += `<text x="86" y="${268 + title.length*(size+14) + 22}" font-family="${B}" font-weight="400" font-style="italic" font-size="44" fill="#9FC4BF">${esc(en)}</text>`;
  out += `<rect x="86" y="612" width="150" height="54" rx="10" fill="${siegel}"/>
  <text x="112" y="650" font-family="${B}" font-weight="700" font-size="30" letter-spacing="3" fill="${paper}">${esc(level)}</text>
  <text x="270" y="650" font-family="${B}" font-weight="700" font-size="30" letter-spacing="2" fill="${gold}">deutsch-meister.de</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${out}</svg>`;
}

const jobs = [];
const sq = (name, cfg) => jobs.push([name, square(cfg)]);
const th = (name, cfg) => jobs.push([name, thumb(cfg)]);

/* ===== TAG 1 — Alphabet & Aussprache ===================================== */
sq('t1-alphabet-01', {kind:'cover', label:'A1 · AUSSPRACHE', title:['Das deutsche','Alphabet'], en:'The German alphabet',
  lines:['Vier Buchstaben, die es im','Englischen nicht gibt.']});
sq('t1-alphabet-02', {label:'DIE VIER', title:['Ä  Ö  Ü  ß'], en:"The four letters English doesn't have",
  lines:['*Ä wie in "Mädchen"','*Ö wie in "können"','*Ü wie in "über"','*ß wie ein scharfes s: "Straße"']});

/* ===== TAG 2 — Buchstabenkombinationen ================================== */
sq('t2-eiie-01', {kind:'cover', label:'A1 · AUSSPRACHE', title:['ei oder ie?'], en:'ei or ie?',
  lines:['Ein Blick auf den zweiten','Buchstaben — und du weißt es.']});
sq('t2-eiie-02', {label:'DIE REGEL', title:['Der zweite','Buchstabe spricht'], en:'The second letter is the one you hear',
  lines:['*ei → sprich "ai"','Wein, mein, Zeit, arbeiten','','*ie → sprich langes "ii"','Wien, Liebe, sieben, spielen']});

/* ===== TAG 3 — Nominativ (4 Slides) ==================================== */
sq('t3-nominativ-01', {kind:'cover', label:'A1 · NOMINATIV', title:['Wer macht es?'], en:'Who is doing it? — the nominative case',
  lines:['Der Nominativ ist die Form,','die im Wörterbuch steht.'], accent:NOM});
sq('t3-nominativ-02', {label:'NOM', title:['Die Frage:','Wer oder was?'], en:'The test question: who or what?',
  lines:['*Der Mann liest.','Wer liest? → der Mann','','*Das Kind schläft.','Wer schläft? → das Kind'], accent:NOM});
sq('t3-nominativ-03', {label:'NOM', title:['Die Artikel'], en:'The four definite articles',
  lines:['*der  —  männlich','*die  —  weiblich','*das  —  sächlich','*die  —  Plural'], accent:NOM});
sq('t3-nominativ-04', {label:'MERKE', title:['Subjekt =','Nominativ'], en:'The subject is always nominative',
  lines:['Wer die Handlung macht,','steht immer im Nominativ.','','Deshalb lernst du jedes Nomen','mit seinem Artikel.'], accent:NOM});

/* ===== TAG 4 — Akkusativ (4 Slides) ==================================== */
sq('t4-akkusativ-01', {kind:'cover', label:'A1 · AKKUSATIV', title:['Nur "der"','ändert sich.'], en:'Only "der" changes — the accusative',
  lines:['Der Akkusativ ist einfacher,','als er aussieht.'], accent:AKK});
sq('t4-akkusativ-02', {label:'AKK', title:['Die ganze','Veränderung'], en:'That is the entire change',
  lines:['*der → den','*die → die','*das → das','*die (Plural) → die'], accent:AKK});
sq('t4-akkusativ-03', {label:'AKK', title:['Im Satz'], en:'In a sentence',
  lines:['*Ich sehe den Mann.','*Ich sehe die Frau.','*Ich sehe das Kind.','*Ich sehe die Kinder.'], accent:AKK});
sq('t4-akkusativ-04', {label:'MERKE', title:['Die Frage:','Wen oder was?'], en:'The test question: whom or what?',
  lines:['Wen sehe ich? → den Mann','','Ein einziger Buchstabe.','Mehr passiert nicht.'], accent:AKK});

/* ===== TAG 5 — sein ==================================================== */
sq('t5-sein-01', {kind:'cover', label:'A1 · VERBEN', title:['sein'], en:'the verb "to be"',
  lines:['Das wichtigste Verb im','Deutschen — und unregelmäßig.']});
sq('t5-sein-02', {label:'PRÄSENS', title:['ich bin,','du bist, …'], en:'I am, you are, …',
  lines:['#ich bin|wir sind','#du bist|ihr seid','#er/sie/es ist|sie sind','','Sie sind — die Höflichkeitsform.']});

/* ===== TAG 6 — haben =================================================== */
sq('t6-haben-01', {kind:'cover', label:'A1 · VERBEN', title:['haben'], en:'the verb "to have"',
  lines:['Das zweite Verb, das du','jeden Tag brauchst.']});
sq('t6-haben-02', {label:'PRÄSENS', title:['ich habe,','du hast, …'], en:'I have, you have, …',
  lines:['#ich habe|wir haben','#du hast|ihr habt','#er/sie/es hat|sie haben','','Achtung: "du hast" — ohne b.']});

/* ===== TAG 7 — ein oder eine (4 Slides) =============================== */
sq('t7-eineine-01', {kind:'cover', label:'A1 · ARTIKEL', title:['ein oder','eine?'], en:'a or an? — the indefinite article',
  lines:['Wenn du den Artikel kennst,','kennst du auch diesen.']});
sq('t7-eineine-02', {label:'DIE BRÜCKE', title:['Vom der/die/das','zum ein/eine'], en:'From the definite to the indefinite',
  lines:['*der Tisch → ein Tisch','*die Lampe → eine Lampe','*das Buch → ein Buch']});
sq('t7-eineine-03', {label:'MERKE', title:['Nur "die"','bekommt ein e'], en:'Only "die" takes an -e',
  lines:['der → ein','die → eine','das → ein','','Ein einziger Buchstabe','unterscheidet die drei.']});
sq('t7-eineine-04', {label:'IM PLURAL', title:['Es gibt kein','"eine" im Plural'], en:'No indefinite article in the plural',
  lines:['ein Buch → Bücher','','Kein Artikel. Das Wort steht','einfach allein.']});

/* ===== YouTube-Thumbnails ============================================== */
th('yt-t1-thumb', {kicker:'DEUTSCH LERNEN', title:['Das deutsche','Alphabet'], en:'The German Alphabet', level:'A1'});
th('yt-t2-thumb', {kicker:'AUSSPRACHE', title:['ei, ie, eu, ch'], en:'German pronunciation rules', level:'A1'});
th('yt-t3-thumb', {kicker:'GRAMMATIK', title:['Der Nominativ'], en:'The nominative case', level:'A1'});
th('yt-t4-thumb', {kicker:'GRAMMATIK', title:['Der Akkusativ'], en:'The accusative case', level:'A1'});
th('yt-t5-thumb', {kicker:'VERBEN', title:['Das Verb','sein'], en:'The verb "to be"', level:'A1'});
th('yt-t6-thumb', {kicker:'VERBEN', title:['Das Verb','haben'], en:'The verb "to have"', level:'A1'});
th('yt-t7-thumb', {kicker:'ARTIKEL', title:['ein oder eine?'], en:'a or an?', level:'A1'});

for (const [name, svg] of jobs){
  await sharp(Buffer.from(svg)).png().toFile(OUT + name + '.png');
}
console.log('rendered', jobs.length);
