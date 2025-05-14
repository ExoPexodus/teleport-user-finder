
"""Add Keycloak fields to users table

Revision ID: 3_add_keycloak_fields
Revises: 2_add_scheduled_tasks
Create Date: 2023-05-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3_add_keycloak_fields'
down_revision = '2_add_scheduled_tasks'
branch_labels = None
depends_on = None

def upgrade():
    # Add Keycloak specific fields to users table
    op.add_column('users', sa.Column('keycloak_id', sa.String(50), nullable=True, unique=True))
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('given_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('family_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('preferred_username', sa.String(255), nullable=True))
    
    # Create index on keycloak_id for faster lookups
    op.create_index('idx_users_keycloak_id', 'users', ['keycloak_id'], unique=True)

def downgrade():
    # Drop columns in reverse order
    op.drop_index('idx_users_keycloak_id')
    op.drop_column('users', 'preferred_username')
    op.drop_column('users', 'family_name')
    op.drop_column('users', 'given_name')
    op.drop_column('users', 'email')
    op.drop_column('users', 'keycloak_id')
