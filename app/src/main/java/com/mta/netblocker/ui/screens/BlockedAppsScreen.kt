package com.mta.netblocker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mta.netblocker.data.AppItem
import com.mta.netblocker.ui.components.AppRowItem
import com.mta.netblocker.ui.theme.*

@Composable
fun BlockedAppsScreen(
    apps: List<AppItem>,
    onUnblockApp: (String) -> Unit,
    onUnblockAll: () -> Unit
) {
    val blockedApps = remember(apps) { apps.filter { it.isBlocked } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
    ) {
        // Header
        Surface(
            color = Slate900,
            tonalElevation = 3.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "التطبيقات المحظورة",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "إجمالي المحظورة: ${blockedApps.size} تطبيق",
                            color = RedBlocked,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    if (blockedApps.isNotEmpty()) {
                        Button(
                            onClick = onUnblockAll,
                            colors = ButtonDefaults.buttonColors(containerColor = GreenAllowed),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("إلغاء حظر الكل", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        if (blockedApps.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Block,
                        contentDescription = null,
                        tint = Slate700,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "لا توجد تطبيقات محظورة حالياً",
                        color = Slate400,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "يمكنك حظر أي تطبيق من القائمة الرئيسية لمنعه من استهلاك الإنترنت.",
                        color = Slate400.copy(alpha = 0.7f),
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(top = 8.dp, bottom = 80.dp)
            ) {
                items(
                    items = blockedApps,
                    key = { it.packageName }
                ) { app ->
                    AppRowItem(
                        app = app,
                        onToggleBlock = { shouldBlock ->
                            if (!shouldBlock) onUnblockApp(app.packageName)
                        },
                        showExcludeOption = false
                    )
                }
            }
        }
    }
}
