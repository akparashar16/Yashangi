# Images Directory

This directory contains all static images for the application.

## Directory Structure

```
public/
  assets/
    images/
      StaticProduct/     # Product category images
      avtar.png         # Avatar/User images
      bannetr4.jpg      # Banner images
      banner2.jpg       # Banner images
      icon.png          # Site logo/favicon
      placeholder.jpg   # Placeholder image
```

## Image Requirements

1. **Banner Images**: Should be 1200x400px or similar aspect ratio
2. **Product Images**: Should be 300x300px or similar square format
3. **Category Images**: Should be 300x300px or similar square format
4. **Logo**: Should be 61px height (as per design)

## Image Sources

You can copy images from your ECommerce.Web project:
- `ECommerce.Web/wwwroot/assets/images/` → `public/assets/images/`

## Fallback Behavior

If images are missing, the application will automatically show SVG placeholders with the image name/description.

