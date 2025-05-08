
import threading
import time
import logging
from datetime import datetime
# Try to import requests, but provide a fallback if not available
try:
    import requests
except ImportError:
    requests = None
    logging.warning("requests module not available, external API calls will not work")

from sqlalchemy import and_
from models.scheduled_task import ScheduledTask
from utils.db import get_db_session

class TaskScheduler:
    def __init__(self, check_interval=60):
        """Initialize the task scheduler.
        
        Args:
            check_interval: How often to check for due tasks, in seconds.
        """
        self.check_interval = check_interval
        self.running = False
        self.thread = None
        self.logger = logging.getLogger('TaskScheduler')
    
    def start(self):
        """Start the scheduler in a background thread."""
        if self.running:
            self.logger.warning("Scheduler is already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        self.logger.info("Task scheduler started")
    
    def stop(self):
        """Stop the scheduler thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5.0)
            self.logger.info("Task scheduler stopped")
    
    def _run(self):
        """Main loop that periodically checks for due tasks."""
        while self.running:
            try:
                self._check_and_execute_due_tasks()
            except Exception as e:
                self.logger.error(f"Error in scheduler: {str(e)}")
            
            # Sleep for the check interval
            time.sleep(self.check_interval)
    
    def _check_and_execute_due_tasks(self):
        """Check for tasks that are due and execute them."""
        now = datetime.now()
        self.logger.debug(f"Checking for due tasks at {now.isoformat()}")
        
        session = get_db_session()
        try:
            # Query for tasks that are scheduled and due
            due_tasks = session.query(ScheduledTask).filter(
                and_(
                    ScheduledTask.status == 'scheduled',
                    ScheduledTask.scheduled_time <= now
                )
            ).all()
            
            if due_tasks:
                self.logger.info(f"Found {len(due_tasks)} due tasks to execute")
            
            # Process each due task
            for task in due_tasks:
                self._execute_task(task)
                
        except Exception as e:
            self.logger.error(f"Error while checking for due tasks: {str(e)}")
        finally:
            session.close()
    
    def _execute_task(self, task):
        """Execute a specific task.
        
        Args:
            task: The ScheduledTask object to execute.
        """
        self.logger.info(f"Executing task {task.id} for user {task.user_name}")
        
        session = get_db_session()
        try:
            # Prepare data for execution
            data = {
                'taskId': task.id,
                'userName': task.user_name,
                'portal': task.portal,
                'action': task.action,
                'roles': task.roles.split(',') if task.roles else []
            }
            
            # Call the execute endpoint using internal API call
            # Import here to avoid circular imports
            from routes.teleport_scheduler import execute_task_internal
            result = execute_task_internal(data)
            
            if result.get('success', False):
                self.logger.info(f"Task {task.id} executed successfully")
            else:
                self.logger.error(f"Task {task.id} execution failed: {result.get('message')}")
                
        except Exception as e:
            self.logger.error(f"Error executing task {task.id}: {str(e)}")
            # Update task status to failed
            try:
                task.status = 'failed'
                task.executed_at = datetime.now()
                task.result = f"Error: {str(e)}"
                session.commit()
            except Exception as commit_err:
                self.logger.error(f"Error updating task status: {str(commit_err)}")
                session.rollback()
        finally:
            session.close()

# Create a singleton instance
scheduler = TaskScheduler()
