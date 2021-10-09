require('dotenv').config({path: __dirname + '/.env'})

const TelegramBot = require('node-telegram-bot-api');
const token_tg = process.env.TELEGRAM_TOKEN;
const ADMIN_CHAT = -1001589426879;
const bot = new TelegramBot(token_tg, {polling: true});
const MANAGER_CHAT = -1001339183887;
const apiTests = require('./api/Api');
let ap = new apiTests()
const {getMainDataFromMsg, createApartmentsMessage} = require("./utils/TelegramUtils")
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
        // let key = msg.text.replace("/start", '').trim();
        // let password = passgen.create(20);

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
    console.log(apiTest[0])
    bot.sendMessage(msgInfo.chat, createApartmentsMessage(apiTest[0]))
    getUserByTelegramID(msg).then(async user => {
        /*if (user.subscription.name.includes("Тест")) {
            setTimeout( () => {
                    bot.sendMessage(user.telegram_id, "Дякую, що ти з нами! РУМС БОТ допоможе тобі знайти квартиру без комісії!" + "\n" +
                        "Ми взагалі продаємо підписку на наш БОТ щоб ти міг отримувати більше квартир. " +
                        "Але зараз ми даємо тобі \n" +
                        "1 ТЕСТОВИЙ ДЕНЬ щоб познайомитись з нашим сервісом!\nПід час тесту - ти можеш отримувати лише по 10 квартир на день" +
                        "\n" +
                        "Хочеш отримати платну підписку з більшою кількістю об'єктів? Придбай тут https://roomsua.me/#/tarrifs")
                }
                ,5000)
        }*/
        if (user.messaging_history) {
            if (user.messaging_history.todayCompilation) {
                if (user.messaging_history.todayCompilation.length > 0) {
                    if (user.messaging_history.lastViewed === "none") {
                        sendApartment(user, user.messaging_history.todayCompilation[0])
                        user.messaging_history.lastViewed = user.messaging_history.todayCompilation[0];
                        api.request({
                            "url": "users",
                            "method": "PUT",
                            "id": user.id,
                            body: {messaging_history: user.messaging_history}
                        })
                    } else {
                        sendApartment(user, user.messaging_history.lastViewed)
                    }
                } else {
                    await getFreshApartmentsByUser(user, user.subscription.apartments_amount, 0, []).then(apartments => {
                        if (apartments.length > 0) {
                            user.messaging_history.todayCompilation = apartments.map(apart => apart.id);
                            user.messaging_history.viewed = user.messaging_history.viewed.concat(user.messaging_history.todayCompilation);
                            user.messaging_history.lastViewed = user.messaging_history.todayCompilation[0];
                            user.days_of_subscription -= 1;
                            if (user.subscription.name !== "Вічна підписка") {
                                api.request({
                                    "url": "users",
                                    "method": "PUT",
                                    "id": user.id,
                                    body: {messaging_history: user.messaging_history}
                                })
                            } else {
                                api.request({
                                    "url": "users",
                                    "method": "PUT",
                                    "id": user.id,
                                    body: {
                                        messaging_history: user.messaging_history,
                                        days_of_subscription: user.days_of_subscription
                                    }
                                })
                            }
                            try {
                                sendApartment(user, user.messaging_history.todayCompilation[0])
                            } catch (e) {

                            }
                            try {
                                createTelegraphPage(apartments.slice(0, 10).map(apartment => {
                                    return createApartmentsPartTelegraph(apartment)
                                }), user).then(compilation => {
                                    console.log(compilation);
                                    bot.sendMessage(user.telegram_id, `Ми тут для Тебе дещо приготували! [Клац 😏](${compilation.url})`, {parse_mode: "Markdown"})
                                })
                            } catch (e) {

                            }
                        } else {
                            console.log("Не знайдено квартири по фільтрам")
                            bot.sendMessage(user.telegram_id, "На жаль зараз відсутні нові об'єкти по твоїм фільтрам - але не сумуй, ти можеш змінити параметри пошуку, та спробувати ще раз!\nПридбай персональний підбір, і це пришвидшить пошук у рази! Деталі за посиланням https://roomsua.me/#/personal")
                        }
                    })

                }

            }
        }

    })
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
            "lastName": msgInfo.last_name
        }
    })
}

