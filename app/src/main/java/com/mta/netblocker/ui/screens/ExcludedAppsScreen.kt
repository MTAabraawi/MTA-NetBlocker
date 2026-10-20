package com.mta.netblocker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Star
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
fun ExcludedAppsScreen(
    apps: List<AppItem>,
    onToggleExclude: (String, Boolean) -> Unit
) {
    val excludedApps = remember(apps) { apps.filter { it.isExcluded } }

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
                Text(
                    text = "التطبيقات المستثناة",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "عدد المستثناة: ${excludedApps.size} تطبيق",
                    color = AmberExcluded,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Explanatory note
                Surface(
                    color = Slate800,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = CyanAccent,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "التطبيقات المستثناة تعمل وتتصل بالإنترنت دائماً بحرية تامة، ولن تتأثر حتى عند تفعيل خيار «حظر الكل».",
                            color = Slate200,
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }
        }

        if (excludedApps.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = Slate700,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "لا توجد تطبيقات مستثناة حالياً",
                        color = Slate400,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "يمكنك استثناء التطبيقات الحيوية (مثل تطبيقات الاتصال والمراسلة المهمة) بالضغط على أيقونة النجمة بجانب التطبيق في الصفحة الرئيسية.",
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
                    items = excludedApps,
                    key = { it.packageName }
                ) { app ->
                    AppRowItem(
                        app = app,
                        onToggleBlock = {},
                        onToggleExclude = { isExcluded ->
                            onToggleExclude(app.packageName, isExcluded)
                        },
                        showExcludeOption = true
                    )
                }
            }
        }
    }
}
