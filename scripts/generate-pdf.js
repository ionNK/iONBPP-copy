const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
    console.log('Starting PDF generation...');

    // Define paths
    const htmlPath = path.join(process.cwd(), 'public', 'docs', 'Betika-Promotions-Platform_User_Manual_v1.0.html');
    const pdfPath = path.join(process.cwd(), 'public', 'docs', 'Betika-Promotions-Platform_User_Manual_v1.0.pdf');
    const fileUrl = `file://${htmlPath}`;

    console.log(`Reading HTML from: ${htmlPath}`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to A4 size approximately
    await page.setViewport({ width: 1240, height: 1754 });

    console.log('Navigating to file...');
    // Navigate to the HTML file
    await page.goto(fileUrl, {
        waitUntil: 'networkidle0' // Wait for all images to load
    });

    console.log('Generating PDF...');
    // Generate PDF
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
        }
    });

    await browser.close();
    console.log(`PDF generated successfully at: ${pdfPath}`);
}

generatePDF().catch(console.error);
