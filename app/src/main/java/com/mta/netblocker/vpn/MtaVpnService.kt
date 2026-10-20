package com.mta.netblocker.vpn

import android.app.Notification
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mta.netblocker.MainActivity
import com.mta.netblocker.MtaNetBlockerApp
import com.mta.netblocker.R
import com.mta.netblocker.data.PreferencesManager
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.atomic.AtomicBoolean

class MtaVpnService : VpnService(), Runnable {

    companion object {
        const val TAG = "MtaVpnService"
        const val ACTION_START = "com.mta.netblocker.START_VPN"
        const val ACTION_STOP = "com.mta.netblocker.STOP_VPN"
        const val ACTION_RELOAD = "com.mta.netblocker.RELOAD_RULES"
        const val NOTIFICATION_ID = 1001

        private val isRunning = AtomicBoolean(false)
        fun isServiceRunning(): Boolean = isRunning.get()
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    private val isStopping = AtomicBoolean(false)
    private lateinit var prefsManager: PreferencesManager

    override fun onCreate() {
        super.onCreate()
        prefsManager = PreferencesManager(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        when (action) {
            ACTION_STOP -> {
                stopVpn()
                return START_NOT_STICKY
            }
            ACTION_RELOAD -> {
                if (isRunning.get()) {
                    restartVpn()
                }
                return START_STICKY
            }
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, createNotification())
                startVpn()
                return START_STICKY
            }
        }
        return START_NOT_STICKY
    }

    private fun startVpn() {
        if (isRunning.get()) {
            Log.d(TAG, "VPN is already running.")
            return
        }

        isStopping.set(false)
        try {
            vpnInterface = configureVpnInterface()
            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface (null interface)")
                stopSelf()
                return
            }

            isRunning.set(true)
            prefsManager.isVpnActive = true

            // Start network packet processing thread
            vpnThread = Thread(this, "MtaVpnPacketThread").apply {
                start()
            }
            Log.i(TAG, "MTA Net blocker VPN Service started successfully.")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN interface", e)
            stopVpn()
        }
    }

    /**
     * Configures the TUN interface and routes blocked applications into the local firewall sinkhole.
     */
    private fun configureVpnInterface(): ParcelFileDescriptor? {
        val builder = Builder()

        // Local Virtual Subnet for Sinkhole
        builder.setSession("MTA Net blocker Firewall")
        builder.setMtu(1500)
        
        // IPv4 Dummy Gateway
        builder.addAddress("10.120.0.1", 32)
        builder.addRoute("10.120.0.0", 24)

        // IPv6 Dummy Gateway (Prevents IPv6 leak)
        try {
            builder.addAddress("fd00:1:2:3::1", 128)
            builder.addRoute("fd00:1:2:3::", 64)
        } catch (e: Exception) {
            Log.w(TAG, "IPv6 address assignment warning: ${e.message}")
        }

        // Add dummy DNS to sinkhole any DNS requests originating from blocked apps
        builder.addDnsServer("10.120.0.1")

        // Determine which packages should be captured and sinkholed
        val blockedPackages = getEffectiveBlockedPackages()

        if (blockedPackages.isEmpty()) {
            // If no apps are currently blocked, capture a dummy package or loopback so service stays idle
            try {
                // Keep minimal configuration
                builder.addRoute("10.120.0.0", 32)
            } catch (e: Exception) {
                Log.w(TAG, "Route fallback: ${e.message}")
            }
        } else {
            // Apply real package filter: only packages that are designated as blocked are routed into the sinkhole TUN
            var addedCount = 0
            for (pkg in blockedPackages) {
                try {
                    builder.addAllowedApplication(pkg)
                    addedCount++
                } catch (e: PackageManager.NameNotFoundException) {
                    Log.w(TAG, "Package not found on system: $pkg")
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to add package $pkg to VPN: ${e.message}")
                }
            }
            Log.i(TAG, "Configured $addedCount packages into MTA firewall sinkhole.")
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setMetered(false)
        }

        return builder.establish()
    }

    private fun getEffectiveBlockedPackages(): Set<String> {
        val excluded = prefsManager.getExcludedPackages()
        if (prefsManager.isBlockAllEnabled) {
            // Block all installed apps except excluded ones and self
            val allInstalled = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
            return allInstalled
                .map { it.packageName }
                .filter { it != packageName && !excluded.contains(it) }
                .toSet()
        }
        return prefsManager.getBlockedPackages().filter { !excluded.contains(it) && it != packageName }.toSet()
    }

    /**
     * Packet processing loop: Reads raw IP packets entering the TUN interface from blocked applications.
     * All packets from blocked apps are dropped, effectively cutting off their Internet connection.
     */
    override fun run() {
        val pfd = vpnInterface ?: return
        val inputStream = FileInputStream(pfd.fileDescriptor)
        val outputStream = FileOutputStream(pfd.fileDescriptor)
        val packetBuffer = ByteArray(32768)

        Log.i(TAG, "Packet filtering loop running. Intercepting and dropping blocked packets.")

        try {
            while (!isStopping.get() && !Thread.interrupted()) {
                val length = inputStream.read(packetBuffer)
                if (length > 0) {
                    // Packet intercepted from a blocked application!
                    // In a sinkhole firewall, packets routed here are dropped without routing out to WiFi/Cellular.
                    // If needed, we can craft and send back TCP RST or ICMP unreachable.
                    // Dropping the packet simulates immediate network timeout / blocked state.
                } else if (length < 0) {
                    break
                }
            }
        } catch (e: IOException) {
            if (!isStopping.get()) {
                Log.e(TAG, "Packet processing exception", e)
            }
        } finally {
            try {
                inputStream.close()
                outputStream.close()
            } catch (ignored: Exception) {}
            Log.i(TAG, "Packet filtering loop ended.")
        }
    }

    private fun restartVpn() {
        Log.d(TAG, "Reloading VPN rules...")
        stopVpnInterface()
        vpnInterface = configureVpnInterface()
        if (vpnInterface != null) {
            vpnThread = Thread(this, "MtaVpnPacketThread").apply { start() }
            Log.i(TAG, "MTA VPN rules updated successfully.")
        }
    }

    private fun stopVpn() {
        isStopping.set(true)
        isRunning.set(false)
        prefsManager.isVpnActive = false

        vpnThread?.interrupt()
        vpnThread = null

        stopVpnInterface()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        Log.i(TAG, "MTA Net blocker VPN service stopped.")
    }

    private fun stopVpnInterface() {
        try {
            vpnInterface?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing VPN interface", e)
        }
        vpnInterface = null
    }

    private fun createNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, MtaVpnService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, MtaNetBlockerApp.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_shield_logo)
            .setContentTitle(getString(R.string.notification_running_title))
            .setContentText(getString(R.string.notification_running_content))
            .setContentIntent(openPendingIntent)
            .addAction(0, getString(R.string.stop_service), stopPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVpn()
    }
}
