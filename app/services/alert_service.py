import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
from sqlalchemy.orm import Session
from db.models import AlertConfig

def get_alert_config(db: Session, username: str):
    return db.query(AlertConfig).filter(AlertConfig.username == username).first()

def save_alert_config(db: Session, username: str, config_data: Dict[str, Any]):
    from db.database import logger
    logger.info(f"Saving alert config for {username}: {config_data}")
    alert = db.query(AlertConfig).filter(AlertConfig.username == username).first()
    if not alert:
        alert = AlertConfig(username=username)
        db.add(alert)
    
    alert.email_enabled = config_data.get('email_enabled', False)
    alert.target_email = config_data.get('target_email')
    alert.titer_threshold = config_data.get('titer_threshold', 5.0)
    alert.condition = config_data.get('condition', 'above')
    alert.smtp_server = config_data.get('smtp_server')
    alert.smtp_port = config_data.get('smtp_port', 587)
    alert.smtp_user = config_data.get('smtp_user')
    alert.smtp_pass = config_data.get('smtp_pass')
    alert.email_provider = config_data.get('email_provider', 'smtp')
    alert.api_key = config_data.get('api_key')
    
    db.commit()

def send_email_alert(recipient: str, subject: str, body: str, smtp_config: Dict[str, Any]) -> bool:
    try:
        from db.database import logger
        provider = smtp_config.get('email_provider', 'smtp')
        
        if provider == 'resend' or smtp_config.get('api_key'):
            import resend
            api_key = smtp_config.get('api_key')
            if not api_key:
                logger.error("Resend API key missing")
                return False
            
            resend.api_key = api_key
            r = resend.Emails.send({
                "from": "BioNexus <onboarding@resend.dev>",
                "to": [recipient],
                "subject": subject,
                "text": body,
            })
            logger.info(f"Email successfully dispatched (via Resend) to {recipient}. ID: {getattr(r, 'id', 'N/A')}")
            return True
            
        else:
            # Fallback to SMTP
            msg = MIMEMultipart()
            msg['From'] = smtp_config.get('smtp_user')
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(smtp_config.get('smtp_server'), smtp_config.get('smtp_port'))
            server.starttls()
            server.login(smtp_config.get('smtp_user'), smtp_config.get('smtp_pass'))
            server.send_message(msg)
            server.quit()
            logger.info(f"Email successfully dispatched (via SMTP) to {recipient}")
            return True
    except Exception as e:
        from db.database import logger
        logger.error(f"Email failed: {e}")
        return False

def test_smtp_connection(smtp_config: Dict[str, Any], recipient: str) -> bool:
    subject = "BioNexus: Connectivity Test"
    body = "This is a test email from your BioNexus dashboard to verify alert settings."
    return send_email_alert(recipient, subject, body, smtp_config)

def check_and_send_alerts(db: Session, username: str, results: Dict[str, Any]):
    config = get_alert_config(db, username)
    if not config or not config.email_enabled:
        return

    # Check predictions for threshold crossing
    predictions = results.get("results", []) 
    if not predictions:
        return

    latest_val = predictions[-1]
    triggered = False
    
    condition = config.condition
    threshold = config.titer_threshold
    
    from db.database import logger
    
    if condition == "above":
        matching_values = [v for v in predictions if v > threshold]
        if matching_values:
            triggered = True
            latest_val = matching_values[0] 
    elif condition == "below":
        matching_values = [v for v in predictions if v < threshold]
        if matching_values:
            triggered = True
            latest_val = matching_values[0]

    logger.info(f"Checking alerts for {username}: Condition={condition}, Threshold={threshold}, Triggered={triggered}")
    
    if triggered:
        smtp_config = {
            "smtp_server": config.smtp_server,
            "smtp_port": config.smtp_port,
            "smtp_user": config.smtp_user,
            "smtp_pass": config.smtp_pass,
            "email_provider": config.email_provider,
            "api_key": config.api_key
        }
        subject = f"BioNexus Alert: {condition.capitalize()} Threshold reached"
        body = f"User {username},\n\nYour recent prediction value {latest_val} has reached the {condition} threshold of {threshold}.\n\nModel: {results.get('model_name', 'Bioreactor_v1')}"
        send_email_alert(config.target_email, subject, body, smtp_config)

def check_and_send_alerts_background(username: str, results: Dict[str, Any]):
    from db.database import SessionLocal
    db = SessionLocal()
    try:
        check_and_send_alerts(db, username, results)
    finally:
        db.close()
