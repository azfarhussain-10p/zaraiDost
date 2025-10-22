# ML Package - Machine Learning Components

Python-based machine learning models and training pipelines for Zarai Dost crop disease detection and prediction.

## Overview

This package contains TensorFlow/PyTorch models for crop disease detection, pest identification, nutrient deficiency analysis, and yield prediction. Models are optimized for mobile deployment using TensorFlow Lite.

## Features

- **Disease Detection**: Identify 50+ crop diseases from images
- **Pest Identification**: Detect and classify common agricultural pests
- **Nutrient Deficiency**: Analyze crop images for nutrient deficiencies
- **Yield Prediction**: Predict crop yields based on various factors
- **Model Optimization**: Convert models to TensorFlow Lite for mobile
- **Data Augmentation**: Synthetic data generation for underrepresented classes
- **Transfer Learning**: Fine-tune pretrained models on agricultural datasets
- **Model Evaluation**: Comprehensive benchmarking and validation

## Tech Stack

- **Deep Learning**: TensorFlow 2.15+, PyTorch 2.0+
- **Computer Vision**: OpenCV, Pillow, scikit-image
- **Data Processing**: NumPy, Pandas
- **Model Optimization**: TensorFlow Lite, ONNX
- **Experiment Tracking**: Weights & Biases, MLflow
- **Training**: Google Colab, AWS SageMaker

## Prerequisites

- Python >= 3.9
- CUDA 11.8+ (for GPU training)
- At least 16GB RAM (32GB recommended)
- 50GB+ storage for datasets

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# For GPU support
pip install -r requirements-gpu.txt
```

## Project Structure

```
ml/
├── models/                    # Trained models
│   ├── crop-disease.tflite
│   ├── pest-detection.tflite
│   ├── nutrient-deficiency.tflite
│   └── checkpoints/
├── training/                  # Training scripts
│   ├── train_disease_model.py
│   ├── train_pest_model.py
│   └── config/
├── inference/                 # Inference service
│   ├── app.py                # Flask API
│   ├── predict.py
│   └── utils.py
├── data/                     # Dataset management
│   ├── raw/                  # Raw images (gitignored)
│   ├── processed/            # Preprocessed data
│   ├── augmented/            # Augmented images
│   └── scripts/
│       ├── download.py
│       ├── preprocess.py
│       └── augment.py
├── notebooks/                # Jupyter notebooks
│   ├── exploratory/
│   ├── training/
│   └── evaluation/
├── tests/
├── requirements.txt
├── requirements-gpu.txt
├── Dockerfile
└── README.md
```

## Quick Start

### Download Dataset

```bash
# Download PlantVillage and custom Pakistani crop dataset
python data/scripts/download.py --dataset all --output data/raw/

# Preprocess images
python data/scripts/preprocess.py --input data/raw/ --output data/processed/
```

### Train Model

```bash
# Train disease detection model
python training/train_disease_model.py \
  --data-dir data/processed/disease/ \
  --epochs 50 \
  --batch-size 32 \
  --model-arch efficientnet_b3 \
  --output models/checkpoints/disease_v1/

# Train with GPU
python training/train_disease_model.py --gpu 0
```

### Convert to TensorFlow Lite

```bash
# Convert for mobile deployment
python training/convert_to_tflite.py \
  --model models/checkpoints/disease_v1/model.h5 \
  --output models/crop-disease.tflite \
  --quantize int8  # 8-bit quantization for smaller size
```

### Run Inference API

```bash
# Start Flask server
python inference/app.py

# Test API
curl -X POST http://localhost:5000/predict \
  -F "image=@test_image.jpg" \
  -F "model=disease"
```

## Training Details

### Disease Detection Model

- **Architecture**: EfficientNet-B3 (transfer learning)
- **Input Size**: 224x224 RGB
- **Classes**: 50+ diseases across wheat, rice, cotton, corn
- **Dataset**: 100K+ images (PlantVillage + custom)
- **Accuracy**: 92% on validation set
- **Model Size**: 12MB (TFLite), 45MB (full)

### Training Configuration

```python
# training/config/disease_config.yaml
model:
  architecture: efficientnet_b3
  input_shape: [224, 224, 3]
  num_classes: 54
  pretrained_weights: imagenet

training:
  epochs: 50
  batch_size: 32
  learning_rate: 0.001
  optimizer: adam
  loss: categorical_crossentropy

data_augmentation:
  rotation_range: 20
  width_shift_range: 0.2
  height_shift_range: 0.2
  horizontal_flip: true
  vertical_flip: false
  zoom_range: 0.2
```

### Custom Training

```python
# training/train_disease_model.py
from tensorflow import keras
from training.models import create_disease_model
from training.data import create_data_generators

