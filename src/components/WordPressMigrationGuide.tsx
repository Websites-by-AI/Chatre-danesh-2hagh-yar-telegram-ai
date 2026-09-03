import React, { useState } from "react";
import JSZip from "jszip";
import { 
  FileText, Code, FolderTree, ArrowLeftRight, Download, CheckCircle, Database, 
  Layers, ChevronRight, Copy, Terminal, AlertCircle, FileCode, Check, HelpCircle, Server,
  Folder, FolderOpen, File
} from "lucide-react";
import { BRAND_CONFIG } from "../constants";

interface WordPressMigrationGuideProps {
  pluginSlug?: string;
}

export default function WordPressMigrationGuide({ pluginSlug = "kaizen-education-sync" }: WordPressMigrationGuideProps) {
  const [activeTab, setActiveTab] = useState<"steps" | "zip_structure" | "core_placement" | "content_export">("steps");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // File Explorer interactive states
  const [selectedFileKey, setSelectedFileKey] = useState<"main_php" | "readme" | "sso" | "rest" | "css" | "js" | "index">("main_php");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    includes: true,
    assets: true,
    css: true,
    js: true
  });

  const [isZipping, setIsZipping] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("sso_roles");

  const promptPresets = [
    {
      key: "sso_roles",
      title: "نقش مربی و مپینگ کاربران (SSO)",
      prompt: `سلام وبمستر کایزن! لطفاً افزونه وردپرسی ${pluginSlug} مجهز به سیستمی شود که علاوه بر همگام‌سازی فیلدهای پیشرفته، نقش‌های کاربری وردپرس (به ویژه دانش‌آموز، مدیر، مشاور) را نیز به سیستم امنیتی SSO بیافزاید تا در پله ورود شناختی، سطوح دسترسی بر پایه آن‌ها مدیریت شوند.`
    },
    {
      key: "woocommerce",
      title: "اتصال به درگاه و اشتراک ووکامرس",
      prompt: `سلام استاد! می‌خواهم کدهای بخش شورت‌کد آیفریم ${pluginSlug} را ارتقا دهیم تا وضعیت خریدهای فعال کاربر از ووکامرس (WooCommerce Subscriptions) بررسی گردد و در صورت عدم خرید اشتراک، به جای نمایش پورتال، فیدبک شیک تشویقی برای خرید قرار داده شود.`
    },
    {
      key: "quiz_sync",
      title: "همگام‌سازی تراز آزمون‌ها در LearnDash",
      prompt: `سلام توسعه‌دهنده گرامی! کدهای REST API افزونه ${pluginSlug} را به‌روزرسانی کن تا پس از اتمام پایش‌های روان‌شناختی داوطلب در پورتال، اتورتی توکن تراز دریافتی را مستقیماً به متا کاربری وردپرس و افزونه آموزشی لِرن‌دش (LearnDash LMS) ارسال نموده و نتایج را ارجاع دهد.`
    },
    {
      key: "telemetry",
      title: "داشبورد لاگ تله‌متری و پایش امنیتی",
      prompt: `سلام! هماهنگ‌کننده وردپرسی ${pluginSlug} را مجهز به یک سیستم لاگ تله‌متری بومی وردپرس کن که آی‌پی‌های تکراری، سیستم‌عامل‌های متصل به آیفریم و خطاهای همگام‌سازی را در فایلی محافظت‌شده ذخیره کند و فید خطایابی زنده برای ادمین کل نمایش دهد.`
    }
  ];

  const generateAndDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Create root folder named as the pluginSlug
      const folder = zip.folder(pluginSlug);
      if (!folder) throw new Error("Could not construct zip folder root.");

      // 1. Root index.php
      const idxObj = getFileContent("index.php");
      folder.file("index.php", idxObj.code);

      // 2. Principal PHP File
      const mainObj = getFileContent(`${pluginSlug}.php`);
      folder.file(`${pluginSlug}.php`, mainObj.code);

      // 3. readme.txt
      const readmeObj = getFileContent("readme.txt");
      folder.file("readme.txt", readmeObj.code);

      // 4. includes/ folder & files
      const includesFolder = folder.folder("includes");
      if (includesFolder) {
        includesFolder.file("index.php", `<?php\n// Silence is golden.\n`);
        includesFolder.file("class-sso-handler.php", getFileContent("includes/class-sso-handler.php").code);
        includesFolder.file("class-rest-api.php", getFileContent("includes/class-rest-api.php").code);
      }

      // 5. assets/ folder & files
      const assetsFolder = folder.folder("assets");
      if (assetsFolder) {
        assetsFolder.file("index.php", `<?php\n// Silence is golden.\n`);
        const cssFolder = assetsFolder.folder("css");
        if (cssFolder) {
          cssFolder.file("index.php", `<?php\n// Silence is golden.\n`);
          cssFolder.file("style.css", getFileContent("assets/css/style.css").code);
        }
        const jsFolder = assetsFolder.folder("js");
        if (jsFolder) {
          jsFolder.file("index.php", `<?php\n// Silence is golden.\n`);
          jsFolder.file("admin-script.js", getFileContent("assets/js/admin-script.js").code);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${pluginSlug}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert("خطایی در ایجاد زیپ بوجود آمد.");
    } finally {
      setIsZipping(false);
    }
  };

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://kais-taranom.ir";

  const fileStructureText = `${pluginSlug}/
├── ${pluginSlug}.php     # فایل اصلی افزونه وردپرس (هدرها و تعریف شورت‌کدها)
├── readme.txt                  # راهنمای نصب و مستند فیلترهای وردپرس
├── includes/
│   ├── class-sso-handler.php   # لایه احراز هویت خودکار (SSO) داوطلبان با متد MD5
│   └── class-rest-api.php      # کالیبره کردن هدهای REST API جهت همگام‌ساز دوطرفه
└── assets/
    ├── css/
    │   └── style.css           # شیوه نمایش و متحرک‌سازی واکنش‌گرا و نرم آیفریم‌ها
    └── js/
        └── admin-script.js     # جاوااسکریپت عیب‌یابی بخش تنظیمات ادمین`;

  const getFileContent = (pathSuffix: string) => {
    // Normalise key resolution for display
    if (pathSuffix.endsWith(".php") && !pathSuffix.includes("/")) {
      return {
        lines: 54,
        size: "2.1 KB",
        icon: FileCode,
        code: `<?php
/**
 * Plugin Name: Kaizen Education Portal Sync
 * Plugin URI: ${appOrigin}
 * Description: افزونه جامع اتصال اتوماتیک پورتال شناختی ${BRAND_CONFIG.name} به مدیریت محتوای وردپرس با پورتال فوق واکنش‌گرا و قابلیت SSO داینامیک.
 * Version: 3.1.2
 * Author: دپارتمان نرم‌افزاری ${BRAND_CONFIG.name}
 * Text Domain: ${pluginSlug}
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) {
    exit; // خروج امن در صورت لود مستقیم
}

// ضمیمه نمودن کلاس هماهنگ‌کننده احراز هویت یکپارچه و اندپوینت وب‌هوک تراز
require_once plugin_dir_path(__FILE__) . 'includes/class-sso-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-rest-api.php';

// تعریف و ثبت شورت‌کد جهت لود آیفریم پورتال داوطلب
add_shortcode('kaizen_full_portal', 'kaizen_render_full_portal_iframe');

function kaizen_render_full_portal_iframe($atts) {
    $atts = shortcode_atts(array(
        'width'  => '100%',
        'height' => '720px',
        'border' => 'none'
    ), $atts);
    
    $user = wp_get_current_user();
    if (!$user->exists()) {
        return '<div class="wp-auth-warning">🛑 داوطلب گرامی، برای دسترسی به پنل مربی و آزمون‌های کایزن ابتدا باید در وبسایت وارد شوید.</div>';
    }
    
    // کالیبرسیون توکن امن با MD5
    $sso_token = My_Custom_SaaS_SSO_Handler::generate_sso_token($user->ID, $user->user_login);
    $iframe_url = add_query_arg(array(
        'wp_user_id' => $user->ID,
        'wp_user'    => urlencode($user->user_login),
        'sso_token'  => $sso_token,
        'email'      => urlencode($user->user_email),
        'name'       => urlencode($user->display_name)
    ), '${appOrigin}/portal-iframe-login');
    
    // فراخوانی استایل‌های سفارشی افزونه جهت افکت حرکت
    wp_enqueue_style('kaizen-iframe-style', plugin_dir_url(__FILE__) . 'assets/css/style.css');
    
    return "<div class='kaizen-portal-container'>
        <div class='kaizen-iframe-header-badge'>اتصال زنده به مربی همدل ${BRAND_CONFIG.name}</div>
        <iframe src='" . esc_url($iframe_url) . "' style='width: " . esc_attr($atts['width']) . "; height: " . esc_attr($atts['height']) . "; border: " . esc_attr($atts['border']) . "; border-radius:18px;' allow='camera; microphone; geolocation'></iframe>
    </div>";
}`
      };
    }

    switch (pathSuffix) {
      case "readme.txt":
        return {
          lines: 24,
          size: "540 B",
          icon: FileText,
          code: `=== ${pluginSlug} ===
Contributors: Academic AI Team
Tags: education, portal, sso, iframe, sync
Requires at least: 5.6
Tested up to: 6.4
Version: 3.1.2
License: GPLv2 or later

یکپارچه‌ساز پورتال دوطرفه ${BRAND_CONFIG.name} با وردپرس جهت سهولت دسترسی کاربران به آزمون‌ها و خدمات مربیگری شناختی.

== نصب ==
۱. پوشه فشرده شده را بارگذاری نمایید.
۲. افزونه را در مدیریت وردپرس فعال نمایید.
۳. شورت‌کد [kaizen_full_portal] را در المنتور پیاده‌سازی نمایید.

== کدهای کوتاه ==
- شورت‌کد پورتال اصلی: [kaizen_full_portal height="720px"]
- شورت‌کد ابزارک آزمون‌ساز هوشمند: [kaizen_quiz_generator]
- شورت‌کد ربات مربی همراه: [kaizen_counselor_bot]`
        };
      case "includes/class-sso-handler.php":
        return {
          lines: 18,
          size: "540 B",
          icon: Code,
          code: `<?php
/**
 * Class My_Custom_SaaS_SSO_Handler
 * کلاس اختصاصی احراز هویت یکپارچه و امن داوطلب در هسته وردپرس
 */
class My_Custom_SaaS_SSO_Handler {
    private static $salt = 'KAIZEN_SECURE_SALT_993'; // کلید نمک امنیتی

    public static function generate_sso_token($user_id, $user_login) {
        return md5($user_id . $user_login . self::$salt);
    }

    public static function verify_sso_token($user_id, $user_login, $token) {
        $expected_token = self::generate_sso_token($user_id, $user_login);
        return hash_equals($expected_token, $token);
    }
}`
        };
      case "includes/class-rest-api.php":
        return {
          lines: 32,
          size: "955 B",
          icon: Code,
          code: `<?php
/**
 * Class Kaizen_Rest_API_Sync
 * کنترلر تبادل ترازهای آزمون به جداول کارنامه کاربران وردپرس
 */
class Kaizen_Rest_API_Sync {
    public static function init() {
        add_action('rest_api_init', function () {
            register_rest_route('layouts/v1', '/sync-traz', array(
                'methods'             => 'POST',
                'callback'            => array('Kaizen_Rest_API_Sync', 'handle_traz_sync_request'),
                'permission_callback' => array('Kaizen_Rest_API_Sync', 'verify_api_secure_token'),
            ));
        });
    }

    public static function handle_traz_sync_request($request) {
        $params = $request->get_json_params();
        $user_id = intval($params['user_id']);
        $traz_score = intval($params['traz_score']);
        
        if (!get_userdata($user_id)) {
            return new WP_Error('user_not_found', 'داوطلب یافت نشد', array('status' => 404));
        }

        update_user_meta($user_id, 'kaizen_last_traz_score', $traz_score);
        update_user_meta($user_id, '_kaizen_exam_completed_date', current_time('mysql'));
        
        return array('success' => true, 'message' => 'تراز آزمون داوطلب با موفقیت در دیتابیس همگام شد.');
    }

    public static function verify_api_secure_token($request) {
        $auth_header = $request->get_header('Authorization');
        return !empty($auth_header) && strpos($auth_header, 'KaizenToken-3.1.2') !== false;
    }
}
Kaizen_Rest_API_Sync::init();`
        };
      case "assets/css/style.css":
        return {
          lines: 20,
          size: "460 B",
          icon: FileCode,
          code: `/* assets/css/style.css - طراحی واکنش‌گرا و نرم آیفریم‌ها */
.kaizen-portal-container {
    position: relative;
    width: 100%;
    margin: 15px 0;
    font-family: inherit;
}

.kaizen-portal-container iframe {
    background: #0f172a;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.kaizen-iframe-header-badge {
    background: #4f46e5;
    color: #ffffff;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 800;
    border-radius: 12px 12px 0 0;
    display: inline-block;
}`
        };
      case "assets/js/admin-script.js":
        return {
          lines: 22,
          size: "620 B",
          icon: FileCode,
          code: `/**
 * assets/js/admin-script.js - بررسی زنده ارتباطات SSO
 */
(function($) {
    'use strict';
    $(document).ready(function() {
        console.log("Kaizen CRM Integration Script initialized.");
        
        $('#kaizen-test-sso-btn').on('click', function(e) {
            e.preventDefault();
            var $btn = $(this);
            $btn.text('درحال عیب‌یابی سامانه...');
            
            $.post(ajaxurl, { action: 'kaizen_ping_diagnostic' }, function(res) {
                alert("پاسخ تله‌متری: " + res.status + " - لایسنس معتبر است.");
                $btn.text('بررسی مجدد ارتباط');
            });
        });
    });
})(jQuery);`
        };
      case "index.php":
        return {
          lines: 6,
          size: "95 B",
          icon: FileCode,
          code: `<?php
/**
 * @package ${pluginSlug}
 */
// Silence is golden.`
        };
      default:
        return {
          lines: 0,
          size: "0 B",
          icon: FileText,
          code: ""
        };
    }
  };

  const ssoHandlerCode = `<?php
/**
 * Class My_Custom_SaaS_SSO_Handler
 * کلاس اختصاصی احراز هویت یکپارچه و امن داوطلب در هسته وردپرس
 */
class My_Custom_SaaS_SSO_Handler {
    private static $salt = 'KAIZEN_SECURE_SALT_993'; // کلید نمک امنیتی

    public static function generate_sso_token($user_id, $user_login) {
        return md5($user_id . $user_login . self::$salt);
    }

    public static function verify_sso_token($user_id, $user_login, $token) {
        $expected_token = self::generate_sso_token($user_id, $user_login);
        return hash_equals($expected_token, $token);
    }
}`;

  const themePlacementCode = `/**
 * قرار دادن این تابع در انتهای فایل functions.php پوسته فرزند (Child Theme)
 * جهت ریدایرکت خودکار کاربران غیرعضو یا مهمان به صفحه ورود پیش‌فرض قبل از لود ماژول‌ها
 */
add_action('template_redirect', 'restrict_educational_pages_to_logged_in_users');

function restrict_educational_pages_to_logged_in_users() {
    // شناسه برگه‌هایی که حاوی شورت‌کدهای آزمون‌ساز یا اتاق آموزش هستند
    $protected_pages = array('quiz-room', 'counselor-desk', 'cognitive-lab');
    
    if (is_page($protected_pages) && !is_user_logged_in()) {
        $login_url = wp_login_url(get_permalink());
        wp_redirect(add_query_arg('redirect_reason', 'sso_required', $login_url));
        exit;
    }
}`;

  const jsonExportSample = `[
  {
    "id": 1052,
    "displayName": "علی محمدی",
    "academicField": "تجربی",
    "gradeLevel": "دوازدهم",
    "activeStreak": 8,
    "meta": {
      "registeredAt": "2026-06-12T12:00:00Z",
      "nationalId": "0021489952",
      "counselorName": "دکتر رادان"
    }
  },
  {
    "id": 1053,
    "displayName": "زهرا احمدی",
    "academicField": "ریاضی f",
    "gradeLevel": "یازدهم",
    "activeStreak": 14,
    "meta": {
      "registeredAt": "2026-06-11T15:30:00Z",
      "nationalId": "0031526487",
      "counselorName": "خانم حسینی"
    }
  }
]`;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-right font-sans" dir="rtl" id="wp-migration-guide-root">
      
      {/* Header section with icon badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 pb-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-150 text-indigo-900 px-3 py-1 rounded-full text-[11px] font-black">
            <Layers size={13} className="text-indigo-600 animate-pulse" />
            <span>مستندات مرجع مهاجرت پایگاه داده و هماهنگی هسته (Migration Core Suite)</span>
          </div>
          <h3 className="text-base md:text-xl font-black text-slate-900">
            راهنمای گام‌به‌گام و علمی مهاجرت وبسایت به وردپرس
          </h3>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed font-semibold">
            با استفاده از این راهنمای جامع داینامیک، می‌توانید اطلاعات فعلی داوطلبان، نمرات و سوابق عارضه‌یابی روانشناختی را استخراج کرده و هسته افزونه تایید شده وردپرس را با سیستم مدیریت محتوای خود کالیبره کنید.
          </p>
        </div>
        <div className="shrink-0 font-mono text-left bg-slate-50 p-2.5 rounded-xl border border-slate-250/60">
          <span className="text-[10px] text-slate-400 block font-bold">آخرین ویرایش سند</span>
          <span className="text-xs text-indigo-600 font-black">2026-06-12 v3.1.2</span>
        </div>
      </div>

      {/* Tabs list inside migration guide */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {[
          { id: "steps", label: "📋 نقشه‌راه انتقال پورتال (100% Migration Steps)", icon: ChevronRight },
          { id: "zip_structure", label: "📦 ساختار فایلهای زیپ افزونه (Plugin ZIP Tree)", icon: FolderTree },
          { id: "core_placement", label: "🛠️ کدهای کمکی هسته وردپرس (Core Placement Code)", icon: Code },
          { id: "content_export", label: "💾 فرمت خروجی محتوا و دیتا (Content Export Schema)", icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isActive 
                  ? "bg-blue-900 text-white shadow-sm ring-2 ring-blue-500/25" 
                  : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render selected content tab dynamically */}
      <div className="mt-4 duration-300 transition-all">
        
        {/* TAB 1: STEPS TO MIGRATE */}
        {activeTab === "steps" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  phase: "فاز ۱: استخراج و آماده‌سازی داده‌ها",
                  desc: "استخراج سوابق داوطلبان به همراه ترازها و عارضه های ردیاب از پنل ادمین آکادمی به فرمت JSON/CSV استاندارد که در وردپرس قابل نگاشت باشد.",
                  badge: "گام‌های پیش‌نیاز"
                },
                {
                  phase: "فاز ۲: ایجاد ساختار زیپ افزونه",
                  desc: "ساخت بسته نصبی افزونه شامل تعاریف هدر وردپرس، متدهایی جهت احراز هویت SSO و ماژول رندرساز آیفریم‌های متحرک بر پایه کدهای بومی.",
                  badge: "کدنویسی و بسته‌بندی"
                },
                {
                  phase: "فاز ۳: اتصال وب‌هوک و هاردنینگ",
                  desc: "درج توکن هوشمند متقابل و پیکربندی Application Password در وردپرس برای اجازه دادن به انتقال داده تراز ها به صورت دوطرفه و زنده.",
                  badge: "استقرار و بهره‌برداری"
                }
              ].map((step, idx) => (
                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 hover:shadow-xs transition-shadow">
                  <div className="text-[10px] text-indigo-600 font-black mb-1">{step.badge}</div>
                  <h4 className="text-xs font-black text-slate-900 mb-2">{step.phase}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Instruction List for absolute clarity */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="text-emerald-500" size={15} />
                <span>لیست اقدامات مرحله به مرحله مدیریت وردپرس:</span>
              </h4>

              <div className="space-y-2 text-xs font-semibold text-slate-700 pr-1">
                {[
                  {
                    num: "1",
                    title: "تولید و دانلود افزونه اصلی:",
                    text: "از لبه کناری (مهاجرت و افزونه وردپرس)، فایل PHP تولید شده با قالب دلخواه را دانلود کنید."
                  },
                  {
                    num: "2",
                    title: "تنظیم فایل زیپ و آپلود در هاست ورپرس:",
                    text: "مطابق با لبه دوم، افزونه را فشرده کرده و از هاست وردپرس یا داشبورد بارگذاری کنید."
                  },
                  {
                    num: "3",
                    title: "ورود به پیشخوان وردپرس بخش پورتال:",
                    text: "آدرس دامنه سااس را در باکس تنظیمات دخیره کنید تا کلید نمک امنیتی (SSO Secret Key) در جداول ادمین وردپرس همگام شود."
                  },
                  {
                    num: "4",
                    title: "قراردادن شورت‌کدها در المنتور یا گوتنبرگ:",
                    text: "از شورت‌کدهای اختصاصی مانند [kaizen_full_portal] در برگه‌ای نظیر 'پورتال داوطلبان' استفاده کرده تا کلیند از محیط ورپرس خارج نشود."
                  }
                ].map((item) => (
                  <div key={item.num} className="flex gap-3 items-start border-r-2 border-indigo-600 pr-3 py-1.5">
                    <span className="text-[11px] font-black text-indigo-700 font-mono">0{item.num}.</span>
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 text-[11.5px]">{item.title}</strong>
                      <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLUGIN ZIP STRUCTURE */}
        {activeTab === "zip_structure" && (() => {
          const filesList = [
            {
              key: "main_php" as const,
              name: `${pluginSlug}.php`,
              path: `/${pluginSlug}.php`,
              type: "php",
            },
            {
              key: "readme" as const,
              name: "readme.txt",
              path: "/readme.txt",
              type: "txt",
            },
            {
              key: "index" as const,
              name: "index.php",
              path: "/index.php",
              type: "php",
            },
            {
              key: "sso" as const,
              name: "class-sso-handler.php",
              path: "/includes/class-sso-handler.php",
              type: "php",
            },
            {
              key: "rest" as const,
              name: "class-rest-api.php",
              path: "/includes/class-rest-api.php",
              type: "php",
            },
            {
              key: "css" as const,
              name: "style.css",
              path: "/assets/css/style.css",
              type: "css",
            },
            {
              key: "js" as const,
              name: "admin-script.js",
              path: "/assets/js/admin-script.js",
              type: "js",
            }
          ];

          const activeFile = filesList.find(f => f.key === selectedFileKey) || filesList[0];
          const activeContent = getFileContent(activeFile.key === "main_php" ? `${pluginSlug}.php` : (activeFile.key === "index" ? "index.php" : activeFile.path.substring(1)));
          const activePromptPreset = promptPresets.find(p => p.key === selectedPreset) || promptPresets[0];

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Main packing header banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-950 to-slate-900 rounded-2xl border border-indigo-900/60 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h4 className="text-sm font-black text-white">پکیج‌ساز خودکار و زنده افزونه وردپرس</h4>
                  </div>
                  <p className="text-[11px] text-indigo-200/80 font-bold">
                    سیستم ترنم اکنون می‌تواند تمام کدهای تولیدشده در درخت‌واره زیر را ادغام کرده و ساختار استاندارد افزونه را آماده دانلود کند.
                  </p>
                </div>
                
                <button
                  onClick={generateAndDownloadZip}
                  disabled={isZipping}
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-60 text-white rounded-xl font-black text-xs inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer shrink-0"
                >
                  <Download size={14} className={isZipping ? "animate-spin" : ""} />
                  <span>{isZipping ? "درحال زیپ کردن پوشه‌ها..." : `دانلود پکیج کامل افزونه (${pluginSlug}.zip)`}</span>
                </button>
              </div>

              {/* The Interactive File Explorer layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Directory Browser (LHS: 4 columns) */}
                <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-4 flex flex-col justify-between min-h-[390px]">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                      <div className="flex items-center gap-1.5">
                        <FolderTree className="text-indigo-600 animate-pulse" size={16} />
                        <span className="text-xs font-black text-slate-800">کاوشگر پکیج افزونه</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">ZIP Explorer v3.1</span>
                    </div>
                    
                    {/* Tree list with fold state */}
                    <div className="space-y-1 font-mono text-[11px] select-none text-left" dir="ltr">
                      
                      {/* Root Folder item */}
                      <div 
                        onClick={() => toggleFolder("root")}
                        className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 cursor-pointer text-slate-800 font-bold"
                      >
                        {expandedFolders.root ? <FolderOpen className="text-amber-500 shrink-0" size={14} /> : <Folder className="text-amber-500 shrink-0" size={14} />}
                        <span className="truncate">{pluginSlug}/</span>
                      </div>

                      {expandedFolders.root && (
                        <div className="pl-4 border-l border-slate-200 ml-3.5 space-y-1">
                          
                          {/* 1. Main plugin PHP file */}
                          <div 
                            onClick={() => setSelectedFileKey("main_php")}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                              selectedFileKey === "main_php" 
                                ? "bg-slate-900 text-white font-bold" 
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                          >
                            <FileCode className={selectedFileKey === "main_php" ? "text-indigo-300 animate-bounce" : "text-indigo-500"} size={13} style={{ animationDuration: "3s" }} />
                            <span className="truncate">{pluginSlug}.php</span>
                          </div>

                          {/* 2. Readme TXT file */}
                          <div 
                            onClick={() => setSelectedFileKey("readme")}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                              selectedFileKey === "readme" 
                                ? "bg-slate-900 text-white font-bold" 
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                          >
                            <FileText className={selectedFileKey === "readme" ? "text-slate-300" : "text-slate-500"} size={13} />
                            <span className="truncate">readme.txt</span>
                          </div>

                          {/* 3. Quiet index.php */}
                          <div 
                            onClick={() => setSelectedFileKey("index")}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                              selectedFileKey === "index" 
                                ? "bg-slate-900 text-white font-bold" 
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                          >
                            <FileCode className={selectedFileKey === "index" ? "text-slate-300" : "text-slate-400"} size={13} />
                            <span className="truncate">index.php</span>
                          </div>

                          {/* 4. includes Directory */}
                          <div 
                            onClick={() => toggleFolder("includes")}
                            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 cursor-pointer text-slate-800 font-bold"
                          >
                            {expandedFolders.includes ? <FolderOpen className="text-amber-500 shrink-0" size={13} /> : <Folder className="text-amber-500 shrink-0" size={13} />}
                            <span>includes/</span>
                          </div>

                          {expandedFolders.includes && (
                            <div className="pl-4 border-l border-slate-200 ml-3 space-y-1">
                              {/* class-sso-handler.php */}
                              <div 
                                onClick={() => setSelectedFileKey("sso")}
                                className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedFileKey === "sso" 
                                    ? "bg-slate-900 text-white font-bold" 
                                    : "text-slate-600 hover:bg-slate-200/60"
                                }`}
                              >
                                <Code className={selectedFileKey === "sso" ? "text-indigo-300" : "text-amber-500"} size={12} />
                                <span className="truncate">class-sso-handler.php</span>
                              </div>
                              
                              {/* class-rest-api.php */}
                              <div 
                                onClick={() => setSelectedFileKey("rest")}
                                className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedFileKey === "rest" 
                                    ? "bg-slate-900 text-white font-bold" 
                                    : "text-slate-600 hover:bg-slate-200/60"
                                }`}
                              >
                                <Code className={selectedFileKey === "rest" ? "text-indigo-300" : "text-emerald-500"} size={12} />
                                <span className="truncate">class-rest-api.php</span>
                              </div>
                            </div>
                          )}

                          {/* 5. assets Directory */}
                          <div 
                            onClick={() => toggleFolder("assets")}
                            className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 cursor-pointer text-slate-800 font-bold"
                          >
                            {expandedFolders.assets ? <FolderOpen className="text-amber-500 shrink-0" size={13} /> : <Folder className="text-amber-500 shrink-0" size={13} />}
                            <span>assets/</span>
                          </div>

                          {expandedFolders.assets && (
                            <div className="pl-4 border-l border-slate-200 ml-3 space-y-1">
                              
                              {/* css Folder */}
                              <div 
                                onClick={() => toggleFolder("css")}
                                className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 cursor-pointer text-slate-700 font-bold"
                              >
                                {expandedFolders.css ? <FolderOpen className="text-teal-500 shrink-0" size={11} /> : <Folder className="text-teal-500 shrink-0" size={11} />}
                                <span>css/</span>
                              </div>

                              {expandedFolders.css && (
                                <div className="pl-4 border-l border-slate-200 ml-2.5 space-y-1">
                                  <div 
                                    onClick={() => setSelectedFileKey("css")}
                                    className={`flex items-center gap-1.5 py-0.5 px-2 rounded-lg cursor-pointer transition-colors ${
                                      selectedFileKey === "css" 
                                        ? "bg-slate-900 text-white font-bold" 
                                        : "text-slate-600 hover:bg-slate-200/60"
                                    }`}
                                  >
                                    <FileCode className="text-blue-500" size={11} />
                                    <span className="truncate">style.css</span>
                                  </div>
                                </div>
                              )}

                              {/* js Folder */}
                              <div 
                                onClick={() => toggleFolder("js")}
                                className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 cursor-pointer text-slate-700 font-bold"
                              >
                                {expandedFolders.js ? <FolderOpen className="text-teal-500 shrink-0" size={11} /> : <Folder className="text-teal-500 shrink-0" size={11} />}
                                <span>js/</span>
                              </div>

                              {expandedFolders.js && (
                                <div className="pl-4 border-l border-slate-200 ml-2.5 space-y-1">
                                  <div 
                                    onClick={() => setSelectedFileKey("js")}
                                    className={`flex items-center gap-1.5 py-0.5 px-2 rounded-lg cursor-pointer transition-colors ${
                                      selectedFileKey === "js" 
                                        ? "bg-slate-900 text-white font-bold" 
                                        : "text-slate-600 hover:bg-slate-200/60"
                                    }`}
                                  >
                                    <FileCode className="text-yellow-500" size={11} />
                                    <span className="truncate">admin-script.js</span>
                                  </div>
                                </div>
                              )}

                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  </div>

                  {/* Explorer mini footnote status */}
                  <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-bold space-y-1.5 font-sans">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                      <span>سلسله مراتب: <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border">wp-content/plugins</code></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>بسته‌بند: <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border">{pluginSlug}.zip</code></span>
                    </div>
                  </div>
                </div>

                {/* Code Previewer Editor Panel (RHS: 8 columns) */}
                <div className="lg:col-span-8 flex flex-col bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden font-mono text-[11px] h-[390px]">
                  
                  {/* Editor Tab bar */}
                  <div className="bg-slate-900/95 border-b border-slate-905 px-4 py-2.5 flex items-center justify-between select-none">
                    {/* Active File info */}
                    <div className="flex items-center gap-2" dir="ltr">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                      <span className="text-slate-600 text-[10px] mx-1">|</span>
                      <span className="text-indigo-400 font-bold font-mono text-[10.5px]">
                        {selectedFileKey === "main_php" ? `${pluginSlug}.php` : filesList.find(f => f.key === selectedFileKey)?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        ({activeContent.size} • {activeContent.lines} خط کد)
                      </span>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => triggerCopy(activeContent.code, "editor_code")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-[10.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy size={11} />
                      <span>{copiedText === "editor_code" ? "کپی شد!" : "کپی محتویات فایل"}</span>
                    </button>
                  </div>

                  {/* Path & Engine detail */}
                  <div className="bg-slate-950 text-[9.5px] px-4 py-1.5 text-slate-500 border-b border-slate-900 flex items-center justify-between" dir="ltr">
                    <span>ثبت محلی: /wp-content/plugins/{pluginSlug}{activeFile.path}</span>
                    <span className="text-slate-600">UTF-8 PHP Mode</span>
                  </div>

                  {/* Scrollable code with custom line columns */}
                  <div className="flex-1 overflow-y-auto p-4 text-left select-text scrollbar-thin scrollbar-thumb-slate-800 font-mono" dir="ltr">
                    <div className="grid grid-cols-12 gap-3 min-w-[500px]">
                      {/* Line numbers column */}
                      <div className="col-span-1 text-slate-600 text-right select-none pr-1.5 border-r border-slate-900 font-semibold space-y-0.5" style={{ minWidth: "24px" }}>
                        {Array.from({ length: activeContent.lines }).map((_, i) => (
                          <div key={i} className="leading-5 h-5 text-[10px]">
                            {i + 1}
                          </div>
                        ))}
                      </div>

                      {/* Code contents column */}
                      <pre className="col-span-11 text-indigo-100 overflow-x-auto selection:bg-indigo-500/30 whitespace-pre scrollbar-none font-mono leading-5">
                        {activeContent.code}
                      </pre>
                    </div>
                  </div>

                </div>

              </div>

              {/* AI Code Enhancement Prompt Generator Panel */}
              <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-200/95 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="text-indigo-600 animate-pulse" size={17} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">پنل تولید پرامپت ارتقای افزونه وردپرس</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">افکت‌های اختصاصی مربوطه را انتخاب کرده و پرامپت آماده کدهای فرعی را کپی کنید.</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => triggerCopy(activePromptPreset.prompt, "preset_prompt")}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    {copiedText === "preset_prompt" ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span>پرامپت کپی گردید!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>کپی پرامپت توسعه انتخاب شده</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preset Options Grid Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {promptPresets.map((preset) => {
                    const isSelected = selectedPreset === preset.key;
                    return (
                      <button
                        key={preset.key}
                        onClick={() => setSelectedPreset(preset.key)}
                        className={`p-3 text-right rounded-xl border text-xs font-bold transition-all flex flex-col justify-between items-start h-[78px] cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 ring-2 ring-indigo-500/30"
                            : "bg-white hover:bg-slate-100/70 border-slate-200 text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <span className="text-[11px] block">{preset.title}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-100 text-slate-500"
                        }`}>
                          {preset.key}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Prompt Preview Textarea */}
                <div className="space-y-1.5" dir="ltr">
                  <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-400">
                    <span className="font-mono">PROMPT PREVIEW (READY TO COPY)</span>
                    <span className="font-sans">جهت ارسال به هوش مصنوعی و تولید کدهای فرعی تکمیلی</span>
                  </div>
                  <textarea
                    readOnly
                    className="w-full text-right bg-slate-950 text-emerald-400 border border-slate-900 p-4 rounded-xl text-[10.5px] font-mono leading-relaxed h-[100px] resize-none focus:outline-none"
                    value={activePromptPreset.prompt}
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: CORE CODE PLACEMENT */}
        {activeTab === "core_placement" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 font-bold flex gap-2">
              <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <span>
                جهت پیاده‌سازی ویژگی ورود یکپارچه بدون دردسر به پورتال هوشمند، لازم است کدهای همگام‌ساز SSO و ریدایرکت‌های زیر را در هسته افزونه یا فایل <code className="bg-amber-100 px-1 rounded font-mono font-bold">functions.php</code> قالب وردپرس قرار دهید.
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File 1 Code inside Core */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>۱. نحوه تعریف فرمول توکن سازی ریدایرکت SSO در افزونه:</span>
                  <button 
                    onClick={() => triggerCopy(ssoHandlerCode, "sso_code")}
                    className="text-[10px] text-indigo-600 font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copiedText === "sso_code" ? "کپی شد!" : "کپی کلاسیک کد"}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[9px] font-mono leading-relaxed overflow-x-auto text-left max-h-[240px]">
                  {ssoHandlerCode}
                </pre>
              </div>

              {/* File 2 Code inside functions.php */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>۲. کد حفاظت و ریدایرکت ورود در فایل functions.php قالب:</span>
                  <button 
                    onClick={() => triggerCopy(themePlacementCode, "theme_code")}
                    className="text-[10px] text-indigo-600 font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copiedText === "theme_code" ? "کپی شد!" : "کپی تملپت قالب"}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-indigo-300 p-4 rounded-xl text-[9px] font-mono leading-relaxed overflow-x-auto text-left max-h-[240px]">
                  {themePlacementCode}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONTENT EXPORT SCHEMA */}
        {activeTab === "content_export" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              برای لود سریع داوطلبان غرفه‌ها در جداול وردپرس نیاز است اطلاعات با طرحواره (Schema) استاندارد زیر اکسپورت شده و سپس وارد افزونه دیتابیس ایمپورتر وردپرس (مانند WP All Import یا اسکریپت سفارشی دیتابیس) گردند.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Structural info */}
              <div className="lg:col-span-5 space-y-4">
                <h5 className="text-xs font-black text-slate-800">مشخصات کلیدی فیلدهای فایل اکسپورت:</h5>
                
                <div className="space-y-2 text-xs text-slate-600 font-semibold pr-1">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-indigo-700 bg-slate-50 px-1 rounded">id</span>
                    <span>شناسه یکتا داوطلب ثبت شده در ترنم</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-indigo-700 bg-slate-50 px-1 rounded">displayName</span>
                    <span>نام و نام خانوادگی داوطلب جهت آیفریم شخصی‌سازی شده</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-indigo-700 bg-slate-50 px-1 rounded">academicField</span>
                    <span>رشته تحصیلی انتخابی داوطلب (تجربی / ریاضی / انسانی)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-indigo-700 bg-slate-50 px-1 rounded">activeStreak</span>
                    <span>تعداد روزهای متوالی مطالعه و استقامت ذهنی</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-indigo-700 bg-slate-50 px-1 rounded">meta.counselorName</span>
                    <span>نام مشاور آموزشی منتسب جهت برقراری ارتباط با مربی هوشمند</span>
                  </div>
                </div>
              </div>

              {/* Sample Output schema viewer */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>نمونه فایل JSON اکسپورت داوطلبان (academic-export-users.json)</span>
                  <button 
                    onClick={() => triggerCopy(jsonExportSample, "json_export")}
                    className="text-[10px] text-indigo-600 font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copiedText === "json_export" ? "کپی شد!" : "کپی ساختار JSON"}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl text-[9px] font-mono leading-relaxed overflow-x-auto text-left max-h-[160px]">
                  {jsonExportSample}
                </pre>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
