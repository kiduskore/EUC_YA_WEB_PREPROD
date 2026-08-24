import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'euc_super_secret_key_2026')
    DATABASE_URL = os.environ.get('DATABASE_URL')
    IS_POSTGRES = DATABASE_URL is not None
    DATABASE_LOCAL_PATH = 'euc_ya.db'
    SMTP_USER = os.environ.get('SMTP_USER', 'info@eucmaryland.org')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
