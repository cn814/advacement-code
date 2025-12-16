# Quick Start Guide: Deploying to GitHub Pages

## What You Need
- A GitHub account (free) - sign up at https://github.com
- The 5 files from this project

## Step-by-Step Instructions

### Part 1: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click "Sign up"
3. Follow the prompts to create your account

### Part 2: Create a New Repository
1. Once logged in to GitHub, click the "+" icon in the top right
2. Select "New repository"
3. Name it: `scout-loop-tool` (or any name you prefer)
4. Choose "Public"
5. **DO NOT** check "Add a README file"
6. Click "Create repository"

### Part 3: Upload Your Files
1. On the repository page, click "uploading an existing file"
2. Drag and drop these 5 files:
   - index.html
   - styles.css
   - app.js
   - README.md
   - scout-data-template.js
3. Scroll down and click "Commit changes"

### Part 4: Enable GitHub Pages
1. In your repository, click "Settings" (top navigation)
2. Scroll down and click "Pages" (left sidebar)
3. Under "Source", select "main" from the dropdown
4. Click "Save"
5. Wait 1-2 minutes for GitHub to build your site

### Part 5: Visit Your Website
Your website will be at:
```
https://YOUR-USERNAME.github.io/scout-loop-tool/
```

Replace `YOUR-USERNAME` with your actual GitHub username.

Example: If your username is `pack361leader`, your site would be:
```
https://pack361leader.github.io/scout-loop-tool/
```

## Troubleshooting

**"I don't see my website yet"**
- Wait 2-3 minutes after enabling Pages
- Check that all files uploaded correctly
- Make sure "main" branch is selected in Pages settings

**"The page shows but nothing works"**
- Check browser console for errors (F12 key)
- Make sure all 5 files were uploaded
- Try a different browser (Chrome recommended)

**"PDF parsing doesn't work"**
- The parser needs customization for your specific report format
- You can manually add scout data using the scout-data-template.js file
- Or continue using your Python scripts locally

## Updating Your Site

To update the site after making changes:
1. Go to your repository on GitHub
2. Click on the file you want to edit
3. Click the pencil icon (Edit)
4. Make your changes
5. Click "Commit changes"
6. Wait 1-2 minutes for the site to rebuild

## Customization Ideas

### Change Your Pack Number
Edit `app.js` and find this line:
```javascript
packNumber: '361'
```
Change `361` to your pack number.

### Change Colors
Edit `styles.css` and modify the color variables at the top:
```css
:root {
    --bsa-blue: #003f87;
    --bsa-red: #ce1126;
    --bsa-gold: #ffc72c;
    --bsa-orange: #ff6600;
}
```

### Pre-load Scout Data
1. Edit `scout-data-template.js`
2. Add your scout data in the format shown
3. In `index.html`, add before the closing `</body>` tag:
   ```html
   <script src="scout-data-template.js"></script>
   ```

## Getting Help

- **GitHub Pages docs**: https://pages.github.com/
- **GitHub support**: https://support.github.com/
- **HTML/CSS/JS tutorials**: https://www.w3schools.com/

## Security Note

This tool runs entirely in your browser. No data is sent to any server. Your advancement reports and scout information stay on your computer.

---

Good luck with your adventure loop distribution! 🦅
