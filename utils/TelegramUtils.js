
function getMainDataFromMsg(msg) {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let name = msg.hasOwnProperty('chat') ? msg.chat.first_name : msg.from.first_name;
    let last_name = msg.hasOwnProperty('chat') ? msg.chat.last_name : msg.from.last_name;
    return {chat: chat, name: name ? name : "Анонім ;)", last_name: last_name ? last_name : ""}
}



module.exports = {
    getMainDataFromMsg
}