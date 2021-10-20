require('dotenv').config({path: __dirname + '/.env'})

const TelegramBot = require('node-telegram-bot-api');
let schedule = require('node-schedule');
const token_tg = process.env.TELEGRAM_TOKEN;
const ADMIN_CHAT = -1001589426879;
const bot = new TelegramBot(token_tg, {polling: true});
const MANAGER_CHAT = -1001339183887;
const apiTests = require('./api/Api');
let ap = new apiTests()
const {
    getMainDataFromMsg,
    createApartmentsMessage,
    createFiltersMessage,
    createFreshApartmentsMessage
} = require("./utils/TelegramUtils")
const cities = require("./cities.json");
const {log} = require("nodemon/lib/utils");
const metroArray = require("./metros.json");
const rooms = [
    {
        "name": "1"
    },
    {
        "name": "2"
    },
    {
        "name": "3"
    },
    {
        "name": "4"
    }
]
let roomsMinMax = '';
const TRANZZO_TOKEN = process.env.TRANZZO_TOKEN;

bot.onText(/\/start/, (msg) => {
    try {
        let msgInfo = getMainDataFromMsg(msg);
        getUserByTelegramID(msg).then(user => {
            if (user) {
                processReturnedUser(msgInfo);
            } else {
                registerUser(msgInfo);
                bot.sendMessage(msgInfo.chat, `Привіт, ${msgInfo.name} ${msgInfo.last_name}!\nЦе 🤖 компанії РУМС!\nТут ти зможеш:
                        \n▫️обрати необхідні тобі фільтри для персональних підбірок
                        \n▫️тримати зв'язок із персональним помічником
                        \n▫️отримувати сповіщення про появу нових об'єктів за твоїми фільтрами ;)
                        \n▫️пожалітися нам у підтримку, або попросити перевірити власника житла, або квартиру.
                        \nНадішліть Ваш номер, щоб ми могли вас верифікувати, будь ласка.
                        `).then(res => {
                        return bot.sendMessage(msgInfo.chat, `Ми пропонуємо почитати що таке РУМС, та чим ми займаємося у [оглядовій статті](https://teletype.in/@rooms_ua/NGUnJgEUi)`, {parse_mode: "Markdown"})
                    }
                )
                sendGreetingMessage(msgInfo);
                bot.sendMessage(ADMIN_CHAT, `Зареєстрований новий користувач "${msgInfo.name + " " + msgInfo.last_name}" з ID"${msgInfo.chat}"`);
            }
            // if (key.includes("chat")) {
            //     let msgInfo = getMainDataFromMsg(msg);
            //     getUserByTelegramID(msg).then(user => {
            //         if (user.role.type === "manager") {
            //             api.request({
            //                 "url": "users",
            //                 "method": "PUT",
            //                 "id": user.id,
            //                 body: {support_receiver_telegram_id: key.split("_")[1]}
            //             }).then(() => {
            //                 return getUserByTelegramID(key.split("_")[1])
            //             }).then(client => {
            //                 return bot.sendMessage(msgInfo.chat, `Ви підключені до чату з користувачем *${client.name ? client.name : "" + " " + client.last_name ? client.last_name : ""}* ${client.phone ? "з номером +" + client.phone : ""}\n`, generateMessagingButtons())
            //             })
            //
            //         }
            //     })
            //     return;
            // }
            // if (key.includes("5f44102d479cca001db181d7")) {
            //     api.request({
            //         "url": "users",
            //         "method": "PUT",
            //         "id": user.id,
            //         body: {subscription: "5f44102d479cca001db181d7", days_of_subscription: 99999}
            //     })
            // }
        })
    } catch (e) {
        console.log(e);
    }

})

bot.onText(/Налаштування/, (msg) => {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;

    const opts = {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{text: 'Оновити фільтри ⚙️'}, {
                    text: 'Інформація про підписку ℹ️'
                }, {
                    text: 'Головне меню ◀️'
                }],
                [{text: 'Хочу пожалітися 😡', callback_data: 'settings'}]
            ]
        })
    };
    bot.sendMessage(chat, 'Оберіть пункт меню', opts);
})

bot.onText(/Головне меню/, (msg) => {
    sendMainMenu(msg)
});

