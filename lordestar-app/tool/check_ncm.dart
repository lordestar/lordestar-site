// 本地解析自检：dart run tool/check_ncm.dart "分享徐佳莹的单曲《灰色》"
import 'package:lordestar_app/src/ncm_local.dart';

Future<void> main(List<String> args) async {
  final text = args.isEmpty ? '分享徐佳莹的单曲《灰色》' : args.join(' ');
  final r = await resolveLocal(text);
  final s = r.song;
  if (s == null) {
    print('ERR: ${r.error}');
  } else {
    print('OK: id=${s.id} | ${s.title} / ${s.artist} / ${s.album}');
    print('cover: ${s.cover.isEmpty ? '(none)' : s.cover}');
    print('url: ${s.songUrl}');
  }
}
