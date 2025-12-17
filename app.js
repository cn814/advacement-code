// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application state
const appState = {
    pdfData: null,
    parsedData: null,
    images: {},
    packNumber: '361'
};

// Label template configurations
const labelTemplates = {
    '8160': { cols: 3, rows: 10, width: 2.625, height: 1.0, leftMargin: 0.21875, topMargin: 0.5 },
    '5160': { cols: 3, rows: 10, width: 2.625, height: 1.0, leftMargin: 0.21875, topMargin: 0.5 },
    '8163': { cols: 2, rows: 5, width: 4.0, height: 2.0, leftMargin: 0.21875, topMargin: 0.5 },
    '5163': { cols: 2, rows: 5, width: 4.0, height: 2.0, leftMargin: 0.21875, topMargin: 0.5 },
    '8164': { cols: 2, rows: 3, width: 4.0, height: 3.33, leftMargin: 0.21875, topMargin: 0.5 }
};

// DOM elements
const pdfUpload = document.getElementById('pdfUpload');
const uploadArea = document.getElementById('uploadArea');
const uploadStatus = document.getElementById('uploadStatus');
const configSection = document.getElementById('configSection');
const generateSection = document.getElementById('generateSection');
const packNumberInput = document.getElementById('packNumber');
const labelTemplateSelect = document.getElementById('labelTemplate');
const previewContent = document.getElementById('previewContent');
const generateShoppingGuide = document.getElementById('generateShoppingGuide');
const generateLabels = document.getElementById('generateLabels');
const generateBoth = document.getElementById('generateBoth');
const generateStatus = document.getElementById('generateStatus');

// Event listeners
pdfUpload.addEventListener('change', handleFileUpload);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
uploadArea.addEventListener('dragleave', handleDragLeave);
packNumberInput.addEventListener('input', (e) => appState.packNumber = e.target.value);
generateShoppingGuide.addEventListener('click', () => generateDocuments('shopping'));
generateLabels.addEventListener('click', () => generateDocuments('labels'));
generateBoth.addEventListener('click', () => generateDocuments('both'));

// Common belt loop SKUs - add your SKUs here
const commonBeltLoopSKUs = [
    // Tiger
    '614334', '614335', '614336', '614337', '614338', '614339', '614340',
    // Wolf
    '614341', '614342', '614343', '614344', '614345', '614346', '614347',
    // Bear
    '614348', '614349', '614350', '614351', '614352', '614353', '614354',
    // Webelos
    '614355', '614356', '614357', '614358', '614359', '614360', '614361',
    // Add more SKUs as needed
];

// Load belt loop images from directory
async function loadBeltLoopImages() {
    let loadedCount = 0;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    // Try to load each common SKU
    for (const sku of commonBeltLoopSKUs) {
        let imageLoaded = false;

        // Try each image extension
        for (const ext of imageExtensions) {
            if (imageLoaded) break;

            const imagePath = `images/belt-loops/${sku}.${ext}`;

            try {
                const imgResponse = await fetch(imagePath);
                if (imgResponse.ok) {
                    const blob = await imgResponse.blob();
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        appState.images[sku] = e.target.result;
                    };

                    reader.readAsDataURL(blob);
                    imageLoaded = true;
                    loadedCount++;
                }
            } catch (err) {
                // Image doesn't exist, skip silently
            }
        }
    }

    // Also try to load from manifest for custom additions
    try {
        const response = await fetch('images/belt-loops/image-manifest.json');
        if (response.ok) {
            const manifest = await response.json();

            for (const [key, imageInfo] of Object.entries(manifest.images)) {
                if (key === 'example') continue;

                const imagePath = `images/belt-loops/${imageInfo.filename}`;
                const sku = imageInfo.sku;

                // Skip if already loaded
                if (appState.images[sku]) continue;

                try {
                    const imgResponse = await fetch(imagePath);
                    if (imgResponse.ok) {
                        const blob = await imgResponse.blob();
                        const reader = new FileReader();

                        reader.onload = (e) => {
                            appState.images[sku] = e.target.result;
                        };

                        reader.readAsDataURL(blob);
                        loadedCount++;
                    }
                } catch (err) {
                    console.warn(`Failed to load ${sku}:`, err);
                }
            }
        }
    } catch (error) {
        // No manifest file, that's okay
    }

    if (loadedCount > 0) {
        console.log(`Loaded ${loadedCount} belt loop images from directory`);
    }
}

// Load images on startup
loadBeltLoopImages();

// File upload handlers
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        processPDF(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        processPDF(file);
    }
}

// Process uploaded PDF
async function processPDF(file) {
    try {
        showStatus(uploadStatus, 'Processing PDF...', 'info');
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        appState.pdfData = fullText;
        parsePDFData(fullText);
        
        showStatus(uploadStatus, '✓ PDF processed successfully!', 'success');
        configSection.style.display = 'block';
        generateSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error processing PDF:', error);
        showStatus(uploadStatus, '✗ Error processing PDF: ' + error.message, 'error');
    }
}

