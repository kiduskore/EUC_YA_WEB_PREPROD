import re

with open('main.py', 'r') as f:
    content = f.read()

# Add imports
imports = """
from app.utils.validation import validate_schema
from app.utils.schemas import MemberCreateSchema, PodCreateSchema, WeeklyPlanCreateSchema
"""
content = content.replace("from datetime import datetime\n", "from datetime import datetime\n" + imports)

# Patch create_member
# Replace `def create_member():` and `data = request.json` with the validated version
member_target = """@app.route('/api/members', methods=['POST'])
def create_member():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json"""
member_replacement = """@app.route('/api/members', methods=['POST'])
@validate_schema(MemberCreateSchema)
def create_member(validated_data: MemberCreateSchema):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = {"name": validated_data.name, "email": validated_data.email, "phone": validated_data.phone, "role": validated_data.role, "spiritual_stage": validated_data.spiritual_stage}"""
content = content.replace(member_target, member_replacement)

# Patch create_pod
pod_target = """@app.route('/api/pods', methods=['POST'])
def create_pod():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json"""
pod_replacement = """@app.route('/api/pods', methods=['POST'])
@validate_schema(PodCreateSchema)
def create_pod(validated_data: PodCreateSchema):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = {"name": validated_data.name, "leader_id": validated_data.leader_id}"""
content = content.replace(pod_target, pod_replacement)

# Patch create_weekly_plan
plan_target = """@app.route('/api/weekly-plans', methods=['POST'])
def create_weekly_plan():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json"""
plan_replacement = """@app.route('/api/weekly-plans', methods=['POST'])
@validate_schema(WeeklyPlanCreateSchema)
def create_weekly_plan(validated_data: WeeklyPlanCreateSchema):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = {
        "pod_id": validated_data.pod_id,
        "leader_id": validated_data.leader_id,
        "week_date": validated_data.week_date,
        "bible_passage": validated_data.bible_passage,
        "discussion_questions": validated_data.discussion_questions,
        "spiritual_goals": validated_data.spiritual_goals
    }"""
content = content.replace(plan_target, plan_replacement)

with open('main.py', 'w') as f:
    f.write(content)
