from flask import Flask, request, jsonify, render_template_string
from cryptography.hazmat.primitives import padding, hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

app = Flask(__name__)


def generate_key():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    return private_key, public_key

def encrypt(text, public_key):
    encrypted = public_key.encrypt(
        text.encode('utf-8'),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return encrypted

def decrypt(encrypted_text, private_key):# Расшифровка
    decrypted = private_key.decrypt(
        encrypted_text,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return decrypted.decode('utf-8')


private_key, public_key = generate_key()# Генерация ключей

@app.route('/')
def index():
    HTML_FORM = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ассиметричное шифрование</title>
    </head>
    <body>
        <h2>Шифрование и дешифровка</h2>
        <form action="/encrypt" method="post">
                <h3>Введите текст для шифрования:</h3>
                <textarea name="text_to_encrypt" rows="1" cols="50"></textarea><br><br>
                <input type="submit" value="Зашифровать">
        </form>
        <form action="/decypher" method="post">
                <h3>Введите зашифрованный текст для дешифровки:</h3>
                <textarea name="text_to_decrypt" rows="1" cols="50"></textarea><br><br>
                <input type="submit" value="Расшифровать">
        </form>
    </body>
    </html>
    '''


    return render_template_string(HTML_FORM)


@app.route('/encrypt', methods=['POST'])
def encrypt():
    text = request.form.get('text_to_encrypt')
    if not text:
        return jsonify({"error": "Введите текст для шифрования"}), 400
    
    encrypted_data = encrypt(text, public_key)

    return jsonify({"encrypted_data": encrypted_data.hex()})


@app.route('/decrypt', methods=['POST'])
def decypher():
    encrypted_data_hex = request.form.get('text_to_decrypt')
    if not encrypted_data_hex:
        return jsonify({"error": "Введите зашифрованный текст для расшифровки"}), 400

    encrypted_data = bytes.fromhex(encrypted_data_hex)

    decrypted_data = decrypt(encrypted_data, private_key)

    return jsonify({"decrypted_data": decrypted_data})


@app.route('/login', methods=['GET'])
def login():
    return jsonify({"author": "1149913"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)