// Parse PDF data to extract scouts and adventures from ScoutShop purchase order
function parsePDFData(text) {
    const data = {
        scouts: [],      // Array of {name, adventures: [{sku, name, qty}]}
        summary: {},     // SKU -> {name, qty, scouts: [names]}
        packNumber: appState.packNumber
    };

    console.log('=== DEBUG: Raw PDF Text ===');
    console.log(text);
    console.log('=== END DEBUG ===');

    // Extract pack number from header if present
    const packMatch = text.match(/Pack\s+(\d+)/i);
    if (packMatch) {
        data.packNumber = packMatch[1];
        appState.packNumber = packMatch[1];
        packNumberInput.value = packMatch[1];
    }

    // Method 1: Try regex pattern matching on entire text
    // This handles cases where PDF extraction doesn't preserve line breaks
    const itemPattern = /(\d+)\s+(6\d{5})\s+([^\n$]+?)(?:Adventure)?\s+((?:[A-Z][a-z]+\s+[A-Z](?:,\s*)?)+)/g;
    let match;

    while ((match = itemPattern.exec(text)) !== null) {
        const qty = parseInt(match[1]);
        const sku = match[2];
        let itemName = match[3].trim();
        const scoutText = match[4].trim();

        // Clean up item name
        itemName = itemName.replace(/\s*Adventure\s*$/, '').replace(/\$.*$/, '').trim();

        // Parse scout names
        const scouts = scoutText.split(',').map(s => s.trim()).filter(s => s.length > 0);

        console.log(`Found: QTY=${qty}, SKU=${sku}, Item=${itemName}, Scouts=${scouts.join(', ')}`);

        // Add to summary
        data.summary[sku] = {
            name: itemName,
            qty: qty,
            scouts: scouts,
            unitPrice: 1.99
        };

        // Add to individual scout records
        scouts.forEach(scoutName => {
            let scout = data.scouts.find(s => s.name === scoutName);
            if (!scout) {
                scout = { name: scoutName, adventures: [] };
                data.scouts.push(scout);
            }
            scout.adventures.push({
                sku: sku,
                name: itemName,
                qty: 1
            });
        });
    }

    // Method 2: If Method 1 didn't find anything, try line-by-line parsing
    if (Object.keys(data.summary).length === 0) {
        console.log('Method 1 failed, trying line-by-line parsing...');
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Look for SKU pattern
            const skuMatch = line.match(/(\d+)\s+(6\d{5})\s+(.+)/);
            if (skuMatch) {
                const qty = parseInt(skuMatch[1]);
                const sku = skuMatch[2];
                let itemName = skuMatch[3];

                // Clean up item name
                itemName = itemName.replace(/\s*Adventure\s*$/, '').replace(/\$.*$/, '').trim();

                // Look ahead for scout names
                let scouts = [];
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.match(/^[\d\$]/) && !nextLine.includes('Adventure') && nextLine.match(/[A-Z][a-z]+\s+[A-Z]/)) {
                        scouts = nextLine.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                }

                console.log(`Line parse: QTY=${qty}, SKU=${sku}, Item=${itemName}, Scouts=${scouts.join(', ')}`);

                data.summary[sku] = {
                    name: itemName,
                    qty: qty,
                    scouts: scouts,
                    unitPrice: 1.99
                };

                scouts.forEach(scoutName => {
                    let scout = data.scouts.find(s => s.name === scoutName);
                    if (!scout) {
                        scout = { name: scoutName, adventures: [] };
                        data.scouts.push(scout);
                    }
                    scout.adventures.push({
                        sku: sku,
                        name: itemName,
                        qty: 1
                    });
                });
            }
        }
    }

    console.log('Parsed data:', data);
    appState.parsedData = data;
    displayPreview(data);
}

// Display parsed data preview
function displayPreview(data) {
    let html = '';

    if (data.scouts && data.scouts.length > 0) {
        html += `<div class="preview-summary">`;
        html += `<h4>Order Summary (${data.scouts.length} scouts, ${Object.keys(data.summary).length} different adventures)</h4>`;
        html += `</div>`;

        // Show summary by adventure
        html += `<div class="preview-section">`;
        html += `<h5>By Adventure:</h5>`;
        for (const [sku, info] of Object.entries(data.summary)) {
            html += `<div class="preview-item">`;
            html += `<strong>${info.name}</strong> (${sku}): ${info.qty} loops<br>`;
            html += `<span class="scout-list">${info.scouts.join(', ')}</span>`;
            html += `</div>`;
        }
        html += `</div>`;

        // Show by scout
        html += `<div class="preview-section">`;
        html += `<h5>By Scout:</h5>`;
        data.scouts.forEach(scout => {
            html += `<div class="preview-scout">`;
            html += `<strong>${scout.name}</strong>: ${scout.adventures.length} loop(s)<br>`;
            html += `<span class="adventure-list">${scout.adventures.map(a => a.name).join(', ')}</span>`;
            html += `</div>`;
        });
        html += `</div>`;
    } else {
        html = '<p>No data found in the purchase order. Please check the PDF format.</p>';
    }

    previewContent.innerHTML = html;
}

