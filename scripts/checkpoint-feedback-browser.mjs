// Offline renderer for the real CheckpointPage. No Vite/esbuild child process,
// network services, authentication or database. Only the service and audio/AI
// boundaries are stubbed; the page, UI primitives, builders and scorer are real.
// Run from the repository root; open http://127.0.0.1:5174/?level=a1.2 (or a1.1).
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'sucrase';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import config from '../tailwind.config.js';
import { anyCurriculumFor, curriculumPath } from '../src/data/curricula/index.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = 'src/pages/lesson/CheckpointPage.jsx';
const files = new Map();
const stubs = {
  'react': 'module.exports = React;',
  'react/jsx-runtime': 'exports.jsx = exports.jsxs = (type, props, key) => {const {children,...rest}=props; return React.createElement(type, {...rest, key}, ...(Array.isArray(children)?children:[children]));}; exports.Fragment = React.Fragment;',
  'react-router-dom': 'exports.useParams = () => ({level: window.fixture.curriculum.level, nr: "3"}); exports.Link = React.forwardRef(({to, children, ...rest}, ref) => React.createElement("a", {...rest, href: to, ref}, children)); exports.Navigate = () => React.createElement("p", null, "Unexpected redirect");',
  'lucide-react': 'for (const name of ["ArrowLeft", "ArrowRight", "Check", "RotateCcw", "X", "BookOpen", "Globe", "Globe2", "Languages", "Info", "ExternalLink"]) exports[name] = props => React.createElement("svg", {...props, "data-icon":name});',
  'src/contexts/AuthContext': 'const user={id:"offline-fixture"}; exports.useAuth = () => ({user});',
  'src/data/curricula/index.js': 'exports.curriculumFor = () => window.fixture.curriculum; exports.curriculumPath = () => window.fixture.path;',
  'src/services/checkpointService.js': 'exports.ATTEMPT_LIMIT=3; exports.ATTEMPT_WINDOW_HOURS=8; exports.fetchAttemptState=async()=>({used:window.saved.length,remaining:3-window.saved.length,blocked:false}); exports.recordAttempt=async(user,args)=>{window.saved.push({user,...args}); return true;};',
  'src/components/lesson/PlayButton.jsx': 'exports.default=()=>React.createElement("span",null,"Offline audio fixture");',
  'src/components/lesson/ReadAloudLine.jsx': 'exports.default=({onResult})=>React.createElement("button",{onClick:()=>onResult({usedMic:true,pct:0.8})},"Offline speaking fixture");',
  'src/components/lesson/GradedWriting.jsx': 'exports.default=({onResult})=>React.createElement("button",{onClick:()=>onResult({scored:true,pct:0.8})},"Offline writing fixture");',
};
function add(id) {
  if (files.has(id)) return;
  if (stubs[id]) { files.set(id, `exports.__esModule=true; ${stubs[id]}`); return; }
  let path = resolve(root, id);
  if (!existsSync(path) && existsSync(`${path}.js`)) path += '.js';
  if (!path.startsWith(`${root}\\`) && !path.startsWith(`${root}/`)) throw new Error(`Outside repository: ${path}`);
  const source = readFileSync(path, 'utf8');
  if (path.endsWith('.json')) { files.set(id, `module.exports=${source};`); return; }
  let code = transform(source, { transforms: ['jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code;
  files.set(id, '');
  code = code.replace(/require\(["']([^"']+)["']\)/g, (_, spec) => {
    const target = spec.startsWith('.') ? relative(root, resolve(dirname(path), spec)).replaceAll('\\', '/') : spec;
    add(target);
    return `require(${JSON.stringify(target)})`;
  });
  files.set(id, code);
}
add(entry);
const bundle = `const modules={${[...files].map(([id, code]) => `${JSON.stringify(id)}:(module,exports,require)=>{${code}\n}`).join(',')}};
const cache={}; window.require=id=>{if(cache[id])return cache[id].exports; const module=cache[id]={exports:{}}; modules[id](module,module.exports,window.require);return module.exports;};
window.saved=[]; ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(window.require(${JSON.stringify(entry)}).default));`;
const css = (await postcss([tailwind({ ...config, content: [...files.keys()].filter((id) => id.startsWith('src/')).map((id) => resolve(root, id)), corePlugins: { preflight: true } })]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined })).css;

const exercise = async function () {
  const status = document.getElementById('status');
  const app = document.getElementById('app');
  const wait = (ms = 50) => new Promise((done) => setTimeout(done, ms));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const button = (text) => [...app.querySelectorAll('button')].find((node) => node.textContent.trim() === text);
  const until = async (condition) => { for (let n = 0; n < 200; n += 1) { if (condition()) return; await wait(); } throw new Error('Timed out waiting for the page'); };
  const click = async (text) => { await until(() => button(text) && !button(text).disabled); button(text).click(); await wait(); };
  const pause = async (label) => {
    if (!new URLSearchParams(location.search).has('pause')) return;
    status.textContent = label;
    const resume = document.createElement('button'); resume.textContent = 'Resume verification';
    status.appendChild(resume);
    await new Promise((done) => { resume.onclick = done; });
    status.textContent = 'Verification running';
  };
  try {
    await click('Start the checkpoint');
    let reading = 0;
    const answers = {};
    for (const item of window.fixture.items) {
      let answer = item.answer;
      if (item.section === 'lesen') {
        reading += 1;
        if (reading === 1) answer = item.options.find((option) => option !== item.answer);
        const text = app.querySelector('.whitespace-pre-line');
        assert(text?.textContent === item.text, 'Lesen text changed');
        assert(!window.saved.length, 'Attempt saved before paper completion');
      }
      if (item.kind === 'gradedWriting' || item.kind === 'readAloud') {
        await click(item.kind === 'gradedWriting' ? 'Offline writing fixture' : 'Offline speaking fixture');
        answer = item.kind === 'gradedWriting' ? { graded: true, pct: 0.8 } : { usedMic: true, pct: 0.8 };
      } else if (item.mode === 'options') await click(answer);
      else {
        const input = app.querySelector('input');
        assert(input, 'Typed input missing');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, answer);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(); await click('Check');
      }
      answers[item.id] = answer;
      if (item.section === 'lesen') {
        assert(app.textContent.includes('Answer recorded.'), 'No neutral receipt');
        assert(!app.querySelector('[data-icon="Check"], [data-icon="X"], [class*="limette"], [class*="himbeer"]'), 'Correctness colour or icon leaked');
        assert(!app.textContent.includes('The answer is:') && !app.textContent.includes('Not right'), 'Correctness text leaked');
        assert(!item.explanationEn || !app.textContent.includes(item.explanationEn), 'Explanation leaked');
        if (reading === 1) await pause('Observed: wrong Lesen response; neutral receipt; no correctness, key marking or explanation.');
      }
      await click('Continue');
      if (item.section === 'lesen' && reading === 4) {
        assert(app.textContent.includes('Lesen — feedback'), 'Section review missing');
        assert(app.querySelectorAll('ol > li').length === 4, 'Incomplete feedback');
        for (const row of window.fixture.items.filter((it) => it.section === 'lesen')) {
          assert(app.textContent.includes(row.answer), 'Released key missing');
          assert(!row.explanationEn || app.textContent.includes(row.explanationEn), 'Released explanation missing');
        }
        assert(!window.saved.length, 'Section review saved an attempt');
        await pause('Observed: all four Lesen items complete; full feedback released.');
        await click('Continue');
      }
    }
    await until(() => window.saved.length === 1);
    const expected = window.require('src/lib/checkpoint/buildCheckpoint.js').scoreCheckpoint(window.fixture.items, answers);
    assert(JSON.stringify(window.saved[0].answers) === JSON.stringify(answers), 'Saved answers changed');
    assert(JSON.stringify(window.saved[0].result) === JSON.stringify(expected), 'Saved score changed');
    assert(window.saved[0].stamp && window.saved[0].level === window.fixture.curriculum.level, 'Attempt identity missing');
    assert(app.textContent.includes(`${expected.overall} %`), 'Result score missing');
    status.textContent = `PASS browser ${window.fixture.curriculum.level}: 20 items; Lesen text unchanged; 4 neutral receipts; full section feedback; 1 stamped attempt; answers, scoring and result preserved.`;
  } catch (error) { status.textContent = `FAIL browser: ${error.message}`; console.error(error); }
};

createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:5174');
  if (url.pathname === '/react.js' || url.pathname === '/react-dom.js') {
    const library = url.pathname === '/react.js' ? 'react' : 'react-dom';
    response.setHeader('Content-Type', 'text/javascript');
    response.end(readFileSync(resolve(root, `node_modules/${library}/umd/${library}.development.js`))); return;
  }
  const curriculum = anyCurriculumFor(url.searchParams.get('level') === 'a1.1' ? 'a1.1' : 'a1.2');
  const checkpoint = curriculum.checkpoints[2];
  const pool = JSON.parse(readFileSync(resolve(root, `src/data/lessonPools/${curriculum.level.replace('.', '')}.json`), 'utf8'));
  const fixture = { curriculum, path: curriculumPath(curriculum), items: buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, 0) }) };
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'");
  response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Round 16 offline checkpoint verification</title><style>${css}</style><body><p id="status" style="padding:1rem;background:#eee">Verification running</p><div id="app"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script>window.fixture=${JSON.stringify(fixture).replaceAll('<', '\\u003c')};${bundle}\n(${exercise})();</script></body></html>`);
}).listen(5174, '127.0.0.1', () => console.log('Offline checkpoint renderer: http://127.0.0.1:5174/?level=a1.2&pause'));
