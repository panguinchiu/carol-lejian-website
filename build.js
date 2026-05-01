#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/+$/, '');

function applyBasePath(text) {
  if (!BASE_PATH) return text;
  // href="/..." or src="/..." (not href="//...") — HTML
  text = text.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE_PATH}/`);
  // url(/...) in CSS / inline style — also skip url(//...)
  text = text.replace(/url\((['"]?)\/(?!\/)/g, (_m, q) => `url(${q}${BASE_PATH}/`);
  return text;
}

const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/content.json'), 'utf8'));

const partialsDir = path.join(ROOT, 'templates/partials');
fs.readdirSync(partialsDir).forEach(file => {
  const name = path.basename(file, '.hbs');
  Handlebars.registerPartial(name, fs.readFileSync(path.join(partialsDir, file), 'utf8'));
});

Handlebars.registerHelper('poeticLines', function(lines) {
  if (!Array.isArray(lines)) return '';
  return new Handlebars.SafeString(
    lines.map(line =>
      line === ''
        ? '<p class="stanza-break" aria-hidden="true"></p>'
        : `<p>${Handlebars.escapeExpression(line)}</p>`
    ).join('\n')
  );
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('json', function(obj) {
  return new Handlebars.SafeString(JSON.stringify(obj, null, 2));
});

Handlebars.registerHelper('jsonInline', function(obj) {
  return new Handlebars.SafeString(JSON.stringify(obj));
});

const pages = [
  { template: 'index.hbs',    output: 'index.html',    page: 'home',     data: content.home },
  { template: 'qhht.hbs',     output: 'qhht.html',     page: 'qhht',     data: content.qhht },
  { template: 'about.hbs',    output: 'about.html',    page: 'about',    data: content.about },
  { template: 'service.hbs',  output: 'service.html',  page: 'service',  data: content.service },
  { template: 'faq.hbs',      output: 'faq.html',      page: 'faq',      data: content.faq },
  { template: 'training.hbs', output: 'training.html', page: 'training', data: content.training },
  { template: 'contact.hbs',  output: 'contact.html',  page: 'contact',  data: content.contact },
];

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

pages.forEach(({ template, output, page, data }) => {
  const tplPath = path.join(ROOT, 'templates', template);
  const tplSrc = fs.readFileSync(tplPath, 'utf8');
  const compile = Handlebars.compile(tplSrc);
  const html = compile({
    global: content.global,
    seo: content.seo && content.seo[page],
    page,
    ...data,
  });
  fs.writeFileSync(path.join(DIST, output), applyBasePath(html), 'utf8');
  console.log('  ✓', output);
});

// CSS/JS: copy with BASE_PATH transform applied
['css', 'js'].forEach(dir => {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) {
    copyDirSync(src, path.join(DIST, dir), { transform: applyBasePath, exts: ['.css', '.js'] });
  }
});

// assets, admin: copy as-is (binary safe)
['assets', 'admin'].forEach(dir => {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) {
    copyDirSync(src, path.join(DIST, dir));
  }
});

['llms.txt', 'robots.txt', 'sitemap.xml', 'favicon.ico', 'CNAME'].forEach(f => {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, f));
});

const dataOut = path.join(DIST, 'data');
fs.mkdirSync(dataOut, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'data/content.json'), path.join(dataOut, 'content.json'));

console.log('\n✅ Build complete → dist/');

function copyDirSync(src, dest, opts = {}) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d, opts);
    } else if (opts.transform && opts.exts && opts.exts.includes(path.extname(entry.name))) {
      const text = fs.readFileSync(s, 'utf8');
      fs.writeFileSync(d, opts.transform(text), 'utf8');
    } else {
      fs.copyFileSync(s, d);
    }
  });
}