// Manual image upload and display functions removed - images now auto-load from directory
// See loadBeltLoopImages() function above

// Generate documents
async function generateDocuments(type) {
    try {
        showStatus(generateStatus, 'Generating documents...', 'info');
        
        if (type === 'shopping' || type === 'both') {
            await generateShoppingGuidePDF();
        }
        
        if (type === 'labels' || type === 'both') {
            await generateLabelsPDF();
        }
        
        showStatus(generateStatus, '✓ Documents generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating documents:', error);
        showStatus(generateStatus, '✗ Error generating documents: ' + error.message, 'error');
    }
}

// Generate shopping guide PDF
async function generateShoppingGuidePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 63, 135);
    doc.text(`Pack ${appState.packNumber} Adventure Loops`, 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Shopping Guide', 105, 28, { align: 'center' });

    const date = new Date().toLocaleDateString();
    doc.setFontSize(9);
    doc.text(date, 105, 35, { align: 'center' });

    // Add content based on parsed data
    let y = 50;

    if (appState.parsedData && appState.parsedData.summary) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Adventure Loop Shopping List', 20, y);
        y += 8;

        // Calculate total loops
        const totalLoops = Object.values(appState.parsedData.summary).reduce((sum, item) => sum + item.qty, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Total Loops: ${totalLoops}`, 20, y);
        y += 10;

        // Table headers
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('QTY', 20, y);
        doc.text('SKU', 35, y);
        doc.text('Adventure Name', 60, y);
        doc.text('Scouts', 120, y);
        y += 2;

        // Draw header line
        doc.setDrawColor(0, 0, 0);
        doc.line(20, y, 190, y);
        y += 6;

        // List each adventure
        doc.setFont(undefined, 'normal');
        for (const [sku, info] of Object.entries(appState.parsedData.summary)) {
            // Check if we need a new page
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.text(info.qty.toString(), 20, y);
            doc.text(sku, 35, y);
            doc.text(info.name, 60, y, { maxWidth: 55 });

            // Wrap scout names if needed
            const scoutText = info.scouts.join(', ');
            const scoutLines = doc.splitTextToSize(scoutText, 70);
            doc.text(scoutLines, 120, y);

            y += Math.max(6, scoutLines.length * 4);
        }

        // Add summary at bottom
        y += 10;
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        doc.line(20, y, 190, y);
        y += 6;
        doc.setFont(undefined, 'bold');
        doc.text(`Total: ${totalLoops} adventure loops`, 20, y);

    } else {
        doc.setFontSize(10);
        doc.text('No parsed data available. Please upload a purchase order.', 20, y);
    }

    // Save PDF
    doc.save(`Pack_${appState.packNumber}_Shopping_Guide.pdf`);
}

// Generate labels PDF
async function generateLabelsPDF() {
    const { jsPDF } = window.jspdf;
    const template = labelTemplates[labelTemplateSelect.value];
    const doc = new jsPDF();

    const inch = 25.4; // mm per inch
    const labelWidth = template.width * inch;
    const labelHeight = template.height * inch;
    const leftMargin = template.leftMargin * inch;
    const topMargin = template.topMargin * inch;

    let labelIndex = 0;

    if (appState.parsedData && appState.parsedData.scouts) {
        for (const scout of appState.parsedData.scouts) {
            for (const adventure of scout.adventures) {
                // Start new page if needed
                const row = Math.floor(labelIndex / template.cols);
                if (row >= template.rows) {
                    doc.addPage();
                    labelIndex = 0;
                }

                const currentRow = Math.floor(labelIndex / template.cols);
                const currentCol = labelIndex % template.cols;
                const x = leftMargin + (currentCol * labelWidth);
                const y = topMargin + (currentRow * labelHeight);

                // Draw label border (optional - comment out for borderless)
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.1);
                doc.rect(x, y, labelWidth, labelHeight);

                // Add scout name
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 63, 135);
                doc.text(scout.name, x + 3, y + 6);

                // Add adventure name
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                const adventureLines = doc.splitTextToSize(adventure.name, labelWidth - 6);
                doc.text(adventureLines, x + 3, y + 11);

                // Add SKU (smaller, at bottom)
                doc.setFontSize(6);
                doc.setTextColor(128, 128, 128);
                doc.text(`SKU: ${adventure.sku}`, x + 3, y + labelHeight - 3);

                // Add loop image if available
                if (appState.images[adventure.sku]) {
                    try {
                        const imgSize = Math.min(labelHeight - 10, labelWidth / 3);
                        doc.addImage(
                            appState.images[adventure.sku],
                            'JPEG',
                            x + labelWidth - imgSize - 3,
                            y + 3,
                            imgSize,
                            imgSize
                        );
                    } catch (err) {
                        console.warn(`Failed to add image for SKU ${adventure.sku}:`, err);
                    }
                }

                labelIndex++;
            }
        }
    }

    // Save PDF
    doc.save(`Pack_${appState.packNumber}_Labels_${labelTemplateSelect.value}.pdf`);
}

// Utility function to show status messages
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}
