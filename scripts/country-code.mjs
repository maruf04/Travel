#!/usr/bin/env node
// Turns country names into the two-letter codes the site uses.
//
//   node scripts/country-code.mjs "bangladesh, pakistn, usa"   ->  BD,PK,US
//
// Accepts English or Bangla names, common short names (USA, UK, UAE...), codes (BD), small
// typos, and "earth"/"world" for videos about the whole world (EARTH).
// Prints the codes on stdout and what each name was read as on stderr.
// Exits with 1 if a name can't be matched, after suggesting close names.

const en = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
const bn = new Intl.DisplayNames(['bn'], { type: 'region', fallback: 'none' })

// Codes that aren't present-day countries (EU, UN, retired codes like Burma/Soviet Union, ...).
const SKIP = new Set(['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA', 'XK',
  'BU', 'CS', 'DD', 'FX', 'NT', 'SU', 'TP', 'YD', 'YU', 'ZR', 'AN'])
const ALIASES = {
  US: ['usa', 'us', 'america', 'united states', 'united states of america', 'আমেরিকা'],
  GB: ['uk', 'britain', 'great britain', 'england', 'scotland', 'wales', 'northern ireland', 'ব্রিটেন', 'ইংল্যান্ড'],
  AE: ['uae', 'emirates', 'dubai'], TR: ['turkey', 'turkiye'], IR: ['persia'], NL: ['holland'],
  MM: ['burma', 'myanmar', 'মিয়ানমার'], CI: ['ivory coast'], CZ: ['czech republic', 'czech'], VA: ['vatican'],
  CD: ['dr congo', 'drc', 'democratic republic of the congo', 'congo kinshasa'],
  CG: ['republic of the congo', 'congo brazzaville', 'congo'], KR: ['korea', 'south korea'], KP: ['north korea'],
  RU: ['russia', 'রাশিয়া'], MK: ['macedonia'], SZ: ['swaziland'], TL: ['east timor'], PS: ['palestine', 'gaza', 'ফিলিস্তিন'],
  IL: ['israel', 'ইসরায়েল', 'ইসরাইল'], SA: ['saudi', 'saudi arabia', 'সৌদি'], BA: ['bosnia'], LA: ['laos'],
  VN: ['vietnam'], SY: ['syria'], TW: ['taiwan'], BO: ['bolivia'], VE: ['venezuela'], TZ: ['tanzania'], MD: ['moldova'],
  EARTH: ['earth', 'world', 'whole world', 'global', 'worldwide', 'পৃথিবী', 'বিশ্ব'],
}

// lower case, no accents or punctuation: "Türkiye" -> "turkiye", "St. Lucia" -> "st lucia"
const norm = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim()

const index = new Map() // normalized name -> { code, name }
const add = (name, code, display) => { if (name && !index.has(norm(name))) index.set(norm(name), { code, name: display }) }
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b)
    const name = en.of(code)
    if (!name || SKIP.has(code)) continue
    add(name, code, name)
    for (const part of name.split(/\s*[()]\s*|\s+-\s+/)) add(part, code, name) // "Myanmar (Burma)", "Congo - Kinshasa"
    const bnName = bn.of(code)
    if (bnName) for (const part of bnName.split(/\s*[()]\s*/)) add(part, code, name)
  }
}
for (const [code, list] of Object.entries(ALIASES)) {
  const display = code === 'EARTH' ? 'Earth (whole world)' : en.of(code)
  for (const n of list) index.set(norm(n), { code, name: display })
}

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return d[a.length][b.length]
}

// -> { code, name } or { suggestions: [names] }
export function lookup(input) {
  const q = norm(input)
  if (!q) return { suggestions: [] }
  if (index.has(q)) return index.get(q)
  if (/^[a-z]{2}$/.test(q) && en.of(q.toUpperCase()) && !SKIP.has(q.toUpperCase())) {
    return { code: q.toUpperCase(), name: en.of(q.toUpperCase()) }
  }
  // the start of a name: "bosn" -> Bosnia and Herzegovina (only if it points to one country)
  if (q.length >= 4) {
    const starts = new Map([...index].filter(([k]) => k.startsWith(q)).map(([, v]) => [v.code, v]))
    if (starts.size === 1) return [...starts.values()][0]
  }
  // small typos: "pakistn" -> Pakistan
  const scored = [...index]
    .map(([k, v]) => ({ ...v, d: distance(q, k) }))
    .sort((x, y) => x.d - y.d)
  const best = scored[0]
  const allowed = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3
  if (best && best.d <= allowed && !(scored[1] && scored[1].d === best.d && scored[1].code !== best.code)) return best
  const suggestions = [...new Set(scored.slice(0, 12).map((s) => s.name))].slice(0, 4)
  return { suggestions }
}

// command line use
if (import.meta.url === `file://${process.argv[1]}`) {
  const names = process.argv.slice(2).join(',').split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
  const codes = []
  let failed = false
  for (const name of names) {
    const r = lookup(name)
    if (r.code) {
      codes.push(r.code)
      console.error(`  ${name} → ${r.name} (${r.code})`)
    } else {
      failed = true
      console.error(`  ${name} → not found${r.suggestions.length ? `. Did you mean: ${r.suggestions.join(', ')}?` : ''}`)
    }
  }
  if (failed) process.exit(1)
  console.log([...new Set(codes)].join(','))
}