bot.onText(/Свіжі квартири/, (msg) => {
    let msgInfo = getMainDataFromMsg(msg);
    getUserByTelegramID(msg).then(user => {
        if (user.daysOfSubscription > 0) {
            user.todayCompilation = user.todayCompilation === null ? [] : user.todayCompilation;
            if (user.todayCompilation.length > 0) {
                sendApartments(user, msg, user.todayCompilation[0])
            } else {
                bot.sendMessage(msgInfo.chat, "Свежих квартир нет")
            }

        } else {
            bot.sendMessage(msgInfo.chat, "У вас закончилась подписка")
        }

    })
    // bot.sendMessage(msgInfo.chat, createApartmentsMessage(apiTest[0]))
    // getUserByTelegramID(msg).then(async user => {
    //     /*if (user.subscription.name.includes("Тест")) {
    //         setTimeout( () => {
    //                 bot.sendMessage(user.telegram_id, "Дякую, що ти з нами! РУМС БОТ допоможе тобі знайти квартиру без комісії!" + "\n" +
    //                     "Ми взагалі продаємо підписку на наш БОТ щоб ти міг отримувати більше квартир. " +
    //                     "Але зараз ми даємо тобі \n" +
    //                     "1 ТЕСТОВИЙ ДЕНЬ щоб познайомитись з нашим сервісом!\nПід час тесту - ти можеш отримувати лише по 10 квартир на день" +
    //                     "\n" +
    //                     "Хочеш отримати платну підписку з більшою кількістю об'єктів? Придбай тут https://roomsua.me/#/tarrifs")
    //             }
    //             ,5000)
    //     }*/
    //     if (user.messaging_history) {
    //         if (user.messaging_history.todayCompilation) {
    //             if (user.messaging_history.todayCompilation.length > 0) {
    //                 if (user.messaging_history.lastViewed === "none") {
    //                     sendApartment(user, user.messaging_history.todayCompilation[0])
    //                     user.messaging_history.lastViewed = user.messaging_history.todayCompilation[0];
    //                     api.request({
    //                         "url": "users",
    //                         "method": "PUT",
    //                         "id": user.id,
    //                         body: {messaging_history: user.messaging_history}
    //                     })
    //                 } else {
    //                     sendApartment(user, user.messaging_history.lastViewed)
    //                 }
    //             } else {
    //                 await getFreshApartmentsByUser(user, user.subscription.apartments_amount, 0, []).then(apartments => {
    //                     if (apartments.length > 0) {
    //                         user.messaging_history.todayCompilation = apartments.map(apart => apart.id);
    //                         user.messaging_history.viewed = user.messaging_history.viewed.concat(user.messaging_history.todayCompilation);
    //                         user.messaging_history.lastViewed = user.messaging_history.todayCompilation[0];
    //                         user.days_of_subscription -= 1;
    //                         if (user.subscription.name !== "Вічна підписка") {
    //                             api.request({
    //                                 "url": "users",
    //                                 "method": "PUT",
    //                                 "id": user.id,
    //                                 body: {messaging_history: user.messaging_history}
    //                             })
    //                         } else {
    //                             api.request({
    //                                 "url": "users",
    //                                 "method": "PUT",
    //                                 "id": user.id,
    //                                 body: {
    //                                     messaging_history: user.messaging_history,
    //                                     days_of_subscription: user.days_of_subscription
    //                                 }
    //                             })
    //                         }
    //                         try {
    //                             sendApartment(user, user.messaging_history.todayCompilation[0])
    //                         } catch (e) {
    //
    //                         }
    //                         try {
    //                             createTelegraphPage(apartments.slice(0, 10).map(apartment => {
    //                                 return createApartmentsPartTelegraph(apartment)
    //                             }), user).then(compilation => {
    //                                 console.log(compilation);
    //                                 bot.sendMessage(user.telegram_id, `Ми тут для Тебе дещо приготували! [Клац 😏](${compilation.url})`, {parse_mode: "Markdown"})
    //                             })
    //                         } catch (e) {
    //
    //                         }
    //                     } else {
    //                         console.log("Не знайдено квартири по фільтрам")
    //                         bot.sendMessage(user.telegram_id, "На жаль зараз відсутні нові об'єкти по твоїм фільтрам - але не сумуй, ти можеш змінити параметри пошуку, та спробувати ще раз!\nПридбай персональний підбір, і це пришвидшить пошук у рази! Деталі за посиланням https://roomsua.me/#/personal")
    //                     }
    //                 })
    //
    //             }
    //
    //         }
    //     }
    //
    // })
    sendMainMenu(msg)
})

bot.onText(/Збережені/, (msg) => {
    let msgInfo = getMainDataFromMsg(msg);
    getUserByTelegramID(msg).then(user => {
        if (user.daysOfSubscription > 0) {
            user.savedApartments = user.savedApartments === null ? [] : user.savedApartments;
            if (user.savedApartments.length > 0) {
                sendLikedApartments(user, msg, user.savedApartments[0])
                // sendApartments(user, msg, user.savedApartments[0])
            } else {
                bot.sendMessage(msgInfo.chat, "Сохраненных квартир нет")
            }

        } else {
            bot.sendMessage(msgInfo.chat, "У вас закончилась подписка")
        }

    })
})

function sendLikedApartments(user, msg, idApartments) {
    user.savedApartments = user.savedApartments === null ? [] : user.savedApartments;
    ap.request({
        url: "apartments/find",
        filters: {id: idApartments},
        method: "GET"
    }).then(apartment => {
        let metro = [];
        if (apartment) {
            let metroArray = require('./metros.json');
            for (let i = 0, len = metroArray.length; i < len; i++) {
                if (metroArray[i].name !== apartment[0].location.metro.name) {
                    continue;
                }
                metro = metroArray[i];
            }
            let captionString = createFreshApartmentsMessage(apartment[0], metro);
            let photos = [];
            for (let i = 0; i < apartment[0].images.slice(0, 5).length; i++) {
                if (i === 0) {
                    photos.push({
                        type: "photo",
                        media: apartment[0].images[i],
                        // caption: captionString,
                        parse_mode: "Markdown"
                    })
                } else {
                    photos.push({type: "photo", media: apartment[0].images[i]})
                }
            }
            // let viewConfig = {previos: -1, next: 0}
            bot.sendMediaGroup(user.idTelegram, (photos.length) > 0 ? photos : [{
                type: 'photo',
                media: "http://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png"
            }], {"disable_notification": true})
                .then(resp => {
                    let viewConfig = {previos: -1, next: 0}
                    idApartments = Number(idApartments);
                    if (user.savedApartments.indexOf(idApartments) !== -1) {
                        viewConfig.previos = user.savedApartments.indexOf(idApartments) - 1 >= 0 ? user.savedApartments.indexOf(idApartments) - 1 : -1;
                        viewConfig.next = user.savedApartments.indexOf(idApartments) + 1 <= user.savedApartments.length - 1 ? user.savedApartments.indexOf(idApartments) + 1 : 0;
                        console.log("VIEWCONFIG next: " + viewConfig.next)
                    } else {
                        viewConfig = {previos: -1, next: 0}
                    }
                    sendLikedApartmentMessageForUser(user, captionString, idApartments, apartment, viewConfig, resp);
                })
                .catch(err => {
                    let viewConfig = {previos: -1, next: 0}
                    if (user.savedApartments.indexOf(idApartments) !== -1) {
                        viewConfig.previos = user.savedApartments.indexOf(idApartments) - 1 >= 0 ? user.savedApartments.indexOf(idApartments) - 1 : -1;
                        viewConfig.next = user.savedApartments.indexOf(idApartments) + 1 <= user.savedApartments.length - 1 ? user.savedApartments.indexOf(idApartments) + 1 : 0;
                    } else {
                        viewConfig = {previos: -1, next: 0}
                    }
                    bot.sendMessage(user.idTelegram, captionString, {
                        parse_mode: "Markdown",
                        "disable_notification": true,
                        reply_markup: JSON.stringify({
                            resize_keyboard: true,
                            inline_keyboard: [[{
                                text: 'Видалити  ❤',
                                callback_data: 'delete:' + idApartments+":"+user.savedApartments[viewConfig.next]
                            }, {
                                text: 'Детальніше ℹ️',
                                callback_data: 'detail_info:' + idApartments
                            }],
                                [{
                                    text: viewConfig.previos === -1 ? "⏺" : '◀️ Попередня',
                                    callback_data: 'pag:' + user.savedApartments[viewConfig.previos] + ":"
                                }, {
                                    text: 'Наступна ▶️',
                                    callback_data: 'pag:' + user.savedApartments[viewConfig.next] + ":"
                                }]]
                        })
                    })
                })
        } else {
            bot.sendMessage(user.idTelegram, 'На жаль квартири за даними параметрами не знайдено')
        }
    })
}

