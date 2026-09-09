package cn.lordestar.app

import android.content.Intent
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Lordestar 主 Activity。
 *
 * 除正常启动外，接收「网易云 App 分享单曲」的 ACTION_SEND text/plain Intent：
 * 冷启动把文本存好（getInitialShare），热启动通过 onShare 事件推给 Flutter。
 */
class MainActivity : FlutterActivity() {
    private var sharedText: String? = null
    private var channel: MethodChannel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        handleShare(intent) // 必须在 configureFlutterEngine 之前记录
        super.onCreate(savedInstanceState)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        channel = MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "lordestar/share",
        ).also { ch ->
            ch.setMethodCallHandler { call, result ->
                when (call.method) {
                    "getInitialShare" -> result.success(sharedText)
                    else -> result.notImplemented()
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleShare(intent)
        val text = sharedText ?: return
        channel?.invokeMethod("onShare", text)
    }

    private fun handleShare(intent: Intent?) {
        sharedText = null
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
        }
    }
}
