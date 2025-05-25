## Создание бота-переводчика для Telegram с использованием Cloud Functions и API Gateway.
--------
API: https://api.mymemory.translated.net/get</br>
main.py
```py
import telebot
import requests
import json

API_TOKEN = ''
bot = telebot.TeleBot(API_TOKEN)
def translate(text):
    url = "https://api.mymemory.translated.net/get"
    params = {
        'q': text,
        'langpair': 'ru|en'
    }
    
    response = requests.get(url, params=params)
    translation = response.json()
    return translation['responseData']['translatedText']

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, """\
Это бот-переводчик с русского языка на английский язык.\
""")

@bot.message_handler(commands=['help'])
def send_help(message):
    bot.reply_to(message, """\
Нпишите любой текст на русском языке, он будет переведен на английский\
""")

@bot.message_handler(func=lambda message: True)
def echo_message(message):
    bot.reply_to(message, translate(message.text))

def handler(event, context):
    message = telebot.types.Update.de_json(event['body'])
    bot.process_new_updates([message])
    return {
         'statusCode': 200,
         'body': 'Hello World!',
    }
```
requirements.txt
```
pyTelegramBotAPI
requests
```
![repo_1_cp](https://github.com/user-attachments/assets/c9dc3865-24be-4104-8b37-f7e16ed5d56f)

## API gateway

```
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
servers:
- url: https://d5dqpghsldljfvhqa669.ql6wied2.apigw.yandexcloud.net
paths:
  /:
    post:
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: d4eoicoe1hruf0fvc64b
      operationId: tgbot
```
![repo_2_cp](https://github.com/user-attachments/assets/f920d87e-7f80-42c7-9db7-961b338077ea)

## Webhook

```
curl.exe `
   --request POST `
   --url https://api.telegram.org/bot7869222659:AAG5A7d7ymBnJpsy2kAQHhZvZZEMEsZo9zs/setWebhook `
   --header '"Content-type: application/json"' `
   --data '"{ \"url\": \"https://d5dqpghsldljfvhqa669.ql6wied2.apigw.yandexcloud.net\" }"'
```
<img width="715" alt="repo_4_cp" src="https://github.com/user-attachments/assets/9327c0d5-138e-4209-a18b-36864cf75e0e" />

## ник Telegram-бота
```
@Translate_comp_practicum_bot
```
<img width="666" alt="repo_3_cp" src="https://github.com/user-attachments/assets/08bbca6f-ee92-4122-ac0b-ed7d46d1fc02" />
