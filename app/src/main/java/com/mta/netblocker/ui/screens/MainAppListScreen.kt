package com.mta.netblocker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mta.netblocker.data.AppItem
import com.mta.netblocker.ui.components.AppRowItem
import com.mta.netblocker.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppListScreen(
    apps: List<AppItem>,
    isVpnRunning: Boolean,
    onToggleVpn: () -> Unit,
    onBlockAll: () -> Unit,
    onUnblockAll: () -> Unit,
    onToggleAppBlock: (String, Boolean) -> Unit,
    onToggleAppExcluded: (String, Boolean) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var showSystemApps by remember { mutableStateOf(false) }

    val filteredApps = remember(apps, searchQuery, showSystemApps) {
        apps.filter { app ->
            val matchesQuery = searchQuery.isBlank() ||
                    app.appName.contains(searchQuery, ignoreCase = true) ||
                    app.packageName.contains(searchQuery, ignoreCase = true)
            val matchesSystem = showSystemApps || !app.isSystemApp
            matchesQuery && matchesSystem
        }
    }

    val blockedCount = remember(apps) { apps.count { it.isBlocked } }
    val excludedCount = remember(apps) { apps.count { it.isExcluded } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
    ) {
        // Top Header with VPN Status and Toggle
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
                            text = "MTA Net blocker",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = if (isVpnRunning) "جدار الحماية: نشط ومفعّل" else "جدار الحماية: متوقف",
                            color = if (isVpnRunning) GreenAllowed else RedBlocked,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Main VPN switch
                    Button(
                        onClick = onToggleVpn,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isVpnRunning) RedBlocked else IndigoPrimary
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(
                            imageVector = if (isVpnRunning) Icons.Default.PowerSettingsNew else Icons.Default.Shield,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isVpnRunning) "إيقاف" else "تشغيل",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Action Buttons: Block All & Unblock All
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onBlockAll,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = RedBlocked.copy(alpha = 0.85f)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Block, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("حظر الكل", fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = onUnblockAll,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = GreenAllowed)
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("إلغاء حظر الكل", fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "التطبيقات: ${apps.size} | المحظورة: $blockedCount | المستثناة: $excludedCount",
                        color = Slate400,
                        fontSize = 12.sp
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = showSystemApps,
                            onCheckedChange = { showSystemApps = it },
                            colors = CheckboxDefaults.colors(checkedColor = IndigoPrimary)
                        )
                        Text(
                            text = "عرض تطبيقات النظام",
                            color = Slate400,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Search Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("بحث عن تطبيق أو حزمة...", color = Slate400) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "بحث", tint = Slate400) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "مسح", tint = Slate400)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Slate900,
                    unfocusedContainerColor = Slate900,
                    focusedBorderColor = IndigoPrimary,
                    unfocusedBorderColor = Slate800,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )
        }

        // App List with Real Icons
        if (filteredApps.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "لا توجد تطبيقات مطابقة للبحث",
                    color = Slate400,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(
                    items = filteredApps,
                    key = { it.packageName }
                ) { app ->
                    AppRowItem(
                        app = app,
                        onToggleBlock = { shouldBlock ->
                            onToggleAppBlock(app.packageName, shouldBlock)
                        },
                        onToggleExclude = { isExcluded ->
                            onToggleAppExcluded(app.packageName, isExcluded)
                        },
                        showExcludeOption = true
                    )
                }
            }
        }
    }
}
