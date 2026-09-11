// src/assets/cdn.js
// Static images served from Cloudinary instead of bundled into the Vite
// build — keeps the JS bundle lean and gets CDN caching for free.
//
// `f_auto,q_auto` (inserted right after `/upload/`) tells Cloudinary to
// pick the best format for the requesting browser (WebP/AVIF where
// supported, falling back to the original otherwise) and auto-compress —
// no manual re-exporting needed if the source images ever change.
const CLOUD_NAME = "zhuts6dm";

function cloudinaryUrl(publicId, version) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${version}/${publicId}`;
}

export const LOGO_ICON = cloudinaryUrl("logo-icon.png", "v1789136428");
export const ILLUSTRATION = cloudinaryUrl("illustration.png", "v1789136428");
export const BG_SHAPE = cloudinaryUrl("bg-shape.png", "v1789136427");
export const AUTH_BG = cloudinaryUrl("auth-bg.jpg", "v1789136916");

