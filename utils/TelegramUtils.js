
function getMainDataFromMsg(msg) {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let name = msg.hasOwnProperty('chat') ? msg.chat.first_name : msg.from.first_name;
    let last_name = msg.hasOwnProperty('chat') ? msg.chat.last_name : msg.from.last_name;
    return {chat: chat, name: name ? name : "Анонім ;)", last_name: last_name ? last_name : ""}
}

function createApartmentsMessage(apartment, metro) {
    return `*${apartment.name ? apartment.name : "Квартира :)"}*\n`
        + `*Ціна*: ${apartment.price.value} ${apartment.price.currency}\n`
        + `*Вільна*: ${apartment.rented ? "Ні 😔" : "Так! 🥳"}\n`
        + `*Станція метро*: ${(metro) ? (metro.name) ? ((metro.color ? metro.color === 'green' ? '🟢' : metro.color === 'red' ? "🔴" : metro.color === 'blue' ? "🔵" : "" : "") + " " + metro.name) : "Не вказано :(" : "Не вказано :("}\n`
        + `*Адреса*: \`${apartment.location.address ? apartment.location.address : "Не вказано 😔"}\`\n`
        + `*Кількість кімнат*: ${apartment.rooms ? apartment.rooms : "Не вказано :("}\n`
        + `*Площа*: ${apartment.area.value} м²\n`
        + `*Поверх*: ${apartment.floor}\n`
        + `*Номер власника*: ${apartment.salesAgent.phone}\n`;
}


module.exports = {
    getMainDataFromMsg,
    createApartmentsMessage
}