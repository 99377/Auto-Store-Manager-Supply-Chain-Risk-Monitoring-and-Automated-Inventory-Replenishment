from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit

def run_full_pipeline():
    """Run the complete ingestion → classification → scoring pipeline."""
    print("\n[Pipeline] Starting full pipeline run...")
    try:
        from app.pipeline.ingestion import run_ingestion
        from app.pipeline.classifier import run_classification
        from app.pipeline.scorer import run_scoring
        run_ingestion()
        run_classification()
        run_scoring()
        print("[Pipeline] Full pipeline complete.\n")
    except Exception as e:
        print(f"[Pipeline] Error: {e}")

def start_scheduler():
    """Start the background scheduler — runs every 3 hours."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=run_full_pipeline,
        trigger=IntervalTrigger(hours=3),
        id="watchtower_pipeline",
        name="WatchTower Risk Pipeline",
        replace_existing=True
    )
    scheduler.start()
    print("[Scheduler] Pipeline scheduled every 3 hours.")
    atexit.register(lambda: scheduler.shutdown())
    return scheduler