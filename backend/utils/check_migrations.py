
import logging
from alembic import command
from alembic.config import Config
import os

def run_migrations():
    """Run alembic migrations automatically on startup"""
    try:
        # Get the directory of the current file
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Create Alembic config
        alembic_cfg = Config(os.path.join(base_dir, 'alembic.ini'))
        alembic_cfg.set_main_option('script_location', os.path.join(base_dir, 'migrations'))
        
        # Run the migration
        logging.info("Running database migrations...")
        command.upgrade(alembic_cfg, "head")
        logging.info("Migrations complete!")
    except Exception as e:
        logging.error(f"Error running migrations: {e}")
        # Don't raise the exception to prevent app crash on migration failure
        # But log it so it's visible
