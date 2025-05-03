
"""Initial migration

Revision ID: 1_initial_migration
Revises: 
Create Date: 2023-05-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1_initial_migration'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('roles', sa.String(), nullable=True),
        sa.Column('created_date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(20), nullable=True),
        sa.Column('manager', sa.String(255), nullable=True),
        sa.Column('portal', sa.String(50), nullable=True),
        sa.CheckConstraint("status IN ('active', 'inactive', 'pending')", name='check_status')
    )
    
    # Create indexes
    op.create_index('idx_users_status', 'users', ['status'], unique=False)
    op.create_index('idx_users_portal', 'users', ['portal'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index('idx_users_portal')
    op.drop_index('idx_users_status')
    
    # Drop tables
    op.drop_table('users')
