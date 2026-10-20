package com.mta.netblocker.network.models

import com.google.gson.annotations.SerializedName

data class AdResponse(
    @SerializedName("hasAd")
    val hasAd: Boolean = false,
    
    @SerializedName("ad")
    val ad: AdItem? = null
)

data class AdItem(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("imageUrl")
    val imageUrl: String,
    
    @SerializedName("targetUrl")
    val targetUrl: String? = null,
    
    @SerializedName("durationSeconds")
    val durationSeconds: Int = 10,
    
    @SerializedName("isActive")
    val isActive: Boolean = true
)

data class UpdateResponse(
    @SerializedName("hasUpdate")
    val hasUpdate: Boolean = false,
    
    @SerializedName("latestVersionName")
    val latestVersionName: String = "1.0.0",
    
    @SerializedName("latestVersionCode")
    val latestVersionCode: Int = 1,
    
    @SerializedName("downloadUrl")
    val downloadUrl: String? = null,
    
    @SerializedName("sha256")
    val sha256: String? = null,
    
    @SerializedName("releaseNotes")
    val releaseNotes: String? = null,
    
    @SerializedName("isMandatory")
    val isMandatory: Boolean = false
)
