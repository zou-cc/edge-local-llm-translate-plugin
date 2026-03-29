# Icon Generation Guide

## Icon Source

The `icon.svg` file is the master source for all extension icons.

### Current Icon Design

The icon features:
- **Background**: Green (#4CAF50) rounded rectangle
- **Symbol**: Chinese character "译" (translation)
- **Size**: 128x128 SVG viewBox

## Converting SVG to PNG

Since the development environment doesn't have image generation tools, you'll need to convert the SVG to PNG at the required sizes.

### Required Sizes

According to `manifest.json`, the extension needs icons at:
- **16x16** pixels - `icon16.png` (toolbar icon)
- **48x48** pixels - `icon48.png` (extension management page)
- **128x128** pixels - `icon128.png` (Chrome Web Store)

### Method 1: Command Line (Recommended)

Using ImageMagick:

```bash
# Install ImageMagick (if not already installed)
# macOS: brew install imagemagick
# Ubuntu/Debian: sudo apt-get install imagemagick
# Windows: choco install imagemagick

# Convert to 16x16
convert -background none icon.svg -resize 16x16 icon16.png

# Convert to 48x48
convert -background none icon.svg -resize 48x48 icon48.png

# Convert to 128x128
convert -background none icon.svg -resize 128x128 icon128.png
```

Using Inkscape (better SVG rendering):

```bash
# Export to 16x16
inkscape icon.svg --export-type=png --export-filename=icon16.png -w 16 -h 16

# Export to 48x48
inkscape icon.svg --export-type=png --export-filename=icon48.png -w 48 -h 48

# Export to 128x128
inkscape icon.svg --export-type=png --export-filename=icon128.png -w 128 -h 128
```

### Method 2: Online Tools

1. **SVG to PNG Converter Websites**:
   - Convertio (convertio.co)
   - CloudConvert (cloudconvert.com)
   - SVG to PNG (svg-to-png.com)

2. **Steps**:
   - Upload `icon.svg`
   - Set dimensions: 16, 48, and 128 pixels
   - Download each PNG file
   - Rename to `icon16.png`, `icon48.png`, `icon128.png`

### Method 3: Design Software

**Using Adobe Illustrator**:
1. Open `icon.svg`
2. File → Export → Export As
3. Format: PNG
4. Set width/height to: 16, 48, or 128
5. Export with transparency

**Using Figma**:
1. Import `icon.svg`
2. Set frame size to 16×16, 48×48, or 128×128
3. Export as PNG with transparent background

**Using GIMP**:
1. File → Open → Select `icon.svg`
2. Set import size to desired dimension
3. File → Export As → `icon16.png` (etc.)

## Icon Guidelines

### Technical Requirements

- **Format**: PNG with transparency
- **Color Space**: RGB (not CMYK)
- **Transparency**: Supported and recommended
- **File Size**: Keep under 100KB each

### Visual Guidelines

- The icon should remain recognizable at 16×16 (toolbar size)
- Use high contrast for visibility
- The "译" character should remain clear at all sizes
- Green background (#4CAF50) matches Material Design guidelines

## Manifest Configuration

Icons are referenced in `manifest.json`:

```json
{
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

## Testing Icons

After generating PNG files:

1. Load the extension in Chrome/Edge
2. Check the toolbar icon (should show 16×16 version)
3. Visit `chrome://extensions` or `edge://extensions`
4. Verify the 48×48 icon displays correctly
5. The 128×128 icon is used for the Chrome Web Store listing

## Alternative Icon Designs

If you want to customize the icon, here are some alternative concepts:

1. **Translation Symbol**: Globe with arrows
2. **Text Bubble**: Chat icon with "A→中"
3. **Book**: Open book with translation marks
4. **Magic Wand**: Wand transforming text

To use a different design, replace the contents of `icon.svg` and regenerate the PNG files.
