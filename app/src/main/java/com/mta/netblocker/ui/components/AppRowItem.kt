package com.mta.netblocker.ui.components

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mta.netblocker.data.AppItem
import com.mta.netblocker.ui.theme.*

@Composable
fun AppRowItem(
    app: AppItem,
    onToggleBlock: (Boolean) -> Unit,
    onToggleExclude: ((Boolean) -> Unit)? = null,
    showExcludeOption: Boolean = true,
    modifier: Modifier = Modifier
) {
    val bitmap = remember(app.icon) {
        app.icon?.let { drawableToBitmap(it) }
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (app.isBlocked) Slate800.copy(alpha = 0.9f) else Slate900
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Real App Icon
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Slate800),
                contentAlignment = Alignment.Center
            ) {
                if (bitmap != null) {
                    Image(
                        bitmap = bitmap.asImageBitmap(),
                        contentDescription = app.appName,
                        modifier = Modifier.size(42.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Block,
                        contentDescription = null,
                        tint = Slate400,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // App details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = app.appName,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate200,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (app.isSystemApp) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "نظام",
                            color = Slate400,
                            fontSize = 10.sp,
                            modifier = Modifier
                                .background(Slate700.copy(alpha = 0.6f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                    }
                }

                Text(
                    text = app.packageName,
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate400,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                // Status chip
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (app.isExcluded) {
                        Text(
                            text = "مستثنى من الحظر",
                            color = AmberExcluded,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    } else if (app.isBlocked) {
                        Text(
                            text = "محظور من الإنترنت",
                            color = RedBlocked,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    } else {
                        Text(
                            text = "متصل بالإنترنت",
                            color = GreenAllowed,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Normal
                        )
                    }
                }
            }

            // Exclude action button (star)
            if (showExcludeOption && onToggleExclude != null) {
                IconButton(
                    onClick = { onToggleExclude(!app.isExcluded) },
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = if (app.isExcluded) Icons.Default.Star else Icons.Outlined.StarOutline,
                        contentDescription = "استثناء",
                        tint = if (app.isExcluded) AmberExcluded else Slate400
                    )
                }
            }

            Spacer(modifier = Modifier.width(4.dp))

            // Block / Unblock Switch
            Switch(
                checked = app.isBlocked,
                onCheckedChange = { onToggleBlock(it) },
                enabled = !app.isExcluded, // Excluded apps can't be individually blocked without removing exclusion
                colors = SwitchDefaults.colors(
                    checkedThumbColor = RedBlocked,
                    checkedTrackColor = RedBlocked.copy(alpha = 0.4f),
                    uncheckedThumbColor = Slate400,
                    uncheckedTrackColor = Slate800
                )
            )
        }
    }
}

/**
 * Converts an Android Drawable into a Bitmap for Jetpack Compose rendering.
 */
fun drawableToBitmap(drawable: Drawable): Bitmap {
    if (drawable is BitmapDrawable && drawable.bitmap != null) {
        return drawable.bitmap
    }
    val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
    val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)
    return bitmap
}
