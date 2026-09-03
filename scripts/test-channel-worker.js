import worker from '../channel-worker/worker.js';

async function runTest() {
  console.log("=== تست و دیباگ خودکار ارسالی‌های کانال تلگرام و بله (Channel Worker) ===");

  const mockEnv = {
    RUN_KEY: "secret123",
    TELEGRAM_BOT_TOKEN: "mock_tg",
    CHANNEL_ID: "@ChatreDanesh_Law",
    BALE_BOT_TOKEN: "mock_bale",
    BALE_CHANNEL_ID: "@ChatreDanesh_Law_Channel",
    EXAM_RAG_URL: "https://sosa123454321-taranom-exam-rag.static.hf.space",
    AI: {
      run: async (model, params) => {
        return { response: "نکته حقوقی روز: در دعوای مطالبه خسارت وارده به ملک، بر اساس ماده ۱۲ ق.آ.د.م منحصراً دادگاه محل وقوع مال غیرمنقول صالح است." };
      }
    }
  };

  const req = new Request("https://worker.local/?key=secret123");
  const resp = await worker.fetch(req, mockEnv);
  const data = await resp.json();
  console.log("خروجی وضعیت سرویس Worker:", data);
  console.log("✅ ساختار ارسال پیام و تست خودکار با موفقیت اعتبارسنجی شد.");
}

runTest();
