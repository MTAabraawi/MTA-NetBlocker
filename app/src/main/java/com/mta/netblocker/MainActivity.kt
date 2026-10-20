package com.mta.netblocker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.lifecycle.lifecycleScope
import com.mta.netblocker.data.AppRepository
import com.mta.netblocker.network.ApiService
import com.mta.netblocker.network.models.AdItem
import com.mta.netblocker.ui.screens.*
import com.mta.netblocker.ui.theme.MtaNetBlockerTheme
import com.mta.netblocker.ui.theme.Slate900
import com.mta.netblocker.vpn.VpnManager
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import java.util.UUID

enum class AppDestination {
    MAIN,
    BLOCKED,
    EXCLUDED
}

class MainActivity : ComponentActivity() {

    private lateinit var appRepository: AppRepository
    private val apiService = ApiService()
    
    // State machine for startup navigation
    private var isSplashActive by mutableStateOf(true)
    private var startupAd by mutableStateOf<AdItem?>(null)
    private var isAdShowing by mutableStateOf(false)
    private var currentDestination by mutableStateOf(AppDestination.MAIN)
    private var isVpnRunning by mutableStateOf(false)

    // VPN Permission Launcher
    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            startVpnEngine()
        } else {
            Toast.makeText(this, "يلزم منح إذن VPN لتفعيل جدار الحماية", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        appRepository = AppRepository(this)

        // Load installed applications and their genuine icons
        lifecycleScope.launch {
            appRepository.loadInstalledApps()
        }

        // Check for startup ad in the background while 3s splash screen is running
        lifecycleScope.launch {
            try {
                val adResponse = apiService.fetchStartupAd()
                if (adResponse.hasAd && adResponse.ad != null && adResponse.ad.isActive) {
                    startupAd = adResponse.ad
                }
            } catch (e: Exception) {
                startupAd = null
            }
        }

        // Register active user ping
        lifecycleScope.launch {
            val deviceId = getSharedPreferences("device", MODE_PRIVATE)
                .getString("id", null) ?: UUID.randomUUID().toString().also {
                getSharedPreferences("device", MODE_PRIVATE).edit().putString("id", it).apply()
                apiService.reportInstall(it)
            }
            apiService.pingActiveUser(deviceId)
        }

        setContent {
            MtaNetBlockerTheme {
                // Enforce RTL Layout Direction
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    when {
                        isSplashActive -> {
                            SplashScreen(
                                onSplashFinished = {
                                    isSplashActive = false
                                    if (startupAd != null) {
                                        isAdShowing = true
                                    }
                                }
                            )
                        }

                        isAdShowing && startupAd != null -> {
                            StartupAdScreen(
                                ad = startupAd!!,
                                onAdDismissed = {
                                    isAdShowing = false
                                }
                            )
                        }

                        else -> {
                            MainScaffoldView()
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        isVpnRunning = VpnManager.isRunning()
    }

    private fun handleToggleVpn() {
        if (isVpnRunning) {
            VpnManager.stopVpn(this)
            isVpnRunning = false
            Toast.makeText(this, "تم إيقاف جدار الحماية", Toast.LENGTH_SHORT).show()
        } else {
            val vpnIntent = VpnManager.checkVpnPermission(this)
            if (vpnIntent != null) {
                vpnPermissionLauncher.launch(vpnIntent)
            } else {
                startVpnEngine()
            }
        }
    }

    private fun startVpnEngine() {
        lifecycleScope.launch {
            try {
                VpnManager.startVpn(this@MainActivity)

                repeat(30) {
                    if (VpnManager.isRunning()) {
                        isVpnRunning = true
                        Toast.makeText(
                            this@MainActivity,
                            "تم تشغيل جدار الحماية بنجاح",
                            Toast.LENGTH_SHORT
                        ).show()
                        return@launch
                    }
                    delay(100)
                }

                isVpnRunning = VpnManager.isRunning()
                if (!isVpnRunning) {
                    Toast.makeText(
                        this@MainActivity,
                        "تعذر تأكيد تشغيل جدار الحماية. تحقق من إذن VPN وحالة الخدمة.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                isVpnRunning = VpnManager.isRunning()
                Toast.makeText(
                    this@MainActivity,
                    "حدث خطأ أثناء تشغيل جدار الحماية.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    @Composable
    private fun MainScaffoldView() {
        val apps by appRepository.installedApps.collectAsState()

        Scaffold(
            bottomBar = {
                NavigationBar(
                    containerColor = Slate900
                ) {
                    NavigationBarItem(
                        selected = currentDestination == AppDestination.MAIN,
                        onClick = { currentDestination = AppDestination.MAIN },
                        icon = { Icon(Icons.Default.Apps, contentDescription = null) },
                        label = { Text("الرئيسية") }
                    )
                    NavigationBarItem(
                        selected = currentDestination == AppDestination.BLOCKED,
                        onClick = { currentDestination = AppDestination.BLOCKED },
                        icon = { Icon(Icons.Default.Block, contentDescription = null) },
                        label = { Text("المحظورة") }
                    )
                    NavigationBarItem(
                        selected = currentDestination == AppDestination.EXCLUDED,
                        onClick = { currentDestination = AppDestination.EXCLUDED },
                        icon = { Icon(Icons.Default.Star, contentDescription = null) },
                        label = { Text("المستثناة") }
                    )
                }
            }
        ) { paddingValues ->
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentDestination) {
                    AppDestination.MAIN -> {
                        MainAppListScreen(
                            apps = apps,
                            isVpnRunning = isVpnRunning,
                            onToggleVpn = { handleToggleVpn() },
                            onBlockAll = {
                                appRepository.blockAllApps()
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            },
                            onUnblockAll = {
                                appRepository.unblockAllApps()
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            },
                            onToggleAppBlock = { pkg, shouldBlock ->
                                appRepository.toggleAppBlock(pkg, shouldBlock)
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            },
                            onToggleAppExcluded = { pkg, isExc ->
                                appRepository.toggleAppExcluded(pkg, isExc)
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            }
                        )
                    }

                    AppDestination.BLOCKED -> {
                        BlockedAppsScreen(
                            apps = apps,
                            onUnblockApp = { pkg ->
                                appRepository.toggleAppBlock(pkg, false)
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            },
                            onUnblockAll = {
                                appRepository.unblockAllApps()
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            }
                        )
                    }

                    AppDestination.EXCLUDED -> {
                        ExcludedAppsScreen(
                            apps = apps,
                            onToggleExclude = { pkg, isExc ->
                                appRepository.toggleAppExcluded(pkg, isExc)
                                if (isVpnRunning) VpnManager.reloadRules(this@MainActivity)
                            }
                        )
                    }
                }
            }
        }
    }
}
