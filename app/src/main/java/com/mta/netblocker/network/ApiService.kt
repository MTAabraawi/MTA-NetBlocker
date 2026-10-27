package com.mta.netblocker.network

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.mta.netblocker.network.models.AdItem
import com.mta.netblocker.network.models.AdResponse
import com.mta.netblocker.network.models.UpdateResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class ApiService(private val baseUrl: String = DEFAULT_BASE_URL) {
    companion object {
        const val DEFAULT_BASE_URL = "https://through-dos-pleasant-thought.trycloudflare.com"
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    suspend fun fetchStartupAd(): AdResponse = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/api/v1/ads")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext AdResponse()

                val root = gson.fromJson(
                    response.body?.string().orEmpty(),
                    JsonObject::class.java
                )
                val ads = root?.getAsJsonArray("ads")
                    ?: return@withContext AdResponse()

                val today = java.time.LocalDate.now(
                    java.time.ZoneId.of("Asia/Aden")
                ).toString()

                val ad = ads.mapNotNull { element ->
                    if (!element.isJsonObject) return@mapNotNull null
                    val item = element.asJsonObject
                    val active = item.get("active")?.asBoolean ?: false
                    val start = item.get("startDate")?.takeUnless { it.isJsonNull }?.asString
                    val end = item.get("endDate")?.takeUnless { it.isJsonNull }?.asString
                    if (!active || (start != null && start > today) ||
                        (end != null && end < today)
                    ) return@mapNotNull null

                    AdItem(
                        id = item.get("id")?.asString.orEmpty(),
                        title = item.get("title")?.asString.orEmpty(),
                        imageUrl = item.get("mediaUrl")?.asString.orEmpty(),
                        targetUrl = item.get("targetUrl")
                            ?.takeUnless { it.isJsonNull }?.asString,
                        durationSeconds = 10,
                        isActive = true
                    )
                }.firstOrNull { it.imageUrl.isNotBlank() && it.title.isNotBlank() }

                if (ad == null) AdResponse() else AdResponse(hasAd = true, ad = ad)
            }
        } catch (_: Exception) {
            AdResponse()
        }
    }

    suspend fun checkAppUpdate(): UpdateResponse = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/api/v1/app-version")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext UpdateResponse()

                val root = gson.fromJson(
                    response.body?.string().orEmpty(),
                    JsonObject::class.java
                ) ?: return@withContext UpdateResponse()

                val latestCode = root.get("latestVersionCode")?.asInt ?: 1
                val latestName = root.get("latestVersionName")?.asString ?: "1.0.0"
                val notesAr = root.get("releaseNotesAr")
                    ?.takeUnless { it.isJsonNull }?.asString
                val notesEn = root.get("releaseNotesEn")
                    ?.takeUnless { it.isJsonNull }?.asString
                val checksum = root.get("sha256Checksum")
                    ?.takeUnless { it.isJsonNull }?.asString

                UpdateResponse(
                    hasUpdate = false,
                    latestVersionName = latestName,
                    latestVersionCode = latestCode,
                    downloadUrl = root.get("downloadUrl")
                        ?.takeUnless { it.isJsonNull }?.asString,
                    sha256 = checksum,
                    releaseNotes = notesAr ?: notesEn,
                    isMandatory = root.get("isMandatory")?.asBoolean ?: false
                )
            }
        } catch (_: Exception) {
            UpdateResponse()
        }
    }

    // The current server does not expose public analytics endpoints.
    // Keep these methods to preserve existing callers without sending unsupported requests.
    suspend fun pingActiveUser(deviceId: String) = withContext(Dispatchers.IO) {
        deviceId.length
    }

    suspend fun reportInstall(deviceId: String) = withContext(Dispatchers.IO) {
        deviceId.length
    }
}