function deleteApartmentFromLiked(msg, reply, chat) {
    getUserByTelegramID(msg).then(user => {
        // user.savedApartments = user.savedApartments.map(reg => reg).filter(id => id !== reply.split(":")[1]);
        console.log(reply.split(":")[1])
        console.log(user.savedApartments.indexOf(reply.split(":")[1]))
        let index= Number(reply.split(":")[1])
        let myIndex = user.savedApartments.indexOf(index);
        if (myIndex !== -1) {
            console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT')
            user.savedApartments.splice(myIndex, 1);
        }
        console.log(user)
        ap.request({
            "url": "user/updateById/" + user.id,
            "method": "PUT",
            body: user
        }).then(res => {
            bot.sendMessage(chat, "Видалили :(")
        })
    })
}

bot.onText(/pay/, (msg) => {
    createInvoiceMsg(msg.chat.id);
});

function sendApartmentMessageForUser(user, captionString, apartmentId, apartment, viewConfig, resp) {
    bot.sendMessage(user.idTelegram, "Навігація:", {
        parse_mode: "Markdown",
        "disable_notification": true,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [[{
                text: user.savedApartments.map(ap => ap).includes(apartmentId) ? "Збережено ✅" : 'Зберегти  ❤',
                callback_data: 'like:' + apartmentId
            }, {
                text: 'Детальніше ℹ️',
                callback_data: 'detail_info:' + apartment
            }], [{
                text: viewConfig.previos === -1 ? "⏺" : '◀️ Попередня',
                callback_data: 'aps:' + user.todayCompilation[viewConfig.previos] + ":" + resp.map(ms => ms.message_id).join("*")
            }, {
                text: 'Наступна ▶️',
                callback_data: 'aps:' + user.todayCompilation[viewConfig.next] + ":" + resp.map(ms => ms.message_id).join("*")
            }]]
        })
    })
}

function sendLikedApartmentMessageForUser(user, captionString, apartmentId, apartment, viewConfig, resp) {
    bot.sendMessage(user.idTelegram, captionString, {
        parse_mode: "Markdown",
        "disable_notification": true,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [[{
                text: 'Видалити  ❤',
                callback_data: 'delete:' + apartmentId+":"+user.savedApartments[viewConfig.next]+":"+ resp.map(ms => ms.message_id).join("*")
            }, {
                text: 'Детальніше ℹ️',
                callback_data: 'detail_info:' + apartment
            }], [{
                text: viewConfig.previos === -1 ? "⏺" : '◀️ Попередня',
                callback_data: 'pag:' + user.savedApartments[viewConfig.previos] + ":" + resp.map(ms => ms.message_id).join("*")
            }, {
                text: 'Наступна ▶️',
                callback_data: 'pag:' + user.savedApartments[viewConfig.next] + ":" + resp.map(ms => ms.message_id).join("*")
            }]]
        })
    })
}

