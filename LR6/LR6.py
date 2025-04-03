from flask import Flask, request, jsonify, render_template_string
from PIL import Image
import io

app = Flask(__name__)

HTML_FORM = '''
<!DOCTYPE html>
<html>
<head>
    <title>Upload Image</title>
    <script>
        function previewImage(event) {
            var reader = new FileReader();
            reader.onload = function(){
                var output = document.getElementById('thumbnail');
                output.src = reader.result;
                output.style.display = 'block';
            }
            reader.readAsDataURL(event.target.files[0]);
        }
    </script>
</head>
<body>
    <h2>Upload PNG Image</h2>
    <form action="/size2json" method="post" enctype="multipart/form-data">
        <input type="file" name="image" accept="image/png" required onchange="previewImage(event)">
        <button type="submit">Upload</button>
    </form>
    <br>
    <img id="thumbnail" src="#" alt="Image preview" style="display:none; max-width: 200px; max-height: 200px; border: 1px solid #ddd;">
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_FORM)

@app.route('/size2json', methods=['POST'])
def size2json():
    if 'image' not in request.files:
        return jsonify({"result": "no file provided"}), 400
    
    file = request.files['image']
    
    if file.filename == '' or not file.filename.lower().endswith('.png'):
        return jsonify({"result": "invalid filetype"}), 400
    
    try:
        image = Image.open(io.BytesIO(file.read()))
        width, height = image.size
        return jsonify({"width": width, "height": height}), 200
    except Exception as e:
        return jsonify({"result": "error processing image"}), 500

@app.route('/login', methods=['GET'])
def login():
    return jsonify({"author": "1149913"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
