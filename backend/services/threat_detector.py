"""
AutoSOC — AI Threat Detection Service
The brain of the operation. Uses LLMs to analyze security events.
"""

import json
import asyncio
from typing import Optional
from datetime import datetime
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from models.alert import Alert, AlertSeverity, ThreatCategory
from config import settings
import logging

logger = logging.getLogger(__name__)

# Use whichever AI provider you prefer
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

THREAT_DETECTION_PROMPT = """You are an elite cybersecurity analyst with 20+ years of experience.
Analyze the following security log event and provide a structured threat assessment.

You must respond ONLY with valid JSON in this exact format:
{
  "severity": "critical|high|medium|low|info",
  "threat_category": "malware|intrusion|data_exfiltration|phishing|dos|privilege_escalation|lateral_movement|reconnaissance|policy_violation|none",
  "confidence": 0.0-1.0,
  "is_threat": true/false,
  "threat_summary": "1-2 sentence plain English summary",
  "technical_details": "technical explanation for analysts",
  "recommended_actions": ["action1", "action2"],
  "mitre_attack_technique": "T1234 or null",
  "false_positive_likelihood": "high|medium|low",
  "requires_immediate_action": true/false
}

Be conservative — only flag real threats. Reduce alert fatigue.
"""

ALERT_TRIAGE_PROMPT = """You are a senior SOC analyst performing alert triage.
Given multiple related security alerts, determine if they form a coordinated attack pattern.

Respond ONLY with valid JSON:
{
  "is_coordinated_attack": true/false,
  "attack_narrative": "What is happening in plain English",
  "kill_chain_stage": "reconnaissance|weaponization|delivery|exploitation|installation|c2|actions",
  "consolidated_severity": "critical|high|medium|low",
  "priority_score": 1-100,
  "recommended_response": "immediate_action|investigate|monitor|close",
  "estimated_blast_radius": "description of potential impact"
}
"""

REPORT_GENERATION_PROMPT = """You are a cybersecurity expert writing a weekly security report for a small business owner.
They are NOT technical. Write clearly, avoid jargon, be reassuring but honest.

The report should include:
1. Executive Summary (2-3 sentences — how safe are they?)
2. What We Found This Week (bullet points, plain English)
3. What We Did About It (actions taken)
4. Your Risk Level (Low/Medium/High with color indicator)
5. One Security Tip for the Week

Keep it under 400 words. Be human, warm, professional.
"""


class ThreatDetector:
    """AI-powered threat detection engine"""

    def __init__(self, provider: str = "openai"):
        self.provider = provider

    async def analyze_event(self, log_event: dict) -> dict:
        """
        Analyze a single log event for threats.
        Returns structured threat assessment.
        """
        try:
            event_str = json.dumps(log_event, indent=2)
            prompt = f"{THREAT_DETECTION_PROMPT}\n\nLog Event:\n{event_str}"

            if self.provider == "openai":
                response = await openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1,  # Low temp for consistency
                    max_tokens=800,
                )
                result = json.loads(response.choices[0].message.content)

            else:  # anthropic
                response = await anthropic_client.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=800,
                    messages=[{"role": "user", "content": prompt}],
                )
                result = json.loads(response.content[0].text)

            result["analyzed_at"] = datetime.utcnow().isoformat()
            result["provider"] = self.provider
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            return self._fallback_assessment(log_event)
        except Exception as e:
            logger.error(f"Threat detection error: {e}")
            return self._fallback_assessment(log_event)

    async def triage_alert_cluster(self, alerts: list[dict]) -> dict:
        """
        Analyze a cluster of related alerts to detect coordinated attacks.
        """
        try:
            alerts_str = json.dumps(alerts[:20], indent=2)  # Max 20 alerts
            prompt = f"{ALERT_TRIAGE_PROMPT}\n\nAlerts:\n{alerts_str}"

            response = await openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=600,
            )
            return json.loads(response.choices[0].message.content)

        except Exception as e:
            logger.error(f"Triage error: {e}")
            return {"error": str(e), "is_coordinated_attack": False}

    async def generate_weekly_report(self, week_data: dict) -> str:
        """
        Generate a plain-English weekly security report for business owners.
        """
        try:
            data_str = json.dumps(week_data, indent=2)
            prompt = f"{REPORT_GENERATION_PROMPT}\n\nWeek's Security Data:\n{data_str}"

            response = await openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=1000,
            )
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Report generation error: {e}")
            return "Report generation failed. Please contact support."

    def _fallback_assessment(self, log_event: dict) -> dict:
        """Fallback when AI is unavailable — conservative defaults"""
        return {
            "severity": "medium",
            "threat_category": "unknown",
            "confidence": 0.3,
            "is_threat": False,
            "threat_summary": "Unable to analyze — requires manual review",
            "technical_details": "AI analysis unavailable",
            "recommended_actions": ["manual_review"],
            "mitre_attack_technique": None,
            "false_positive_likelihood": "unknown",
            "requires_immediate_action": False,
            "analyzed_at": datetime.utcnow().isoformat(),
            "provider": "fallback",
        }


