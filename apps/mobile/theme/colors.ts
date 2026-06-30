// ═══════════════════════════════════════════════════
// SekolahPintar — Color Palette
// ═══════════════════════════════════════════════════

export const lightColors = {
  // Brand
  primary: '#075E54',
  primaryLight: '#128C7E',
  secondary: '#128C7E',
  accent: '#25D366',
  accentLight: '#34EB7A',

  // Background
  background: '#FFFFFF',
  surface: '#F0F2F5',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#111B21',
  textSecondary: '#667781',
  textTertiary: '#8696A0',
  textInverse: '#FFFFFF',

  // Chat bubbles
  bubbleOutgoing: '#DCF8C6',
  bubbleIncoming: '#FFFFFF',
  bubbleOutgoingText: '#111B21',
  bubbleIncomingText: '#111B21',

  // UI elements
  border: '#E9EDEF',
  divider: '#E9EDEF',
  inputBackground: '#F0F2F5',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E9EDEF',
  headerBackground: '#075E54',
  headerText: '#FFFFFF',
  statusBar: '#064E46',

  // Semantic
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  info: '#2196F3',

  // Grades
  gradeHigh: '#4CAF50',
  gradeMedium: '#FFC107',
  gradeLow: '#FF5252',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  ripple: 'rgba(0, 0, 0, 0.1)',

  // Shadows
  shadow: '#000000',

  // FAB
  fab: '#25D366',
  fabText: '#FFFFFF',

  // Unread badge
  badge: '#25D366',
  badgeText: '#FFFFFF',

  // Search
  searchBackground: '#F0F2F5',
  searchText: '#111B21',
  searchPlaceholder: '#667781',
};

export const darkColors = {
  // Brand
  primary: '#00A884',
  primaryLight: '#00A884',
  secondary: '#00A884',
  accent: '#25D366',
  accentLight: '#34EB7A',

  // Background
  background: '#0B141A',
  surface: '#1F2C34',
  surfaceElevated: '#233138',

  // Text
  text: '#E9EDEF',
  textSecondary: '#8696A0',
  textTertiary: '#667781',
  textInverse: '#111B21',

  // Chat bubbles
  bubbleOutgoing: '#005C4B',
  bubbleIncoming: '#202C33',
  bubbleOutgoingText: '#E9EDEF',
  bubbleIncomingText: '#E9EDEF',

  // UI elements
  border: '#233138',
  divider: '#233138',
  inputBackground: '#1F2C34',
  tabBar: '#1F2C34',
  tabBarBorder: '#233138',
  headerBackground: '#1F2C34',
  headerText: '#E9EDEF',
  statusBar: '#0B141A',

  // Semantic
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  info: '#2196F3',

  // Grades
  gradeHigh: '#4CAF50',
  gradeMedium: '#FFC107',
  gradeLow: '#FF5252',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  ripple: 'rgba(255, 255, 255, 0.1)',

  // Shadows
  shadow: '#000000',

  // FAB
  fab: '#00A884',
  fabText: '#111B21',

  // Unread badge
  badge: '#00A884',
  badgeText: '#111B21',

  // Search
  searchBackground: '#233138',
  searchText: '#E9EDEF',
  searchPlaceholder: '#8696A0',
};

export type ColorScheme = typeof lightColors;
