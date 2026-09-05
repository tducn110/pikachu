import type { ImgHTMLAttributes, ReactNode } from "react";

export const HYPER_ICON_SRC = {
  hint: "/hyper-ui/icons/hint.webp",
  shuffle: "/hyper-ui/icons/shuffle.webp",
  bomb: "/hyper-ui/icons/bomb.webp",
  settings: "/hyper-ui/icons/settings.webp",
  trophy: "/hyper-ui/icons/trophy.webp",
  clock: "/hyper-ui/icons/clock.webp",
  heart: "/hyper-ui/icons/heart.webp",
  music: "/hyper-ui/icons/music.webp",
  sound: "/hyper-ui/icons/sound.webp",
} as const;

export type HyperIconName = keyof typeof HYPER_ICON_SRC;

export function HyperIcon({
  name,
  alt = "",
  ...props
}: { name: HyperIconName } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & { alt?: string }) {
  return (
    <img
      src={HYPER_ICON_SRC[name]}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      decoding="async"
      {...props}
    />
  );
}

export function HyperTitleBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`hyper-title-bar ${className}`}>{children}</div>;
}