class AutoResponseEngine:
    """
    Automated response engine.
    Takes action based on threat severity and type.
    """

    RESPONSE_PLAYBOOKS = {
        "critical": {
            "actions": ["isolate_host", "block_ip", "alert_analyst", "create_incident"],
            "auto_execute": True,
            "notification_channels": ["email", "sms", "slack"],
        },
        "high": {
            "actions": ["block_ip", "alert_analyst", "create_incident"],
            "auto_execute": True,
            "notification_channels": ["email", "slack"],
        },
        "medium": {
            "actions": ["alert_analyst", "create_ticket"],
            "auto_execute": False,
            "notification_channels": ["email"],
        },
        "low": {
            "actions": ["log_event"],
            "auto_execute": False,
            "notification_channels": [],
        },
    }

    async def execute_response(self, alert: dict, client_config: dict) -> dict:
        """Execute automated response based on threat severity"""
        severity = alert.get("severity", "low")
        playbook = self.RESPONSE_PLAYBOOKS.get(severity, self.RESPONSE_PLAYBOOKS["low"])

        results = {
            "severity": severity,
            "playbook_executed": playbook["actions"],
            "auto_executed": playbook["auto_execute"],
            "timestamp": datetime.utcnow().isoformat(),
            "actions_taken": [],
        }

        if playbook["auto_execute"]:
            for action in playbook["actions"]:
                result = await self._execute_action(action, alert, client_config)
                results["actions_taken"].append(result)

        return results

    async def _execute_action(self, action: str, alert: dict, config: dict) -> dict:
        """Execute a specific response action"""
        logger.info(f"Executing action: {action} for alert {alert.get('id')}")

        action_handlers = {
            "isolate_host": self._isolate_host,
            "block_ip": self._block_ip,
            "alert_analyst": self._alert_analyst,
            "create_incident": self._create_incident,
            "create_ticket": self._create_ticket,
            "log_event": self._log_event,
        }

        handler = action_handlers.get(action, self._log_event)
        return await handler(alert, config)

    async def _isolate_host(self, alert: dict, config: dict) -> dict:
        # Integration point: call your EDR API (CrowdStrike, SentinelOne, etc.)
        return {"action": "isolate_host", "status": "executed", "target": alert.get("source_ip")}

    async def _block_ip(self, alert: dict, config: dict) -> dict:
        # Integration point: call firewall API
        return {"action": "block_ip", "status": "executed", "ip": alert.get("source_ip")}

    async def _alert_analyst(self, alert: dict, config: dict) -> dict:
        # Send notification to analyst
        return {"action": "alert_analyst", "status": "notified"}

    async def _create_incident(self, alert: dict, config: dict) -> dict:
        return {"action": "create_incident", "status": "created"}

    async def _create_ticket(self, alert: dict, config: dict) -> dict:
        return {"action": "create_ticket", "status": "created"}

    async def _log_event(self, alert: dict, config: dict) -> dict:
        return {"action": "log_event", "status": "logged"}
