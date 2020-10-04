# TWITTER MEMES BOT
<img src="https://github.com/cestoliv/twitter_memes_bot/raw/main/res/logo/logo.png" align="right"
     alt="Twitter Memes Bot logo" width="250" height="250">
     
**TWITTER MEMES_BOT** is a Twitter bot that you can ask for a meme (by private messages or by mentioning it)

## Installation
You will need a developer account on Twitter: **create a Twitter app**
![Twitter apps](https://github.com/cestoliv/twitter_memes_bot/raw/main/res/screens/twitter_apps_overview.png)
**change it's permission**
![Twitter app permissions](https://github.com/cestoliv/twitter_memes_bot/raw/main/res/screens/twitter_apps_permissions.png)
**and create a development environment**
![Twitter development environment](https://github.com/cestoliv/twitter_memes_bot/raw/main/res/screens/twitter_dev_environnement.png)

**clone repository:**

    git clone https://github.com/cestoliv/twitter_memes_bot.git
    cd twitter_memes_bot

### Twitter Bot

Requirement : **nodejs and npm**
Installation of required packages:

	npm install

### Memes management

Requirement : **python 3.x**
Installation of required packages:

	pip install -r requirements.txt
	--OR--
	python3 -m pip install -r requirements.txt

## Configuration
Edit **.env**:
- NODE_ENV=production --OR-- debug
- TWITTER_CONSUMER_KEY = Twitter API key
- TWITTER_CONSUMER_SECRET = Twitter API secret
- TWITTER_ACCESS_TOKEN = Twitter Acsess token
- TWITTER_ACCESS_TOKEN_SECRET = Twitter Access Secret
- TWITTER_WEBHOOK_ENV= Twitter Dev environment label
- PREFIX = prefix

You will find the tokens of your Twitter application in its settings.
![Twitter apps token](https://github.com/cestoliv/twitter_memes_bot/raw/main/res/screens/twitter_apps_tokens.png)

## Use
### Twitter Bot
You will need to run `python memes.py` a first time to create the database (you can then exit the program)

    npm start

*You can use twitter_memes_bot.service to start the bot as a systemd service.*

    sed -i "s?^WorkingDirectory=.*?WorkingDirectory=$(pwd)?g" twitter_memes_bot.service

    cp twitter_memes_bot.service /etc/systemd/system/twitter_memes_bot.service

    sudo systemctl start twitter_memes_bot

### Memes management
	
	python memes.py

To add new memes, add the images in the `memes` folder, launch the program, choose `add` then follow the instructions.

## Troubleshooting

### I have "No meme found ..." every time ...
You must launch

    rm db/Memes.db
    python memes.py
to create (or recreate) the database (you can exit immediately after)

### sqlite3.OperationalError: no such table: Memes
You must launch

    rm db/Memes.db
    python memes.py
to create (or recreate) the database (you can exit immediately after)