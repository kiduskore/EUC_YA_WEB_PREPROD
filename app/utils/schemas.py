from dataclasses import dataclass
from typing import Optional, List

@dataclass
class MemberCreateSchema:
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    spiritual_stage: str = 'new'
    role: str = 'member'

@dataclass
class PodCreateSchema:
    name: str
    leader_id: int

@dataclass
class WeeklyPlanCreateSchema:
    pod_id: int
    leader_id: int
    week_date: str
    bible_passage: str
    discussion_questions: str
    spiritual_goals: str
