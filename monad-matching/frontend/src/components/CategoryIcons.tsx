import {
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon,
  CodeBracketIcon,
  LinkIcon,
  PhotoIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

import type { CategoryIconKey } from "../data/mock";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** 카테고리 → Heroicons 24×24 outline */
export const CATEGORY_ICONS: Record<CategoryIconKey, SvgIcon> = {
  dev: CodeBracketIcon,
  design: SwatchIcon,
  art: PhotoIcon,
  climbing: ArrowTrendingUpIcon,
  coffee: BuildingStorefrontIcon,
  onchain: LinkIcon,
};
