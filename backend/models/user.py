
from sqlalchemy import Column, String, DateTime, func, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    roles = Column(String, nullable=True)
    created_date = Column(DateTime, default=func.current_timestamp())
    last_login = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=True)
    manager = Column(String(255), nullable=True)
    portal = Column(String(50), nullable=True)

    __table_args__ = (
        CheckConstraint(status.in_(['active', 'inactive', 'pending']), name='check_status'),
    )
