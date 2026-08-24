import os
from main import app
from flask import session

with app.test_client() as client:
    with client.session_transaction() as sess:
        sess['user_id'] = 1
        sess['role'] = 'leader'
        # Deliberately OMIT 'version'
    
    response = client.get('/api/stats')
    print("Status:", response.status_code)
    print("Data:", response.data.decode('utf-8'))
