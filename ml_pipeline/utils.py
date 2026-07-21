import os

# --- Configuration ---
DATA_DIR = "ml_pipeline/data"
MODELS_DIR = "ml_pipeline/models"
RESULTS_DIR = "ml_pipeline/results"
PLOTS_DIR = "ml_pipeline/plots"
LOGS_DIR = "ml_pipeline/logs"

# Ensure directories exist
def setup_directories():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)
    os.makedirs(PLOTS_DIR, exist_ok=True)
    os.makedirs(LOGS_DIR, exist_ok=True)
    print("Directories initialized.")

# Constants
SEED = 42

# --- Logger Setup ---
import logging

def get_logger(name):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
        if not os.path.exists(LOGS_DIR):
            os.makedirs(LOGS_DIR, exist_ok=True)
            
        fh = logging.FileHandler(f"{LOGS_DIR}/{name}.log")
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    return logger
