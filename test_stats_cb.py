from main import app
with app.test_client() as client:
    response = client.get('/api/stats?_cb=123')
    print("Status:", response.status_code)
    print("Data:", response.data.decode('utf-8'))
