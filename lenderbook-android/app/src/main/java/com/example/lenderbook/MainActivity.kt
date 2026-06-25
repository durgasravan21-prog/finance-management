package com.example.lenderbook

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Telephony
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.lenderbook.theme.LenderBookTheme

class MainActivity : ComponentActivity() {

  private var webView: WebView? = null

  private val requestPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestMultiplePermissions()
  ) { permissions ->
    val receiveSmsGranted = permissions[Manifest.permission.RECEIVE_SMS] ?: false
    val readSmsGranted = permissions[Manifest.permission.READ_SMS] ?: false
    val sendSmsGranted = permissions[Manifest.permission.SEND_SMS] ?: false

    if (receiveSmsGranted || readSmsGranted || sendSmsGranted) {
      Toast.makeText(this, "SMS permissions processed.", Toast.LENGTH_SHORT).show()
    }
  }

  private val smsReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent.action) {
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        for (message in messages) {
          val sender = message.displayOriginatingAddress ?: "Unknown"
          val body = message.displayMessageBody ?: ""
          runOnUiThread {
            forwardSmsToWebView(sender, body)
          }
        }
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    checkAndRequestPermissions()

    setContent {
      LenderBookTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
          LenderBookWebView("https://finance-beta-three.vercel.app")
        }
      }
    }

    val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(smsReceiver, filter, RECEIVER_EXPORTED)
    } else {
      registerReceiver(smsReceiver, filter)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    try {
      unregisterReceiver(smsReceiver)
    } catch (e: Exception) {
      // Ignore
    }
  }

  fun checkAndRequestPermissions() {
    val permissions = arrayOf(
      Manifest.permission.RECEIVE_SMS,
      Manifest.permission.READ_SMS,
      Manifest.permission.SEND_SMS
    )
    val neededPermissions = permissions.filter {
      ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
    }
    if (neededPermissions.isNotEmpty()) {
      requestPermissionLauncher.launch(neededPermissions.toTypedArray())
    }
  }

  private fun forwardSmsToWebView(sender: String, body: String) {
    val escapedSender = sender.replace("'", "\\'")
    val escapedBody = body.replace("'", "\\'").replace("\n", "\\n").replace("\r", "")
    webView?.evaluateJavascript(
      "javascript:if(typeof window.handleAndroidIncomingSMS === 'function') { window.handleAndroidIncomingSMS('$escapedSender', '$escapedBody'); }",
      null
    )
  }

  @Composable
  fun LenderBookWebView(url: String) {
    AndroidView(
      modifier = Modifier.fillMaxSize(),
      factory = { context ->
        WebView(context).apply {
          webView = this
          settings.javaScriptEnabled = true
          settings.domStorageEnabled = true
          settings.databaseEnabled = true
          addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidInterface")

          webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
              val targetUrl = request?.url?.toString() ?: return false
              if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
                return false
              }
              try {
                val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(targetUrl))
                view?.context?.startActivity(intent)
              } catch (e: Exception) {
                Toast.makeText(view?.context, "Action not supported: $targetUrl", Toast.LENGTH_SHORT).show()
              }
              return true
            }
          }
          webChromeClient = WebChromeClient()
          loadUrl(url)
        }
      }
    )
  }
}

class WebAppInterface(private val activity: MainActivity) {
  @JavascriptInterface
  fun requestSMSPermissions() {
    activity.runOnUiThread {
      activity.checkAndRequestPermissions()
    }
  }
}