function sendApartments(user, msg, idApartments) {
    //user.savedApartments = user.savedApartments === null ? [] : user.savedApartments;
    ap.request({
        url: "apartments/find",
        filters: {id: idApartments},
        method: "GET"
    }).then(apartment => {
        let metro = [];
        user.savedApartments = user.savedApartments===null?[]:user.savedApartments;
        if (apartment) {
            let metroArray = require('./metros.json');
            for (let i = 0, len = metroArray.length; i < len; i++) {
                if (metroArray[i].name === apartment[0].location.metro.name) {
                    metro = metroArray[i];
                }
            }
            let captionString = createFreshApartmentsMessage(apartment[0], metro);
            let photos = [];
            for (let i = 0; i < apartment[0].images.slice(0, 5).length; i++) {
                if (i === 0) {
                    photos.push({
                        type: "photo",
                        media: apartment[0].images[i],
                        caption: captionString,
                        parse_mode: "Markdown"
                    })
                } else {
                    photos.push({type: "photo", media: apartment[0].images[i]})
                }
            }
            // let viewConfig = {previos: -1, next: 0}
            bot.sendMediaGroup(user.idTelegram, (photos.length) > 0 ? photos : [{
                type: 'photo',
                media: "http://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png"
            }], {"disable_notification": true})
                .then(resp => {
                    let viewConfig = {previos: -1, next: 0}
                    idApartments = Number(idApartments);
                    if (user.todayCompilation.indexOf(idApartments) !== -1) {
                        viewConfig.previos = user.todayCompilation.indexOf(idApartments) - 1 >= 0 ? user.todayCompilation.indexOf(idApartments) - 1 : -1
                        viewConfig.next = user.todayCompilation.indexOf(idApartments) + 1 <= user.todayCompilation.length - 1 ? user.todayCompilation.indexOf(idApartments) + 1 : 0;
                        console.log("VC: "+ viewConfig.next)
                    } else {
                        viewConfig = {previos: -1, next: 0}
                    }
                    sendApartmentMessageForUser(user, captionString, idApartments, apartment, viewConfig, resp);
                })
                .catch(err => {
                    let viewConfig = {previos: -1, next: 0}
                    if (user.todayCompilation.indexOf(idApartments) !== -1) {
                        viewConfig.previos = user.todayCompilation.indexOf(idApartments) - 1 >= 0 ? user.todayCompilation.indexOf(idApartments) - 1 : -1;
                        viewConfig.next = user.todayCompilation.indexOf(idApartments) + 1 <= user.todayCompilation.length - 1 ? user.todayCompilation.indexOf(idApartments) + 1 : 0;
                    } else {
                        viewConfig = {previos: -1, next: 0}
                    }
                    bot.sendMessage(user.idTelegram, captionString, {
                        parse_mode: "Markdown",
                        "disable_notification": true,
                        reply_markup: JSON.stringify({
                            resize_keyboard: true,
                            inline_keyboard: [[{
                                text: user.savedApartments.map(ap => ap.id).includes(idApartments) ? "Збережено ✅" : 'Зберегти  ❤',
                                callback_data: 'like:' + idApartments
                            }, {
                                text: 'Детальніше ℹ️',
                                callback_data: 'detail_info:' + idApartments
                            }],
                                [{
                                    text: viewConfig.previos === -1 ? "⏺" : '◀️ Попередня',
                                    callback_data: 'aps:' + user.todayCompilation[viewConfig.previos] + ":"
                                }, {
                                    text: 'Наступна ▶️',
                                    callback_data: 'aps:' + user.todayCompilation[viewConfig.next] + ":"
                                }]]
                        })
                    })
                })
        } else {
            bot.sendMessage(user.idTelegram, 'На жаль квартири за даними параметрами не знайдено')
        }
    })
}

schedule.scheduleJob('42 * * * *', async function () {
    await ap.request({url: "api/user", method: "GET"}).then(async users => {
        for (let i = 0; i < users.length; i++) {
            let user = users[i]
            try {
                await decreaseDaysInSubscription(user);
            } catch (e) {
                console.log(e)
            }
        }
    })
});

async function decreaseDaysInSubscription(user) {
    try {
        user.daysOfSubscription -= 1;
    } catch (e) {
        console.log("Failed")
    }
}
bot.onText(/Оновити фільтри/, (msg) => {
    let msgInfo = getMainDataFromMsg(msg);
    let metros = require('./metros.json');
    let metroNew = []
    getUserByTelegramID(msg).then(user => {
        user.metroNames = user.metroNames === null ? [] : user.metroNames;
        metros.map(metro => {
            user.metroNames.map(user_metro => {
                if (user_metro == metro.name) {
                    metroNew.push(metro);
                }
            })
        })
        bot.sendMessage(msgInfo.chat, createFiltersMessage(user, metroNew), {parse_mode: "Markdown"})
    })
    const cities = require('./cities.json')
    setTimeout(() => {
        bot.sendMessage(msgInfo.chat, "Яке твоє місто?", createKeyboardOpts(cities.map(city => {
            return {text: city.name, callback_data: "set_city:" + city.id}
        }), 3,))
    }, 1000)
})

function getUserByTelegramID(msg) {
    let chat;
    if (!msg.chat && !msg.from) {
        chat = msg;
    } else {
        chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    }
    return ap.request(
        {
            "url": "user",
            "id": chat,
            method: "GET"
        }
    ).then(res => {
        return res;
    })/*.then(user => {
        if (user && user.days_of_subscription <= 0) {
            api.request({url: "subscriptions", method: "GET", filters: {"_sort": "price:ASC"}}).then(plans => {
                if (plans) {
                    let keyboard = createKeyboardOpts(plans.filter(plan => {
                        return !plan.name.includes("Тест")
                    }).map(plan => {
                        return {text: plan.name + " " + plan.price + " грн", url: plan.url}
                    }), 1);
                    bot.sendMessage(user.telegram_id, "Оу, в тебе закінчилась тестова підписка 😢\n" +
                        "Тобі необхідно обрати свій тариф та оплатити його щоб отримувати по 100 нових об'єктів!", keyboard)
                }
            })
            return null;
        } else {
            return user;
        }
    })*/
}

function processReturnedUser(msgInfo) {
    bot.sendMessage(msgInfo.chat, `Привіт, ${msgInfo.name} ${msgInfo.last_name}!\nЗ поверненням!`, {
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{text: 'Свіжі квартири 🏢', callback_data: 'getFreshApartments'}, {
                    text: 'Збережені ❤',
                    callback_data: 'liked'
                }],
                [{text: 'Налаштування ⚙', callback_data: 'settings'}, {
                    text: 'Придбати персональний підбір 🧞‍♂',
                    callback_data: 'settings'
                }]
            ]
        })
    })
}

async function registerUser(msgInfo) {
    await ap.request({
        "url": "user/add", "method": "POST", body: {
            // subscription: "5f44102d479cca001db181d7",
            "nickname": msgInfo.chat,
            "name": msgInfo.name,
            "idTelegram": msgInfo.chat,
            "lastName": msgInfo.last_name,
            "daysOfSubscription": 2
        }
    })
}

function sendGreetingMessage(msgInfo) {
    const cities = require('./cities.json')
    setTimeout(() => {
        bot.sendMessage(msgInfo.chat, `Ти з нами вперше - тому тобі надано 2 дні тестової підписки \n З чим тобі допомогти?`)
            .then(() => {
                bot.sendMessage(msgInfo.chat, "Яке твоє місто?", createKeyboardOpts(cities.map(city => {
                    return {text: city.name, callback_data: "set_city_update:" + city.id}
                }), 3,))
            })
    }, 1000)
}

