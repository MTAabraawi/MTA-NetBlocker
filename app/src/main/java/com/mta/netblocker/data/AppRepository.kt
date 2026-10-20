package com.mta.netblocker.data

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class AppRepository(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager
    val preferencesManager = PreferencesManager(context)

    private val _installedApps = MutableStateFlow<List<AppItem>>(emptyList())
    val installedApps: StateFlow<List<AppItem>> = _installedApps.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    suspend fun loadInstalledApps() = withContext(Dispatchers.IO) {
        _isLoading.value = true
        val blocked = preferencesManager.getBlockedPackages()
        val excluded = preferencesManager.getExcludedPackages()
        val blockAll = preferencesManager.isBlockAllEnabled

        val flags = PackageManager.GET_META_DATA
        val packages = packageManager.getInstalledApplications(flags)

        val appList = mutableListOf<AppItem>()
        for (appInfo in packages) {
            // Ignore MTA Net blocker itself to avoid self-blocking
            if (appInfo.packageName == context.packageName) continue

            // Determine if app is a system app
            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val appName = try {
                packageManager.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                appInfo.packageName
            }
            
            val icon = try {
                packageManager.getApplicationIcon(appInfo)
            } catch (e: Exception) {
                null
            }

            val isExcluded = excluded.contains(appInfo.packageName)
            val isBlocked = if (isExcluded) false else if (blockAll) true else blocked.contains(appInfo.packageName)

            appList.add(
                AppItem(
                    packageName = appInfo.packageName,
                    appName = appName,
                    icon = icon,
                    isSystemApp = isSystem,
                    isBlocked = isBlocked,
                    isExcluded = isExcluded
                )
            )
        }

        // Sort alphabetically by app name
        _installedApps.value = appList.sortedBy { it.appName.lowercase() }
        _isLoading.value = false
    }

    fun toggleAppBlock(packageName: String, shouldBlock: Boolean) {
        if (shouldBlock) {
            preferencesManager.addBlockedPackage(packageName)
            // Cannot be both blocked and excluded
            preferencesManager.removeExcludedPackage(packageName)
        } else {
            preferencesManager.removeBlockedPackage(packageName)
        }
        refreshAppStates()
    }

    fun toggleAppExcluded(packageName: String, isExcluded: Boolean) {
        if (isExcluded) {
            preferencesManager.addExcludedPackage(packageName)
            // If excluded, it is unblocked
            preferencesManager.removeBlockedPackage(packageName)
        } else {
            preferencesManager.removeExcludedPackage(packageName)
        }
        refreshAppStates()
    }

    fun blockAllApps() {
        preferencesManager.isBlockAllEnabled = true
        refreshAppStates()
    }

    fun unblockAllApps() {
        preferencesManager.isBlockAllEnabled = false
        preferencesManager.setBlockedPackages(emptySet())
        refreshAppStates()
    }

    fun refreshAppStates() {
        val blocked = preferencesManager.getBlockedPackages()
        val excluded = preferencesManager.getExcludedPackages()
        val blockAll = preferencesManager.isBlockAllEnabled

        _installedApps.value = _installedApps.value.map { app ->
            val isExc = excluded.contains(app.packageName)
            val isBlk = if (isExc) false else if (blockAll) true else blocked.contains(app.packageName)
            app.copy(
                isBlocked = isBlk,
                isExcluded = isExc
            )
        }
    }
}
