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

    try {
        // Load the adventure loops manifest
        const response = await fetch('images/scout_awards_media/adventure-loops.json');
        if (!response.ok) {
            console.log('Adventure loops manifest not found');
            return;
        }

        const manifest = await response.json();

        // Load each image from the manifest
        for (const [sku, filename] of Object.entries(manifest)) {
            const imagePath = `images/scout_awards_media/_all_flat/${filename}`;

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
                // Image doesn't exist, skip silently
            }
        }

        if (loadedCount > 0) {
            console.log(`Loaded ${loadedCount} belt loop images`);
        }
    } catch (error) {
        console.log('Failed to load adventure loops:', error);
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

    // Extract pack number from header if present
    const packMatch = text.match(/Pack\s+(\d+)/i);
    if (packMatch) {
        data.packNumber = packMatch[1];
        appState.packNumber = packMatch[1];
        packNumberInput.value = packMatch[1];
    }

    // Method 1: Try regex pattern matching on entire text
    // Pattern: QTY SKU ItemName Adventure ScoutNames $ Price
    const itemPattern = /(\d+)\s+(6\d{5})\s+(.+?Adventure)\s+([^$]+?)\s+\$/g;
    let match;

    while ((match = itemPattern.exec(text)) !== null) {
        const qty = parseInt(match[1]);
        const sku = match[2];
        let itemName = match[3].trim();
        const scoutText = match[4].trim();

        // Clean up item name - remove "Adventure" suffix
        itemName = itemName.replace(/\s+Adventure\s*$/, '').trim();

        // Parse scout names - split by comma
        const scouts = scoutText.split(',').map(s => s.trim()).filter(s => s.length > 0);

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

    let y = 45;

    if (appState.parsedData && appState.parsedData.summary) {
        // Group adventures by den
        const denGroups = {
            'Lion': [],
            'Tiger': [],
            'Wolf': [],
            'Bear': [],
            'Webelos': [],
            'Arrow of Light': []
        };

        for (const [sku, info] of Object.entries(appState.parsedData.summary)) {
            const den = getDenFromSKU(sku);
            denGroups[den].push({ sku, ...info });
        }

        // Display each den section
        for (const [den, adventures] of Object.entries(denGroups)) {
            if (adventures.length === 0) continue;

            // Check if we need a new page
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            // Den header
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 102, 0);
            doc.text(den, 20, y);
            y += 10;

            // List each adventure in this den
            for (const adventure of adventures) {
                // Check if we need a new page
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }

                const imgSize = 20;

                // Add image if available
                if (appState.images[adventure.sku]) {
                    try {
                        doc.addImage(
                            appState.images[adventure.sku],
                            'JPEG',
                            20,
                            y,
                            imgSize,
                            imgSize
                        );
                    } catch (err) {
                        console.warn(`Failed to add image for SKU ${adventure.sku}:`, err);
                    }
                }

                // Add text info next to image
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(`${adventure.name}`, 45, y + 5);

                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`SKU: ${adventure.sku}`, 45, y + 10);
                doc.text(`Quantity: ${adventure.qty}`, 45, y + 15);

                y += imgSize + 5;
            }

            y += 5; // Space after each den section
        }

    } else {
        doc.setFontSize(10);
        doc.text('No parsed data available. Please upload a purchase order.', 20, y);
    }

    // Save PDF
    doc.save(`Pack_${appState.packNumber}_Shopping_Guide.pdf`);
}

// Helper function to determine den from adventure SKU
function getDenFromSKU(sku) {
    const skuNum = parseInt(sku);

    // Lion adventures: 646384-646407, 660185-660224
    if ((skuNum >= 646384 && skuNum <= 646407) || (skuNum >= 660185 && skuNum <= 660224)) {
        return 'Lion';
    }
    // Tiger adventures: 619914-619929, 660225-660237
    if ((skuNum >= 619914 && skuNum <= 619929) || (skuNum >= 660225 && skuNum <= 660237)) {
        return 'Tiger';
    }
    // Wolf adventures: 619933-619949, 660238-660251
    if ((skuNum >= 619933 && skuNum <= 619949) || (skuNum >= 660238 && skuNum <= 660251)) {
        return 'Wolf';
    }
    // Bear adventures: 619955-619969, 660252-660264, 660402, 660425, 660435, 661069
    if ((skuNum >= 619955 && skuNum <= 619969) || (skuNum >= 660252 && skuNum <= 660264) ||
        skuNum === 660402 || skuNum === 660425 || skuNum === 660435 || skuNum === 661069) {
        return 'Bear';
    }
    // Webelos adventures: 619985-619996, 660265-660280, 660434
    if ((skuNum >= 619985 && skuNum <= 619996) || (skuNum >= 660265 && skuNum <= 660280) || skuNum === 660434) {
        return 'Webelos';
    }
    // Arrow of Light adventures: 619970-619983, 653309, 660281-660297, 660403
    if ((skuNum >= 619970 && skuNum <= 619983) || skuNum === 653309 ||
        (skuNum >= 660281 && skuNum <= 660297) || skuNum === 660403) {
        return 'Arrow of Light';
    }

    return 'Cub Scout';
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
            // Determine den from first adventure (all adventures for a scout should be same den)
            const den = scout.adventures.length > 0 ? getDenFromSKU(scout.adventures[0].sku) : 'Cub Scout';

            // Create one label per scout
            const row = Math.floor(labelIndex / template.cols);
            if (row >= template.rows) {
                doc.addPage();
                labelIndex = 0;
            }

            const currentRow = Math.floor(labelIndex / template.cols);
            const currentCol = labelIndex % template.cols;
            const x = leftMargin + (currentCol * labelWidth);
            const y = topMargin + (currentRow * labelHeight);

            // Draw label border (optional)
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.rect(x, y, labelWidth, labelHeight);

            // Add scout name (centered vertically)
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 63, 135);
            doc.text(scout.name, x + labelWidth / 2, y + labelHeight / 2 - 3, { align: 'center' });

            // Add den (centered, below name)
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(den, x + labelWidth / 2, y + labelHeight / 2 + 4, { align: 'center' });

            labelIndex++;
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
