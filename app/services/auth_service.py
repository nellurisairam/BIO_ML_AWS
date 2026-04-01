from sqlalchemy.orm import Session
from db.database import logger
from db.models import User, Prediction, AlertConfig
import json

def create_user(db: Session, username, password, email=None, name=None, role="user", approved=False):
    try:
        import bcrypt
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        roles = [role]
        user = User(
            username=username, 
            password=hashed, 
            email=email, 
            name=name, 
            role=role, 
            roles=json.dumps(roles),
            approved=approved
        )
        db.add(user)
        db.commit()
        logger.info(f"New user created: {username} (Role: {role}, Approved: {approved})")
    except Exception as e:
        logger.error(f"Error creating user {username}: {e}")
        raise e

def list_users(db: Session):
    return db.query(User).all()

def update_user_approval(db: Session, username, approved):
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.approved = approved
            db.commit()
            logger.info(f"User {username} approval set to {approved}")
        else:
            logger.warning(f"Attempted to approve non-existent user: {username}")
    except Exception as e:
        logger.error(f"Error updating approval for {username}: {e}")
        raise e

def delete_user(db: Session, username):
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            # Resolve ForeignKey constraints dynamically
            db.query(Prediction).filter(Prediction.username == username).delete(synchronize_session=False)
            db.query(AlertConfig).filter(AlertConfig.username == username).delete(synchronize_session=False)
            db.commit() # Flush and commit constraint removals immediately
            
            # Now delete the parent user
            db.delete(user)
            db.commit()
            logger.info(f"User {username} and associated records deleted")
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user {username}: {e}")
        raise e

def update_user_role(db: Session, username, role):
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.role = role
            user.roles = json.dumps([role])
            db.commit()
            logger.info(f"User {username} role set to {role}")
    except Exception as e:
        logger.error(f"Error updating role for {username}: {e}")
        raise e

def authenticate_user(db: Session, username, password):
    try:
        import bcrypt
        user = db.query(User).filter(User.username == username).first()
        if user and bcrypt.checkpw(password.encode(), user.password.encode()):
            if user.approved:
                logger.info(f"User login successful: {username}")
                return user
            else:
                logger.warning(f"Login attempt for non-approved user: {username}")
                return None
        logger.warning(f"Login failed for user: {username}")
        return None
    except Exception as e:
        logger.error(f"Authentication error for {username}: {e}")
        return None