# Create model
model = create_disease_model(
    architecture='efficientnet_b3',
    num_classes=54,
    input_shape=(224, 224, 3)
)

# Prepare data
train_gen, val_gen = create_data_generators(
    data_dir='data/processed/disease',
    batch_size=32,
    augment=True
)

# Train
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=50,
    callbacks=[
        keras.callbacks.ModelCheckpoint('best_model.h5'),
        keras.callbacks.EarlyStopping(patience=5),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3)
    ]
)
```

## Inference API

### Flask API Endpoints

```python
# POST /predict
# Analyze crop image for diseases

curl -X POST http://localhost:5000/predict \
  -F "image=@crop_image.jpg" \
  -F "crop_type=wheat"

# Response
{
  "success": true,
  "predictions": [
    {
      "disease": "Yellow Rust",
      "confidence": 0.92,
      "severity": "moderate",
      "treatment": "Apply fungicide within 3 days"
    }
  ],
  "inference_time": 0.234
}
```

### Python SDK

```python
from ml.inference import DiseasePredictor

# Load model
predictor = DiseasePredictor(model_path='models/crop-disease.tflite')

# Predict from image
result = predictor.predict(
    image_path='crop_image.jpg',
    crop_type='wheat'
)

print(result)
# {
#   'disease': 'Yellow Rust',
#   'confidence': 0.92,
#   'recommendations': [...]
# }
```

## Model Optimization

### Quantization

```python
import tensorflow as tf

# Post-training quantization
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# Convert to int8
converter.target_spec.supported_types = [tf.int8]
tflite_model = converter.convert()

# Save optimized model
with open('model_quantized.tflite', 'wb') as f:
    f.write(tflite_model)
```

### Pruning

```python
import tensorflow_model_optimization as tfmot

# Apply pruning
pruning_params = {
    'pruning_schedule': tfmot.sparsity.keras.PolynomialDecay(
        initial_sparsity=0.0,
        final_sparsity=0.5,
        begin_step=0,
        end_step=1000
    )
}

model_for_pruning = tfmot.sparsity.keras.prune_low_magnitude(
    model, **pruning_params
)
```

## Evaluation

### Benchmark Models

```bash
# Evaluate on test set
python training/evaluate.py \
  --model models/crop-disease.tflite \
  --test-dir data/test/ \
  --output results/evaluation.json

# Results include:
# - Accuracy, Precision, Recall, F1
# - Per-class performance
# - Confusion matrix
# - Inference time statistics
```

### Performance Metrics

```python
from ml.evaluation import evaluate_model

metrics = evaluate_model(
    model_path='models/crop-disease.tflite',
    test_data_path='data/test/',
    batch_size=32
)

print(metrics)
# {
#   'accuracy': 0.92,
#   'precision': 0.91,
#   'recall': 0.90,
#   'f1_score': 0.905,
#   'inference_time_ms': 234,
#   'model_size_mb': 12.4
# }
```

## Data Augmentation

### Synthetic Data Generation

```python
from ml.data.augmentation import generate_synthetic_data

# Generate augmented images
generate_synthetic_data(
    input_dir='data/raw/wheat_rust/',
    output_dir='data/augmented/wheat_rust/',
    num_samples=5000,
    augmentations=[
        'rotation', 'flip', 'brightness',
        'contrast', 'noise', 'blur'
    ]
)
```

## Deployment

### Docker Container

```bash
# Build image
docker build -t zaraidost-ml:latest .

# Run container
docker run -p 5000:5000 zaraidost-ml:latest

# Test
curl http://localhost:5000/health
```

### AWS SageMaker

```python
from sagemaker.tensorflow import TensorFlowModel

model = TensorFlowModel(
    model_data='s3://bucket/models/disease_model.tar.gz',
    role=sagemaker_role,
    framework_version='2.13'
)

predictor = model.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large'
)
```

## Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# Test inference
python tests/test_inference.py
```

## Monitoring

- Track model accuracy over time
- Monitor inference latency
- Log prediction distributions
- A/B test model versions

## Common Issues

**Out of memory during training**
- Reduce batch size
- Use gradient accumulation
- Enable mixed precision training

**Model accuracy too low**
- Increase dataset size
- Apply more augmentation
- Try different architectures
- Adjust learning rate

**Inference too slow**
- Use quantized models
- Reduce input resolution
- Optimize preprocessing pipeline

## Resources

- [TensorFlow Documentation](https://www.tensorflow.org/)
- [PlantVillage Dataset](https://www.kaggle.com/datasets/plantvillage)
- [Transfer Learning Guide](https://www.tensorflow.org/tutorials/images/transfer_learning)

## License

MIT - See [LICENSE](../LICENSE)

---

**Built with ❤️ for Pakistan's farmers**
