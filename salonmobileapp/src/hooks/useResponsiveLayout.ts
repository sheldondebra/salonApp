import { useWindowDimensions } from "react-native";
import { spacing } from "@/theme/colors";

const TABLET_MIN_WIDTH = 768;
const DESKTOP_MIN_WIDTH = 1024;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const isWide = width >= DESKTOP_MIN_WIDTH;

  return {
    width,
    height,
    isTablet,
    isWide,
    /** Centered column max width */
    contentMaxWidth: isWide ? 1100 : isTablet ? 900 : width,
    horizontalPadding: isTablet ? spacing.xl : spacing.lg,
    /** List columns for card grids */
    gridColumns: isWide ? 3 : isTablet ? 2 : 1,
    /** Master-detail: show side-by-side list + detail on wide tablet+ web */
    useSplitLayout: isTablet && width >= 900,
  };
}
