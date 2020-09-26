# TWITTER MEMES BOT
**TWITTER MEMES_BOT** is a Twitter bot that you can ask for a meme (by private messages or by mentioning it)

## Installation
You will need a developer account on Twitter: create a Twitter app and development environment

clone repository:

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

## Use
### Twitter Bot

    npm start

*You can use twitter_memes_bot.service to start the bot as a systemd service.*

### Memes management
	
	python memes.py