import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  urlParams.delete("hash");

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  return calculatedHash === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    // Verify Telegram data
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    if (!verifyTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 401 });
    }

    // Parse init data
    const urlParams = new URLSearchParams(initData);
    const userDataString = urlParams.get("user");

    if (!userDataString) {
      return NextResponse.json({ error: "No user data" }, { status: 400 });
    }

    const userData = JSON.parse(userDataString);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: userData.id.toString() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: userData.id.toString(),
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
