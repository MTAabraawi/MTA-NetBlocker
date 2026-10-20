package com.mta.netblocker.data

import android.graphics.drawable.Drawable

/**
 * Represents an installed Android application with its real icon and blocking state.
 */
data class AppItem(
    val packageName: String,
    val appName: String,
    val icon: Drawable?,
    val isSystemApp: Boolean = false,
    val isBlocked: Boolean = false,
    val isExcluded: Boolean = false
)
