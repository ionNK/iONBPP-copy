const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateSupportGuidePDF() {
    console.log('Starting Support Guide PDF generation...');

    // Define paths
    const htmlPath = path.join(process.cwd(), 'public', 'docs', 'Betika_Support_Guide_v1.0.html');
    const pdfPath = path.join(process.cwd(), 'public', 'docs', 'Betika_Support_Guide_v1.0.pdf');
    const fileUrl = `file://${htmlPath}`;

    if (!fs.existsSync(htmlPath)) {
        console.error(`Error: HTML source file not found at ${htmlPath}`);
        process.exit(1);
    }

    console.log(`Reading HTML from: ${htmlPath}`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to approximate A4 width (at 96 DPI, A4 is ~794px width. We use higher for better resolution)
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
            top: '0px', // We handle margins in CSS
            right: '0px',
            bottom: '0px',
            left: '0px'
        }
    });

    await browser.close();
    console.log(`✅ PDF generated successfully at: ${pdfPath}`);
}

generateSupportGuidePDF().catch(console.error);
