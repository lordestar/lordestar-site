import 'package:flutter_test/flutter_test.dart';
import 'package:lordestar_app/src/models.dart';

void main() {
  test('DiaryItem.fromJson 解析服务端字段', () {
    final item = DiaryItem.fromJson(const {
      'dbId': 7,
      'kind': 'song',
      'title': '灰色',
      'artist': '徐佳莹',
      'album': '理想人生',
      'cover': '/media/ncm-covers/524868012.jpg',
      'ncmId': 524868012,
      'songUrl': 'https://music.163.com/#/song?id=524868012',
      'note': '今天一直循环。',
      'images': <String>[],
      'public': true,
      'createdAt': '2026-02-01T10:00:00.000Z',
    });

    expect(item.dbId, 7);
    expect(item.kind, DiaryKind.song);
    expect(item.title, '灰色');
    expect(item.artist, '徐佳莹');
    expect(item.ncmId, 524868012);
    expect(item.isPublic, isTrue);
    expect(item.createdAt.isUtc, isFalse);
  });

  test('toPayload 与服务端 parseDiaryInput 字段一致', () {
    final item = DiaryItem.fromJson(const {
      'dbId': 1,
      'kind': 'photo',
      'title': '照片',
      'artist': '',
      'album': '',
      'cover': '',
      'ncmId': null,
      'songUrl': '',
      'note': '海边',
      'images': ['uploads/1700000000000-a.jpg'],
      'public': false,
      'createdAt': '2026-02-01T00:00:00.000Z',
    });

    final p = item.toPayload();
    expect(p['kind'], 'photo');
    expect(p['images'], ['uploads/1700000000000-a.jpg']);
    expect(p['public'], false);
    expect(p['ncmId'], isNull);
  });

  test('autoTitle 取正文开头（去空白，≤20 字）', () {
    expect(autoTitle('  今天  循环 了一下午 '), '今天 循环 了一下午');
    expect(autoTitle('一'.padRight(30, '二')).length, 20);
  });
}
