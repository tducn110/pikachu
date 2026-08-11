import type { ImgHTMLAttributes, ReactNode } from "react";

export const HYPER_ICON_SRC = {
  hint: "/hyper-ui/icons/hint.png",
  shuffle: "/hyper-ui/icons/shuffle.png",
  bomb: "/hyper-ui/icons/bomb.png",
  settings: "/hyper-ui/icons/settings.png",
  trophy: "/hyper-ui/icons/trophy.png",
  clock: "/hyper-ui/icons/clock.png",
  heart: "/hyper-ui/icons/heart.png",
  music: "/hyper-ui/icons/music.png",
  sound: "/hyper-ui/icons/sound.png",
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
