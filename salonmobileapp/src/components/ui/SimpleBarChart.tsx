import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme/colors";

export type ChartPoint = {
  label: string;
  value: number;
};

type SimpleBarChartProps = {
  title: string;
  data: ChartPoint[];
  formatValue?: (n: number) => string;
  accentColor?: string;
};

export function SimpleBarChart({
  title,
  data,
  formatValue = (n) => String(n),
  accentColor = colors.accent,
}: SimpleBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 120;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.chartArea, { height: chartHeight }]}>
        {data.map((point, i) => {
          const h = Math.max(4, (point.value / max) * (chartHeight - 24));
          return (
            <View key={`${point.label}-${i}`} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.peak}>
        Peak: {formatValue(max)} · {data.length} days
      </Text>
    </View>
  );
}

type ChartRangeToggleProps = {
  value: 7 | 30;
  onChange: (v: 7 | 30) => void;
};

export function ChartRangeToggle({ value, onChange }: ChartRangeToggleProps) {
  return (
    <View style={toggleStyles.row}>
      {([7, 30] as const).map((d) => (
        <Pressable
          key={d}
          onPress={() => onChange(d)}
          style={[toggleStyles.chip, value === d && toggleStyles.chipActive]}
        >
          <Text style={[toggleStyles.text, value === d && toggleStyles.textActive]}>{d}d</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.black },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
    paddingTop: spacing.sm,
  },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: {
    width: "100%",
    maxWidth: 36,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "80%",
    minWidth: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: { fontSize: 9, fontWeight: "600", color: colors.mutedForeground, textAlign: "center" },
  peak: { fontSize: 11, color: colors.mutedForeground, textAlign: "center" },
});

const toggleStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
  },
  chipActive: { backgroundColor: colors.primary },
  text: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  textActive: { color: colors.primaryForeground },
});
