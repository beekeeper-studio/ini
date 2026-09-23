const i = require('../')
const tap = require('tap')
const test = tap.test

const opt = { preserveComments: true }
const nl = s => s.replace(/\r\n/g, '\n')
const round = src => nl(i.stringify(i.parse(src, opt), opt))

test('a full-line comment above a key round-trips', function (t) {
  t.equal(round('; a comment\nfoo = bar\n'), '; a comment\nfoo=bar\n')
  t.end()
})

test('preserveComments is opt-in', function (t) {
  const d = i.parse('; a comment\nfoo = bar\n', { preserveComments: true })
  t.equal(nl(i.stringify(d)), 'foo=bar\n')
  t.end()
})

test('multiple comment lines and # style are kept', function (t) {
  t.equal(round('; one\n# two\nfoo = bar\n'), '; one\n# two\nfoo=bar\n')
  t.end()
})

test('a comment above a section header attaches to the section', function (t) {
  t.equal(round('; about a\n[a]\nx = 1\n'), '; about a\n[a]\nx=1\n')
  t.end()
})

test('an inline comment round-trips on the same line', function (t) {
  t.equal(round('foo = bar ; inline note\n'), 'foo=bar ; inline note\n')
  t.end()
})

test('an escaped semicolon is not treated as an inline comment', function (t) {
  t.equal(round('foo = a\\; b\n'), 'foo=a\\; b\n')
  t.end()
})

test('no inline comment is captured from a quoted value', function (t) {
  t.equal(round('foo = "a;b"\n'), 'foo=a\\;b\n')
  t.end()
})

test('the same key name in two sections keeps distinct comments', function (t) {
  const out = round('[one]\n; one host\nhost = a\n[two]\n; two host\nhost = b\n')
  t.match(out, /\[one\]\n; one host\nhost=a/)
  t.match(out, /\[two\]\n; two host\nhost=b/)
  t.end()
})

test('comments survive deep nested sections', function (t) {
  const out = round('[a.b.c.d]\n; deep\ndeep = 1\n')
  t.match(out, /\[a\.b\.c\.d\]\n; deep\ndeep=1/)
  t.end()
})

test('a trailing comment at end of file is preserved', function (t) {
  t.equal(round('first = 1\n; dangling\n'), 'first=1\n; dangling\n')
  t.end()
})

test('a newly added key is appended without a comment', function (t) {
  const d = i.parse('; a\nalpha = 1\n', { preserveComments: true })
  d.gamma = 3
  t.equal(nl(i.stringify(d, { preserveComments: true })), '; a\nalpha=1\ngamma=3\n')
  t.end()
})

test('sort keeps each comment with its key', function (t) {
  const d = i.parse('; z\nzebra = 1\n; a\napple = 2\n', { preserveComments: true })
  t.equal(nl(i.stringify(d, { preserveComments: true, sort: true })), '; a\napple=2\n; z\nzebra=1\n')
  t.end()
})

test('deleting a key drops its comment', function (t) {
  const d = i.parse('; a\nalpha = 1\n; b\nbeta = 2\n', { preserveComments: true })
  delete d.alpha
  t.equal(nl(i.stringify(d, { preserveComments: true })), '; b\nbeta=2\n')
  t.end()
})

test('a section named like a comment is emitted normally', function (t) {
  const d = i.parse('[comments-are-fun]\nx = 1\n')
  t.match(nl(i.stringify(d)), /\[comments-are-fun\]\nx=1/)
  t.end()
})

test('encode does not mutate its input object', function (t) {
  const d = i.parse('[a]\nx = 1\n', { preserveComments: true })
  const before = Object.getOwnPropertySymbols(d.a).length
  i.stringify(d, { preserveComments: true })
  t.equal(Object.getOwnPropertySymbols(d.a).length, before)
  t.end()
})

test('an inline comment on an array item round-trips', function (t) {
  t.equal(round('ar[] = one ; first\nar[] = two ; second\n'),
    'ar[]=one ; first\nar[]=two ; second\n')
  t.end()
})

test('each array item keeps its own inline comment, gaps included', function (t) {
  t.equal(round('ar[] = one\nar[] = two ; only this one\nar[] = three\n'),
    'ar[]=one\nar[]=two ; only this one\nar[]=three\n')
  t.end()
})

test('a lead comment and per-item inline comments coexist on an array', function (t) {
  t.equal(round('; the array\nar[] = one ; first\nar[] = two\n'),
    '; the array\nar[]=one ; first\nar[]=two\n')
  t.end()
})

test('an inline comment survives a scalar being promoted to an array', function (t) {
  t.equal(round('foo = 1 ; first\nfoo[] = 2 ; second\n'),
    'foo[]=1 ; first\nfoo[]=2 ; second\n')
  t.end()
})

test('inline comments survive duplicate-key arrays', function (t) {
  const dup = { preserveComments: true, bracketedArray: false }
  const d = i.parse('foo = 1 ; first\nfoo = 2 ; second\n', dup)
  t.equal(nl(i.stringify(d, dup)), 'foo=1 ; first\nfoo=2 ; second\n')
  t.end()
})

test('an escaped semicolon in an array item is not an inline comment', function (t) {
  t.equal(round('ar[] = a\\; b\nar[] = c ; real\n'), 'ar[]=a\\; b\nar[]=c ; real\n')
  t.end()
})
