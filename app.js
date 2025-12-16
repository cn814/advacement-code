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
const addImageBtn = document.getElementById('addImageBtn');
const imageUploadGrid = document.getElementById('imageUploadGrid');
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
addImageBtn.addEventListener('click', addImageUpload);
packNumberInput.addEventListener('input', (e) => appState.packNumber = e.target.value);
generateShoppingGuide.addEventListener('click', () => generateDocuments('shopping'));
generateLabels.addEventListener('click', () => generateDocuments('labels'));
generateBoth.addEventListener('click', () => generateDocuments('both'));

// Load belt loop images on startup
loadBeltLoopImages();

// Load belt loop images from directory
async function loadBeltLoopImages() {
    try {
        const response = await fetch('images/belt-loops/image-manifest.json');
        if (!response.ok) {
            console.log('No image manifest found - images can be added manually');
            return;
        }

        const manifest = await response.json();

        for (const [key, imageInfo] of Object.entries(manifest.images)) {
            if (key === 'example') continue; // Skip example entry

            const imagePath = `images/belt-loops/${imageInfo.filename}`;
            const sku = imageInfo.sku;

            // Load image and convert to base64
            try {
                const imgResponse = await fetch(imagePath);
                const blob = await imgResponse.blob();
                const reader = new FileReader();

                reader.onload = (e) => {
                    appState.images[sku] = e.target.result;
                    displayImageItem(sku, e.target.result);
                };

                reader.readAsDataURL(blob);
            } catch (err) {
                console.warn(`Failed to load image for SKU ${sku}:`, err);
            }
        }

        console.log('Belt loop images loaded from directory');
    } catch (error) {
        console.log('Image manifest not available - images can be added manually');
    }
}

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

// Parse PDF data to extract scouts and adventures
function parsePDFData(text) {
    const data = {
        dens: {
            'Lion': [],
            'Tiger': [],
            'Wolf': [],
            'Bear': [],
            'Webelos': [],
            'Arrow of Light': []
        }
    };
    
    // This is a simplified parser - you'll need to customize based on your actual PDF format
    // Looking for patterns like: "Scout Name    Adventure Name    Date"
    const lines = text.split('\n');
    let currentScout = null;
    let currentDen = null;
    
    for (let line of lines) {
        line = line.trim();
        
        // Detect den headers
        if (line.includes('Lion') && line.includes('Den')) currentDen = 'Lion';
        else if (line.includes('Tiger') && line.includes('Den')) currentDen = 'Tiger';
        else if (line.includes('Wolf') && line.includes('Den')) currentDen = 'Wolf';
        else if (line.includes('Bear') && line.includes('Den')) currentDen = 'Bear';
        else if (line.includes('Webelos')) currentDen = 'Webelos';
        else if (line.includes('Arrow of Light')) currentDen = 'Arrow of Light';
        
        // Detect scout names and adventures
        // This is a placeholder - customize for your PDF format
        if (currentDen && line.length > 0) {
            // Add parsing logic here based on your PDF structure
        }
    }
    
    appState.parsedData = data;
    displayPreview(data);
}

// Display parsed data preview
function displayPreview(data) {
    let html = '';
    
    for (const [den, scouts] of Object.entries(data.dens)) {
        if (scouts.length > 0) {
            html += `<div class="preview-den">`;
            html += `<h4>${den} Den (${scouts.length} scouts)</h4>`;
            scouts.forEach(scout => {
                html += `<div class="preview-scout">`;
                html += `<strong>${scout.name}</strong>: ${scout.adventures.join(', ')}`;
                html += `</div>`;
            });
            html += `</div>`;
        }
    }
    
    if (html === '') {
        html = '<p>No data parsed yet. The PDF parser needs to be configured for your specific advancement report format.</p>';
        html += '<p><strong>Tip:</strong> You can manually add scout data in the code or enhance the parser.</p>';
    }
    
    previewContent.innerHTML = html;
}

// Add image upload input
function addImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', handleImageUpload);
    input.click();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const imageData = event.target.result;
        const sku = prompt('Enter SKU number for this adventure loop:');
        if (sku) {
            appState.images[sku] = imageData;
            displayImageItem(sku, imageData);
        }
    };
    reader.readAsDataURL(file);
}

function displayImageItem(sku, imageData) {
    const existingItem = document.getElementById(`image-${sku}`);
    if (existingItem) {
        existingItem.remove();
    }
    
    const item = document.createElement('div');
    item.className = 'image-item';
    item.id = `image-${sku}`;
    item.innerHTML = `
        <button class="remove-btn" onclick="removeImage('${sku}')">×</button>
        <img src="${imageData}" alt="Loop ${sku}">
        <input type="text" value="${sku}" readonly>
    `;
    
    imageUploadGrid.insertBefore(item, addImageBtn);
}

function removeImage(sku) {
    delete appState.images[sku];
    document.getElementById(`image-${sku}`).remove();
}

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
    
    // Add content based on parsed data
    let y = 45;
    
    if (appState.parsedData) {
        for (const [den, scouts] of Object.entries(appState.parsedData.dens)) {
            if (scouts.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(255, 102, 0);
                doc.text(`${den} Den`, 20, y);
                y += 10;
                
                // List adventures
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                // Add adventure listing logic here
                
                y += 15;
            }
        }
    } else {
        doc.setFontSize(10);
        doc.text('No parsed data available. Please upload an advancement report.', 20, y);
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
    let pageNumber = 1;
    
    if (appState.parsedData) {
        for (const [den, scouts] of Object.entries(appState.parsedData.dens)) {
            for (const scout of scouts) {
                const row = Math.floor(labelIndex / template.cols);
                const col = labelIndex % template.cols;
                
                // Start new page if needed
                if (row >= template.rows) {
                    doc.addPage();
                    pageNumber++;
                    labelIndex = 0;
                }
                
                const x = leftMargin + (col * labelWidth);
                const y = topMargin + (row * labelHeight);
                
                // Draw label border
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, y, labelWidth, labelHeight);
                
                // Add scout name
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 63, 135);
                doc.text(scout.name, x + 3, y + 6);
                
                // Add adventures
                doc.setFontSize(7);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                let ay = y + 10;
                for (const adventure of scout.adventures) {
                    doc.text(`• ${adventure}`, x + 3, ay);
                    ay += 3;
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
