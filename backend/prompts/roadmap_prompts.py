"""
AI Prompts for Personalized Learning Roadmap Generation via OpenRouter LLM.
"""

ROADMAP_SYSTEM_PROMPT = (
    "You are a Senior Career Mentor, Technical Curriculum Architect, and Lead Engineering Director. "
    "Always respond strictly in valid JSON format."
)

ROADMAP_USER_PROMPT_TEMPLATE = """Generate a personalized, highly structured 4-week AI Learning Roadmap for a candidate aiming for the target role of '{target_role}'.

Candidate Profile Context:
Current Skills: {current_skills}
Missing Skills / Gaps: {missing_skills}
Resume Summary Context: {resume_context}

Return a JSON object with EXACTLY this structure:
{{
  "target_role": "{target_role}",
  "current_skills": [<list of candidate's verified current skills>],
  "missing_skills": [<list of key missing skills to master>],
  "estimated_completion_time": "4 Weeks (10-12 hrs/week)",
  "weekly_plan": [
    {{
      "week": 1,
      "title": "<Week 1 Theme/Focus Area>",
      "description": "<Overview of what will be learned in Week 1>",
      "objectives": [
        "<Actionable Objective 1>",
        "<Actionable Objective 2>",
        "<Actionable Objective 3>"
      ]
    }},
    {{
      "week": 2,
      "title": "<Week 2 Theme/Focus Area>",
      "description": "<Overview of what will be learned in Week 2>",
      "objectives": [
        "<Actionable Objective 1>",
        "<Actionable Objective 2>",
        "<Actionable Objective 3>"
      ]
    }},
    {{
      "week": 3,
      "title": "<Week 3 Theme/Focus Area>",
      "description": "<Overview of what will be learned in Week 3>",
      "objectives": [
        "<Actionable Objective 1>",
        "<Actionable Objective 2>",
        "<Actionable Objective 3>"
      ]
    }},
    {{
      "week": 4,
      "title": "<Week 4 Theme/Focus Area>",
      "description": "<Overview of what will be learned in Week 4>",
      "objectives": [
        "<Actionable Objective 1>",
        "<Actionable Objective 2>",
        "<Actionable Objective 3>"
      ]
    }}
  ],
  "recommended_courses": [
    {{
      "title": "<Course/Specialization Title>",
      "provider": "<Platform e.g. Coursera, Udemy, YouTube, Official Docs>",
      "link": "https://coursera.org",
      "focus": "<Key skill covered in course>"
    }},
    {{
      "title": "<Course/Specialization Title>",
      "provider": "<Platform>",
      "link": "https://udemy.com",
      "focus": "<Key skill covered in course>"
    }}
  ],
  "learning_resources": [
    {{
      "title": "<Resource Title e.g. Official Documentation / GitHub Roadmap>",
      "resource_type": "Documentation",
      "description": "<Brief description of how to use this resource>",
      "link": "https://developer.mozilla.org"
    }},
    {{
      "title": "<Interactive Coding Platform / Practice Site>",
      "resource_type": "Practice Platform",
      "description": "<Brief description>",
      "link": "https://leetcode.com"
    }}
  ],
  "practice_projects": [
    {{
      "title": "<Portfolio Project Title 1>",
      "description": "<Production-ready project description solving real-world problems>",
      "tech_stack": ["<Tech 1>", "<Tech 2>", "<Tech 3>"]
    }},
    {{
      "title": "<Portfolio Project Title 2>",
      "description": "<Project description>",
      "tech_stack": ["<Tech 1>", "<Tech 2>", "<Tech 3>"]
    }}
  ]
}}
"""
