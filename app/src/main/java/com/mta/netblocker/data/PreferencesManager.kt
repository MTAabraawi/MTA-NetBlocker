package com.mta.netblocker.data

import android.content.Context
import android.content.SharedPreferences

class PreferencesManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "mta_netblocker_prefs"
        private const val KEY_BLOCK_ALL = "key_block_all"
        private const val KEY_BLOCKED_PACKAGES = "key_blocked_packages"
        private const val KEY_EXCLUDED_PACKAGES = "key_excluded_packages"
        private const val KEY_VPN_ACTIVE = "key_vpn_active"
    }

    var isBlockAllEnabled: Boolean
        get() = prefs.getBoolean(KEY_BLOCK_ALL, false)
        set(value) = prefs.edit().putBoolean(KEY_BLOCK_ALL, value).apply()

    var isVpnActive: Boolean
        get() = prefs.getBoolean(KEY_VPN_ACTIVE, false)
        set(value) = prefs.edit().putBoolean(KEY_VPN_ACTIVE, value).apply()

    fun getBlockedPackages(): Set<String> {
        return prefs.getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()
    }

    fun setBlockedPackages(packages: Set<String>) {
        prefs.edit().putStringSet(KEY_BLOCKED_PACKAGES, packages).apply()
    }

    fun addBlockedPackage(packageName: String) {
        val current = getBlockedPackages().toMutableSet()
        current.add(packageName)
        setBlockedPackages(current)
    }

    fun removeBlockedPackage(packageName: String) {
        val current = getBlockedPackages().toMutableSet()
        current.remove(packageName)
        setBlockedPackages(current)
    }

    fun getExcludedPackages(): Set<String> {
        return prefs.getStringSet(KEY_EXCLUDED_PACKAGES, emptySet()) ?: emptySet()
    }

    fun setExcludedPackages(packages: Set<String>) {
        prefs.edit().putStringSet(KEY_EXCLUDED_PACKAGES, packages).apply()
    }

    fun addExcludedPackage(packageName: String) {
        val current = getExcludedPackages().toMutableSet()
        current.add(packageName)
        setExcludedPackages(current)
    }

    fun removeExcludedPackage(packageName: String) {
        val current = getExcludedPackages().toMutableSet()
        current.remove(packageName)
        setExcludedPackages(current)
    }

    /**
     * Determines whether a package should be blocked based on the rules:
     * 1. If the app is in the excluded list, it is NEVER blocked (even if blockAll is true).
     * 2. If Block All is enabled, every app except excluded is blocked.
     * 3. Otherwise, check if it's explicitly in the blocked list.
     */
    fun shouldBlockPackage(packageName: String): Boolean {
        if (packageName == "com.mta.netblocker") return false
        val excluded = getExcludedPackages()
        if (excluded.contains(packageName)) {
            return false
        }
        if (isBlockAllEnabled) {
            return true
        }
        return getBlockedPackages().contains(packageName)
    }
}
