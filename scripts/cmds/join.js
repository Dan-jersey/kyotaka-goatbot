module.exports = {
  config: {
    name: "join",
    version: "1.0",
    author: "Dan jersey",
    role: 0,
    shortDescription: "Être ajouté à un groupe par le bot",
    longDescription: "Permet uniquement à l'administrateur de se faire ajouter à un groupe via son TID (Thread ID).",
    category: "admin",
    guide: "{pn} <tid du groupe>"
  },

  onStart: async function ({ args, message, event, api }) {
    const adminUID = "61577043882265";
    const senderUID = event.senderID;

    if (senderUID !== adminUID) {
      return message.reply("❌ | Tu n'es pas autorisé à utiliser cette commande.");
    }

    const threadID = args[0];
    if (!threadID || isNaN(threadID)) {
      return message.reply("⚠️ | Fournis un Thread ID de groupe valide.");
    }

    try {
      await api.addUserToGroup(senderUID, threadID);
      message.reply(`✅ | Tu as été ajouté dans le groupe (TID: ${threadID}) avec succès.`);
    } catch (error) {
      console.error(error);
      message.reply("❌ | Échec de l'ajout au groupe. Vérifie que je suis dans le groupe et que j'ai les permissions pour ajouter.");
    }
  }
};