# Belt Loop Images

This directory contains images of Cub Scout adventure belt loops from ScoutShop.org.

## Quick Start - Simple Method

Just drop your images here named by SKU number:

1. Download belt loop images from ScoutShop.org
2. Rename files to the SKU number (e.g., `614334.jpg`)
3. Save in this `belt-loops/` directory
4. The app will automatically load them!

### Example Structure
```
belt-loops/
  ├── 614334.jpg    (Tiger - Backyard Jungle)
  ├── 614335.png    (Tiger - Games Tigers Play)
  ├── 614336.jpg    (Tiger - My Tiger Jungle)
  └── ...
```

## Supported Formats
- `.jpg` / `.jpeg`
- `.png`
- `.webp`

## Finding SKU Numbers

The SKU is the product number on ScoutShop.org:
- Look in the product URL: `scoutshop.org/...614334`
- Or on the product page details

## Adding Custom SKUs

The app checks for common SKU numbers automatically. To add SKUs not in the default list:

**Option 1:** Add the SKU to the list in `app.js` (line 52)
```javascript
const commonBeltLoopSKUs = [
    '614334', '614335', // ... add your SKUs here
];
```

**Option 2:** Use the manifest file `image-manifest.json` for custom additions

## How It Works

- The app automatically tries to load all images on startup
- Simply name your files by SKU (e.g., `614334.jpg`)
- No configuration needed - just drop images in this folder!
- If an image isn't found, it's silently skipped
- You can still manually add images using the "+ Add Loop Image" button in the app
