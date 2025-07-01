// Helper function to calculate change types for regular indicators
export function getChangeType(percentual: number): "positive" | "negative" | "neutral" {
  if (Math.abs(percentual) < 0.1) return "neutral";
  return percentual >= 0 ? "positive" : "negative";
}

// Helper function to calculate change types for debt indicators
export function getDividaChangeType(percentual: number): "positive" | "negative" | "neutral" {
  // For debt, a reduction (negative) is positive
  if (Math.abs(percentual) < 0.1) return "neutral";
  return percentual < 0 ? "positive" : "negative";
}

// Helper function for indicator status based on thresholds
export function getIndicatorChangeType(
  value: number, 
  threshold1: number, 
  threshold2: number
): "positive" | "negative" | "neutral" {
  // For debt indicators, lower is better
  if (value <= threshold1) return "positive";
  if (value <= threshold2) return "neutral";
  return "negative";
}