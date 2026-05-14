from groq import Groq
import os
import json

# Initialize Groq client — reads GROQ_API_KEY from .env
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_task_suggestions(title: str, description: str = None, priority: str = "medium") -> dict:
    prompt = f"""You are a productivity expert. Given this task:
Title: {title}
Description: {description or 'No description provided'}
Priority: {priority}

Respond ONLY with a valid JSON object, no extra text, no markdown backticks:
{{
  "subtasks": ["subtask 1", "subtask 2", "subtask 3"],
  "estimated_hours": 2.5,
  "tip": "one practical productivity tip"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.7
    )

    text = response.choices[0].message.content.strip()

    # Remove markdown if model adds it
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "subtasks": [
                "Break the task into smaller steps",
                "Research and gather resources",
                "Execute and review results"
            ],
            "estimated_hours": 2,
            "tip": "Focus on one subtask at a time"
        }

def summarize_task(title: str, description: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"Summarize in one sentence: {title}. {description or ''}"
        }],
        max_tokens=100
    )
    return response.choices[0].message.content

def prioritize_tasks(tasks: list) -> str:
    task_list = "\n".join([
        f"- {t['title']} (Priority: {t['priority']})" for t in tasks
    ])
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"Re-order these tasks by urgency and impact:\n{task_list}\n\nProvide ordered list with brief reason."
        }],
        max_tokens=400
    )
    return response.choices[0].message.content