from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util

# Initialize Flask app
app = Flask(__name__)
# Enable CORS to allow requests from our frontend
CORS(app)

# Load a pre-trained model. This is done once when the server starts.
print("Loading sentence-transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    try:
        data = request.get_json()
        job_description = data.get('job_description')
        resume_text = data.get('resume_text')

        if not job_description or not resume_text:
            return jsonify({'error': 'Missing job_description or resume_text'}), 400

        # Encode the texts into numerical vectors (embeddings)
        jd_embedding = model.encode(job_description, convert_to_tensor=True)
        resume_embedding = model.encode(resume_text, convert_to_tensor=True)

        # Calculate the cosine similarity score
        cosine_score = util.pytorch_cos_sim(jd_embedding, resume_embedding)

        # Extract the score as a number and format it
        score = round(cosine_score.item() * 100, 2)
        
        return jsonify({'match_score': score})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to process request'}), 500

if __name__ == '__main__':
    # We run on port 5001 to avoid conflicts with other services
    app.run(host='0.0.0.0', port=5001, debug=True)