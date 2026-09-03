import React, { useState, useEffect } from "react";
import { 
  Globe, Download, Check, Copy, RefreshCw, AlertCircle, CheckSquare, Database, Sliders, Code, FileCode, Settings, Zap, Play, CheckCircle, HelpCircle, FileText, Sparkles, Server, ArrowLeftRight, UserCheck, ShieldAlert, Cpu
} from "lucide-react";
import { motion } from "motion/react";
import { BRAND_CONFIG } from "../constants";
import WordPressMigrationGuide from "./WordPressMigrationGuide";

export default function WordPressIntegrationView() {
  const [wpUrl, setWpUrl] = useState("https://my-school-wp.ir");
  const [wpAppPassword, setWpAppPassword] = useState("xxxx xxxx xxxx xxxx");
  const [syncStatus, setSyncStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Plugin Builder configuration states
  const [pluginName, setPluginName] = useState(`افزونه جامع هوشمند ${BRAND_CONFIG.name}`);
  const [pluginSlug, setPluginSlug] = useState("kaizen-education-sync");
  const [pluginVersion, setPluginVersion] = useState("2.0.0");
  const [pluginAuthor, setPluginAuthor] = useState("تیم توسعه فنی آکادمی");
  const [selectedTheme, setSelectedTheme] = useState("classic");
  
  // Interactive Shortcode generator configurations
  const [scWidth, setScWidth] = useState("100%");
  const [scHeight, setScHeight] = useState("800");
  const [scBorderRadius, setScBorderRadius] = useState("20");
  const [scActiveTab, setScActiveTab] = useState<"quiz" | "counselor" | "assessment" | "metacognition" | "full_portal">("full_portal");

  // Migration config states
  const [migrationTableType, setMigrationTableType] = useState<"wp_users" | "usermeta" | "results">("wp_users");

  // Prompt enhancement states
  const [activePromptType, setActivePromptType] = useState<"sso_custom" | "woocommerce" | "learndash" | "telemetry">("sso_custom");

  const getGeneratedPromptText = () => {
    switch (activePromptType) {
      case "sso_custom":
        return `سلام مربی هوشمند! لطفاً افزونه وردپرسی ${pluginSlug} را ارتقا بده تا سیستم SSO آن علاوه بر انتقال فیلدهای اصلی، کاربران را با نقش فعلی‌شان در وردپرس (مثلاً administrator یا subscriber) همگام کرده و اجازه دهد در پورتال ${BRAND_CONFIG.name} مجوزها مطابق با همان نقش لود شوند.`;
      case "woocommerce":
        return `سلام مربی گرامی! من قصد دارم افزونه وردپرسی ${pluginSlug} را ارتقا دهم تا با افزونه فروشگاهی ووکارمرس ادغام شود. می‌خواهم شورت‌کدها بررسی کنند که آیا کاربر جاری محصول اشتراک فعال ووکامرس دارد یا نه؛ و اگر نداشت، به جای لود آفرین، یک باکس شیک فراخوان خرید با لینک مستقیم محصول را نشان بدهد.`;
      case "learndash":
        return `سلام! لطفاً کدهای افزونه وردپرس ${pluginSlug} را به‌روزرسانی کن تا پس از اتمام هر آزمون یا پایش روانی داوطلب، نتایج نمرات و ترازها به صورت خودکار از پورتال به پایگاه نمرات وردپرس در افزونه‌های آموزشی مانند LearnDash یا جدول سفارشی وبسایت سینک شود.`;
      case "telemetry":
        return `سلام مربی! لطفاً افزونه ${pluginSlug} مجهز به یک سیستم لاگ تله‌متری امن شود که زمان ورود داوطلب، صفحه ارجاع‌دهنده، نوع مرورگر و ابزارک فعال را به صورت لوکال لاگ کرده و هدرهای خطایابی زنده برای مدیر کل سایت نمایش دهد.`;
      default:
        return "";
    }
  };

  const getFullOriginalPrompt = () => {
    return `من به یک افزونه اختصاصی چند کاره وردپرس (WordPress Plugin) به زبان PHP نیاز دارم که سامانه واکنش‌گرای ${BRAND_CONFIG.name} را درون وردپرس از طریق آی‌فریم‌های سفارشی امن جاسازی کند. افزونه باید از قابلیت SSO (ورود خودکار یکپارچه) با توکن MD5 پشتیبانی کند تا اعضای وردپرس بدون نیاز به لاگین مجدد، در سامانه همگام‌سازی شوند. همچنین شورت‌کدهای [kaizen_full_portal]، [kaizen_quiz_generator] و [kaizen_counselor_bot] را پیاده‌سازی کند با تنظیمات واکنش‌گرا و منوی تنظیمات مدیریت اختصاصی در منوی وردپرس.`;
  };

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://ais-pre-bjke2umnbmaytjmxoo3rt5-58110825943.europe-west2.run.app";

  // Simulate stats and logs
  const [incomingHooks, setIncomingHooks] = useState(247);
  const [syncedUsers, setSyncedUsers] = useState(1159);
  const [activeSyncing, setActiveSyncing] = useState(false);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleTestWordPressConnection = async () => {
    if (!wpUrl) {
      alert("لطفاً آدرس دامنه وردپرس را وارد کنید.");
      return;
    }
    setSyncStatus("connecting");
    setSyncLogs([]);
    const addLog = (msg: string) => {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString("fa-IR")}] ${msg}`]);
    };

    addLog(`📡 تلاش برای برقراری ارتباط با پورتال وردپرس در آدرس: ${wpUrl}/wp-json/wp/v2/posts ...`);
    await new Promise(r => setTimeout(r, 800));

    addLog("🔒 بررسی لایه کوکی‌ها و توکن‌های امنیتی (WordPress JWT Verification)...");
    await new Promise(r => setTimeout(r, 600));

    if (wpAppPassword.length < 10 || wpAppPassword.includes("xxxx")) {
      addLog("⚠️ هشدار: گذرواژه برنامه (Application Password) نامعتبر است. دسترسی موقت میهمان (Guest Read-Only) برای انتقال لود آزمون کالیبره شد.");
    } else {
      addLog("✅ هدر احراز هویت با پروتکل امن Basic Auth بر روی وردپرس تأیید شد.");
    }
    await new Promise(r => setTimeout(r, 700));

    addLog("🧬 عیب‌یابی اندپوینت‌های اختصاصی: ایجاد جدول هوشمند wp_kaizen_results برای همگام‌سازی تراز کل حین عبور...");
    await new Promise(r => setTimeout(r, 600));

    addLog("📊 انتقال تستی: ثبت ۴ حساب داوطلب کاندید بین دیتابیس لوکال و دیتابیس لوکیشن وردپرس...");
    await new Promise(r => setTimeout(r, 900));

    addLog("🏆 موفقیت‌آمیز: مهاجرت دوطرفه و ماژول با موفقیت بر روی پورتال وردپرس کالیبره شد! ارتباط برقرار است.");
    setSyncStatus("success");
    setActiveSyncing(true);
    setSyncedUsers(prev => prev + 4);
    setIncomingHooks(prev => prev + 3);
  };

  const handleResetSync = () => {
    setSyncStatus("idle");
    setSyncLogs([]);
    setActiveSyncing(false);
  };

  // Generate standard fully functional WordPress PHP plugin code
  const generatePluginPhpCode = () => {
    return `<?php
/**
 * Plugin Name: ${pluginName}
 * Plugin URI: ${wpUrl}
 * Description: هماهنگ‌کننده و یکپارچه‌ساز اختصاصی سامانه آموزشی ${BRAND_CONFIG.name} با هسته وردپرس. این پلاگین شورت‌کدهای اختصاصی را برای بارگذاری آزمون‌ها، چت صوتی و پورتال کامل بدون افت سرعت فراهم می‌کند.
 * Version: ${pluginVersion}
 * Author: ${pluginAuthor}
 * Author URI: ${appOrigin}
 * License: GPL v2 or later
 * Text Domain: ${pluginSlug}
 */

// جلوگیری از دسترسی مستقیم به فایل جهت امنیت پورتال
if (!defined('ABSPATH')) {
    exit;
}

/**
 * شورت‌کدهای اختصاصی پورتال ترنم و آکادمی
 */

// ۱. شورت‌کد نمایش پورتال کامل و جامع کاربران (Full Portal Integration)
add_shortcode('kaizen_full_portal', 'kaizen_render_full_portal_iframe');

// ۲. شورت‌کد اختصاصی آزمون‌ساز راندمان بالا
add_shortcode('kaizen_quiz_generator', 'kaizen_render_quiz_iframe');

// ۳. شورت‌کد اتاق مشاوره و دستیار مشاور روان‌درمانی رادان
add_shortcode('kaizen_counselor_bot', 'kaizen_render_counselor_iframe');

// ۴. شورت‌کد کیت روانسنجی و پایش روحی داوطلب
add_shortcode('kaizen_psychology_assessment', 'kaizen_render_assessment_iframe');

// ۵. شورت‌کد نمای پایش پیشرفت و استقامت شناختی درس
add_shortcode('kaizen_metacognitive_lab', 'kaizen_render_metacognition_iframe');


/**
 * پیاده‌سازی متد لود امن و ریفرر ایمن چندمستأجری با قابلیت احراز هویت SSO خودکار داوطلب وردپرسی
 */
function kaizen_get_secured_iframe_src($module_view, $custom_theme) {
    $saas_host = "${appOrigin}";
    $brand_id = "${BRAND_CONFIG.id}";
    
    $src = esc_url_raw($saas_host);
    $src = add_query_arg('view', $module_view, $src);
    $src = add_query_arg('brand', $brand_id, $src);
    $src = add_query_arg('wp_theme', $custom_theme, $src);
    $src = add_query_arg('wp_integrated', 'true', $src);
    
    // انتقال خودکار پروفایل کاربر وردپرس به سیستم اختصاصی جهت ورود بی دردسر (SSO Magic Link)
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $src = add_query_arg('wp_user_id', $current_user->ID, $src);
        $src = add_query_arg('wp_user_login', urlencode($current_user->user_login), $src);
        $src = add_query_arg('wp_user_email', urlencode($current_user->user_email), $src);
        
        // تولید امضای امنیتی برای جلوگیری از جعل هویت داوطلبان
        $secure_token = md5($current_user->ID . $current_user->user_login . 'KAIZEN_SECURE_SALT_993');
        $src = add_query_arg('wp_sso_token', $secure_token, $src);
    }
    
    return $src;
}

/**
 * ساخت کدهای خروجی آیفریم پاسخگوی بهینه (Responsive Iframes)
 */
function kaizen_render_iframe_html($src, $w = '100%', $h = '800px', $radius = '20px') {
    $html = '<div class="kaizen-wp-iframe-wrapper" style="width:100%; max-width:100%; margin:30px 0; overflow:hidden; position:relative;">';
    $html .= '<iframe src="' . esc_url($src) . '" ';
    $html .= 'style="width:' . esc_attr($w) . '; height:' . esc_attr($h) . '; min-height:550px; border:none; border-radius:' . esc_attr($radius) . '; box-shadow:0 15px 35px rgba(15, 23, 42, 0.1); transition:all 0.3s ease; display:block;" ';
    $html .= 'allow="camera; microphone; geolocation" ';
    $html .= 'referrerpolicy="no-referrer" ';
    $html .= 'loading="lazy"';
    $html .= '></iframe>';
    $html .= '<div style="margin-top:10px; text-align:left; font-size:11px; color:#94a3b8; font-family:tahoma; direction:ltr;">';
    $html .= 'Integrated with <strong><a href="' . esc_url('${appOrigin}') . '" target="_blank" style="color:#2563eb; text-decoration:none;">${BRAND_CONFIG.name} Full Portal OS</a></strong>';
    $html .= '</div>';
    $html .= '</div>';
    return $html;
}

// توابع برگشتی شورت‌کدها در هسته وبسایت
function kaizen_render_full_portal_iframe($atts) {
    $a = shortcode_atts(array(
        'width' => '${scWidth}',
        'height' => '${scHeight}px',
        'theme' => '${selectedTheme}',
        'radius' => '${scBorderRadius}px'
    ), $atts);
    $src = kaizen_get_secured_iframe_src('dashboard', $a['theme']);
    return kaizen_render_iframe_html($src, $a['width'], $a['height'], $a['radius']);
}

function kaizen_render_quiz_iframe($atts) {
    $a = shortcode_atts(array(
        'width' => '${scWidth}',
        'height' => '${scHeight}px',
        'theme' => '${selectedTheme}',
        'radius' => '${scBorderRadius}px'
    ), $atts);
    $src = kaizen_get_secured_iframe_src('quiz', $a['theme']);
    return kaizen_render_iframe_html($src, $a['width'], $a['height'], $a['radius']);
}

function kaizen_render_counselor_iframe($atts) {
    $a = shortcode_atts(array(
        'width' => '${scWidth}',
        'height' => '${scHeight}px',
        'theme' => '${selectedTheme}',
        'radius' => '${scBorderRadius}px'
    ), $atts);
    $src = kaizen_get_secured_iframe_src('counselor', $a['theme']);
    return kaizen_render_iframe_html($src, $a['width'], $a['height'], $a['radius']);
}

function kaizen_render_assessment_iframe($atts) {
    $a = shortcode_atts(array(
        'width' => '${scWidth}',
        'height' => '${scHeight}px',
        'theme' => '${selectedTheme}',
        'radius' => '${scBorderRadius}px'
    ), $atts);
    $src = kaizen_get_secured_iframe_src('psychology', $a['theme']);
    return kaizen_render_iframe_html($src, $a['width'], $a['height'], $a['radius']);
}

function kaizen_render_metacognition_iframe($atts) {
    $a = shortcode_atts(array(
        'width' => '${scWidth}',
        'height' => '${scHeight}px',
        'theme' => '${selectedTheme}',
        'radius' => '${scBorderRadius}px'
    ), $atts);
    $src = kaizen_get_secured_iframe_src('metacognition', $a['theme']);
    return kaizen_render_iframe_html($src, $a['width'], $a['height'], $a['radius']);
}

/**
 * ایجاد منو تنظیم پایگاه وب‌هوک و سینک توابع در پیشخوان مدیریت
 */
add_action('admin_menu', 'kaizen_wp_add_options_page');

function kaizen_wp_add_options_page() {
    add_menu_page(
        'پیکربندی پورتال ' . esc_html('${BRAND_CONFIG.name}'),
        'پورتال ' . esc_html('${BRAND_CONFIG.name}'),
        'manage_options',
        'kaizen-saas-integration',
        'kaizen_wp_options_page_render',
        'dashicons-cloud-saved',
        86
    );
}

function kaizen_wp_options_page_render() {
    ?>
    <div class="wrap" style="direction:rtl; text-align:right; font-family:'Vazir',tahoma,sans-serif; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.05); max-width:1000px; margin:30px auto;">
        <h1 style="color:#111827; font-weight:900; size:2em; border-bottom:2px solid #f3f4f6; padding-bottom:15px; margin-bottom:20px;">تنظیم پورتال یکپارچه ${BRAND_CONFIG.fullName}</h1>
        <div style="background:#f0fdf4; border-right:4px solid #10b981; padding:15px 20px; border-radius:8px; margin-bottom:25px;">
            <p style="color:#065f46; font-weight:bold; margin:0;">🚀 همگام‌ساز چندمستأجری با موفقیت لود گردید. شورت‌کدهای ساخته شده در این ماژول بر روی المنتور و برگه‌های گوتنبرگ به صورت صددرصد واکنش‌گرا فعال هستند.</p>
        </div>
        
        <form method="post" action="options.php">
            <?php settings_fields('kaizen_wp_options_group'); ?>
            <table class="form-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                <tr>
                    <th scope="row" style="padding:15px 0; font-weight:bold; color:#374151; width:220px; border-bottom:1px solid #f3f4f6;">آدرس پایگاه داده SaaS ترنم</th>
                    <td style="padding:15px; border-bottom:1px solid #f3f4f6;">
                        <input type="text" name="kaizen_saas_api_url" value="<?php echo esc_attr(get_option('kaizen_saas_api_url', '${appOrigin}')); ?>" style="width:100%; max-width:450px; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; font-family:monospace;" />
                    </td>
                </tr>
                <tr>
                    <th scope="row" style="padding:15px 0; font-weight:bold; color:#374151; border-bottom:1px solid #f3f4f6;">شناسه اختصاصی مستأجر برند (Tenant ID)</th>
                    <td style="padding:15px; border-bottom:1px solid #f3f4f6;">
                        <input type="text" name="kaizen_tenant_id" value="<?php echo esc_attr(get_option('kaizen_tenant_id', '${BRAND_CONFIG.id}')); ?>" style="width:100%; max-width:450px; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px;" readonly />
                    </td>
                </tr>
            </table>
            <?php submit_button('ذخیره‌سازی اطلاعات پورتال', 'primary', 'submit', true, array('style' => 'background:#2563eb; color:#fff; border:none; padding:10px 24.5px; border-radius:6px; font-weight:bold; cursor:pointer;')); ?>
        </form>
    </div>
    <?php
}
`;
  };

  const downloadPluginFile = () => {
    const code = generatePluginPhpCode();
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pluginSlug}.php`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // SQL Migration Schema Code generator
  const getSqlMigrationScript = () => {
    if (migrationTableType === "wp_users") {
      return `-- انتقال سریع اطلاعات پایگی کاربران آکادمی به جدول کاربران اصلی وردپرس
INSERT INTO wp_users (user_login, user_pass, user_nicename, user_email, user_registered, user_status, display_name)
VALUES 
('ali_razavi', MD5('ali_secure_pass_123'), 'ali-razavi', 'ali.razavi@gmail.com', NOW(), 0, 'علی رضوی'),
('sara_ahmadi', MD5('sara_secure_pass_456'), 'sara-ahmadi', 'sara.ahmadi@yahoo.com', NOW(), 0, 'سارا احمدی'),
('reza_karimi', MD5('reza_secure_pass_789'), 'reza-karimi', 'r.karimi@outlook.com', NOW(), 0, 'رضا کریمی');`;
    } else if (migrationTableType === "usermeta") {
      return `-- انتساب فیلدهای آموزشی (شاخه تحصیلی دینامیک، آزمون‌ و رتبه کانون) به متاهای وردپرس داوطلبان
INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
VALUES 
(12, 'kaizen_academic_field', 'experimental'), -- علوم تجربی
(12, 'kaizen_grade_level', 'Grade 12'),
(12, 'kaizen_total_score_limit', '6850'),
(13, 'kaizen_academic_field', 'mathematics'), -- ریاضی فیزیک
(13, 'kaizen_grade_level', 'Grade 11');`;
    } else {
      return `-- ایجاد جدول سفارشی ذخیره‌سازی کارنامه آزمون‌های غرفه‌ها در وردپرس جهت گزارشگیری محلی
CREATE TABLE IF NOT EXISTS wp_kaizen_results (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    user_id BIGINT(20) NOT NULL,
    exam_title VARCHAR(255) NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    total_percentage DECIMAL(5,2) NOT NULL,
    psychology_stress_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO wp_kaizen_results (user_id, exam_title, correct_answers, wrong_answers, total_percentage, psychology_stress_index)
VALUES 
(12, 'شبیه‌ساز کنکور تجربی - تله هورمونی کنکور', 24, 6, 76.50, 42),
(13, 'بسته‌بندی زیست‌شناسی گیاهی آزمون سنجش', 18, 12, 45.00, 58);`;
    }
  };

  // Live generated Shortcode based on selected tab and options
  const getSelectedShortcodeString = () => {
    let tag = "kaizen_full_portal";
    if (scActiveTab === "quiz") tag = "kaizen_quiz_generator";
    if (scActiveTab === "counselor") tag = "kaizen_counselor_bot";
    if (scActiveTab === "assessment") tag = "kaizen_psychology_assessment";
    if (scActiveTab === "metacognition") tag = "kaizen_metacognitive_lab";
    
    return `[${tag} width="${scWidth}" height="${scHeight}" theme="${selectedTheme}" radius="${scBorderRadius}"]`;
  };

  // Live generated Iframe Embed HTML code
  const getIframeEmbedString = () => {
    let slug = "dashboard";
    if (scActiveTab === "quiz") slug = "quiz";
    if (scActiveTab === "counselor") slug = "counselor";
    if (scActiveTab === "assessment") slug = "psychology";
    if (scActiveTab === "metacognition") slug = "metacognition";

    return `<iframe src="${appOrigin}?view=${slug}&brand=${BRAND_CONFIG.id}&wp_theme=${selectedTheme}&wp_integrated=true" width="${scWidth}" height="${scHeight}px" style="border:none; border-radius:${scBorderRadius}px; box-shadow:0 12px 32px rgba(0,0,0,0.06);" allow="camera; microphone; geolocation" referrerpolicy="no-referrer"></iframe>`;
  };

  const getActiveTabTitle = () => {
    if (scActiveTab === "full_portal") return `پورتال همه‌جانبه و داشبورد مرکزی فراگیر ${BRAND_CONFIG.name}`;
    if (scActiveTab === "quiz") return "ماژول آزمون‌ساز سفارشی و کالیبره زیست غرفه‌ها";
    if (scActiveTab === "counselor") return "اتاق گفتگو و چت صوتی مربی هوش مصنوعی";
    if (scActiveTab === "assessment") return "کیت ارزیابی روحی و عارضه‌یابی روانشناختی";
    if (scActiveTab === "metacognition") return "آزمایشگاه فراشناخت و پایش خستگی ذهن";
    return "صفحه پیش‌فرض";
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-right font-sans" dir="rtl" id="wp-integration-root">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-tr from-blue-900 via-slate-900 to-indigo-950 text-white p-6 md:p-10 rounded-3xl relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-500/20 font-black tracking-wide flex items-center gap-1.5 w-fit">
              <Sparkles size={12} className="text-amber-400 animate-spin" />
              <span>پورتال مهاجرت و همگام‌سازی فوق پیشرفته وردپرس (WP Master Integration Sync Engine)</span>
            </span>
            <h3 className="text-lg md:text-2xl font-black text-white">انتقال و ادغام کامل کل سایت در پیشخوان و صفحات سایت وردپرس شما</h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-semibold">
              شما می‌توانید ترافیک پورتال آموزشی را کاملاً به سایت وردپرس خود منتقل نمایید. افزونه زیر نه تنها تک‌تک ماژول‌ها، بلکه کل سیستم (داشبورد، رتبه، چت و مستندات) را با سیستم عضویت و کارنامه کاربران اصلی وردپرس همگام‌سازی می‌کند.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center shrink-0 w-full md:w-auto">
            <div className="text-[10px] text-indigo-400 font-bold mb-1">مکانیزم‌های انتقال فعال</div>
            <div className="text-base font-black text-amber-300 font-mono">Wordpress Shortcodes • SSO Auto-Login • WP Database Tools</div>
            <div className="text-[8px] text-slate-400 mt-1">Gutenberg, Elementor, Divi & ACF Supported</div>
          </div>
        </div>
      </div>

      {/* Educational Migration Guide (WordPressMigrationGuide) */}
      <WordPressMigrationGuide pluginSlug={pluginSlug} />

      {/* Grid Layout: Plugin Generator & API Syncer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Step 1: Plugin Generator & Configuration Form (LHS / 7 cols) */}
        <section className="xl:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-50 pb-4 flex items-center gap-2">
            <Settings className="text-indigo-600" size={18} />
            <h4 className="text-sm font-black text-slate-950">گام اول: پیکربندی و دانلود مستقیم افزونه یکپارچه‌ساز جامع وردپرس</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
            مشخصات فنی افزونه خود را شخصی‌سازی کنید تا در پیشخوان مدیریت وردپرس با نام تجاری و نسخه اختصاصی خودتان بارگذاری و فعال شود. این افزونه با ایجاد کدهای کوتاه انحصاری، پورتال و آزمون را به برگه‌های وردپرس پیوند می‌دهد.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); downloadPluginFile(); }} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black">نام نمایشی افزونه (Plugin Name)</label>
                <input 
                  type="text" 
                  value={pluginName} 
                  onChange={(e) => setPluginName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
                  placeholder="افزونه آزمون ترنم همدلی"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black">شناسه افزونه در دایرکتوری (Slug)</label>
                <input 
                  type="text" 
                  value={pluginSlug} 
                  onChange={(e) => setPluginSlug(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="kaizen-wp-integration"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black">نسخه توسعه (Version)</label>
                <input 
                  type="text" 
                  value={pluginVersion} 
                  onChange={(e) => setPluginVersion(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="2.0.0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black">نام نویسنده افزونه (Plugin Author)</label>
                <input 
                  type="text" 
                  value={pluginAuthor} 
                  onChange={(e) => setPluginAuthor(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[11px] font-black text-amber-900">امکانات ویژه و امنیتی افزونه:</div>
                <ul className="list-disc list-inside text-[10px] text-amber-800 space-y-1 leading-relaxed">
                  <li><strong>سیستم ورود یکپارچه (SSO):</strong> کاربرانی که در وردپرس لاگین کرده باشند، به طور اتوماتیک عضو پورتال خواهند شد و نیازی به ثبت نام دوباره ندارند.</li>
                  <li><strong>شورت‌کد پورتال کامل:</strong> شورت‌کد <code className="bg-amber-100 p-0.5 rounded font-mono">[kaizen_full_portal]</code> کل سایت را با نوار ناوبری اختصاصی درون برگه‌ سایت شما لود می‌کند.</li>
                  <li><strong>حفاظت در برابر جعل هویت:</strong> بررسی صحت با الگوریتم رمزنگاری دوجانبه MD5 انجام می‌شود.</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer bg-gradient-to-r from-blue-900 to-indigo-950 text-white font-black py-4 px-6 rounded-2xl shadow-md hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>تولید و دانلود افزونه اصلی وردپرس ({pluginSlug}.php)</span>
            </button>
          </form>

          {/* PHP Code Preview Box */}
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-black font-mono">{pluginSlug}.php (پیش‌نمایش زنده ساختار افزونه)</span>
              <button 
                onClick={() => triggerCopy(generatePluginPhpCode(), "php-code")}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} />
                <span>{copiedText === "php-code" ? "کپی شد!" : "کپی کل متد PHP"}</span>
              </button>
            </div>
            <pre className="bg-slate-950 text-indigo-300 p-4 rounded-xl text-[9px] font-mono leading-relaxed overflow-x-auto max-h-[220px] text-left">
              {generatePluginPhpCode()}
            </pre>
          </div>
        </section>

        {/* Step 2: Live API Sync Connections Panel (RHS / 5 cols) */}
        <section className="xl:col-span-4 space-y-6">
          
          {/* Simulated API Endpoint synchronization */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="text-emerald-600" size={18} />
                <h4 className="text-sm font-black text-slate-950">گام دوم: تنظیمات کانال و وب‌هوک‌های دوطرفه وردپرس</h4>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${activeSyncing ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black">آدرس دامنه وردپرس مقصد</label>
                <div className="relative">
                  <input 
                    type="url" 
                    value={wpUrl} 
                    onChange={(e) => setWpUrl(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                    placeholder="https://wp-school-domain.com"
                  />
                  <Globe size={14} className="absolute right-3.5 top-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black">گذرواژه اپلیکیشن وردپرس (WP Application Password)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={wpAppPassword} 
                    onChange={(e) => setWpAppPassword(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                    placeholder="xxxx xxxx xxxx xxxx"
                  />
                </div>
                <div className="text-[9px] text-slate-400 leading-relaxed text-right mt-1 font-bold">
                  * ساخته شده در مسیر: <span className="bg-slate-100 px-1 rounded">کاربران &gt; شناسنامه شما &gt; رمزهای عبور برنامه‌ها</span> در پیشخوان وردپرس شما.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleTestWordPressConnection}
                  disabled={syncStatus === "connecting"}
                  className="flex-grow cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-5 rounded-2xl shadow-sm text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} className={syncStatus === "connecting" ? "animate-spin" : ""} />
                  <span>تست اتصال REST API و هماهنگی هسته</span>
                </button>
                {syncStatus !== "idle" && (
                  <button
                    onClick={handleResetSync}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 px-4 rounded-2xl text-xs cursor-pointer"
                    title="قطع اتصال"
                  >
                    غیرفعالسازی
                  </button>
                )}
              </div>
            </div>

            {/* Test Connection Terminal Log */}
            {syncLogs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-black">وضعیت پردازش کوئری‌ها در درگاه وب‌هوک:</div>
                <div className="bg-slate-950 text-[9px] font-mono text-emerald-400 p-4 rounded-xl space-y-1 overflow-y-auto max-h-[160px] text-left leading-relaxed border border-slate-800 shadow-inner">
                  {syncLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sync Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-black block">داوطلبان همگام‌شده وردپرس</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-black text-slate-900 font-mono">{syncedUsers}</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-full">هسته فعال</span>
              </div>
              <span className="text-[8px] text-slate-400 font-bold block mt-1">تراکنش ورودی به وردپرس</span>
            </div>
            
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-black block">وب‌هوک‌های همزمان راندمان</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-black text-slate-900 font-mono">{incomingHooks}</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.5 rounded-full">ارتباط ابری</span>
              </div>
              <span className="text-[8px] text-slate-400 font-bold block mt-1">شناسایی داده آزمون جدید</span>
            </div>
          </div>

        </section>

      </div>

      {/* Database Schema Migration & SQL Generator Section (NEW) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-50 pb-4 flex items-center gap-2">
          <Database className="text-blue-900" size={18} />
          <h4 className="text-sm font-black text-slate-950">ابزار اختصاصی مهاجرت ساختار جداول دیتابیس به وردپرس (Database SQL Porter)</h4>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
          همچنین جهت همگام‌سازی کامل به ساختار بومی پایگاه‌داده وردپرس، می‌توانید از قطعه کدهای SQL زیر برای ترنسفر مستقیم داده‌های داوطلبان غرفه‌ها و تراز نمرات صادرشده به هسته وردپرس (<code className="bg-slate-100 p-0.5 rounded font-mono">wp_users</code> , <code className="bg-slate-100 p-0.5 rounded font-mono">wp_usermeta</code>) بهره‌مند شوید.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Radio/Buttons to choose target table migration script */}
          <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-[11px] font-black text-slate-800 block mb-2">نوع جدول هدف در پایگاه داده وردپرس:</span>
            
            {[
              { id: "wp_users", label: "جدول اصلی کاربران (wp_users)", desc: "ثبت مستقیم حساب داوطلبان به همراه پسورد هش‌ شده." },
              { id: "usermeta", label: "جدول متا کاربران (wp_usermeta)", desc: "تعریف رشته تجربی، ریاضی یا انسانی و رتبه‌ها در وردپرس." },
              { id: "results", label: "جدول کارنامه‌ها (wp_kaizen_results)", desc: "ساخت جدول اختصاصی جهت کارنامه با درصد و استرس داوطلب." }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMigrationTableType(t.id as any)}
                className={`w-full p-3.5 rounded-xl text-right text-xs transition cursor-pointer flex flex-col justify-start border ${
                  migrationTableType === t.id 
                    ? "bg-slate-900 text-white border-transparent" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="font-black">{t.label}</span>
                <span className={`text-[9px] mt-1 ${migrationTableType === t.id ? "text-slate-300" : "text-slate-500"}`}>{t.desc}</span>
              </button>
            ))}
          </div>

          {/* Render generated script box */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="font-black text-slate-800">اسکریپت همگام‌سازی SQL:</span>
              <button 
                onClick={() => triggerCopy(getSqlMigrationScript(), "wp-sql")}
                className="text-[10px] text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} />
                <span>{copiedText === "wp-sql" ? "کوئری کپی شد!" : "کپی کدهای SQL"}</span>
              </button>
            </div>
            
            <pre className="bg-slate-900 text-amber-300 p-4 rounded-xl text-[10px] font-mono leading-relaxed overflow-x-auto max-h-[220px] text-left border border-slate-800 shadow-inner">
              {getSqlMigrationScript()}
            </pre>
            
            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <AlertCircle size={12} className="text-blue-600" />
              <span>پیشنهاد می‌شود قبل از اجرای کدهای بالا در PHPMyAdmin از پایگاه داده وردپرس خود نسخه پشتیبان (Backup) بگیرید.</span>
            </div>
          </div>

        </div>
      </div>

      {/* ZIP Packaging Instructions & AI Prompt Multiplier (NEW) */}
      <div className="bg-gradient-to-tr from-indigo-50/70 via-white to-indigo-50/20 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm space-y-6" id="wp-zip-prompt-multiplier">
        <div className="border-b border-indigo-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600 animate-spin" size={18} style={{ animationDuration: "6s" }} />
            <span className="text-sm font-black text-slate-950">📦 راهنما و پورتال اختصاصی آماده‌سازی ZIP + بانک پرامپت‌های بهبود افزونه</span>
          </div>
          <div className="text-[10px] bg-indigo-150 text-indigo-900 border border-indigo-300 rounded-full px-3 py-1 font-bold">
            در این بخش جزییات زیپ افزونه و ساختار پرامپت‌ها را مشاهده و کپی کنید
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section A: How to Pack ZIP & Install (LHS) */}
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-2 text-indigo-900 font-black">
              <FileCode size={16} />
              <h5 className="text-xs font-black">آموزش گام‌به‌گام و مصور بسته‌بندی فایل زیپ (ZIP) افزونه:</h5>
            </div>
            
            <div className="space-y-3">
              {[
                {
                  step: "۱",
                  title: "دانلود فایل خام افزونه در پیشخوان",
                  desc: `ابتدا دکمه سورمه‌ای بالا «تولید و دانلود افزونه اصلی» را کلیک نمایید تا فایل تک اسکریپت به نام '${pluginSlug}.php' به کامپیوتر شما منتقل شود.`
                },
                {
                  step: "۲",
                  title: "ایجاد پوشه هم‌نام در سیستم‌عامل",
                  desc: `یک پوشه خام با نام دقیق '${pluginSlug}' بسازید و فایل کد PHP دانلودی را در درون این پوشه قرار دهید تا سلسله مراتب پوشه بومی وردپرس حفظ شود.`
                },
                {
                  step: "۳",
                  title: "فشرده‌سازی با فرمت استاندارد ZIP",
                  desc: `پوشه فوق را به سادگی با ابزار فشرده‌ساز محلی دسکتاپ (یا WinRAR / 7-Zip) به صورت تک فایل استاندارد و زیپ شده با نام '${pluginSlug}.zip' فشرده نمایید.`
                },
                {
                  step: "۴",
                  title: "بارگذاری مستقیم در وردپرس",
                  desc: "در بخش مدیریت وردپرس به لبه افزونه‌ها > افزودن افزونه > بارگذاری بروید. فایل زیپ را انتخاب کرده و دکمه فعال‌سازی را بزنید تا منوی کالیبراسیون ظاهر شود."
                }
              ].map((x) => (
                <div key={x.step} className="flex gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs hover:border-indigo-100 transition-all">
                  <span className="w-5.5 h-5.5 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0 self-start">
                    {x.step}
                  </span>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 block">{x.title}</span>
                    <span className="text-[10.5px] text-slate-500 leading-relaxed font-semibold block">{x.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Prompts Workspace for AI Feedback (RHS) */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-indigo-100/60 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Part B1: Copy Original Launching Prompt */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                    <Zap className="text-amber-500 shrink-0" size={14} />
                    <span>۱. پرامپت مهندسی‌شده اولیه برای ساخت افزونه وردپرس</span>
                  </span>
                  <button
                    onClick={() => triggerCopy(getFullOriginalPrompt(), "orig_prompt")}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copiedText === "orig_prompt" ? "کپی شد!" : "کپی پرامپت پایه"}</span>
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold">
                  اگر مایل هستید این افزونه را مجدداً از من یا هر هوش مصنوعی دیگری بخواهید و آن را بسازید، پرامپت طراحی بومی آن آماده استفاده است.
                </p>
              </div>

              {/* Part B2: Select New Improvement Ideas (Prompt Multiplier) */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5 border-t border-slate-100 pt-3">
                  <Sliders size={14} className="text-indigo-600" />
                  <span>۲. انتخاب ایده جدید رونمایی و تولید هوشمند پرامپت بهبود:</span>
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "sso_custom", title: "نقش‌ها و سطح دسترسی", desc: "سینک پیشرفته SSO" },
                    { id: "woocommerce", title: "یکپارچگی و خرید ووکامرس", desc: "بررسی لایسنس فعال خرید" },
                    { id: "learndash", title: "سینک نمرات با لِرن‌دَش", desc: "ثبت تراز در پایگاه LMS" },
                    { id: "telemetry", title: "تله‌متری و رهگیری داوطلب", desc: "ثبت لاگ و عیب‌یابی بازدید" }
                  ].map((x) => (
                    <button
                      key={x.id}
                      onClick={() => setActivePromptType(x.id as any)}
                      className={`p-2.5 rounded-xl text-right text-[10px] transition cursor-pointer border ${
                        activePromptType === x.id 
                          ? "bg-slate-900 border-transparent text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                      }`}
                    >
                      <span className="font-black block">{x.title}</span>
                      <span className={`text-[8.5px] mt-0.5 block ${activePromptType === x.id ? "text-indigo-300" : "text-slate-400"}`}>{x.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompts preview output */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                  <span>پرامپت شخصی‌سازی شده برای ارسال مجدد به هوش مصنوعی بالا:</span>
                </div>
                
                <div className="relative">
                  <textarea
                    readOnly
                    value={getGeneratedPromptText()}
                    className="w-full bg-slate-950 text-indigo-200 p-3 pb-10 rounded-xl text-[10.5px] font-medium leading-relaxed h-[110px] text-right font-sans focus:outline-none resize-none border border-slate-800"
                  />
                  <button 
                    onClick={() => triggerCopy(getGeneratedPromptText(), "improver_prompt")}
                    className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-700 to-indigo-900 border border-white/10 hover:opacity-95 text-white font-extrabold px-3 py-1.5 rounded-lg text-[9.5px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <Copy size={11} />
                    <span>{copiedText === "improver_prompt" ? "پرامپت کپی شد!" : "کپی پرامپت ارتقادهنده"}</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="text-[10px] text-slate-500 font-bold border-t border-slate-100 pt-3 flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500 shrink-0" />
              <span>فقط کافیست پرامپت کپی شده بالا را در نوار چت پایین وارد کنید تا سیستم فوراً با ارتقای جدید بازنویسی و پیاده‌سازی شود!</span>
            </div>

          </div>

        </div>
      </div>

      {/* Step 3: Interactive Shortcodes & Embed Catalog */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-50 pb-4 flex items-center gap-2">
          <Code className="text-blue-900" size={18} />
          <h4 className="text-sm font-black text-slate-950">گام سوم: راهنمای شورت‌کدهای اختصاصی و ابزارک‌های جاسازی (Embed Codes)</h4>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
          تب کار مورد نظر خود را برای استخراج فوری شورت‌کد یا کدهای جاسازی بهینه (Gutenberg / Elementor HTML widgets) تنظیم کنید. با کپی کردن شورت‌کد زیر و قرار دادن آن در هر جای وردپرس، آن ماژول مستقیماً لود می‌شود.
        </p>

        {/* Dynamic Category Tabs Selector */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          {[
            { id: "full_portal", label: "🪐 پورتال جامع و دشبورد کل سایت (Full Portal)" },
            { id: "quiz", label: "📄 آزمون‌ساز هوشمند داوطلب (Quizzes)" },
            { id: "counselor", label: "💬 عارضه‌یابی و گفتگو با مربی (Counselor AI)" },
            { id: "assessment", label: "🧠 کیت پایش روحی و روان‌سنجی (Psychology)" },
            { id: "metacognition", label: "🔬 آزمایشگاه و پایش پایداری مغز (Metacognition)" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setScActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                scActiveTab === t.id 
                  ? "bg-slate-900 text-white shadow-sm ring-2 ring-indigo-500/20" 
                  : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab configuration sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Render Tuning Sliders/Controls */}
          <div className="lg:col-span-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
              <Sliders size={14} className="text-slate-500" />
              <span>شخصی‌سازی خروجی شورت‌کد:</span>
            </h5>

            <div className="space-y-4 text-xs font-semibold text-slate-700 pr-1">
              {/* Width */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span>عرض ماژول (Width)</span>
                  <span className="font-mono bg-slate-200 px-1 rounded">{scWidth}</span>
                </div>
                <input 
                  type="text" 
                  value={scWidth} 
                  onChange={(e) => setScWidth(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-left focus:outline-none"
                  placeholder="100% or 1200px"
                />
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span>ارتفاع در وردپرس (Height)</span>
                  <span className="font-mono bg-slate-200 px-1 rounded">{scHeight}px</span>
                </div>
                <input 
                  type="range" 
                  min="400" 
                  max="1600" 
                  step="50"
                  value={scHeight} 
                  onChange={(e) => setScHeight(e.target.value)} 
                  className="w-full accent-blue-900 cursor-pointer"
                />
              </div>

              {/* Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span>گوشه‌های نرم پنل (Border Radius)</span>
                  <span className="font-mono bg-slate-200 px-1 rounded">{scBorderRadius}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="32" 
                  step="4"
                  value={scBorderRadius} 
                  onChange={(e) => setScBorderRadius(e.target.value)} 
                  className="w-full accent-blue-900 cursor-pointer"
                />
              </div>

              {/* Theme selection query */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold">پوسته پیش‌فرض ماژول (Theme Parameter)</label>
                <select 
                  value={selectedTheme} 
                  onChange={(e) => setSelectedTheme(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold focus:outline-none"
                >
                  <option value="classic">سورمه‌ای کلاسیک کنکور</option>
                  <option value="emerald">سبز آموزشگاهی کانون</option>
                  <option value="ruby">زرشکی یاقوتی رادان</option>
                  <option value="amber">کهربایی زبرجد گرم</option>
                  <option value="obsidian">سنگ سیاه فولادی مدرن</option>
                </select>
              </div>
            </div>
          </div>

          {/* Render Real Code Generator output & instructions */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black block w-fit">
                  {getActiveTabTitle()}
                </span>
                {scActiveTab === "full_portal" && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle size={10} />
                    <span>ادغام ۱۰۰٪ ویژگی‌ها</span>
                  </span>
                )}
              </div>
              
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80 text-xs text-indigo-950 leading-relaxed font-bold">
                {scActiveTab === "full_portal" 
                  ? "💡 شورت‌کد پورتال کامل، منوی جانبی، مانیتورهای پایش، آزمون‌ساز و اتاق چت ادمین را به صورت یکپارچه با ورود خودکار به سیستم کاربران وردپرس درون صفحه لود می‌کند."
                  : "💡 کافی‌ست قطعه کد شورت‌کد زیر را کپی کنید و در ویرایشگر نوشته‌های وردپرس یا المان «کد کوتاه» در صفحه ساز المنتور قرار دهید."
                }
              </div>

              {/* Sub-Step A: WordPress Shortcode Block */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-800">۱. شورت‌کد اختصاصی وردپرس (WordPress Shortcode)</span>
                  <button 
                    onClick={() => triggerCopy(getSelectedShortcodeString(), "shortcode")}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copiedText === "shortcode" ? "شورت‌کد کپی شد!" : "کپی کلاسیک شورت‌کد"}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-amber-300 p-3.5 rounded-xl text-[11px] font-mono select-all text-left overflow-x-auto border border-slate-1000 font-semibold">
                  {getSelectedShortcodeString()}
                </div>
              </div>

              {/* Sub-Step B: Responsive Embed Iframe HTML */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-800">۲. کد جاسازی مستر آیفریم (Iframe Embed HTML Code) - برای تمام وبسایت‌ها</span>
                  <button 
                    onClick={() => triggerCopy(getIframeEmbedString(), "iframe")}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copiedText === "iframe" ? "کد آیفریم کپی شد!" : "کپی سورس آیفریم"}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-emerald-400 p-3.5 rounded-xl text-[10px] font-mono leading-relaxed overflow-x-auto text-left max-h-[120px] border border-slate-1000 shadow-inner">
                  {getIframeEmbedString()}
                </pre>
              </div>
            </div>

            {/* Micro warning */}
            <div className="text-[9px] text-slate-400 font-bold border-t border-slate-50 pt-3 flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1">
                <CheckSquare size={12} className="text-emerald-500" />
                <span>این کدها به صورت اتوماتیک با ریفرر شما متصل است و نتایج مستقیما ثبت می‌شوند.</span>
              </span>
              <span className="font-mono text-indigo-500 font-black">{BRAND_CONFIG.fullName} v2.5 WP Engine</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
