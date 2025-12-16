# Cub Scout Adventure Loop Shopping Tool

A web-based tool to generate shopping guides and distribution labels for Cub Scout adventure loops from advancement reports.

## Features

- 📄 Upload advancement report PDFs from Scoutbook
- 🖼️ Add adventure loop images for visual identification
- 📋 Generate professional shopping guides organized by rank
- 🏷️ Create distribution labels (multiple Avery templates supported)
- 🎨 Clean, user-friendly interface
- 🚀 Runs entirely in the browser (no server needed)

## Supported Label Templates

- Avery 8160 / 5160 (30 labels, 2.625" × 1")
- Avery 8163 / 5163 (10 labels, 4" × 2")
- Avery 8164 (6 labels, 4" × 3.33")

## How to Use

1. **Upload Advancement Report**: Upload your PDF advancement report from Scoutbook
2. **Configure Settings**: 
   - Enter your Pack number
   - Select label template
   - Upload adventure loop images from ScoutShop.org (optional)
3. **Generate Documents**: 
   - Click "Generate Shopping Guide" for a shopping list
   - Click "Generate Labels" for distribution labels
   - Click "Generate Both" for both documents

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `scout-loop-tool`
3. Make it public
4. Don't initialize with README (we'll upload our own files)

### Step 2: Upload Files

Upload these files to your repository:
- `index.html`
- `styles.css`
- `app.js`
- `README.md`

You can do this via:
- **Web interface**: Click "Add file" → "Upload files"
- **Git command line**:
  ```bash
  git clone https://github.com/yourusername/scout-loop-tool.git
  cd scout-loop-tool
  # Copy the files here
  git add .
  git commit -m "Initial commit"
  git push origin main
  ```

### Step 3: Enable GitHub Pages

1. Go to your repository settings
2. Click "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click "Save"
5. Your site will be published at: `https://yourusername.github.io/scout-loop-tool/`

## Customization

### PDF Parser

The included PDF parser is a basic template. You'll need to customize the `parsePDFData()` function in `app.js` to match your specific advancement report format.

Example patterns to look for:
- Scout names (usually followed by ID numbers)
- Adventure names (e.g., "Lion's Pride", "Team Tiger", etc.)
- Completion dates
- Den/rank information

### Adding Pre-loaded Loop Images

You can pre-load common adventure loop images by modifying the `appState.images` object in `app.js`:

```javascript
const appState = {
    images: {
        '619938': 'data:image/jpeg;base64,...', // Air of the Wolf
        '619937': 'data:image/jpeg;base64,...', // Footsteps
        // etc.
    }
};
```

### Styling

Modify `styles.css` to change colors, fonts, or layout. BSA brand colors are defined in CSS variables:
- `--bsa-blue: #003f87`
- `--bsa-red: #ce1126`
- `--bsa-gold: #ffc72c`
- `--bsa-orange: #ff6600`

## Technical Details

### Technologies Used

- **PDF.js**: PDF parsing and text extraction
- **jsPDF**: PDF generation
- **Vanilla JavaScript**: No frameworks required
- **CSS Grid**: Responsive layout

### Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

### Privacy

All processing happens in your browser. No data is uploaded to any server.

## Development

### Local Testing

Simply open `index.html` in a web browser. For best results, use a local web server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server

# Then open http://localhost:8000
```

### File Structure

```
scout-loop-tool/
├── index.html      # Main HTML page
├── styles.css      # Styling
├── app.js          # Application logic
└── README.md       # This file
```

## Known Limitations

- PDF parser needs customization for specific report formats
- Large images may increase page load time
- Maximum 30 labels per page (template dependent)

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use and modify for your Pack's needs.

## Support

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ for Cub Scout volunteers
