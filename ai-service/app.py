import numpy as np
import tensorflow as tf
from PIL import Image
import requests
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

# --- 1. INITIALIZATION ---

# Initialize Flask app
app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for our API

# Load the mock nutrition database
print("Loading nutrition data...")
with open('nutrition_data.json', 'r') as f:
    nutrition_data = json.load(f)
print("Nutrition data loaded.")

# Load the pre-trained model
print("Loading MobileNetV2 model...")
model = tf.keras.applications.MobileNetV2(weights='imagenet')
print("Model loaded successfully.")

TARGET_SIZE = (224, 224)


# --- 2. HELPER FUNCTIONS ---

def preprocess_image(image):
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(TARGET_SIZE)
    image_array = tf.keras.preprocessing.image.img_to_array(image)
    image_array = np.expand_dims(image_array, axis=0)
    return tf.keras.applications.mobilenet_v2.preprocess_input(image_array)

def predict_food(image_array):
    predictions = model.predict(image_array)
    decoded_predictions = tf.keras.applications.mobilenet_v2.decode_predictions(predictions, top=1)[0]
    top_prediction = decoded_predictions[0]
    return {
        "label": top_prediction[1],
        "probability": float(top_prediction[2])
    }

# --- 3. API ENDPOINT DEFINITION ---

# Define the '/predict' endpoint, which accepts POST requests
@app.route('/predict', methods=['POST'])
def handle_prediction():
    # 3a. Get the image URL from the incoming JSON request
    data = request.get_json()
    if not data or 'image_url' not in data:
        return jsonify({"error": "Missing 'image_url' in request body"}), 400
    
    image_url = data['image_url']
    
    try:
        # 3b. Download and process the image
        response = requests.get(image_url)
        # Ensure the request was successful
        response.raise_for_status() 
        img = Image.open(BytesIO(response.content))
        
        # 3c. Preprocess and predict
        preprocessed_img = preprocess_image(img)
        prediction_result = predict_food(preprocessed_img)
        
        # 3d. Look up nutritional information
        food_label = prediction_result['label']
        nutritional_info = nutrition_data.get(food_label.lower(), nutrition_data['default'])
        
        # 3e. Combine results and send response
        final_result = {
            "prediction": prediction_result,
            "nutrition": nutritional_info
        }
        return jsonify(final_result)
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to download image from URL: {e}"}), 400
    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# --- 4. START THE SERVER ---

# This block allows us to run the app directly with `python app.py`
if __name__ == '__main__':
    # We will run the server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)