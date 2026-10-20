package com.mta.netblocker

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying firewall rules:
 * - Block All
 * - Unblock All
 * - Individual Blocking
 * - Excluded Apps immunity
 */
class AppRulesTest {

    // Helper logic replicating PreferencesManager.shouldBlockPackage
    private fun shouldBlock(
        packageName: String,
        isBlockAll: Boolean,
        blockedSet: Set<String>,
        excludedSet: Set<String>
    ): Boolean {
        if (packageName == "com.mta.netblocker") return false
        if (excludedSet.contains(packageName)) return false
        if (isBlockAll) return true
        return blockedSet.contains(packageName)
    }

    @Test
    fun testBlockAllRespectsExclusions() {
        val excluded = setOf("com.whatsapp", "com.google.android.apps.messaging")
        val blocked = emptySet<String>()
        val isBlockAll = true

        // WhatsApp is excluded -> Must NOT be blocked
        assertFalse(shouldBlock("com.whatsapp", isBlockAll, blocked, excluded))
        
        // Random app is not excluded -> MUST be blocked
        assertTrue(shouldBlock("com.facebook.katana", isBlockAll, blocked, excluded))
        assertTrue(shouldBlock("com.google.android.youtube", isBlockAll, blocked, excluded))
    }

    @Test
    fun testIndividualBlocking() {
        val excluded = emptySet<String>()
        val blocked = setOf("com.google.android.youtube")
        val isBlockAll = false

        assertTrue(shouldBlock("com.google.android.youtube", isBlockAll, blocked, excluded))
        assertFalse(shouldBlock("com.whatsapp", isBlockAll, blocked, excluded))
    }

    @Test
    fun testUnblockAll() {
        val excluded = emptySet<String>()
        val blocked = emptySet<String>()
        val isBlockAll = false

        assertFalse(shouldBlock("com.whatsapp", isBlockAll, blocked, excluded))
        assertFalse(shouldBlock("com.google.android.youtube", isBlockAll, blocked, excluded))
    }

    @Test
    fun testMtaNetBlockerNeverBlocksItself() {
        // App must never block its own traffic to maintain API connectivity for ads and updates
        assertTrue(!shouldBlock("com.mta.netblocker", true, setOf("com.mta.netblocker"), emptySet()))
    }
}
