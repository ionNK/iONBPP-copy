const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const ALLOW = [path.join('src', 'app', 'admin', 'login', 'page.tsx')];
const hits = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(e.name) && fs.readFileSync(p, 'utf8').includes('style jsx')) {
      const rel = path.relative(path.join(__dirname, '..'), p);
      if (!ALLOW.some((a) => rel === a)) hits.push(rel);
    }
  }
}

walk(ROOT);

if (hits.length) {
  console.error('style-jsx guard: forbidden <style jsx> found in:');
  hits.forEach((h) => console.error('  ' + h));
  process.exit(1);
}

console.log('style-jsx guard: clean');
