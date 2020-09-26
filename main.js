const { Autohook } = require('twitter-autohook')
const util = require('util');
const request = require('request');
var accents = require('remove-accents');
const post = util.promisify(request.post);
const get = util.promisify(request.get);
const sqlite3 = require('sqlite3').verbose();
const Twit = require("twit")
const fs = require("fs")
require('dotenv').config();

let db = new sqlite3.Database('db/Memes.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

const T = new Twit(oAuthConfig)

var botInfos = {}

dlog = (obg) => {
    if(process.env.NODE_ENV == "debug") {
        console.log(obg)
    }
} 

get_memes = (query) => {
    return new Promise((resolve, reject) => {
        query_split = query.split(" ")

        let get_promises = []
        let get_results = []

        for(i = 0; i < query_split.length; i++) {
            get_promises.push(new Promise((resolve, reject) => {
                word = accents.remove(query_split[i])
                db.get("SELECT * FROM Memes WHERE keywords LIKE '%'||?||'%'", [word], (err, row) => {
                    if (err) {
                        console.error(err.message)
                    }
                    if(row && row != undefined) {
                        get_results.push(row)
                    }
                    resolve()        
                })
            }))
        }

        Promise.all(get_promises).then(() => {
            if(get_results.length == 0) {
                resolve([])
            }
            else {
                // elimination of duplicates
                get_results_cleaned = get_results.filter((v,i,a)=>a.findIndex(t=>(t["file_name"] === v["file_name"]))===i)
                
                // add score to each result
                get_results_noted = []
                for(rst = 0; rst < get_results_cleaned.length; rst++) {
                    meme_file = get_results_cleaned[rst].file_name
                    keywords = get_results_cleaned[rst].keywords.split(",")

                    /*
                        for each keyword which corresponds to that of the meme, 
                        we add ont point to the meme
                    */

                    meme_score = 0

                    for(wrd = 0; wrd < query_split.length; wrd++) {
                        word = accents.remove(query_split[wrd])

                        for(kwd = 0; kwd < keywords.length; kwd++) {
                            keyword = accents.remove(keywords[kwd])

                            if(keyword.includes(word)) {
                                meme_score++
                            }
                        }
                    }

                    get_results_noted.push({
                        file_name: meme_file,
                        keywords: get_results_cleaned[rst].keywords,
                        score: meme_score
                    })
                }

                // order by score
                get_results_noted.sort((a,b) => {
                    return b.score - a.score
                })

                resolve(get_results_noted)
            }
        })
    })
};

upload_image = (file_name) => {
    return new Promise((resolve, reject) => {
        fs.readFile(file_name, {encoding: 'base64'}, ((err, base64_image) => {
            if(err) {
                dlog(err)
                reject(err)
            }
            else {
                T.post('media/upload', { media_data: base64_image }, (err, data, response) => {
                    if(err) {
                        dlog(err)
                        reject(err)
                    }
                    else {
                        resolve(data)
                    }
                })
            }
        }))
    })    
};

reply_to_direct_message = (text, sender_id, image_id=undefined) => {
    return new Promise((resolve, reject) => {
        const answerConfig = {
            url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
            oauth: oAuthConfig,
            json: {
                event: {
                    type: 'message_create',
                    message_create: {
                        target: {
                            recipient_id: sender_id,
                        },
                        message_data: {
                            text: text,
                        },
                    },
                },
            },
        }

        if(image_id) {
            attachment = {
                type: "media",
                media: {
                    id: image_id
                }
            }
            answerConfig.json.event.message_create.message_data.attachment = attachment
        }
        

        post(answerConfig).then((response) => {
            resolve(response)
        }).catch((err) => {
            dlog(err)
            reject(err)
        })
    })
};

reply_to_tweet = (text, tweet_id, media_ids=undefined) => {
    return new Promise((resolve, reject) => {
        const answerConfig = {
            url: 'https://api.twitter.com/1.1/statuses/update.json',
            oauth: oAuthConfig,
            form: {
                status: text,
                in_reply_to_status_id: tweet_id,
                media_ids: "",
                auto_populate_reply_metadata: true
            },
        }

        if(media_ids) {
            answerConfig.form.media_ids = media_ids
        }

        post(answerConfig).then((response) => {
            resolve(response)
        }).catch((err) => {
            dlog(err)
            reject(err)
        })
    })
}

get_bot_infos = () => {
    return new Promise((resolve, reject) => {
        const userConfig = {
            url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
            oauth: oAuthConfig,
            json: true
        }

        get(userConfig).then((response) => {
            resolve(response)
        }).catch((err) => {
            dlog(err)
            reject(err)
        })
    })
}

get_bot_infos().then((infos) => {
    botInfos = infos.body
});

(async start => {
  try {
        const webhook = new Autohook();
        
        // Removes existing webhooks
        webhook.on('event', async event => {
        // Don't worry, we'll start adding something more meaningful
        // in just a moment.
        if (event.direct_message_events) {
            const message = event.direct_message_events.shift()

            // We check that the message is valid
            if (typeof message === 'undefined' || typeof message.message_create === 'undefined') {
                return;
            }
        
            // We filter out message you send, to avoid an infinite loop
            if (message.message_create.sender_id === message.message_create.target.recipient_id) {
                return;
            }

            message_text = message.message_create.message_data.text

            // Check if prefix
            if(process.env.PREFIX && !message_text.startsWith(process.env.PREFIX)) {
                return;
            }

            // remove PREFIX from message
            message_text = message_text.substr(process.env.PREFIX.length).trim()

            // GET MEME
            get_memes(message_text).then((founded_memes) => {
                if(founded_memes.length > 0) {
                    upload_image("memes/" + founded_memes[0]["file_name"]).then((image_data) => {
                        reply_to_direct_message("", message.message_create.sender_id, image_data.media_id_string)
                    })
                }
                else {
                    reply_to_direct_message("No meme found...", message.message_create.sender_id)
                }
            })
        }
        else if (event.tweet_create_events) {
            const tweet = event.tweet_create_events.shift()

            // We check that the tweet is valid
            if (typeof tweet === 'undefined') {
                return;
            }

            // We filter out message you send, to avoid an infinite loop
            if (tweet.user.id === botInfos.id) {
                return;
            }

            tweet_text = tweet.text

            // remove mentions
            tweet_text = tweet_text.replace(/@.+?\s/g, "").trim()

            // check prefix
            if(process.env.PREFIX && !tweet_text.startsWith(process.env.PREFIX)) {
                return;
            }

            // remove prefix
            tweet_text = tweet_text.substr(process.env.PREFIX.length).trim()

            // GET MEME
            get_memes(tweet_text).then((founded_memes) => {
                if(founded_memes.length > 0) {
                    upload_image("memes/" + founded_memes[0]["file_name"]).then((image_data) => {
                        reply_to_tweet("", tweet.id_str, image_data.media_id_string)
                    })
                }
                else {
                    reply_to_tweet("No meme found...", tweet.id_str)
                }
            })
        }
    });

    await webhook.removeWebhooks();
    
    // Starts a server and adds a new webhook
    await webhook.start();
    
    // Subscribes to your own user's activity
    await webhook.subscribe({oauth_token: process.env.TWITTER_ACCESS_TOKEN, oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET});  
  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();  