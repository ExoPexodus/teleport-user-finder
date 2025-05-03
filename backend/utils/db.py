
import psycopg2
import psycopg2.extras
import logging
from config import DB_CONFIG
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# Create SQLAlchemy engine for ORM operations
def create_sqlalchemy_engine():
    """Create and return a SQLAlchemy engine."""
    try:
        connection_string = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        return engine
    except Exception as e:
        logging.error(f"Database engine creation error: {e}")
        raise

# Create session factory
engine = create_sqlalchemy_engine()
SessionFactory = sessionmaker(bind=engine)
Session = scoped_session(SessionFactory)

def get_db_session():
    """Create and return a database session using SQLAlchemy."""
    try:
        return Session()
    except Exception as e:
        logging.error(f"Database session error: {e}")
        raise

def get_db_connection():
    """Create and return a database connection using psycopg2 (for raw SQL operations)."""
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
