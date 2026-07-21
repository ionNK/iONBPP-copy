
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log('Connecting to DB...');
const prisma = new PrismaClient();

async function main() {
    console.log('Querying logs...');
    try {
        const logs = await prisma.eventLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log('Logs found:', logs.length);
        console.log(JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error('Query failed:', err);
    }
}

main()
    .catch(e => console.error('Main error:', e))
    .finally(async () => {
        await prisma.$disconnect();
    });