function createKeyboardOpts(list, elementsPerSubArray, args) {
    let list1 = listToMatrix(list, elementsPerSubArray);
    if (args) {
        list1.push(args);
    }
    const opts = {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: list1
        })
    };
    return opts;
}

function listToMatrix(list, elementsPerSubArray) {
    var matrix = [], i, k;
    for (i = 0, k = -1; i < list.length; i++) {
        if (i % elementsPerSubArray === 0) {
            k++;
            matrix[k] = [];
        }
        matrix[k].push(list[i]);
    }

    return matrix;
}

function sendMainMenu(msg) {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    const opts = {
        reply_to_message_id: msg.message_id,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{text: 'Свіжі квартири 🏢', callback_data: 'getFreshApartments'}, {
                    text: 'Збережені ❤️',
                    callback_data: 'liked'
                }],
                [{text: 'Налаштування ⚙', callback_data: 'settings'}, {
                    text: 'Придбати персональний підбір 🧞‍♂️',
                    callback_data: 'settings'
                }]
            ]
        })
    };

    if (chat === MANAGER_CHAT) {
        opts.reply_markup = JSON.stringify({
            resize_keyboard: true,
            keyboard: [
                [{text: 'Меню менеджера 😎'}],
                [{text: 'Конфігурація бота '}]
            ]
        })
    }
    bot.sendMessage(chat, 'Оберіть пункт меню', opts);
}

function prepareRentOrBuy(msg) {
    const opts = {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [
                [
                    {
                        text: 'Хочу орендувати',
                        callback_data: 'rent'
                    },
                    {
                        text: ' Хочу купити',
                        callback_data: 'buy'
                    }
                ]
            ]
        })
    };
    opts.reply_to_message_id = msg.message_id
    return opts;
}

function prepareRentOrBuyUpdate(msg) {
    const opts = {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [
                [
                    {
                        text: 'Хочу орендувати',
                        callback_data: 'rent_update'
                    },
                    {
                        text: ' Хочу купити',
                        callback_data: 'buy_update'
                    }
                ]
            ]
        })
    };
    opts.reply_to_message_id = msg.message_id
    return opts;
}

function selectMaxRooms(msg, reply, chat) {
    const roomsAmount = prepareMaxRoom(msg);
    bot.sendMessage(chat, "Обери максимальну кількість кімнат:", roomsAmount)
}

function selectRooms(msg, reply, chat) {
    const roomsAmount = prepareRoom(msg);
    bot.sendMessage(chat, "Скільки потрібно кімнат?", roomsAmount)
}

function prepareMaxRoom(msg) {
    const opts = createKeyboardOpts(rooms.map(room => {
        return {
            text: room.name,
            callback_data: "max_rooms:" + room.name
        }
    }), 2, [{text: "Пропустити 💾", callback_data: "save_amount_of_rooms"}])
    opts.reply_to_message_id = msg.message_id
    return opts;
}

function prepareRoom(msg) {
    const opts = createKeyboardOpts(rooms.map(room => {
        return {
            text: room.name,
            callback_data: "rooms:" + room.name
        }
    }), 1, [{text: "Зберегти 💾", callback_data: "save_amount_of_rooms"}])
    opts.reply_to_message_id = msg.message_id
    return opts;
}

function prepareHighPriceOpts(msg) {
    const opts = {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [[{text: '5000 грн', callback_data: 'price:5000'}, {
                text: '6000 грн',
                callback_data: 'price:6000'
            }, {text: '7000 грн', callback_data: 'price:7000'}],
                [{text: '8000 грн', callback_data: 'price:8000'}, {
                    text: '9000 грн',
                    callback_data: 'price:9000'
                }, {text: '10000 грн', callback_data: 'price:10000'}],
                [{text: '11000 грн', callback_data: 'price:11000'}, {
                    text: '12000 грн',
                    callback_data: 'price:12000'
                }, {text: '13000 грн', callback_data: 'price:13000'}],
                [{text: '14000 грн', callback_data: 'price:14000'}, {
                    text: '15000 грн',
                    callback_data: 'price:15000'
                }, {text: '16000 грн', callback_data: 'price:16000'}],
                [{text: 'Я хочу найдорожчі квартири! 🤑', callback_data: 'price:50000'}]
            ]
        })
    };
    opts.reply_to_message_id = msg.message_id
    return opts;
}

function prepareLowPriceOpts(msg) {
    const opts = {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [[{text: '1500 грн', callback_data: 'price_low:1500'}, {
                text: '2000 грн',
                callback_data: 'price_low:2000'
            }, {text: '3000 грн', callback_data: 'price_low:3000'}],
                [{text: '4000 грн', callback_data: 'price_low:4000'}, {
                    text: '5000 грн',
                    callback_data: 'price_low:5000'
                }, {text: '6000 грн', callback_data: 'price_low:6000'}],
                [{text: '7000 грн', callback_data: 'price_low:7000'}, {
                    text: '8000 грн',
                    callback_data: 'price_low:8000'
                }]
            ]
        })
    };
    opts.reply_to_message_id = msg.message_id
    return opts;
}

function setRegions(reply, chat, msg) {
    const regions = require('./regions.json')
    let keyboard;
    getUserByTelegramID(msg).then(user => {
        regions.map(region => {
            if (region.id === user.city) {
                keyboard = createKeyboardOpts(region.regions.map(region_name => {
                    return {
                        text: region_name.name,
                        callback_data: "rg:" + region_name.id
                    }
                }), 1, [{text: "Зберегти райони 💾", callback_data: "save_regions"}]);

            }
        })
    }).then(() => {
        bot.sendMessage(chat, "Давай ще уточнимо район в якому ти хочеш жити? (Можна декілька)", keyboard)
    })


}

