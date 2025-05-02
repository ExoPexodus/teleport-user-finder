
import psycopg2
import psycopg2.extras
import logging
from config import DB_CONFIG

def get_db_connection():
    """Create and return a database connection."""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        raise
