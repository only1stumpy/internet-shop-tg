import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN || "";
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
const channelId = process.env.TELEGRAM_CHANNEL_ID || "";

let bot: TelegramBot | null = null;

export function getTelegramBot() {
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN is not set");
    return null;
  }

  if (!bot) {
    bot = new TelegramBot(token, { polling: false });
  }

  return bot;
}

export async function sendOrderToAdmin(order: {
  orderNumber: string;
  orderId: string; // Добавляем orderId для callback
  username: string;
  productName: string;
  amount: number;
  paymentMethod: string;
  screenshotUrl?: string;
  playerInfo?: any;
}) {
  const bot = getTelegramBot();
  if (!bot || !adminChatId) return;

  // Форматируем player info
  let playerInfoText = "";
  if (order.playerInfo && typeof order.playerInfo === "object") {
    playerInfoText = Object.entries(order.playerInfo)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");
  }

  const message = `
🔔 *Новый заказ #${order.orderNumber}*

👤 Пользователь: @${order.username || "без username"}
🎮 Товар: ${order.productName}
💰 Сумма: ${order.amount} ₽
💳 Способ оплаты: ${order.paymentMethod === "APB_TRANSFER" ? "Переводилка АПБ" : "Карта"}
${playerInfoText ? `\n📋 Данные игрока:\n${playerInfoText}` : ""}
  `.trim();

  try {
    if (order.screenshotUrl) {
      await bot.sendPhoto(adminChatId, order.screenshotUrl, {
        caption: message,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Выполнить", callback_data: `complete_${order.orderId}` },
              { text: "❌ Отклонить", callback_data: `reject_${order.orderId}` },
            ],
          ],
        },
      });
    } else {
      await bot.sendMessage(adminChatId, message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Выполнить", callback_data: `complete_${order.orderId}` },
              { text: "❌ Отклонить", callback_data: `reject_${order.orderId}` },
            ],
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error sending order to admin:", error);
    throw error;
  }
}

export async function sendReviewToChannel(review: {
  username: string;
  orderDate: string;
  productName: string;
  comment: string;
  rating: number;
}) {
  const bot = getTelegramBot();
  if (!bot || !channelId) return;

  const stars = "⭐".repeat(review.rating);
  const message = `
${stars}

👤 @${review.username || "Аноним"}
📅 ${review.orderDate}
🎮 ${review.productName}

💬 ${review.comment || "Без комментария"}
  `.trim();

  try {
    await bot.sendMessage(channelId, message);
  } catch (error) {
    console.error("Error sending review to channel:", error);
    throw error;
  }
}

/**
 * Обновляет сообщение после обработки callback (Complete/Reject)
 */
export async function updateOrderMessage(
  chatId: string,
  messageId: number,
  orderNumber: string,
  status: "COMPLETED" | "REJECTED",
  originalCaption: string
) {
  const bot = getTelegramBot();
  if (!bot) return;

  const statusEmoji = status === "COMPLETED" ? "✅" : "❌";
  const statusText = status === "COMPLETED" ? "Выполнен" : "Отклонен";

  const updatedCaption = `${originalCaption}\n\n${statusEmoji} *Статус: ${statusText}*`;

  try {
    await bot.editMessageCaption(updatedCaption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [] }, // Убираем кнопки
    });
  } catch (error) {
    console.error("Error updating order message:", error);
    // Fallback: если нет caption (было sendMessage), пробуем editMessageText
    try {
      await bot.editMessageText(updatedCaption, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
      });
    } catch (fallbackError) {
      console.error("Fallback error updating message:", fallbackError);
    }
  }
}

export { adminChatId, channelId };
