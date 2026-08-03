/* ------------------------------------------------------------------
   A tiny 4-bit computer, explained by letting you run it one step
   at a time.  No dependencies, no build step, no server.

   Memory : 16 cells (addresses are 4 bits), each holding 0..15,
            always shown in binary.
   Word   : an instruction occupies 1 cell for the opcode plus one
            cell per parameter, laid out consecutively.

   Interface language: French by default, English via the switch.
   Every user-visible string lives in I18N below; nothing is written
   straight to the page.  Messages that carry values (assembler
   errors, processor traps) are stored as {k, a} — a key plus its
   arguments — so they can be re-rendered when the language changes.
   ------------------------------------------------------------------ */

'use strict';

const MEM_SIZE = 16;
const MAX_VALUE = 15;

/* ---------------- translations ---------------- */

const I18N = {
  fr: {
    'title': 'Comment fonctionne un ordinateur — machine 4 bits',

    'panel.processor': 'Processeur',
    'panel.memory': 'Mémoire',
    'panel.program': 'Programme',
    'panel.isa': "Jeu d'instructions",

    'reg.pc': 'Compteur ordinal <span class="abbr">PC</span>',
    'reg.pc.note': 'adresse de la prochaine instruction',
    'reg.flag': 'Drapeau de comparaison',
    'reg.flag.note': 'posé par <code>cmp</code>, lu par les sauts',
    'reg.ir': 'Instruction en cours de traitement <span class="abbr">IR</span>',

    'ir.empty': '— rien de chargé —',
    'ir.hint': "appuyez sur Étape pour charger l'instruction à l'adresse du compteur",
    'ir.notInstruction': "n'est pas une instruction",

    'th.address': 'Adresse',
    'th.content': 'Contenu',
    'pcmark.title': 'placer le compteur ordinal à cette adresse',

    'btn.step.fetch': 'Étape — chargement',
    'btn.step.exec': 'Étape — exécution',
    'btn.run': 'Exécuter',
    'btn.pause': 'Pause',
    'btn.reset': 'Réinitialiser le processeur',
    'btn.clear': 'Effacer la mémoire',
    'btn.assemble': 'Assembler en mémoire',
    'speed': 'vitesse',

    'examples.placeholder': 'charger un exemple…',
    'prog.hint': 'Écrire du binaire à la main est fastidieux : tapez le programme ici et ' +
      'appuyez sur <strong>Assembler</strong> pour le placer en mémoire. Vous pouvez aussi ' +
      'ignorer cette zone et modifier directement les cellules mémoire.',
    'asm.ok': 'chargé en mémoire, compteur remis à 0',

    'isa.th.code': 'Code',
    'isa.th.name': 'Nom',
    'isa.th.cells': 'Cellules',
    'isa.th.effect': 'Effet',

    'eff.set': 'mem[b] ← a',
    'eff.add': 'mem[c] ← mem[a] + mem[b]',
    'eff.sub': 'mem[c] ← mem[a] − mem[b]   (jamais en dessous de 0)',
    'eff.mul': 'mem[c] ← mem[a] × mem[b]',
    'eff.cmp': 'drapeau ← compare mem[a] et mem[b]',
    'eff.jeq': 'si le drapeau est "=" alors PC ← a',
    'eff.jlt': 'si le drapeau est "<" alors PC ← a',
    'eff.jgt': 'si le drapeau est ">" alors PC ← a',
    'eff.hlt': 'arrête la machine',

    'notes.rules': 'Règles de cette machine',
    'notes.r1': 'Les adresses font 4 bits &rarr; la mémoire compte exactement ' +
      '<strong>16 cellules</strong>, numérotées 0&ndash;15.',
    'notes.r2': 'Les valeurs sont des entiers positifs sur 4 bits &rarr; <strong>0&ndash;15</strong>. ' +
      'Un résultat supérieur à 15 reste à 15, un résultat négatif reste à 0.',
    'notes.r3': 'Une instruction occupe <strong>1 + (nombre de paramètres)</strong> cellules consécutives.',
    'notes.r4': "Après une instruction qui n'est pas un saut, le compteur passe au-delà de " +
      "l'instruction entière. Un saut effectué écrit le compteur à la place.",
    'notes.r5': 'Les mots <code>1001</code>&ndash;<code>1111</code> ne sont pas des instructions : ' +
      'en charger un arrête la machine avec une <em>instruction illégale</em>.',

    'notes.syntax': "Syntaxe de l'assembleur",
    'notes.s1': '<code>etiquette:</code> devant une instruction, puis <code>etiquette</code> ' +
      'comme cible de saut.',
    'notes.s2': "<code>.at 12</code> &mdash; continuer l'assemblage à l'adresse 12.",
    'notes.s3': '<code>.data 5, 1, 0</code> &mdash; placer des valeurs brutes dans les cellules suivantes.',
    'notes.s4': '<code>;</code> ou <code>#</code> commence un commentaire. Les nombres s\'écrivent ' +
      'en décimal (<code>12</code>) ou en binaire (<code>0b1100</code>), et les paramètres se ' +
      'séparent par des espaces ou des virgules.',

    'msg.hlt': 'arrêtée par hlt',
    'err.illegal': (w, a) => `instruction illégale ${w} à l'adresse ${a}`,
    'err.truncated': (mn, a, n) =>
      `l'instruction « ${mn} » en ${a} a besoin de ${n} paramètre(s) mais la mémoire s'arrête`,

    'err.labelTwice': (ln, name) => `ligne ${ln} : étiquette « ${name} » définie deux fois`,
    'err.atOutside': (ln, tok) => `ligne ${ln} : .at ${tok} est hors de la mémoire`,
    'err.cannotRead': (ln, text) => `ligne ${ln} : impossible de lire « ${text} »`,
    'err.unknownIns': (ln, name) => `ligne ${ln} : instruction inconnue « ${name} »`,
    'err.arity': (ln, mn, need, got) =>
      `ligne ${ln} : « ${mn} » prend ${need} paramètre(s), ${got} reçu(s)`,
    'err.tooLong': (ln, size) =>
      `ligne ${ln} : le programme dépasse l'adresse 15 (la mémoire n'a que ${size} cellules)`,
    'err.writtenTwice': (ln, a) => `ligne ${ln} : l'adresse ${a} est écrite deux fois`,
    'err.notNumber': (ln, tok) =>
      `ligne ${ln} : « ${tok} » n'est ni un nombre ni une étiquette connue`,
    'err.tooBig': (ln, tok, max) => `ligne ${ln} : ${tok} ne tient pas sur 4 bits (max ${max})`,
  },

  en: {
    'title': 'How a Computer Works — 4-bit Machine',

    'panel.processor': 'Processor',
    'panel.memory': 'Memory',
    'panel.program': 'Program',
    'panel.isa': 'Instruction set',

    'reg.pc': 'Ordinal counter <span class="abbr">PC</span>',
    'reg.pc.note': 'address of the next instruction',
    'reg.flag': 'Comparison flag',
    'reg.flag.note': 'set by <code>cmp</code>, read by the jumps',
    'reg.ir': 'Instruction being processed <span class="abbr">IR</span>',

    'ir.empty': '— nothing loaded yet —',
    'ir.hint': 'press Step to fetch the instruction at the ordinal counter',
    'ir.notInstruction': 'not an instruction',

    'th.address': 'Address',
    'th.content': 'Content',
    'pcmark.title': 'set the ordinal counter to this address',

    'btn.step.fetch': 'Step — fetch',
    'btn.step.exec': 'Step — execute',
    'btn.run': 'Run',
    'btn.pause': 'Pause',
    'btn.reset': 'Reset processor',
    'btn.clear': 'Clear memory',
    'btn.assemble': 'Assemble into memory',
    'speed': 'speed',

    'examples.placeholder': 'load an example…',
    'prog.hint': 'Writing binary by hand is tedious, so you can type the program here and press ' +
      '<strong>Assemble</strong> to lay it out in memory. Or ignore this box entirely and edit ' +
      'the memory cells directly.',
    'asm.ok': 'loaded into memory, counter back to 0',

    'isa.th.code': 'Code',
    'isa.th.name': 'Name',
    'isa.th.cells': 'Cells',
    'isa.th.effect': 'Effect',

    'eff.set': 'mem[b] ← a',
    'eff.add': 'mem[c] ← mem[a] + mem[b]',
    'eff.sub': 'mem[c] ← mem[a] − mem[b]   (never below 0)',
    'eff.mul': 'mem[c] ← mem[a] × mem[b]',
    'eff.cmp': 'flag ← compare mem[a] with mem[b]',
    'eff.jeq': 'if flag is "=" then PC ← a',
    'eff.jlt': 'if flag is "<" then PC ← a',
    'eff.jgt': 'if flag is ">" then PC ← a',
    'eff.hlt': 'stop the machine',

    'notes.rules': 'Rules of this machine',
    'notes.r1': 'Addresses are 4 bits &rarr; memory has exactly <strong>16 cells</strong>, ' +
      'numbered 0&ndash;15.',
    'notes.r2': 'Values are 4-bit positive integers &rarr; <strong>0&ndash;15</strong>. ' +
      'A result above 15 sticks at 15, a negative result sticks at 0.',
    'notes.r3': 'An instruction occupies <strong>1 + (number of parameters)</strong> consecutive cells.',
    'notes.r4': 'After a non-jump instruction the counter moves past the whole instruction. ' +
      'A taken jump writes the counter instead.',
    'notes.r5': 'Words <code>1001</code>&ndash;<code>1111</code> are not instructions: fetching ' +
      'one stops the machine with an <em>illegal instruction</em>.',

    'notes.syntax': 'Assembler syntax',
    'notes.s1': '<code>label:</code> before an instruction, then use <code>label</code> as a jump target.',
    'notes.s2': '<code>.at 12</code> &mdash; continue assembling at address 12.',
    'notes.s3': '<code>.data 5, 1, 0</code> &mdash; place raw values in the next cells.',
    'notes.s4': '<code>;</code> or <code>#</code> starts a comment. Numbers may be written decimal ' +
      '(<code>12</code>) or binary (<code>0b1100</code>), and parameters may be separated by ' +
      'spaces or commas.',

    'msg.hlt': 'stopped by hlt',
    'err.illegal': (w, a) => `illegal instruction ${w} at address ${a}`,
    'err.truncated': (mn, a, n) =>
      `instruction "${mn}" at ${a} needs ${n} parameter(s) but memory ends`,

    'err.labelTwice': (ln, name) => `line ${ln}: label "${name}" defined twice`,
    'err.atOutside': (ln, tok) => `line ${ln}: .at ${tok} is outside memory`,
    'err.cannotRead': (ln, text) => `line ${ln}: cannot read "${text}"`,
    'err.unknownIns': (ln, name) => `line ${ln}: unknown instruction "${name}"`,
    'err.arity': (ln, mn, need, got) => `line ${ln}: "${mn}" takes ${need} parameter(s), got ${got}`,
    'err.tooLong': (ln, size) =>
      `line ${ln}: the program runs past address 15 (memory has only ${size} cells)`,
    'err.writtenTwice': (ln, a) => `line ${ln}: address ${a} is written twice`,
    'err.notNumber': (ln, tok) => `line ${ln}: "${tok}" is not a number or a known label`,
    'err.tooBig': (ln, tok, max) => `line ${ln}: ${tok} does not fit in 4 bits (max ${max})`,
  },
};

