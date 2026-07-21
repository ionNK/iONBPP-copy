const fs = require('fs');
const report = JSON.parse(fs.readFileSync('./lighthouse-report.json', 'utf8'));

const categories = report.categories;
console.log('--- lighthouse scores ---');
for (const [key, value] of Object.entries(categories)) {
    console.log(`${value.title}: ${Math.round(value.score * 100)}`);
}

console.log('\n--- top opportunities ---');
const opportunities = Object.values(report.audits)
    .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score < 0.9)
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 5);

opportunities.forEach(op => {
    console.log(`- ${op.title} (${Math.round(op.score * 100)}): ${op.displayValue || ''}`);
});
