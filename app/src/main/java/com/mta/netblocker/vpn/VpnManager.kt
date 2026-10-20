package com.mta.netblocker.vpn

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.VpnService
import androidx.core.content.ContextCompat

object VpnManager {

    /**
     * Checks if the Android system requires user confirmation for VpnService.
     * Returns true if permission is already granted, false if user prompt intent is required.
     */
    fun checkVpnPermission(activity: Activity): Intent? {
        return VpnService.prepare(activity)
    }

    /**
     * Starts the MTA firewall VPN service.
     */
    fun startVpn(context: Context) {
        val intent = Intent(context, MtaVpnService::class.java).apply {
            action = MtaVpnService.ACTION_START
        }
        ContextCompat.startForegroundService(context, intent)
    }

    /**
     * Stops the MTA firewall VPN service.
     */
    fun stopVpn(context: Context) {
        val intent = Intent(context, MtaVpnService::class.java).apply {
            action = MtaVpnService.ACTION_STOP
        }
        context.startService(intent)
    }

    /**
     * Reloads active rules without restarting the entire VPN lifecycle.
     */
    fun reloadRules(context: Context) {
        val intent = Intent(context, MtaVpnService::class.java).apply {
            action = MtaVpnService.ACTION_RELOAD
        }
        context.startService(intent)
    }

    /**
     * Checks if service is actively running.
     */
    fun isRunning(): Boolean {
        return MtaVpnService.isServiceRunning()
    }
}
