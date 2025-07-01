const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

module.exports = {
    config: {
        name: "callad",
        version: "1.7",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: {
            vi: "gửi báo cáo, góp ý, báo lỗi,... của bạn về admin bot",
            en: "send report, feedback, bug,... to admin bot"
        },
        category: "utility",
        guide: {
            vi: "   {pn} <tin nhắn>",
            en: "   {pn} <message>"
        }
    },

    langs: {
        vi: {
            missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi về admin",
            sendByGroup: "\n- Được gửi từ nhóm: %1\n- Thread ID: %2",
            sendByUser: "\n- Được gửi từ người dùng",
            content: "\n\nNội dung:\n─────────────────\n%1\n─────────────────\nPhản hồi tin nhắn này để gửi tin nhắn về người dùng",
            success: "Đã gửi tin nhắn của bạn về %1 admin thành công!",
            failed: "Đã có lỗi xảy ra khi gửi tin nhắn của bạn về %1 admin\nKiểm tra console để biết thêm chi tiết",
            reply: "📍 Phản hồi từ admin %1:\n─────────────────\n%2\n─────────────────\nPhản hồi tin nhắn này để tiếp tục gửi tin nhắn về admin",
            replySuccess: "Đã gửi phản hồi của bạn về admin thành công!",
            feedback: "📝 Phản hồi từ người dùng %1:\n- User ID: %2\n\nNội dung:\n─────────────────\n%4\n─────────────────\nPhản hồi tin nhắn này để gửi tin nhắn về người dùng",
            replyUserSuccess: "Đã gửi phản hồi của bạn về người dùng thành công!",
            noAdmin: "Hiện tại bot chưa có admin nào"
        },
        en: {
            missingMessage: "Please enter the message you want to send to admin",
            sendByGroup: "\n- Sent from group: %1\n- Thread ID: %2",
            sendByUser: "\n- Sent from user",
            content: "\n\nContent:\n─────────────────\n%1\n─────────────────\nReply this message to send message to user",
            success: "Sent your message to %1 admin successfully!",
            failed: "An error occurred while sending your message to %1 admin\nCheck console for more details",
            reply: "📍 Reply from admin %1:\n─────────────────\n%2\n─────────────────\nReply this message to continue send message to admin",
            replySuccess: "Sent your reply to admin successfully!",
            feedback: "📝 Feedback from user %1:\n- User ID: %2\n\nContent:\n─────────────────\n%4\n─────────────────\nReply this message to send message to user",
            replyUserSuccess: "Sent your reply to user successfully!",
            noAdmin: "Bot has no admin at the moment"
        }
    },

    onStart: async function ({ args, message, event, usersData, api, commandName, getLang }) {
        const config = global.GoatBot.config;

        if (!args[0]) return message.reply(getLang("missingMessage"));
        if (!config.adminBot || config.adminBot.length === 0) return message.reply(getLang("noAdmin"));

        const senderID = event.senderID || event.sender.id;
        const senderName = await usersData.getName(senderID);
        const userMessage = args.join(" ");

        const formMessage = {
            body: `📨 New report from ${senderName} (ID: ${senderID})\n\n${userMessage}`,
            attachment: await getStreamsFromAttachment(
                [...(event.attachments || [])].filter(item => mediaTypes.includes(item.type))
            )
        };

        const successIDs = [];
        const failedIDs = [];

        for (const adminID of config.adminBot) {
            try {
                await api.sendMessage(formMessage, adminID);
                successIDs.push(adminID);
            } catch (err) {
                failedIDs.push(adminID);
                log.err("callad", err);
            }
        }

        if (successIDs.length > 0) {
            message.reply(getLang("success", successIDs.length));
        }
        if (failedIDs.length > 0) {
            message.reply(getLang("failed", failedIDs.length));
        }
    },

    onReply: async function ({ args, event, api, message, Reply, usersData, commandName, getLang }) {
        const { type, threadID, messageIDSender } = Reply;
        const senderName = await usersData.getName(event.senderID);
        const isGroup = event.isGroup || false;

        switch (type) {
            case "userCallAdmin": {
                const formMessage = {
                    body: getLang("reply", senderName, args.join(" ")),
                    mentions: [{
                        id: event.senderID,
                        tag: senderName
                    }],
                    attachment: await getStreamsFromAttachment(
                        event.attachments.filter(item => mediaTypes.includes(item.type))
                    )
                };

                api.sendMessage(formMessage, threadID, (err, info) => {
                    if (err) return message.err(err);
                    message.reply(getLang("replyUserSuccess"));
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName,
                        messageID: info.messageID,
                        messageIDSender: event.messageID,
                        threadID: event.threadID,
                        type: "adminReply"
                    });
                }, messageIDSender);
                break;
            }
            case "adminReply": {
                let sendByGroup = "";
                if (isGroup) {
                    const threadInfo = await api.getThreadInfo(event.threadID);
                    sendByGroup = getLang("sendByGroup", threadInfo.threadName, event.threadID);
                }
                const formMessage = {
                    body: getLang("feedback", senderName, event.senderID, sendByGroup, args.join(" ")),
                    mentions: [{
                        id: event.senderID,
                        tag: senderName
                    }],
                    attachment: await getStreamsFromAttachment(
                        event.attachments.filter(item => mediaTypes.includes(item.type))
                    )
                };

                api.sendMessage(formMessage, threadID, (err, info) => {
                    if (err) return message.err(err);
                    message.reply(getLang("replySuccess"));
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName,
                        messageID: info.messageID,
                        messageIDSender: event.messageID,
                        threadID: event.threadID,
                        type: "userCallAdmin"
                    });
                }, messageIDSender);
                break;
            }
            default:
                break;
        }
    }
};