function setMetro(reply, chat, msg) {
    const metroFile = require('./metro-kyiv.json');
    let keyboardEnd = [];
    let keyboard = [];

    getUserByTelegramID(msg).then(user => {
        if (user.region === null) {
            continueMetro(chat);

        } else {
            for (let j = 0; j < metroFile.length; j++) {
                for (let i = 0; i < user.region.length; i++) {
                    if (user.region[i] === metroFile[j].id) {
                        metroFile[j].metros.map(metro => {
                            keyboard.push({
                                text: (metro.color ? metro.color === 'green' ? '🟢' : metro.color === 'red' ? "🔴" : metro.color === 'blue' ? "🔵" : "" : "") + " " + metro.name,
                                callback_data: "set_metro_first:" + metro.name
                            })
                        });
                    }
                }
            }
            keyboard = keyboard.filter((v, i, a) => a.findIndex(t => (t.text === v.text && t.callback_data === v.callback_data)) === i)
            keyboardEnd = createKeyboardOpts(keyboard, 1, [{text: "Зберегти станції 💾", callback_data: "save_metro"}])
            bot.sendMessage(chat, "Обери станції! 🚝 (Можна декілька)", keyboardEnd)
        }

    })


}

function selectRegionKeyboard(msg, reply, chat) {


    let userClickData = reply.split(":")[1]
    let regions = []
    /*    msg.message.reply_markup.inline_keyboard.map(arr => {
            if(arr[0].text.startsWith("✅| ")){
                regions.push(arr[0].text.split(" ")[1])
            }
        })*/

    getUserByTelegramID(msg).then(user => {
        user.region = user.region === null ? [] : user.region;
        if (!user.region.map(reg => reg).includes(userClickData)) {
            user.region.push(userClickData);
            ap.request({
                "url": "user/updateById/" + user.id,
                "method": "PUT",
                body: user
            })
            bot.editMessageText("Обери свій район!(Можна декілька)", {
                chat_id: chat,
                message_id: msg.message.message_id,
                reply_markup: JSON.stringify({
                    inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                        if (arr[0].callback_data.includes(reply)) {
                            arr[0].text = "✅| " + arr[0].text
                        }
                        return arr;
                    })
                })
            })
        } else {
            user.region = user.region.filter(id => id !== userClickData);
            ap.request({
                "url": "user/updateById/" + user.id,
                "method": "PUT",
                body: user
            })
            bot.editMessageText("Обери свій район!(Можна декілька)", {
                chat_id: chat,
                message_id: msg.message.message_id,
                reply_markup: JSON.stringify({
                    inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                        if (arr[0].callback_data.includes(reply)) {
                            arr[0].text = arr[0].text.replace("✅| ", "");
                        }
                        return arr
                    })
                })
            })
        }
    })

}

function selectMetroKeyboard(msg, reply, chat) {
    getUserByTelegramID(msg).then(user => {
        user.metroNames = user.metroNames === null ? [] : user.metroNames;
        if (!user.metroNames.map(reg => reg).includes(reply.split(":")[1])) {
            user.metroNames.push((reply.split(":")[1]));
            ap.request({
                "url": "user/updateById/" + user.id,
                "method": "PUT",
                body: user
            })
            bot.editMessageText("Обери станції! 🚝 (Можна декілька)", {
                chat_id: chat,
                message_id: msg.message.message_id,
                reply_markup: JSON.stringify({
                    inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                        if (arr[0].callback_data.includes(reply)) {
                            arr[0].text = "✅| " + arr[0].text
                        }
                        return arr;
                    })
                })
            })
        } else {
            user.metroNames = user.metroNames.filter(id => id !== reply.split(":")[1]);
            ap.request({
                "url": "user/updateById/" + user.id,
                "method": "PUT",
                body: user
            })
            bot.editMessageText("Обери станції! 🚝 (Можна декілька)", {
                chat_id: chat,
                message_id: msg.message.message_id,
                reply_markup: JSON.stringify({
                    inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                        if (arr[0].callback_data.includes(reply)) {
                            arr[0].text = arr[0].text.replace("✅| ", "");
                        }
                        return arr
                    })
                })
            })
        }
    })

}

function selectRoomsKeyboard(msg, reply, chat) {
    getUserByTelegramID(msg).then(user => {
        user.rooms = user.rooms === null ? [] : user.rooms;
        let userClickData = reply.split(":")[1]
        let userRoomsArrToString = user.rooms.map(room => room.toString());
        if (!userRoomsArrToString.includes(userClickData)) {
            user.rooms.push(userClickData);
            ap.request({
                "url": "user/updateById/" + user.id,
                "method": "PUT",
                body: user
            })
            bot.editMessageText("Обери кількість кімнат", {
                chat_id: chat,
                message_id: msg.message.message_id,
                reply_markup: JSON.stringify({
                    inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                        if (arr[0].callback_data.includes(reply)) {
                            arr[0].text = "✅| " + arr[0].text
                        }
                        return arr;
                    })
                })
            })
        } else {
            user.rooms = userRoomsArrToString.filter(id => id !== userClickData);
            ap.request({
                "url": "user/updateById/" + user.id,
                "method": "PUT",
                body: user
            })
            bot.editMessageText("Обери кількість кімнат", {
                chat_id: chat,
                message_id: msg.message.message_id,
                reply_markup: JSON.stringify({
                    inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                        if (arr[0].callback_data.includes(reply)) {
                            arr[0].text = arr[0].text.replace("✅| ", "");
                        }
                        return arr
                    })
                })
            })
        }
    })

}

