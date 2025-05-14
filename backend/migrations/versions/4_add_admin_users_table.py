
"""Add admin_users table

Revision ID: 4_add_admin_users_table
Revises: 3_add_keycloak_fields
Create Date: 2023-05-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4_add_admin_users_table'
down_revision = '3_add_keycloak_fields'
branch_labels = None
depends_on = None

def upgrade():
    # Create admin_users table
    op.create_table(
        'admin_users',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('roles', sa.String(255), nullable=True),
        sa.Column('created_date', sa.DateTime, server_default=sa.func.current_timestamp()),
        sa.Column('last_login', sa.DateTime, nullable=True),
        sa.Column('keycloak_id', sa.String(50), nullable=False),
        sa.Column('given_name', sa.String(255), nullable=True),
        sa.Column('family_name', sa.String(255), nullable=True),
    )
    
    # Create unique constraints and indexes
    op.create_index('idx_admin_users_keycloak_id', 'admin_users', ['keycloak_id'], unique=True)
    op.create_index('idx_admin_users_username', 'admin_users', ['username'], unique=True)

def downgrade():
    op.drop_index('idx_admin_users_username')
    op.drop_index('idx_admin_users_keycloak_id')
    op.drop_table('admin_users')
