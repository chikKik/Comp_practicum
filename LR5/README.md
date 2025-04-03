# Лабораторная работа № 5
## Часть 1
1 способ:
```py
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import pytz

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()

        # Получаем текущее время в часовом поясе Санкт-Петербурга
        spb_tz = pytz.timezone("Europe/Moscow")
        current_time = datetime.now(spb_tz).strftime("%d.%m.%y %H:%M:%S")

        result = f"1149913, {current_time}"
        self.wfile.write(bytes(result, "utf-8"))

httpd = HTTPServer(('0.0.0.0', 8080), SimpleHTTPRequestHandler)
print('server is running ')
httpd.serve_forever()
```
2 способ:
```py
from flask import Flask
from datetime import datetime
import pytz

app = Flask(__name__)

@app.route('/')
def do_get():
    # Получаем текущее время в часовом поясе Санкт-Петербурга
    spb_tz = pytz.timezone("Europe/Moscow")
    current_time = datetime.now(spb_tz).strftime("%d.%m.%y %H:%M:%S")

    return f'1149913, {current_time}'

if __name__ == '__main__':
    app.run('0.0.0.0', 8080) # aka serve_forever()
```
## Часть 2.1
Flask
```py
from flask import Flask, render_template, request, jsonify, send_file
import json
import datetime

app = Flask(__name__)

data_file = "data.json"

def save_data(login, timestamp):
    entry = {"login": login, "timestamp": timestamp}
    try:
        with open(data_file, "r", encoding="utf-8") as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []

    data.append(entry)

    with open(data_file, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        login = request.form.get("login")
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if login:
            save_data(login, timestamp)
            return jsonify({"message": "Данные успешно сохранены!"})
        else:
            return jsonify({"error": "Введите логин!"}), 400

    return render_template("form.html")

@app.route("/logs", methods=["GET"])
def logs():
    try:
        return send_file(data_file, as_attachment=True, mimetype="application/json")
    except FileNotFoundError:
        return jsonify({"error": "Файл данных отсутствует!"}), 404

if __name__ == "__main__":
    app.run(debug=True)
```
html
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Форма ввода</title>
    <script>
        function setCurrentTime() {
            let now = new Date();
            let formattedTime = now.getFullYear() + '-' + 
                ('0' + (now.getMonth() + 1)).slice(-2) + '-' + 
                ('0' + now.getDate()).slice(-2) + ' ' + 
                ('0' + now.getHours()).slice(-2) + ':' + 
                ('0' + now.getMinutes()).slice(-2) + ':' + 
                ('0' + now.getSeconds()).slice(-2);
            document.getElementById("timestamp").value = formattedTime;
        }
        window.onload = setCurrentTime;

        function sendData(event) {
            event.preventDefault();
            let formData = new FormData(document.getElementById("dataForm"));

            fetch("/", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                let messageBox = document.getElementById("message");
                if (data.message) {
                    messageBox.innerHTML = `<p style="color:green;">${data.message}</p>`;
                } else if (data.error) {
                    messageBox.innerHTML = `<p style="color:red;">${data.error}</p>`;
                }
            })
            .catch(error => console.error("Ошибка:", error));
        }
    </script>
</head>
<body>
    <h2>Введите данные</h2>
    <form id="dataForm" onsubmit="sendData(event)">
        <label for="login">Логин в Moodle:</label>
        <input type="text" id="login" name="login" required><br><br>

        <label for="timestamp">Текущее время:</label>
        <input type="text" id="timestamp" name="timestamp" readonly><br><br>

        <button type="submit">Отправить</button>
    </form>
    <div id="message"></div>
    <br>
    <a href="/logs" target="_blank">Скачать JSON-файл</a>
</body>
</html>
```
## Часть 2.2
Python:
```py
from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import datetime
import urllib.parse

DATA_FILE = "data.json"

class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length).decode("utf-8")
            form_data = urllib.parse.parse_qs(post_data)

            login = form_data.get("login", [""])[0]
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            response = {}

            if login:
                self.save_data(login, timestamp)
                response["message"] = "Данные успешно сохранены!"
            else:
                response["error"] = "Введите логин!"

            self.send_response(200 if login else 400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))

        else:
            self.send_error(404, "Страница не найдена")

    def do_GET(self):
        if self.path == "/logs":
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as file:
                    data = file.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data.encode("utf-8"))
            except FileNotFoundError:
                self.send_error(404, "Файл данных отсутствует")
        else:
            super().do_GET()

    def save_data(self, login, timestamp):
        entry = {"login": login, "timestamp": timestamp}

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            data = []

        data.append(entry)

        with open(DATA_FILE, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=4)


def run(server_class=HTTPServer, handler_class=CustomHandler, port=8000):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Сервер запущен на порту {port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
```
html
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Форма ввода</title>
    <script>
        function setCurrentTime() {
            let now = new Date();
            let formattedTime = now.getFullYear() + '-' + 
                ('0' + (now.getMonth() + 1)).slice(-2) + '-' + 
                ('0' + now.getDate()).slice(-2) + ' ' + 
                ('0' + now.getHours()).slice(-2) + ':' + 
                ('0' + now.getMinutes()).slice(-2) + ':' + 
                ('0' + now.getSeconds()).slice(-2);
            document.getElementById("timestamp").value = formattedTime;
        }
        window.onload = setCurrentTime;

        function sendData(event) {
            event.preventDefault();
            let formData = new FormData(document.getElementById("dataForm"));

            fetch("/", {
                method: "POST",
                body: new URLSearchParams(formData)
            })
            .then(response => response.json())
            .then(data => {
                let messageBox = document.getElementById("message");
                if (data.message) {
                    messageBox.innerHTML = `<p style="color:green;">${data.message}</p>`;
                } else if (data.error) {
                    messageBox.innerHTML = `<p style="color:red;">${data.error}</p>`;
                }
            })
            .catch(error => console.error("Ошибка:", error));
        }
    </script>
</head>
<body>
    <h2>Введите данные</h2>
    <form id="dataForm" onsubmit="sendData(event)">
        <label for="login">Логин:</label>
        <input type="text" id="login" name="login" required><br><br>

        <label for="timestamp">Текущее время:</label>
        <input type="text" id="timestamp" name="timestamp" readonly><br><br>

        <button type="submit">Отправить</button>
    </form>
    <div id="message"></div>
    <br>
    <a href="/logs" target="_blank">Открыть JSON-файл</a>
</body>
</html>
```
