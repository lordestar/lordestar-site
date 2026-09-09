import 'package:flutter/material.dart';

/// Lordestar 深色主题：对齐网站全局色板（#0d0f0e 底 + 珊瑚/水鸭点缀）。
const Color kBg = Color(0xFF0D0F0E);
const Color kBgRaise = Color(0xFF141715);
const Color kPanel = Color(0x0DFFFFFF); // rgba(255,255,255,0.05)
const Color kBorder = Color(0x1CFFFFFF); // rgba(255,255,255,0.11)
const Color kBorderSoft = Color(0x12FFFFFF); // rgba(255,255,255,0.07)
const Color kText = Color(0xFFEEF1F2);
const Color kTextSoft = Color(0xFFC9D0D2);
const Color kMuted = Color(0xFF8E989A);
const Color kCoral = Color(0xFFF08A6F);
const Color kAqua = Color(0xFF7FC8C0);
const Color kLilac = Color(0xFFB7A6F5);
const Color kAmber = Color(0xFFE8C176);

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme:
        ColorScheme.fromSeed(
          seedColor: kCoral,
          brightness: Brightness.dark,
        ).copyWith(
          primary: kCoral,
          secondary: kAqua,
          onPrimary: const Color(0xFF241009),
          onSecondary: const Color(0xFF06201E),
          surface: kBgRaise,
          onSurface: kText,
          onSurfaceVariant: kTextSoft,
          outline: kBorder,
          outlineVariant: kBorderSoft,
          error: const Color(0xFFF38B8B),
        ),
    scaffoldBackgroundColor: kBg,
    fontFamilyFallback: const [
      'PingFang SC',
      'Microsoft YaHei',
      'Noto Sans CJK SC',
    ],
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      foregroundColor: kText,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        color: kText,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: kBgRaise,
      indicatorColor: kCoral.withValues(alpha: 0.16),
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: kMuted),
      ),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final sel = states.contains(WidgetState.selected);
        return IconThemeData(color: sel ? kCoral : kMuted);
      }),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kPanel,
      hintStyle: const TextStyle(color: kMuted),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kBorderSoft),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kBorderSoft),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kAqua, width: 1.2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: kCoral,
        foregroundColor: const Color(0xFF241009),
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: kBgRaise,
      contentTextStyle: const TextStyle(color: kText),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: kBorder),
      ),
    ),
    dividerTheme: const DividerThemeData(color: kBorderSoft, thickness: 1),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        return states.contains(WidgetState.selected)
            ? kCoral
            : const Color(0xFF9AA3A5);
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        return states.contains(WidgetState.selected)
            ? kCoral.withValues(alpha: 0.35)
            : const Color(0x33FFFFFF);
      }),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: kBgRaise,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
  );
  return base;
}

/// 页面间统一的「纸张感」卡片。
class PaperCard extends StatelessWidget {
  const PaperCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.color = kPanel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final body = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: kBorderSoft),
      ),
      child: child,
    );
    if (onTap == null) return body;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: body,
      ),
    );
  }
}

/// 小块标签。
class ChipTag extends StatelessWidget {
  const ChipTag(this.label, {super.key, this.color = kAqua});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
