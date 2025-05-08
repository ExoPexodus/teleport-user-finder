
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class ScheduledTask(Base):
    __tablename__ = 'scheduled_tasks'

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), nullable=False)
    user_name = Column(String(255), nullable=False)
    portal = Column(String(50), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    action = Column(String(10), nullable=False)  # 'add' or 'remove'
    roles = Column(String, nullable=False)  # Comma-separated list of roles
    status = Column(String(20), nullable=False, default='scheduled')  # scheduled, completed, failed
    created_at = Column(DateTime, default=func.current_timestamp())
    executed_at = Column(DateTime, nullable=True)
    result = Column(String, nullable=True)  # Result output or error message
