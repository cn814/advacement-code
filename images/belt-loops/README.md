# Belt Loop Images

This directory contains images of Cub Scout adventure belt loops from ScoutShop.org.

## Quick Start

You can organize your images in two ways - both work automatically!

### Option 1: Flat Structure (Simple)
Just drop all images directly in the `belt-loops/` folder:

```
belt-loops/
  ├── 619939.jpg    (Code of the Wolf)
  ├── 619937.jpg    (Footsteps)
  ├── 646404.jpg    (Fun on the Run)
  └── ...
```

### Option 2: Organized by Den (Recommended)
Create subfolders for each rank:

```
belt-loops/
  ├── tiger/
  │   ├── 619939.jpg
  │   └── ...
  ├── wolf/
  │   ├── 646404.jpg
  │   └── ...
  ├── bear/
  │   └── ...
  ├── webelos/
  │   └── ...
  └── arrow-of-light/  (or 'aol/')
      └── ...
```

The app automatically checks all locations!

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
