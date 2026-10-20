package com.mta.netblocker.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.mta.netblocker.network.models.AdItem
import com.mta.netblocker.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun StartupAdScreen(
    ad: AdItem,
    onAdDismissed: () -> Unit
) {
    val context = LocalContext.current
    // Ad duration capped at 10 seconds maximum
    val maxDuration = remember { minOf(maxOf(ad.durationSeconds, 1), 10) }
    var secondsLeft by remember { mutableIntStateOf(maxDuration) }

    // 1-second interval timer that automatically dismisses after reaching 0
    LaunchedEffect(Unit) {
        while (secondsLeft > 0) {
            delay(1000)
            secondsLeft -= 1
        }
        onAdDismissed()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
    ) {
        // Main Ad Image / Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Slate900)
                    .clickable {
                        ad.targetUrl?.let { url ->
                            if (url.isNotBlank()) {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                    context.startActivity(intent)
                                } catch (ignored: Exception) {}
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(ad.imageUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = ad.title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Ad Title and click prompt if target url exists
            Text(
                text = ad.title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            if (!ad.targetUrl.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clickable {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ad.targetUrl))
                                context.startActivity(intent)
                            } catch (ignored: Exception) {}
                        }
                ) {
                    Text(
                        text = "اضغط للمزيد من التفاصيل",
                        color = CyanAccent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.OpenInNew,
                        contentDescription = null,
                        tint = CyanAccent,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Linear Progress Bar for 10-second countdown
            LinearProgressIndicator(
                progress = { (maxDuration - secondsLeft).toFloat() / maxDuration.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = IndigoLight,
                trackColor = Slate800,
            )
        }

        // Top Overlay Bar: Countdown Badge and Prominent Close 'X' Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 40.dp, start = 16.dp, end = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Countdown badge
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Slate900.copy(alpha = 0.85f),
                tonalElevation = 4.dp
            ) {
                Text(
                    text = "إعلان ($secondsLeft ث)",
                    color = Slate200,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }

            // Prominent Instant Close 'X' Button
            IconButton(
                onClick = { onAdDismissed() },
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Slate900.copy(alpha = 0.85f))
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "إغلاق الإعلان",
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}