function sendRandomApartment(msg) {
    getUserByTelegramID(msg).then(user => {
        ap.request({
            "url": "apartments/randomByParams",
            "method": "GET",
            filters: {
                city: user.city ? user.city : '',
                type: 'аренда',
                priceMin: user.priceMin ? user.priceMin : '',
                priceMax: user.priceMax ? user.priceMax : '',
                rooms: user.rooms ? user.rooms.join() : '',
                subLocationName: user.region ? user.region.join() : '',
                metro: user.metroNames ? user.metroNames.join() : ''
            }
        }).then(apartments => {
            let metro = [];
            if (apartments) {
                console.log(apartments)
                let metroArray = require('./metros.json');
                for (let i = 0, len = metroArray.length; i < len; i++) {
                    if (metroArray[i].name === apartments.location.metro.name) {
                        metro = metroArray[i];
                    }
                }
                let captionString = createApartmentsMessage(apartments, metro);
                let photos = [];
                for (let i = 0; i < apartments.images.slice(0, 5).length; i++) {
                    if (i === 0) {
                        photos.push({
                            type: "photo",
                            media: apartments.images[i],
                            caption: captionString,
                            parse_mode: "Markdown"
                        })
                    } else {
                        photos.push({type: "photo", media: apartments.images[i]})
                    }
                }
                bot.sendMediaGroup(user.idTelegram, (photos.length) > 0 ? photos : [{
                    type: 'photo',
                    media: "https://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png",

                }])
            } else {
                bot.sendMessage(user.idTelegram, 'На жаль квартири за даними параметрами не знайдено')
            }
        })
    })
}

function createInvoiceMsg(msg) {
    let iKeys = [
        {
            value: "На 7 днів - 199 грн",
            amount: "199.00",
            days: 7
        },
        {
            value: "На 14 днів 299 грн",
            amount: "299.00",
            days: 14
        },
        {
            value: "На 30 днів - 499 грн",
            amount: "499.00",
            days: 30
        }
    ];
    bot.sendMessage(msg, "Виберіть свій тариф", createKeyboardOpts(iKeys.map(key => {
        return {
            text: key.value,
            callback_data: "pay:" + key.amount + ":" + key.days
        }
    }), 1));
}

function continueMetro(chat) {
    bot.sendMessage(chat, 'Все я розібрався, яка тобі потрібна квартира. В мене зараз їх 120 шт.\n' +
        'І щодня з’являються ще по 3 свіженьких.\n' +
        '\n' +
        '\n' +
        'Показати їх?', {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            inline_keyboard: [[{text: 'ТАК!', callback_data: 'invoice'}]]
        })
    })
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function clearPreviousApartment(chatId, imagesId, replyMarkupId) {
    for (let imageId of imagesId) {
        bot.deleteMessage(chatId, imageId)
    }
    bot.deleteMessage(chatId, replyMarkupId)
}

function saveApartmentToLiked(msg, reply, chat) {
    getUserByTelegramID(msg).then(user => {
        user.savedApartments = user.savedApartments === null ? [] : user.savedApartments;

        /*let liked = [...user.savedApartments.map(reg => {
            if (reg !== reply.split(":")[1]) return reg
        }), reply.split(":")[1]];
        console.log(liked);*/
        user.savedApartments.push(reply.split(":")[1])
        console.log(user)
        ap.request({
            url: "user/updateById/" + user.id,
            method: "PUT",
            body: user
        })
        bot.editMessageReplyMarkup({
            inline_keyboard: msg.message.reply_markup.inline_keyboard.map(arr => {
                if (arr[0].callback_data.includes(reply)) {
                    arr[0].text = "Збережено ✅";
                }
                return arr
            })
        }, {message_id: msg.message.message_id, chat_id: chat})
    })
}

