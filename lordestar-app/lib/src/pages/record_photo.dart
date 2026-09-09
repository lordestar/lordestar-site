import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api.dart';
import '../models.dart';
import '../store.dart';
import '../theme.dart';

/// 拍照片 / 选图记录页：压缩后上传媒体库，再建 diary 记录。
class RecordPhotoPage extends StatefulWidget {
  const RecordPhotoPage({
    super.key,
    required this.store,
    required this.api,
    this.existing,
  });

  final AppStore store;
  final ApiClient api;
  final DiaryItem? existing;

  @override
  State<RecordPhotoPage> createState() => _RecordPhotoPageState();
}

class _RecordPhotoPageState extends State<RecordPhotoPage> {
  final _picker = ImagePicker();
  late final TextEditingController _title;
  late final TextEditingController _caption;
  bool _isPublic = true;
  bool _busy = false;
  XFile? _image;
  Uint8List? _bytes;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(
      text: e?.title == '照片' ? '' : (e?.title ?? ''),
    );
    _caption = TextEditingController(text: e?.note ?? '');
    _isPublic = e?.isPublic ?? true;
  }

  @override
  void dispose() {
    _title.dispose();
    _caption.dispose();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    try {
      final img = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        imageQuality: 85,
        requestFullMetadata: false,
      );
      if (img == null) return;
      final bytes = await img.readAsBytes();
      if (!mounted) return;
      setState(() {
        _image = img;
        _bytes = bytes;
      });
    } catch (err) {
      if (mounted) _toast('无法读取图片：$err');
    }
  }

  Future<void> _chooseSource() async {
    final src = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: kBgRaise,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('拍照'),
              onTap: () => Navigator.of(ctx).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('从相册选择'),
              onTap: () => Navigator.of(ctx).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (src != null) await _pick(src);
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<String> _uploadNew() async {
    final name = _image!.name;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    final mime = switch (ext) {
      'png' => 'image/png',
      'webp' => 'image/webp',
      'gif' => 'image/gif',
      'heic' || 'heif' => 'image/heic',
      _ => 'image/jpeg',
    };
    return widget.api.uploadPhoto(
      _bytes!,
      name.isEmpty ? 'photo.jpg' : name,
      mime,
    );
  }

  Future<void> _save() async {
    if (!_isEdit && (_image == null || _bytes == null)) {
      _toast('先拍一张或选一张照片');
      return;
    }
    setState(() => _busy = true);
    try {
      final note = _caption.text.trim();
      final title = _title.text.trim().isEmpty
          ? (note.isEmpty ? '照片' : autoTitle(note))
          : _title.text.trim();
      List<String> images;
      if (_isEdit) {
        // 编辑：若选了新图则上传替换，否则保留原图
        images = (_image != null && _bytes != null)
            ? [await _uploadNew()]
            : widget.existing!.images;
      } else {
        images = [await _uploadNew()];
      }
      final payload = {
        'kind': 'photo',
        'title': title,
        'note': note,
        'images': images,
        'public': _isPublic,
      };
      if (_isEdit) {
        await widget.api.update(widget.existing!.dbId, payload);
      } else {
        await widget.api.create(payload);
      }
      if (!mounted) return;
      _toast('已${_isEdit ? '保存' : '记录'} ✓');
      Navigator.of(context).pop(true);
    } catch (err) {
      if (!mounted) return;
      setState(() => _busy = false);
      _toast('$err');
    }
  }

  Widget _buildPreview(bool hasNew, bool hasExisting, DiaryItem? e) {
    final Widget fallback = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.add_a_photo_outlined, size: 40, color: kMuted),
        SizedBox(height: 10),
        Text('拍照或从相册选择', style: TextStyle(color: kMuted)),
      ],
    );
    if (hasNew) {
      return Image.file(File(_image!.path), fit: BoxFit.cover);
    }
    if (hasExisting && e != null) {
      return Image.network(
        widget.store.abs(e.firstImage),
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => fallback,
      );
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.existing;
    final hasNew = _image != null;
    final hasExisting = _isEdit && e!.firstImage.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? '编辑照片记录' : '拍张照片')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            // 图片预览 / 选择
            GestureDetector(
              onTap: _chooseSource,
              child: Container(
                height: 260,
                decoration: BoxDecoration(
                  color: kPanel,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: kBorderSoft),
                ),
                clipBehavior: Clip.antiAlias,
                child: _buildPreview(hasNew, hasExisting, e),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _isEdit && hasExisting && !hasNew ? '点图片可选择新照片替换，保存后生效' : '',
              style: const TextStyle(color: kMuted, fontSize: 11),
            ),
            const SizedBox(height: 4),
            TextField(
              controller: _title,
              decoration: const InputDecoration(
                hintText: '标题（可选，默认「照片」）',
                filled: false,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _caption,
              minLines: 3,
              maxLines: 6,
              decoration: const InputDecoration(hintText: '配几句话（可选）…'),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isPublic,
              onChanged: (v) => setState(() => _isPublic = v),
              title: const Text(
                '公开',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                _isPublic ? '会出现在 lordestar.cn 日记页' : '仅自己可见',
                style: const TextStyle(color: kMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: _busy ? null : _save,
              icon: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check_rounded),
              label: Text(_busy ? '保存中…' : '保存'),
            ),
          ],
        ),
      ),
    );
  }
}
