'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PUBLIC = path.join(__dirname, '../../public');

/** Paths (as served, e.g. "/js/main.js") of every file under the given directories of public/. */
const listFiles = (...directories) =>
  directories.flatMap((directory) =>
    fs
      .readdirSync(path.join(PUBLIC, directory), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => `/${path.relative(PUBLIC, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')}`),
  );

/** The precache list of the service worker, read by running its file with a stub `self`. */
const readShellAssets = () => {
  const source = fs.readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8');
  return vm.runInNewContext(`${source}\n;SHELL_ASSETS`, { self: { addEventListener() {}, location: { origin: 'http://localhost' } } });
};

test('the service worker precaches every script and stylesheet, so the app starts offline', () => {
  const shell = readShellAssets();
  const needed = ['/', '/index.html', ...listFiles('css', 'js', 'fonts').filter((file) => !file.endsWith('.txt'))];

  for (const asset of needed) assert.ok(shell.includes(asset), `${asset} is missing from SHELL_ASSETS in public/sw.js`);
  assert.equal(new Set(shell).size, shell.length, 'SHELL_ASSETS lists a file twice');
});

test('the service worker precaches only files that exist', () => {
  for (const asset of readShellAssets()) {
    if (asset === '/') continue;
    assert.ok(fs.existsSync(path.join(PUBLIC, asset)), `${asset} is listed in SHELL_ASSETS but does not exist`);
  }
});

test('every relative import in the browser code points at an existing module', () => {
  const modules = listFiles('js');
  assert.ok(modules.length > 0);

  for (const file of modules) {
    const source = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
    for (const [, specifier] of source.matchAll(/\bfrom\s+'(\.{1,2}\/[^']+)'/g)) {
      const target = path.join(PUBLIC, path.dirname(file), specifier);
      assert.ok(fs.existsSync(target), `${file} imports ${specifier}, which does not exist`);
    }
  }
});

test('the page starts one module and keeps no inline script handlers', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)].map(([, attributes]) => attributes.trim());

  assert.deepEqual(
    scripts.filter((attributes) => !attributes.includes('application/ld+json')),
    ['type="module" src="js/main.js"'],
  );
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, 'inline event handler attributes are blocked by the CSP');
});

test('nothing writes inline style attributes, which the CSP refuses', () => {
  const inlineStyle = /\sstyle\s*=|setAttribute\(\s*['"]style['"]/i;
  const sources = ['/index.html', ...listFiles('js')];

  for (const file of sources) {
    const source = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
    assert.doesNotMatch(source, inlineStyle, `${file} sets an inline style attribute: use a CSS class or element.style`);
  }
});

test('browser modules talk through imports and events, not window globals', () => {
  for (const file of listFiles('js')) {
    const source = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
    assert.doesNotMatch(source, /window\.__\w+/, `${file} uses a window.__ global`);
  }
});

test('every stylesheet is linked from the page, and the page links no stylesheet that does not exist', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  const linked = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(([, href]) => `/${href}`);

  assert.deepEqual([...linked].sort(), listFiles('css').sort());
  assert.equal(new Set(linked).size, linked.length, 'a stylesheet is linked twice');
});

test('every font file referenced by the stylesheets exists and no stylesheet points off-site', () => {
  for (const file of listFiles('css')) {
    const source = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
    assert.doesNotMatch(source, /https?:\/\//, `${file} references another origin`);
    for (const [, url] of source.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      assert.ok(fs.existsSync(path.join(PUBLIC, path.dirname(file), url)), `${file} references ${url}, which does not exist`);
    }
  }

  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /(?:href|src)=["']https?:\/\/(?!github\.com)/i, 'index.html loads a resource from another origin');
});
