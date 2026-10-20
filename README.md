# مشروع MTA Net blocker - تطبيق أندرويد متكامل

تطبيق أندرويد أصلي (Native) مبني بلغة Kotlin وJetpack Compose مع Material 3 لتوفير جدار ناري محلي (Local Firewall) لحظر وصول التطبيقات المختارة للإنترنت بدون روت، مع دعم إعلان بدء التشغيل وإدارته عبر لوحة تحكم سحابية.

## المواصفات التقنية
- **اسم التطبيق:** MTA Net blocker
- **اسم الحزمة (Package Name):** `com.mta.netblocker`
- **لغة البرمجة:** Kotlin (2.0.21)
- **واجهة المستخدم:** Jetpack Compose + Material 3 (Arabic RTL native)
- **الحد الأدنى للنظام:** Android 8.0 (API 26)
- **الإصدار المستهدف:** Android 15 (API 35)

## بنية المشروع الأساسية
- `com.mta.netblocker.vpn.MtaVpnService`: محرك جدار الحماية المبني على `android.net.VpnService` المحلي مع عزل الحزم عبر واجهة TUN وتوجيه IPv4 / IPv6 وDNS Sinkhole.
- `com.mta.netblocker.data.AppRepository`: جلب وفهرسة التطبيقات المثبتة باستخدام `PackageManager` وحفظ الأيقونات الأصلية.
- `com.mta.netblocker.data.PreferencesManager`: حفظ حالة حظر الكل، التطبيقات المحظورة، والمستثناة بصورة دائمة.
- `com.mta.netblocker.network.ApiService`: فحص إعلانات بدء التشغيل والتحديثات من لوحة الإدارة.
- `com.mta.netblocker.ui.screens`: شاشات الترحيب (3 ثوانٍ)، إعلان البدء (10 ثوانٍ كحد أقصى مع زر إغلاق X)، الصفحة الرئيسية، المحظورة، والمستثناة.

## خطوات البناء في Android Studio
1. افتح مجلد `android` كـ مشروع قائم في **Android Studio Iguana / Ladybug أو أحدث**.
2. انتظر اكتمال مزامنة Gradle Sync.
3. لتشغيل التطبيق على هاتف أو محاكي أندرويد:
   ```bash
   ./gradlew assembleDebug
   ```
4. لبناء حزمة التوزيع الرسمية:
   ```bash
   ./gradlew assembleRelease
   ```
5. لتشغيل اختبارات قواعد الحظر والاستثناء:
   ```bash
   ./gradlew test
   ```