let lang = 'fr';

function t(key, ...args) {
  const table = I18N[lang] || I18N.fr;
  const v = key in table ? table[key] : I18N.en[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(...args) : v;
}

/** A deferred message: a translation key plus its arguments. */
const msg = (k, ...a) => ({ k, a });
const say = m => (m ? t(m.k, ...m.a) : '');

/* ---------------- instruction set ---------------- */

const ISA = {
  0: { mn: 'set', roles: ['value', 'destination address'], eff: 'eff.set' },
  1: { mn: 'add', roles: ['address a', 'address b', 'destination address'], eff: 'eff.add' },
  2: { mn: 'sub', roles: ['address a', 'address b', 'destination address'], eff: 'eff.sub' },
  3: { mn: 'mul', roles: ['address a', 'address b', 'destination address'], eff: 'eff.mul' },
  4: { mn: 'cmp', roles: ['address a', 'address b'], eff: 'eff.cmp' },
  5: { mn: 'jeq', roles: ['target address'], eff: 'eff.jeq' },
  6: { mn: 'jlt', roles: ['target address'], eff: 'eff.jlt' },
  7: { mn: 'jgt', roles: ['target address'], eff: 'eff.jgt' },
  8: { mn: 'hlt', roles: [], eff: 'eff.hlt' },
};

const MNEMONICS = {};
for (const code in ISA) MNEMONICS[ISA[code].mn] = Number(code);

/* ---------------- machine state ---------------- */

const mem = new Array(MEM_SIZE).fill(0);

const cpu = {
  pc: 0,
  phase: 'fetch',      // 'fetch' | 'execute'
  ir: null,            // { addr, word, def, params }
  flag: null,          // null | '<' | '=' | '>'
  status: 'ready',     // 'ready' | 'running' | 'halted' | 'error'
  message: null,       // msg() object, shown under the instruction register
};

const ui = {
  timer: null,
  example: 0,          // which example the editor holds, -1 once edited
  lastAsm: null,       // {ok:true} | {ok:false, err:msg()}
};

/* ---------------- numbers ---------------- */

const bin4 = n => n.toString(2).padStart(4, '0');

/** Read a binary literal typed into a cell; null while it is unusable. */
function parseBin(str) {
  const s = str.trim();
  if (!/^[01]{1,4}$/.test(s)) return null;
  return parseInt(s, 2);
}

/* ---------------- the processor ---------------- */

function fail(m) {
  cpu.status = 'error';
  cpu.message = m;
  stopRun();
}

/** One half-cycle: either fetch the instruction at PC, or execute it. */
function step() {
  if (cpu.status === 'halted' || cpu.status === 'error') return;
  if (cpu.phase === 'fetch') doFetch(); else doExecute();
  render();
}

function doFetch() {
  const addr = cpu.pc;
  const word = mem[addr];
  const def = ISA[word];
  if (!def) {
    cpu.ir = { addr, word, def: null, params: [] };
    fail(msg('err.illegal', bin4(word), bin4(addr)));
    return;
  }
  const n = def.roles.length;
  if (addr + n >= MEM_SIZE && n > 0) {
    cpu.ir = { addr, word, def, params: [] };
    fail(msg('err.truncated', def.mn, bin4(addr), n));
    return;
  }
  cpu.ir = { addr, word, def, params: mem.slice(addr + 1, addr + 1 + n) };
  cpu.phase = 'execute';
  cpu.status = cpu.status === 'ready' ? 'running' : cpu.status;
}

function doExecute() {
  const ir = cpu.ir;
  if (!ir || !ir.def) return;
  const p = ir.params;
  const next = (ir.addr + 1 + p.length) % MEM_SIZE;
  let jumped = false;

  switch (ir.def.mn) {
    case 'set':
      write(p[1], p[0]);
      break;

    case 'add': arith(p, (x, y) => x + y); break;
    case 'sub': arith(p, (x, y) => x - y); break;
    case 'mul': arith(p, (x, y) => x * y); break;

    case 'cmp': {
      const a = mem[p[0]], b = mem[p[1]];
      cpu.flag = a < b ? '<' : a > b ? '>' : '=';
      break;
    }

    case 'jeq': case 'jlt': case 'jgt': {
      const want = { jeq: '=', jlt: '<', jgt: '>' }[ir.def.mn];
      if (cpu.flag === want) {
        cpu.pc = p[0];
        jumped = true;
      }
      break;
    }

    case 'hlt':
      cpu.status = 'halted';
      cpu.message = msg('msg.hlt');
      cpu.phase = 'fetch';
      stopRun();
      return;
  }

  if (!jumped) cpu.pc = next;
  cpu.phase = 'fetch';
}

/** Results are held to 4 bits: nothing above 15, nothing below 0. */
function arith(p, op) {
  const raw = op(mem[p[0]], mem[p[1]]);
  write(p[2], Math.max(0, Math.min(MAX_VALUE, raw)));
}

function write(addr, value) {
  mem[addr] = value;
}

function resetCpu() {
  stopRun();
  cpu.pc = 0;
  cpu.phase = 'fetch';
  cpu.ir = null;
  cpu.flag = null;
  cpu.status = 'ready';
  cpu.message = null;
  render();
}

/* ---------------- run loop ---------------- */

function toggleRun() {
  if (ui.timer) { stopRun(); return; }
  if (cpu.status === 'halted' || cpu.status === 'error') return;
  const delay = 1260 - Number(document.getElementById('speed').value);
  ui.timer = setInterval(() => {
    step();
    if (cpu.status === 'halted' || cpu.status === 'error') stopRun();
  }, delay);
  document.getElementById('btnRun').textContent = t('btn.pause');
}

function stopRun() {
  if (ui.timer) clearInterval(ui.timer);
  ui.timer = null;
  const b = document.getElementById('btnRun');
  if (b) b.textContent = t('btn.run');
}

/* ---------------- rendering ---------------- */

function render() {
  renderMemory();
  renderCpu();
}

function renderMemory() {
  const body = document.getElementById('memBody');

  // remember which cell has the caret so typing is not interrupted
  const active = document.activeElement;
  const keepAddr = active && active.dataset && active.dataset.addr !== undefined
    ? Number(active.dataset.addr) : null;
  const keepPos = keepAddr !== null ? active.selectionStart : 0;

  body.innerHTML = '';

  for (let a = 0; a < MEM_SIZE; a++) {
    const tr = document.createElement('tr');
    if (a === cpu.pc) tr.classList.add('at-pc');

    // pointer column
    const tdPc = document.createElement('td');
    const mark = document.createElement('button');
    mark.className = 'pcmark';
    mark.textContent = a === cpu.pc ? '▶' : '·';
    mark.title = t('pcmark.title');
    mark.onclick = () => { cpu.pc = a; cpu.phase = 'fetch'; render(); };
    tdPc.appendChild(mark);

    // address
    const tdAddr = document.createElement('td');
    tdAddr.className = 'addr';
    tdAddr.textContent = bin4(a);

    // editable content
    const tdVal = document.createElement('td');
    tdVal.className = 'cell';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.spellcheck = false;
    inp.dataset.addr = String(a);
    inp.maxLength = 4;
    inp.value = bin4(mem[a]);
    inp.addEventListener('input', () => {
      const v = parseBin(inp.value);
      if (v === null) return;              // incomplete or invalid: wait
      mem[a] = v;
      render();
    });
    inp.addEventListener('blur', () => { render(); });
    tdVal.appendChild(inp);

    tr.append(tdPc, tdAddr, tdVal);
    body.appendChild(tr);
  }

  if (keepAddr !== null) {
    const el = body.querySelector(`input[data-addr="${keepAddr}"]`);
    if (el) { el.focus(); try { el.setSelectionRange(keepPos, keepPos); } catch (e) {} }
  }
}

function renderCpu() {
  const pcInp = document.getElementById('pcInput');
  if (document.activeElement !== pcInp) pcInp.value = bin4(cpu.pc);

  const dead = cpu.status === 'halted' || cpu.status === 'error';

  // instruction register
  const words = document.getElementById('irWords');
  const asm = document.getElementById('irAsm');
  const note = document.getElementById('irNote');
  words.innerHTML = '';
  if (!cpu.ir) {
    words.innerHTML = `<span class="empty">${t('ir.empty')}</span>`;
    asm.textContent = '';
    note.textContent = t('ir.hint');
  } else {
    const add = (v, cls) => {
      const s = document.createElement('span');
      s.className = 'w ' + cls;
      s.textContent = bin4(v);
      words.appendChild(s);
    };
    add(cpu.ir.word, 'op');
    cpu.ir.params.forEach(v => add(v, 'par'));

    if (cpu.ir.def) {
      asm.innerHTML = `<span class="mn">${cpu.ir.def.mn}</span> ` +
        cpu.ir.params.map(bin4).join(', ');
      note.textContent = t(cpu.ir.def.eff);
    } else {
      asm.innerHTML = `<span class="bad">${t('ir.notInstruction')}</span>`;
      note.textContent = '';
    }
  }

  // with no status box, a stopped machine reports itself here
  note.className = 'reg-note' + (cpu.status === 'error' ? ' err' : '');
  if (dead && cpu.message) note.textContent = say(cpu.message);

  ['<', '=', '>'].forEach((f, i) => {
    const el = [ 'flgLt', 'flgEq', 'flgGt' ][i];
    document.getElementById(el).classList.toggle('on', cpu.flag === f);
  });

  document.getElementById('btnStep').disabled = dead;
  document.getElementById('btnRun').disabled = dead;
  document.getElementById('btnStep').textContent =
    t(cpu.phase === 'fetch' ? 'btn.step.fetch' : 'btn.step.exec');
}

/* ---------------- assembler ---------------- */

/** Assembler errors carry a key plus arguments, translated when shown. */
function asmFail(k, ...a) { throw msg(k, ...a); }

function assemble(src) {
  const lines = src.split('\n');
  const items = [];              // {addr, kind:'ins'|'data', ...}
  const labels = Object.create(null);
  let addr = 0;

  // pass 1 -- positions and labels
  lines.forEach((raw, ln) => {
    let line = raw.replace(/[;#].*$/, '').trim();
    if (!line) return;

    const lab = line.match(/^([A-Za-z_][\w]*)\s*:\s*/);
    if (lab) {
      if (lab[1] in labels) asmFail('err.labelTwice', ln + 1, lab[1]);
      labels[lab[1]] = addr;
      line = line.slice(lab[0].length).trim();
      if (!line) return;
    }

    const at = line.match(/^\.at\s+(\S+)$/i);
    if (at) {
      const v = literal(at[1], ln);
      if (v < 0 || v >= MEM_SIZE) asmFail('err.atOutside', ln + 1, at[1]);
      addr = v;
      return;
    }

    const data = line.match(/^\.data\s+(.+)$/i);
    if (data) {
      const vals = splitArgs(data[1]).map(s => literal(s, ln));
      items.push({ addr, kind: 'data', vals, ln });
      addr += vals.length;
      return;
    }

    const m = line.match(/^([A-Za-z]+)\s*(.*)$/);
    if (!m) asmFail('err.cannotRead', ln + 1, raw.trim());
    const mn = m[1].toLowerCase();
    if (!(mn in MNEMONICS)) asmFail('err.unknownIns', ln + 1, m[1]);
    const def = ISA[MNEMONICS[mn]];
    const args = splitArgs(m[2]);
    if (args.length !== def.roles.length) {
      asmFail('err.arity', ln + 1, mn, def.roles.length, args.length);
    }
    items.push({ addr, kind: 'ins', code: MNEMONICS[mn], args, ln });
    addr += 1 + args.length;
  });

  // pass 2 -- emit
  const out = new Array(MEM_SIZE).fill(0);
  const used = new Array(MEM_SIZE).fill(false);
  const put = (a, v, ln) => {
    if (a >= MEM_SIZE) asmFail('err.tooLong', ln + 1, MEM_SIZE);
    if (used[a]) asmFail('err.writtenTwice', ln + 1, a);
    out[a] = v; used[a] = true;
  };

  for (const it of items) {
    if (it.kind === 'data') {
      it.vals.forEach((v, i) => put(it.addr + i, v, it.ln));
    } else {
      put(it.addr, it.code, it.ln);
      it.args.forEach((tok, i) => put(it.addr + 1 + i, resolve(tok, labels, it.ln), it.ln));
    }
  }
  return out;

  function resolve(tok, labels, ln) {
    if (tok in labels) return labels[tok];
    return literal(tok, ln);
  }
}

/** Parameters may be separated by commas, spaces, or both. */
function splitArgs(s) {
  const t = s.trim();
  return t === '' ? [] : t.split(/[\s,]+/).filter(Boolean);
}

function literal(tok, ln) {
  let v;
  if (/^0b[01]+$/i.test(tok)) v = parseInt(tok.slice(2), 2);
  else if (/^\d+$/.test(tok)) v = parseInt(tok, 10);
  else asmFail('err.notNumber', ln + 1, tok);
  if (v > MAX_VALUE) asmFail('err.tooBig', ln + 1, tok, MAX_VALUE);
  return v;
}

/* ---------------- example programs ---------------- */

const EXAMPLES = [
  {
    name: { fr: 'y = 3x + (3 − x)', en: 'y = 3x + (3 − x)' },
    src: {
      fr: `; calcul y = 3x + (3 − x)
; 3 valeurs suffisent : 13 = la constante 3, 14 = x, 15 = y

      .at 13
      .data 3, 2, 0    ; les constantes, posées en mémoire

      .at 0
      Sub 13 14 15     ; (3 - x) dans 15
      Mul 13 14 13     ; 3 * x dans 13 (le 3 ne sert plus)
      Add 13 15 15     ; y = 3x + (3 - x) dans 15
      Hlt`,
      en: `; compute y = 3x + (3 − x)
; only 3 values are ever live: 13 = the constant 3, 14 = x, 15 = y

      .at 13
      .data 3, 2, 0    ; the constants, placed straight into memory

      .at 0
      Sub 13 14 15     ; (3 - x) into 15
      Mul 13 14 13     ; 3 * x into 13 (the 3 is no longer needed)
      Add 13 15 15     ; y = 3x + (3 - x) into 15
      Hlt`,
    },
  },
  {
    name: { fr: 'Additionner deux nombres', en: 'Add two numbers' },
    src: {
      fr: `; place 5 et 7 en mémoire, puis les additionne
      set 5, 13        ; mem[13] = 5
      set 7, 14        ; mem[14] = 7
      add 13, 14, 15   ; mem[15] = mem[13] + mem[14]
      hlt`,
      en: `; put 5 and 7 into memory, then add them
      set 5, 13        ; mem[13] = 5
      set 7, 14        ; mem[14] = 7
      add 13, 14, 15   ; mem[15] = mem[13] + mem[14]
      hlt`,
    },
  },
  {
    name: { fr: 'Multiplier deux nombres', en: 'Multiply two numbers' },
    src: {
      fr: `; 3 x 4, le résultat arrive dans la cellule 15
      set 3, 13
      set 4, 14
      mul 13, 14, 15
      hlt`,
      en: `; 3 x 4, the result lands in cell 15
      set 3, 13
      set 4, 14
      mul 13, 14, 15
      hlt`,
    },
  },
  {
    name: { fr: 'Compte à rebours (boucle)', en: 'Count down to zero (loop)' },
    src: {
      fr: `; la cellule 13 compte 5,4,3,2,1,0 -- observez le saut
        .at 13
        .data 5, 1, 0   ; 13 = compteur, 14 = un, 15 = zéro

        .at 0
boucle: sub 13, 14, 13  ; compteur = compteur - 1
        cmp 13, 15      ; compare le compteur avec 0
        jgt boucle      ; encore au-dessus de 0 ? on recommence
        hlt`,
      en: `; cell 13 counts 5,4,3,2,1,0 -- watch the jump
      .at 13
      .data 5, 1, 0    ; 13 = counter, 14 = one, 15 = zero

      .at 0
loop: sub 13, 14, 13   ; counter = counter - 1
      cmp 13, 15       ; compare counter with 0
      jgt loop         ; still above 0? go round again
      hlt`,
    },
  },
  {
    name: { fr: 'Garder le plus grand de deux nombres', en: 'Keep the larger of two numbers' },
    src: {
      fr: `; la cellule 14 finit par contenir max(a, b)
      .at 13
      .data 0, 6, 9    ; 13 = zéro, 14 = a, 15 = b

      .at 0
      cmp 14, 15       ; a est-il plus grand que b ?
      jgt fin          ; oui : a est déjà la réponse
      add 15, 13, 14   ; non : copie b dans a (en ajoutant zéro)
fin:  hlt`,
      en: `; cell 14 ends up holding max(a, b)
      .at 13
      .data 0, 6, 9    ; 13 = zero, 14 = a, 15 = b

      .at 0
      cmp 14, 15       ; is a bigger than b?
      jgt done         ; yes: a is already the answer
      add 15, 13, 14   ; no: copy b into a (adding zero)
done: hlt`,
    },
  },
];

const exampleSrc = (i, l) => dedent(EXAMPLES[i].src[l || lang]);

/* ---------------- wiring ---------------- */

function loadMemory(words) {
  for (let i = 0; i < MEM_SIZE; i++) mem[i] = words[i];
  resetCpu();
}

function buildReference() {
  const table = document.getElementById('refTable');
  let html = `<thead><tr><th>${t('isa.th.code')}</th><th>${t('isa.th.name')}</th>` +
             `<th>${t('isa.th.cells')}</th><th>${t('isa.th.effect')}</th></tr></thead><tbody>`;
  Object.keys(ISA).map(Number).sort((a, b) => a - b).forEach(code => {
    const d = ISA[code];
    const args = ['a', 'b', 'c'].slice(0, d.roles.length).join(', ');
    html += `<tr><td class="code">${bin4(code)}</td>` +
            `<td><span class="mn">${d.mn}</span>${args ? ' ' + args : ''}</td>` +
            `<td>${1 + d.roles.length}</td>` +
            `<td class="eff">${t(d.eff)}</td></tr>`;
  });
  html += '</tbody>';
  table.innerHTML = html;
}

function buildExampleList() {
  const sel = document.getElementById('examples');
  sel.innerHTML = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = t('examples.placeholder');
  sel.appendChild(first);
  EXAMPLES.forEach((ex, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = ex.name[lang];
    sel.appendChild(o);
  });
}

/** Swap every visible string, and the example text if it is untouched. */
function setLanguage(next) {
  const prev = lang;
  if (next === prev) return;

  const ta = document.getElementById('source');
  const untouched = ui.example >= 0 && ta.value === exampleSrc(ui.example, prev);

  lang = next;
  if (untouched) ta.value = exampleSrc(ui.example);

  document.documentElement.lang = lang;
  document.getElementById('langFr').classList.toggle('active', lang === 'fr');
  document.getElementById('langEn').classList.toggle('active', lang === 'en');
  applyLanguage();
}

function applyLanguage() {
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  buildReference();
  buildExampleList();
  document.getElementById('btnRun').textContent = t(ui.timer ? 'btn.pause' : 'btn.run');
  showAsmResult();
  render();
}

function showAsmResult() {
  const el = document.getElementById('asmMsg');
  if (!ui.lastAsm) { el.textContent = ''; el.className = 'asmmsg'; return; }
  el.className = 'asmmsg ' + (ui.lastAsm.ok ? 'ok' : 'err');
  el.textContent = ui.lastAsm.ok ? t('asm.ok') : say(ui.lastAsm.err);
}

function doAssemble() {
  try {
    loadMemory(assemble(document.getElementById('source').value));
    ui.lastAsm = { ok: true };
  } catch (err) {
    ui.lastAsm = { ok: false, err: err && err.k ? err : msg('err.cannotRead', 0, String(err)) };
  }
  showAsmResult();
}

function init() {
  const sel = document.getElementById('examples');
  sel.addEventListener('change', () => {
    if (sel.value === '') return;
    ui.example = Number(sel.value);
    document.getElementById('source').value = exampleSrc(ui.example);
    doAssemble();
    sel.value = '';
  });

  document.getElementById('langFr').onclick = () => setLanguage('fr');
  document.getElementById('langEn').onclick = () => setLanguage('en');

  document.getElementById('btnStep').onclick = step;
  document.getElementById('btnRun').onclick = toggleRun;
  document.getElementById('btnReset').onclick = resetCpu;
  document.getElementById('btnClearMem').onclick = () => { mem.fill(0); resetCpu(); };
  document.getElementById('btnAssemble').onclick = doAssemble;

  const pcInp = document.getElementById('pcInput');
  pcInp.addEventListener('input', () => {
    const v = parseBin(pcInp.value);
    if (v === null) return;
    cpu.pc = v;
    cpu.phase = 'fetch';
    if (cpu.status === 'halted' || cpu.status === 'error') {
      cpu.status = 'ready';
      cpu.message = null;
    }
    render();
  });
  pcInp.addEventListener('blur', render);

  document.getElementById('source').addEventListener('input', () => {
    ui.example = -1;                      // edited: stop re-translating it
  });

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); step(); }
  });

  ui.example = 0;
  document.getElementById('source').value = exampleSrc(0);
  doAssemble();
  applyLanguage();
}

function dedent(s) {
  const lines = s.replace(/^\n/, '').split('\n');
  const indents = lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map(l => l.slice(cut)).join('\n').trimEnd();
}

init();
