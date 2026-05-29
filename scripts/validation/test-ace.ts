import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testAll() {
  if (!process.env.ACE_PLATFORM_TOKEN) {
    console.log(
      "Please add your ACE_PLATFORM_TOKEN to .env.local and restart the agent."
    );
    return;
  }

  const { fetchNews, writeArticle, generateImage, generateAudio } =
    await import("@agent/services/ace");

  const testRunId = "test-" + Date.now();
  const topic = "Solana ecosystem";

  console.log("\n=== Testing ACE Services ===\n");

  console.log("1. Testing fetchNews...");
  try {
    const news = await fetchNews(topic, testRunId);
    console.log("✅ fetchNews OK");
    console.log("   Headlines:", news.headlines.length);
    console.log("   First:", news.headlines[0]);
  } catch (e: any) {
    console.log("❌ fetchNews FAILED:", e.message);
  }

  console.log("\n2. Testing writeArticle...");
  try {
    const article = await writeArticle(
      topic,
      {
        headlines: ["Solana hits new milestone"],
        snippets: ["The Solana network continues to grow"],
      },
      testRunId
    );
    console.log("✅ writeArticle OK");
    console.log("   Title:", article.title);
    console.log("   Body length:", article.body.length);
    console.log("   File:", article.filePath);
  } catch (e: any) {
    console.log("❌ writeArticle FAILED:", e.message);
  }

  console.log("\n3. Testing generateImage...");
  try {
    const image = await generateImage("Solana ecosystem milestone", testRunId);
    console.log("✅ generateImage OK");
    console.log("   File:", image.filePath);
  } catch (e: any) {
    console.log("❌ generateImage FAILED:", e.message);
  }

  console.log("\n4. Testing generateAudio...");
  try {
    const audio = await generateAudio(
      "Solana continues to grow as a leading " +
        "blockchain platform with strong developer " +
        "activity and increasing adoption.",
      testRunId
    );
    console.log("✅ generateAudio OK");
    console.log("   File:", audio.filePath);
  } catch (e: any) {
    console.log("❌ generateAudio FAILED:", e.message);
  }

  console.log("\n=== Test complete ===");
  console.log("Check outputs/" + testRunId + "/ for files");
}

testAll().catch(console.error);
