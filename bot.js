const TelegramBot = require('node-telegram-bot-api');
const token_tg = "1953524348:AAGnDAeg5c1dLkAqWiQmy-cTPRwpyWAJlN4";
const ADMIN_CHAT = -1001589426879;
const passgen = require('passgen');
const bot = new TelegramBot(token_tg, {polling: true});
const MANAGER_CHAT = -1001339183887;
const cities = require("./api/cities-api")
require('./test-connection-db');

//Тут у нас тестовые темы вместо API
//apiTest -- тут JSON-файл записан в масив объетов, это по-сути готовый ответ с API
let apiTest = require('./api-request.json')
const api = require('./api/client-api')

const {
    getMainDataFromMsg,
} = require("./utils/TelegramUtils")


bot.onText(/\/start/, (msg) => {
    console.log(msg)
    try {
        let msgInfo = getMainDataFromMsg(msg);
        let key = msg.text.replace("/start", '').trim();
        let password = passgen.create(20);
        console.log(msgInfo)
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

//TODO Fresh apartments
bot.onText(/Свіжі квартири/, (msg) => {
    let msgInfo = getMainDataFromMsg(msg);
    console.log(apiTest)


    // getUserByTelegramID(msg).then(async user => {
    //     if (user.subscription.name.includes("Тест")) {
    //         setTimeout( () => {
    //                 bot.sendMessage(user.telegram_id, "Дякую, що ти з нами! РУМС БОТ допоможе тобі знайти квартиру без комісії!" + "\n" +
    //                     "Ми взагалі продаємо підписку на наш БОТ щоб ти міг отримувати більше квартир. " +
    //                     "Але зараз ми даємо тобі \n" +
    //                     "1 ТЕСТОВИЙ ДЕНЬ щоб познайомитись з нашим сервісом!\nПід час тесту - ти можеш отримувати лише по 10 квартир на день" +
    //                     "\n" +
    //                     "Хочеш отримати платну підписку з більшою кількістю об'єктів? Придбай тут https://roomsua.me/#/tarrifs")
    //             }
    //             ,5000)
    //     }
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

//TODO Refresh filters
bot.onText(/Оновити фільтри/, (msg) => {
    let msgInfo = getMainDataFromMsg(msg);

    getUserByTelegramID(msg).then(user => {
        bot.sendMessage(msgInfo.chat, createFiltersMessage(user), {parse_mode: "Markdown"})
    })

    api.request({
        "url": "cities", "method": "GET"
    }).then(cities => {
        setTimeout(() => {
            bot.sendMessage(msgInfo.chat, "Обери своє місто!", createKeyboardOpts(cities.map(city => {
                return {text: city.name, callback_data: "set_city_first:" + city.id}
            }), 3))
        }, 2000)

    })
})


function getUserByTelegramID(msg) {
    let chat;
    if (!msg.chat && !msg.from) {
        chat = msg;
    } else {
        chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    }
    return api.find({chat:chat}).then(users => {
        if (users.length > 0) {
            console.log(users)
            return users[0]
        }
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

//function processRegisterUser()
async function registerUser(msgInfo) {
    let apiU = new api(msgInfo)
    await apiU.save().then(res => {
        console.log("Успішно зареєстровано!")
    });
}

function sendGreetingMessage(msgInfo) {
    setTimeout(() => {
        bot.sendMessage(msgInfo.chat, `Тобі надано 2 дні тестової підписки ;)`).then(() => {
            bot.sendMessage(msgInfo.chat, `Ти з нами вперше - тому з чим тобі допомогти?`)
            //processRegisterUser(msgInfo);
        }).then(() => {
            cities.find().then(cities =>{
                console.log(cities)
                bot.sendMessage(msgInfo.chat,"Обери місто!",createKeyboardOpts(cities.map(city =>{
                    return {text: city.name, callback_data: "set_city_first:" + city.id}
                }),3))
            })
            //     api.request({
            //         "url": "cities", "method": "GET"
            //     }).then(cities => {
            //         bot.sendMessage(msgInfo.chat, "Обери своє місто!", createKeyboardOpts(cities.map(city => {
            //             return {text: city.name, callback_data: "set_city_first:" + city.id}
            //         }), 3))
            //     })
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

function typeOfApartments(reply,chat,msg){
    if(reply.includes("first")){


    }
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

function setCityForUser(answer, chat, msg) {
    if (answer.includes("first")) {
        api.request({
            "url": "regions", "method": "GET", "filters": {"city.id": answer.split(":")[1]}
        }).then(regions => {
            var keyboard = createKeyboardOpts(regions.map(region => {
                return {
                    text: region.name,
                    callback_data: "rg_first:" + region.id
                }
            }), 1, [{text: "Зберегти райони 💾", callback_data: "save_regions_first"}]);
            if (regions.length > 0) {
                bot.sendMessage(chat, "Обери свій район! (Можна декілька)", keyboard)
            } else {
                sendMainMenu(msg)
            }
        })
    }
}

bot.on('callback_query', (msg) => {
    console.log(msg)
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let msgInfo = getMainDataFromMsg(msg);
    let reply = msg.data;
    switch (reply){
        default:
            if(reply.includes("set_sity")){
                getUserByTelegramID(msg).then(user => {
                    return api.request({
                        "url": "users",
                        "method": "PUT",
                        "id": user.id,
                        body: {preferences: {city: reply.split(":")[1]}}
                    })
                })
            }


    }


})


bot.on('callback_query', (msg) => {
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let msgInfo = getMainDataFromMsg(msg);
    let reply = msg.data;

    switch (reply) {

    }
})