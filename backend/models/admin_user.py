
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class AdminUser(Base):
    __tablename__ = 'admin_users'

    id = Column(String(50), primary_key=True)
    username = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    roles = Column(String(255), nullable=True)  # Comma-separated roles
    created_date = Column(DateTime, default=func.current_timestamp())
    last_login = Column(DateTime, nullable=True)
    
    # Keycloak specific fields
    keycloak_id = Column(String(50), nullable=False, unique=True)
    given_name = Column(String(255), nullable=True)
    family_name = Column(String(255), nullable=True)
