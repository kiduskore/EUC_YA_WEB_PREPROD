import re

with open('main.py', 'r') as f:
    content = f.read()

delete_route = """@app.route('/api/prayer/<int:id>', methods=['DELETE'])
@permission_required('view_dashboard')
def delete_prayer(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM prayer_requests WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

"""

content = content.replace("@app.route('/api/prayer/<int:id>/support', methods=['POST'])", delete_route + "@app.route('/api/prayer/<int:id>/support', methods=['POST'])")

with open('main.py', 'w') as f:
    f.write(content)
