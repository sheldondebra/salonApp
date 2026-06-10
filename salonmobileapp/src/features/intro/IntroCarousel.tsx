import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { colors, radii, spacing } from "@/theme/colors";

export type IntroSlide = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
};

const SLIDES: IntroSlide[] = [
  {
    id: "book",
    icon: "calendar-outline",
    title: "Book in seconds",
    subtitle: "Clients pick services, stylists, and times — polished booking from any phone.",
    accent: "#F8BBD0",
  },
  {
    id: "run",
    icon: "storefront-outline",
    title: "Run your salon",
    subtitle: "Owners and staff see appointments, revenue, and team tools in one place.",
    accent: "#E879A6",
  },
  {
    id: "grow",
    icon: "sparkles-outline",
    title: "Grow with Schedelux",
    subtitle: "SMS reminders, payments, and insights — built for modern beauty businesses.",
    accent: "#D4A5C4",
  },
];

type IntroCarouselProps = {
  onComplete: () => void;
};

export function IntroCarousel({ onComplete }: IntroCarouselProps) {
  const { width } = Dimensions.get("window");
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      onComplete();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const renderItem: ListRenderItem<IntroSlide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconRing, { backgroundColor: item.accent }]}>
        <Ionicons name={item.icon} size={44} color={colors.primaryForeground} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>Schedelux</Text>
        </View>
        {!isLast ? (
          <Pressable onPress={onComplete} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          label={isLast ? "Get started" : "Next"}
          onPress={goNext}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
    letterSpacing: 0.3,
  },
  skip: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
  skipPlaceholder: {
    width: 40,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  iconRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.black,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  cta: {
    width: "100%",
  },
});