function sendGreetingMessage(msgInfo) {
    const cities = require('./cities.json')
    setTimeout(() => {
        bot.sendMessage(msgInfo.chat, `Ти з нами вперше - тому з чим тобі допомогти?`)
            .then(() => {
                bot.sendMessage(msgInfo.chat, "Обери місто!", createKeyboardOpts(cities.map(city => {
                    return {text: city.name, callback_data: "set_city_regions:" + city.id}
                }), 3,))
                /* ap.request({
                     "url": "cities",
                     "method": "GET"
                 }).then(cities => {
                     bot.sendMessage(msgInfo.chat, "Обери своє місто!", createKeyboardOpts(cities.map(city => {
                         return {text: city.name, callback_data: "set_city_first:" + city.id}
                     }), 3))
                 })*/
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
                        text: 'Оренда',
                        callback_data: 'rent'
                    },
                    {
                        text: 'Купівля',
                        callback_data: 'buy'
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
    bot.sendMessage(chat, "Обери кількість кімнат:", roomsAmount)
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

        bot.sendMessage(chat, "Обери свій район! (Можна декілька)", keyboard)
    })


}

function setMetro(reply, chat, msg) {
    const metroFile = require('./metro-kyiv.json');
    let keyboardEnd = [];
    let keyboard = [];
    getUserByTelegramID(msg).then(user => {
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
    }).then(() => {
        keyboard = keyboard.filter((v, i, a) => a.findIndex(t => (t.text === v.text && t.callback_data === v.callback_data)) === i)
        keyboardEnd = createKeyboardOpts(keyboard, 1, [{text: "Зберегти станції 💾", callback_data: "save_metro"}])
        console.log(keyboard)
        bot.sendMessage(chat, "Обери станції! 🚝 (Можна декілька)", keyboardEnd)

    })

}

function selectRegionKeyboard(msg, reply, chat) {
    getUserByTelegramID(msg).then(user => {
        let userClickData = reply.split(":")[1]
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

//TODO Выбор квартир как метро
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
            console.log("СОДЕРЖИТ")
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
        console.log(user)
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

bot.onText(/pay/i, function (msg) {
    let iKeys = [];
    iKeys.push([{
        text: "2 €",
        callback_data: "pay:2.00"
    },{
        text: "10 €",
        callback_data: "pay:10.00"
    }]);

    bot.sendMessage(msg.chat.id, "Виберіть свій тариф", {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: iKeys
        }
    });
});


bot.on('message', function (message) {
    if (message.successful_payment != undefined) {
        var savedPayload = "yyy";	// get from db
        var savedStatus = "zzz";	// get from db, this should be "WAIT"
        if ((savedPayload != message.successful_payment.invoice_payload) || (savedStatus != "WAIT")) {	// match saved data to payment data received
            bot.sendMessage(message.chat.id, "Payment verification failed");
            return;
        }

        // payment successfull
        bot.sendMessage(message.chat.id, "Payment complete!");
    }
});

/*bot.onText(/\/pay/, (msg) => {
    let prices = [
        {label: '1', amount: 134 * 100},
        {label: '2', amount: 154 * 100}
    ]
    bot.sendInvoice(msg.chat.id, "TEST", "Lorem ipsum isefif hello? Let`s go lal lal ",
        `${msg.chat.id}_${Number(new Date())}`, TRANZZO_TOKEN, 'get_access', 'UAH',prices, {
            parse_mode: "Markdown",
            reply_markup: JSON.stringify({
                resize_keyboard: true,
                inline_keyboard: [
                    [{
                        text: 'На 7 днів - 199 грн',
                        callback_data: 'YES'
                    }], [{text: 'На 14 днів 299 грн', callback_data: 'YES'}], [{
                        text: 'На 30 днів - 499 грн',
                        callback_data: 'YES'
                    }]
                ]
            })
        })
})*/

bot.on('callback_query', (msg) => {
    // console.log(msg)
    let chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
    let msgInfo = getMainDataFromMsg(msg)
    let reply = msg.data;
    const highPriceOpts = prepareHighPriceOpts(msg);
    const lowPriceOpts = prepareLowPriceOpts(msg);

    switch (reply) {
        case "buy": {
            const opts = prepareRentOrBuy(msg)
            bot.deleteMessage(chat, msg.message.message_id);
            bot.sendMessage(chat, 'На жаль ця функція не працює 😥 \nМи повидомимо коли буде можливість купувати квартири\n Оберіть інший варіант', opts)
        }
            break;
        case "YES": {
            setTimeout(() => {
                bot.deleteMessage(chat, msg.message.message_id);
                bot.sendMessage(chat, 'Домовились, ти матимеш доступ до квартир без комісії та ріелторів 24/7, я перевірю документи власника всіх квартир, які тобі сподобаються, і надішлю тобі якісний договір оренди\n\n\n\n ТУТ ОПЛАТА УЖЕ БУДЕТ', {
                    parse_mode: "Markdown",
                    reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        inline_keyboard: [[{
                            text: 'На 7 днів - 199 грн',
                            callback_data: 'YES'
                        }], [{text: 'На 14 днів 299 грн', callback_data: 'YES'}], [{
                            text: 'На 30 днів - 499 грн',
                            callback_data: 'YES'
                        }]]
                    })
                })
            }, 5000)
            sendRandomApartment(msg)
        }
            break;
        case "rent": {
            getUserByTelegramID(msg).then(user => {
                user.rent = true;
                return ap.request({
                    "url": "user/updateById/" + user.id,
                    "method": "PUT",
                    body: user
                })
            })
            setTimeout(() => {
                bot.deleteMessage(chat, msg.message.message_id);
                bot.sendMessage(chat, 'Давай визначимо твій бюджет \nВибери мінімальний рівень', lowPriceOpts)
            }, 5000)
            sendRandomApartment(msg)
        }
            break;
        case "save_regions" : {
            setTimeout(() => {
                bot.deleteMessage(chat, msg.message.message_id);
                setMetro(reply, chat, msg)
            }, 5000)
            sendRandomApartment(msg)
        }
            break;
        case "save_metro" : {
            bot.deleteMessage(chat, msg.message.message_id);
            bot.sendMessage(chat, 'Все я розібрався, яка тобі потрібна квартира. В мене зараз їх 120 шт.\n' +
                'І щодня з’являються ще по 3 свіженьких.\n' +
                '\n' +
                '\n' +
                'Показати їх?', {
                parse_mode: "Markdown",
                reply_markup: JSON.stringify({
                    resize_keyboard: true,
                    inline_keyboard: [[{text: 'ТАК!', callback_data: 'YES'}]]
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
                    bot.deleteMessage(chat, msg.message.message_id);
                    setRegions(reply, chat, msg);
                }, 5000)
                sendRandomApartment(msg)
            })
        }
            break;
        default:
            if (reply.includes("set_city")) {
                getUserByTelegramID(msg).then(user => {
                    user.city = (reply.split(':'))[1]
                    return ap.request({
                        "url": "user/updateById/" + user.id,
                        "method": "PUT",
                        body: user
                    })
                }).then(() => {
                    const opts = prepareRentOrBuy(msg)
                    bot.deleteMessage(chat, msg.message.message_id);
                    bot.sendMessage(chat, "Що шукаєте?", opts)
                })

            } else if(reply.includes("pay:")){
                let param = reply.split(":")[1];
                    let payload = msg.chat.id + Date.now() + param;
                    let prices = [{
                        label: "Donation",
                        amount: parseInt(param.replace(".", ""))
                    }];
                    bot.sendInvoice(msg.chat.id, "Donation", "Donation of " + param + "€", payload, TRANZZO_TOKEN, "pay", "EUR", prices);
            } else if (reply.includes("price_low:")) {
                getUserByTelegramID(msg).then(user => {
                    user.priceMin = (reply.split(':'))[1]
                    return ap.request({
                        "url": "user/updateById/" + user.id,
                        "method": "PUT",
                        body: user
                    })
                }).then(() => {
                    bot.deleteMessage(chat, msg.message.message_id);
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
                        bot.deleteMessage(chat, msg.message.message_id);
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
                    bot.deleteMessage(chat, msg.message.message_id);
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
                        bot.deleteMessage(chat, msg.message.message_id);
                        setRegions(reply, chat, msg);
                    }, 5000)
                    sendRandomApartment(msg)
                })
            } /*else if (reply.includes("rooms")) {
                //TODO Put to user room
                selectRooms(msg, reply, chat)
            } */ else if (reply.includes("apartments")) {
                //TODO Put to user apart
                /*getUserByTelegramID(msg).then(user => {
                    /!*return api.request({
                        "url": "users",
                        "method": "PUT",
                        "id": user.id,
                        body: {preferences: {city: reply.split(":")[1]}}
                    })*!/
                })*/
            } else if (reply.includes("rooms")) {
                selectRoomsKeyboard(msg, reply, chat)
            } else if (reply.includes("rg")) {
                selectRegionKeyboard(msg, reply, chat);
            } else if (reply.includes("set_metro_first")) {
                selectMetroKeyboard(msg, reply, chat);
            }
    }
})

