import smtplib
from email.message import EmailMessage
from app.config import Config

def send_invite_email(to_email, name, code):
    if not Config.SMTP_PASSWORD:
        print(f"SMTP_PASSWORD not set! Would send to {to_email}")
        print(f"Code: {code}")
        print(f"Link: https://youngadults.eucmaryland.org/claim-account?code={code}")
        return True
        
    try:
        msg = EmailMessage()
        msg.set_content(f"""Hello {name},

You have been granted leader access to the EUC Young Adults Dashboard.

Please click the link below to claim your account and set your password:
https://youngadults.eucmaryland.org/claim-account?code={code}

Alternatively, go to youngadults.eucmaryland.org/claim-account and enter the invite code: {code}

Blessings,
EUC Leadership Team""")
        msg['Subject'] = "You've been invited to the EUC Leaders Dashboard!"
        msg['From'] = Config.SMTP_USER
        msg['To'] = to_email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
