import { memo } from "react";

/**
 * A loose feather carried by the wind — the custom guestbook artwork.
 *
 * Source: feather.png (repo root) → scripts/prepare_guest_feather.py →
 * public/guestbook/feather.webp. To change the artwork, replace the PNG,
 * re-run the script and paste the printed aspect ratio below.
 */
const SRC = "/guestbook/feather.webp";
export const GUEST_FEATHER_ASPECT = 0.5094;

export const GuestFeather = memo(function GuestFeather({ height = 96 }: { height?: number }) {
  return (
    // A tiny decorative sprite that moves every frame — next/image adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="guest-feather-art"
      src={SRC}
      alt=""
      width={Math.round(height * GUEST_FEATHER_ASPECT)}
      height={height}
      draggable={false}
      decoding="async"
    />
  );
});
