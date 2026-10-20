package com.mta.netblocker.network

import com.google.gson.Gson
import com.mta.netblocker.network.models.AdResponse
import com.mta.netblocker.network.models.UpdateResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiService(private val baseUrl: String = DEFAULT_BASE_URL) {

    companion object {
        // Can be customized in production or configured dynamically
        const val DEFAULT_BASE_URL = "https://ais-dev-f46tdtwzn5cocn6tf42m5d-955731841328.europe-west2.run.app"
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    suspend fun fetchStartupAd(): AdResponse = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/ad")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string() ?: ""
                    gson.fromJson(bodyString, AdResponse::class.java)
                } else {
                    AdResponse(hasAd = false)
                }
            }
        } catch (e: Exception) {
            // Failsafe: on network error or offline, never crash, return no ad
            AdResponse(hasAd = false)
        }
    }

    suspend fun checkAppUpdate(): UpdateResponse = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/version")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string() ?: ""
                    gson.fromJson(bodyString, UpdateResponse::class.java)
                } else {
                    UpdateResponse(hasUpdate = false)
                }
            }
        } catch (e: Exception) {
            UpdateResponse(hasUpdate = false)
        }
    }

    suspend fun pingActiveUser(deviceId: String) = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(mapOf("deviceId" to deviceId))
            val body = json.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/api/stats/ping")
                .post(body)
                .build()
            client.newCall(request).execute().close()
        } catch (ignored: Exception) {}
    }

    suspend fun reportInstall(deviceId: String) = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(mapOf("deviceId" to deviceId))
            val body = json.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/api/stats/install")
                .post(body)
                .build()
            client.newCall(request).execute().close()
        } catch (ignored: Exception) {}
    }
}
