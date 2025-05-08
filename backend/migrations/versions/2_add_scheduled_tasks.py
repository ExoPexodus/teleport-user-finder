
"""Add scheduled_tasks table

Revision ID: 2_add_scheduled_tasks
Revises: 1_initial_migration
Create Date: 2025-05-08 07:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2_add_scheduled_tasks'
down_revision = '1_initial_migration'
branch_labels = None
depends_on = None

def upgrade():
    # Create scheduled_tasks table
    op.create_table(
        'scheduled_tasks',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('user_id', sa.String(50), nullable=False),
        sa.Column('user_name', sa.String(255), nullable=False),
        sa.Column('portal', sa.String(50), nullable=False),
        sa.Column('scheduled_time', sa.DateTime, nullable=False),
        sa.Column('action', sa.String(10), nullable=False),  # 'add' or 'remove'
        sa.Column('roles', sa.String, nullable=False),  # Comma-separated list of roles
        sa.Column('status', sa.String(20), nullable=False, server_default='scheduled'),  # scheduled, completed, failed
        sa.Column('created_at', sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('executed_at', sa.DateTime, nullable=True),
        sa.Column('result', sa.String, nullable=True)  # Result output or error message
    )
    
    # Create indexes
    op.create_index('idx_scheduled_tasks_user_id', 'scheduled_tasks', ['user_id'])
    op.create_index('idx_scheduled_tasks_portal', 'scheduled_tasks', ['portal'])
    op.create_index('idx_scheduled_tasks_status', 'scheduled_tasks', ['status'])
    op.create_index('idx_scheduled_tasks_scheduled_time', 'scheduled_tasks', ['scheduled_time'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_scheduled_tasks_scheduled_time')
    op.drop_index('idx_scheduled_tasks_status')
    op.drop_index('idx_scheduled_tasks_portal')
    op.drop_index('idx_scheduled_tasks_user_id')
    
    # Drop table
    op.drop_table('scheduled_tasks')
