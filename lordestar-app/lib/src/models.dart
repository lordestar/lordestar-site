/// 数据模型：与服务端 /api/diary 返回的 DiaryItem 一一对应。
library;

enum DiaryKind {
  song,
  text,
  photo;

  static DiaryKind parse(String v) => DiaryKind.values.firstWhere(
    (k) => k.name == v,
    orElse: () => DiaryKind.text,
  );

  String get labelZh => switch (this) {
    DiaryKind.song => '听歌',
    DiaryKind.text => '感想',
    DiaryKind.photo => '照片',
  };
}

class DiaryItem {
  const DiaryItem({
    required this.dbId,
    required this.kind,
    required this.title,
    required this.artist,
    required this.album,
    required this.cover,
    required this.ncmId,
    required this.songUrl,
    required this.note,
    required this.images,
    required this.isPublic,
    required this.createdAt,
  });

  final int dbId;
  final DiaryKind kind;
  final String title;
  final String artist;
  final String album;
  final String cover; // 本站 /media/... 或 126.net 外链
  final int? ncmId;
  final String songUrl;
  final String note;
  final List<String> images;
  final bool isPublic;
  final DateTime createdAt;

  factory DiaryItem.fromJson(Map<String, dynamic> j) {
    return DiaryItem(
      dbId: (j['dbId'] as num).toInt(),
      kind: DiaryKind.parse((j['kind'] as String?) ?? 'text'),
      title: (j['title'] as String?) ?? '',
      artist: (j['artist'] as String?) ?? '',
      album: (j['album'] as String?) ?? '',
      cover: (j['cover'] as String?) ?? '',
      ncmId: (j['ncmId'] as num?)?.toInt(),
      songUrl: (j['songUrl'] as String?) ?? '',
      note: (j['note'] as String?) ?? '',
      images: ((j['images'] as List?) ?? const [])
          .map((e) => e.toString())
          .toList(),
      isPublic: j['public'] == true || j['public'] == 1,
      createdAt:
          DateTime.tryParse((j['createdAt'] as String?) ?? '')?.toLocal() ??
          DateTime.now(),
    );
  }

  String get firstImage => images.isNotEmpty ? images.first : cover;

  /// 保存/编辑提交的载荷（对应服务端 parseDiaryInput 字段名）。
  Map<String, dynamic> toPayload() => {
    'kind': kind.name,
    'title': title.trim(),
    'artist': artist.trim(),
    'album': album.trim(),
    'cover': cover.trim(),
    'ncmId': ncmId,
    'songUrl': songUrl.trim(),
    'note': note.trim(),
    'images': images,
    'public': isPublic,
  };
}

/// 网易云解析结果（服务端 ResolveResult）。
class NcmSong {
  const NcmSong({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.cover,
    required this.songUrl,
  });

  final int id;
  final String title;
  final String artist;
  final String album;
  final String cover;
  final String songUrl;

  factory NcmSong.fromJson(Map<String, dynamic> j) => NcmSong(
    id: (j['id'] as num?)?.toInt() ?? 0,
    title: (j['title'] as String?) ?? '',
    artist: (j['artist'] as String?) ?? '',
    album: (j['album'] as String?) ?? '',
    cover: (j['cover'] as String?) ?? '',
    songUrl: (j['songUrl'] as String?) ?? '',
  );
}

/// 快捷日期格式。
String fmtDate(DateTime d) => '${d.year}-${two(d.month)}-${two(d.day)}';

String fmtDateTime(DateTime d) =>
    '${fmtDate(d)} ${two(d.hour)}:${two(d.minute)}';

String fmtMonth(DateTime d) => '${d.year} 年 ${d.month} 月';

String two(int n) => n.toString().padLeft(2, '0');

/// 从正文自动截标题（前 20 字，去空白）。
String autoTitle(String text) {
  final t = text.replaceAll(RegExp(r'\s+'), ' ').trim();
  return t.length <= 20 ? t : t.substring(0, 20);
}
