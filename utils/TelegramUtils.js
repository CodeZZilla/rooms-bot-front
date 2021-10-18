function getMainDataFromMsg(msg) {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let name = msg.hasOwnProperty('chat') ? msg.chat.first_name : msg.from.first_name;
    let last_name = msg.hasOwnProperty('chat') ? msg.chat.last_name : msg.from.last_name;
    return {chat: chat, name: name ? name : "Анонім ;)", last_name: last_name ? last_name : ""}
}

function createApartmentsMessage(apartment, metro) {
    return `*${apartment.category ? apartment.category : "Квартира :)"}*\n`
    + `*Ціна*: ${apartment.price.value} ${apartment.price.currency}\n`
    + `*Вільна*: ${apartment.isFree ? "Ні 😔" : "Так! 🥳"}\n`
    + `*Станція метро*: ${(metro) ? (metro.name) ? ((metro.color ? metro.color === 'green' ? '🟢' : metro.color === 'red' ? "🔴" : metro.color === 'blue' ? "🔵" : "" : "") + " " + metro.name) : "Не вказано :(" : "Не вказано :("}\n`
    + `*Адреса*: \`${apartment.location.address ? apartment.location.address : "Не вказано 😔"}\`\n`
    + `*Район*: \`${apartment.location.subLocationName ? apartment.location.subLocationName : "Не вказано 😔"}\`\n`
    + `*Кількість кімнат*: ${apartment.rooms ? apartment.rooms : "Не вказано :("}\n`
    + `*Площа*: ${apartment.area.value} м²\n`
    + `*Поверх*: ${apartment.floor}`
}

function createFreshApartmentsMessage(apartment, metro) {
    return `*${apartment.category ? apartment.category : "Квартира :)"}*\n`
        + `*Ціна*: ${apartment.price.value} ${apartment.price.currency}\n`
        + `*Вільна*: ${apartment.isFree ? "Ні 😔" : "Так! 🥳"}\n`
        + `*Станція метро*: ${(metro) ? (metro.name) ? ((metro.color ? metro.color === 'green' ? '🟢' : metro.color === 'red' ? "🔴" : metro.color === 'blue' ? "🔵" : "" : "") + " " + metro.name) : "Не вказано :(" : "Не вказано :("}\n`
        + `*Адреса*: \`${apartment.location.address ? apartment.location.address : "Не вказано 😔"}\`\n`
        + `*Район*: \`${apartment.location.subLocationName ? apartment.location.subLocationName : "Не вказано 😔"}\`\n`
        + `*Кількість кімнат*: ${apartment.rooms ? apartment.rooms : "Не вказано :("}\n`
        + `*Площа*: ${apartment.area.value} м²\n`
        + `*Поверх*: ${apartment.floor}\n`
        + `*Номер власника*: ${apartment.salesAgent.phone}`;

}

function createFiltersMessage(user, metro) {

    return "Твої попередні фільтри:\n\n" + `*Місто*: ${user.city}\n\n` +
        "*Райони*:\n" +user.region.map(region => "   👉" +region).join("\n")
        + "\n\n*Станції метро*:\n " +
        metro.map(metro => {
            return `${(metro) ? (metro.name) ? ((metro.color ? metro.color === 'green' ? '🟢' : metro.color === 'red' ? "🔴" : metro.color === 'blue' ? "🔵" : "" : "") + " " + metro.name) : "" : ""}`
        }).join(", ")
        + `\n\n*Ціна від* ${user.priceMin} *до* ${user.priceMax}`
        + `\n\n*Кількість кімнат:* `+user.rooms.map(room=>room).join(" ,")
        + `\n\n*Тип пошуку*: ${user.isRooms?"Оренда":"Купівля"}`;
}

module.exports = {
    getMainDataFromMsg,
    createApartmentsMessage,
    createFiltersMessage,
    createFreshApartmentsMessage
}