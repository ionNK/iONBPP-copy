import subprocess
import os

def run_step(script_name, description):
    print(f"\n--- {description} ---")
    cmd = f"python -m ml_pipeline.{script_name}"
    try:
        subprocess.check_call(cmd, shell=True)
        print(f"Step '{script_name}' completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error running {script_name}: {e}")
        exit(1)

if __name__ == "__main__":
    print("Starting ML Pipeline Execution...")
    
    # 1. Generate Data (10k players for fast demo, user can override manually later)
    # The script uses argparse, but we call via module.
    # To pass args: python -m ml_pipeline.data_generator --players 10000
    print("Generating Synthetic Data (10,000 players)...")
    subprocess.check_call("python -m ml_pipeline.data_generator --players 10000", shell=True)
    
    # 2. Feature Engineering
    run_step("feature_engineering", "Feature Engineering")
    
    # 3. Model Training & CRG Validation
    run_step("models", "Model Training & Validation")
    
    # 4. Visualizations
    run_step("visualize", "Evaluation Visualizations")
    
    print("\nPipeline Complete! Artifacts saved in ml_pipeline/models and ml_pipeline/results.")