bot.on('callback_query', (msg) => {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let msgInfo = getMainDataFromMsg(msg)
    let reply = msg.data;
    const highPriceOpts = prepareHighPriceOpts(msg);
    const lowPriceOpts = prepareLowPriceOpts(msg);
    switch (reply) {
        case "buy": {
            const opts = prepareRentOrBuy(msg)
            //bot.deleteMessage(chat, msg.message.message_id);
            bot.sendMessage(chat, 'На жаль ця функція не працює 😥 \nМи повидомимо коли буде можливість купувати квартири\n Оберіть інший варіант', opts)
        }
            break;
        case "invoice": {
            sendRandomApartment(msg)
            setTimeout(() => {
                createInvoiceMsg(chat)
            }, 5000)
        }
            break;
        case "rent": {
            getUserByTelegramID(msg).then(user => {
                user.type = "аренда";
                return ap.request({
                    "url": "user/updateById/" + user.id,
                    "method": "PUT",
                    body: user
                })
            })
            if (!reply.includes('update')) {
                sendRandomApartment(msg)
                setTimeout(() => {
                    bot.sendMessage(chat, `Ось так швидко я можу знайти тобі квартиру.🪄\nВирішив тобі показати, щоб ти не втік)\nДавай далі уточнювати параметри.➡\n`)
                    //bot.deleteMessage(chat, msg.message.message_id);
                    bot.sendMessage(chat, 'Давай визначимо твій бюджет \nВибери мінімальний рівень', lowPriceOpts)
                }, 1000)
            }

        }
            break;
        case "save_regions" : {
            setTimeout(() => {
                //bot.deleteMessage(chat, msg.message.message_id);
                setMetro(reply, chat, msg)
            }, 5000)
            sendRandomApartment(msg)
        }
            break;
        case "save_metro" : {
            //bot.deleteMessage(chat, msg.message.message_id);
            bot.sendMessage(chat, 'Все я розібрався, яка тобі потрібна квартира. В мене зараз їх 120 шт.\n' +
                'І щодня з’являються ще по 3 свіженьких.\n' +
                '\n' +
                '\n' +
                'Показати їх?', {
                parse_mode: "Markdown",
                reply_markup: JSON.stringify({
                    resize_keyboard: true,
                    inline_keyboard: [[{text: 'ТАК!', callback_data: 'invoice'}]]
                })
            })
        }
            break;
        case "save_amount_of_rooms": {
            getUserByTelegramID(msg).then(user => {
                user.roomsMax = roomsMinMax
                return ap.request({
                    "url": "user/updateById/" + user.id,
                    "method": "PUT",
                    body: user
                })
            }).then(() => {
                setTimeout(() => {
                    //bot.deleteMessage(chat, msg.message.message_id);
                    setRegions(reply, chat, msg);
                }, 5000)
                sendRandomApartment(msg)
            })
        }
            break;
        default:
            if (reply.includes("set_city")) {
                if (reply.split(':')[1] === 'Киев') {
                    getUserByTelegramID(msg).then(user => {
                        user.city = reply.split(':')[1]
                        return ap.request({
                            "url": "user/updateById/" + user.id,
                            "method": "PUT",
                            body: user
                        })
                    }).then(() => {
                        const opts = prepareRentOrBuy(msg)
                        //bot.deleteMessage(chat, msg.message.message_id);
                        bot.sendMessage(chat, "З чим допомогти?", opts)
                    })
                } else {
                    setTimeout(() => {
                        bot.sendMessage(msgInfo.chat, "Вибач, але поки що у цих містах Ми не зможемо тобі допомогти😢\n Обери інше місто😇", createKeyboardOpts(cities.map(city => {
                            return {text: city.name, callback_data: "set_city_regions:" + city.id}
                        }), 3,))
                    }, 1000)
                }
            } else if (reply.includes("pay:")) {
                let param = reply.split(":")[1];
                let payload = uuidv4() + "*" + param.replace('.', '');
                let prices = [{
                    label: "Оплатити",
                    amount: parseInt(param.replace(".", ""))
                }];
                bot.sendInvoice(chat, "Оберіть тариф", "Оплата у розмірі  " + param + " гривень", payload, TRANZZO_TOKEN, "pay", "UAH", prices)
                bot.on('pre_checkout_query', ctx => bot.answerPreCheckoutQuery(ctx.id, true))
                bot.on('successful_payment', (ans) => {
                    if (payload === ans.successful_payment.invoice_payload) {
                        getUserByTelegramID(msg).then(user => {
                            user.daysOfSubscription = parseInt(reply.split(":")[2])
                            ap.request({
                                "url": "user/updateById/" + user.id,
                                "method": "PUT",
                                body: user
                            })
                            bot.sendMessage(chat, 'Вы купили подписку')
                        })

                    }

                })

            } else if (reply.includes("price_low:")) {
                getUserByTelegramID(msg).then(user => {
                    user.priceMin = (reply.split(':'))[1]
                    return ap.request({
                        "url": "user/updateById/" + user.id,
                        "method": "PUT",
                        body: user
                    })
                }).then(() => {
                    //bot.deleteMessage(chat, msg.message.message_id);
                    bot.sendMessage(chat, "Обери верхню ціну", highPriceOpts)
                })
            } else if (reply.includes("price:")) {
                getUserByTelegramID(msg).then(user => {
                    user.priceMax = (reply.split(':'))[1]
                    return ap.request({
                        "url": "user/updateById/" + user.id,
                        "method": "PUT",
                        body: user
                    })
                }).then(() => {
                    setTimeout(() => {
                        //bot.deleteMessage(chat, msg.message.message_id);
                        selectRooms(msg, reply, chat)
                    }, 5000)
                    sendRandomApartment(msg)

                })
            } else if (reply.includes("min_rooms:")) {
                getUserByTelegramID(msg).then(user => {
                    roomsMinMax = (reply.split(':'))[1]
                    user.roomsMin = (reply.split(':'))[1]
                    return ap.request({
                        "url": "user/updateById/" + user.id,
                        "method": "PUT",
                        body: user
                    })
                }).then(() => {
                    //bot.deleteMessage(chat, msg.message.message_id);
                    selectMaxRooms(msg, reply, chat)
                })
            } else if (reply.includes("max_rooms:")) {
                getUserByTelegramID(msg).then(user => {
                    user.roomsMax = (reply.split(':'))[1]
                    return ap.request({
                        "url": "user/updateById/" + user.id,
                        "method": "PUT",
                        body: user
                    })
                }).then(() => {
                    setTimeout(() => {
                        //bot.deleteMessage(chat, msg.message.message_id);
                        setRegions(reply, chat, msg);
                    }, 5000)
                    sendRandomApartment(msg)
                })
            } else if (reply.includes("apartments")) {
            } else if (reply.includes("aps")) {
                let apartmentId = reply.split(":")[1];
                let images = reply.split(":")[2].split("*");

                getUserByTelegramID(msg).then(user => {
                    clearPreviousApartment(user.idTelegram, images, msg.message.message_id)
                    sendApartments(user, msg, apartmentId)
                })
            } else if (reply.includes("delete")) {
                let apartmentId = reply.split(":")[2];
                let images = reply.split(":")[3].split("*");
                deleteApartmentFromLiked(msg, reply, chat);
                getUserByTelegramID(msg).then(user => {
                    clearPreviousApartment(user.idTelegram, images, msg.message.message_id)
                    sendLikedApartments(user, msg, apartmentId)
                })
            }else if (reply.includes("pag")) {
                let apartmentId = reply.split(":")[1];
                let images = reply.split(":")[2].split("*");
                console.log("NEXT SAVE AP in callback_query:  " + apartmentId)
                getUserByTelegramID(msg).then(user => {
                    clearPreviousApartment(user.idTelegram, images, msg.message.message_id)
                    sendLikedApartments(user, msg, apartmentId)
                })

            } else if (reply.includes("like")) {
                saveApartmentToLiked(msg, reply, chat);
            } else if (reply.includes("rooms")) {
                selectRoomsKeyboard(msg, reply, chat)
            } else if (reply.includes("rg")) {
                selectRegionKeyboard(msg, reply, chat);
            } else if (reply.includes("set_metro_first")) {
                selectMetroKeyboard(msg, reply, chat);
            }
    }
})

