import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTelegramBot, updateOrderMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📨 Webhook received:", JSON.stringify(body, null, 2));

    // Handle callback query from admin buttons
    if (body.callback_query) {
      const bot = getTelegramBot();
      if (!bot) {
        return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
      }

      const { data: callbackData, message, from } = body.callback_query;
      const callbackQueryId = body.callback_query.id;

      console.log("🔘 Callback data:", callbackData);

      // Parse callback data: "complete_orderId" or "reject_orderId"
      const [action, orderId] = callbackData.split("_");

      if (!orderId) {
        await bot.answerCallbackQuery(callbackQueryId, {
          text: "❌ Неверный формат данных",
          show_alert: true,
        });
        return NextResponse.json({ error: "Invalid callback data" }, { status: 400 });
      }

      // Найти заказ по ID
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          product: true,
        },
      });

      if (!order) {
        await bot.answerCallbackQuery(callbackQueryId, {
          text: "❌ Заказ не найден",
          show_alert: true,
        });
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Проверка что заказ еще не обработан
      if (order.status === "COMPLETED" || order.status === "REJECTED") {
        await bot.answerCallbackQuery(callbackQueryId, {
          text: "⚠️ Заказ уже обработан",
          show_alert: true,
        });
        return NextResponse.json({ error: "Order already processed" }, { status: 400 });
      }

      // Обновить статус заказа в БД
      if (action === "complete") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        // Обновить сообщение в Telegram
        if (message) {
          const caption = message.caption || message.text || "";
          await updateOrderMessage(
            message.chat.id.toString(),
            message.message_id,
            order.orderNumber,
            "COMPLETED",
            caption
          );
        }

        // Отправить уведомление админу
        await bot.answerCallbackQuery(callbackQueryId, {
          text: `✅ Заказ #${order.orderNumber} выполнен`,
          show_alert: false,
        });

        console.log(`✅ Order ${order.orderNumber} completed by ${from.username || from.first_name}`);
      } else if (action === "reject") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "REJECTED",
          },
        });

        // Обновить сообщение в Telegram
        if (message) {
          const caption = message.caption || message.text || "";
          await updateOrderMessage(
            message.chat.id.toString(),
            message.message_id,
            order.orderNumber,
            "REJECTED",
            caption
          );
        }

        // Отправить уведомление админу
        await bot.answerCallbackQuery(callbackQueryId, {
          text: `❌ Заказ #${order.orderNumber} отклонен`,
          show_alert: false,
        });

        console.log(`❌ Order ${order.orderNumber} rejected by ${from.username || from.first_name}`);
      } else {
        await bot.answerCallbackQuery(callbackQueryId, {
          text: "⚠️ Неизвестное действие",
          show_alert: true,
        });
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
