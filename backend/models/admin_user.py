
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
    
    def has_role(self, role):
        """Check if user has a specific role"""
        if not self.roles:
            return False
        user_roles = self.roles.split(',')
        return role in user_roles
    
    def has_any_role(self, roles):
        """Check if user has any of the specified roles"""
        if not self.roles:
            return False
        user_roles = self.roles.split(',')
        return any(role in user_roles for role in roles)
