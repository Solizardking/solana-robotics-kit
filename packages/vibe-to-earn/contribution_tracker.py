#!/usr/bin/env python3
"""
Contribution Tracker
====================

Track developer contributions from GitHub and Git operations.

Features:
- GitHub webhook processing
- Git commit analysis
- Pull request tracking
- Issue management
- Code review detection
- Automated reward calculation
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
import re
import subprocess
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple
from enum import Enum

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("ContributionTracker")


# =============================================================================
# CONFIGURATION
# =============================================================================

GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

# Repository configuration
TRACKED_REPOS = [
    "8bitsats/Solana-Robotics-Kit",
]

# File patterns for contribution categorization
FILE_PATTERNS = {
    "documentation": [r"\.md$", r"docs/", r"README"],
    "test_coverage": [r"test_.*\.py$", r".*_test\.py$", r"tests/", r"\.test\.(ts|js)$"],
    "feature": [r"src/", r"packages/", r"apps/"],
    "config": [r"\.json$", r"\.toml$", r"\.yaml$", r"\.yml$"],
    "security": [r"security", r"auth", r"crypto", r"encrypt"],
}

# Commit message patterns for auto-categorization
COMMIT_PATTERNS = {
    "bug_fix": [r"^fix", r"^bugfix", r"fixes? #\d+", r"bug"],
    "feature": [r"^feat", r"^feature", r"^add", r"new feature"],
    "documentation": [r"^docs?", r"^readme", r"documentation"],
    "security_fix": [r"^security", r"^sec:", r"vulnerability", r"CVE"],
    "test_coverage": [r"^test", r"add.*test", r"coverage"],
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class GitCommit:
    """Git commit information"""
    hash: str
    author_name: str
    author_email: str
    message: str
    timestamp: datetime
    files_changed: List[str] = field(default_factory=list)
    additions: int = 0
    deletions: int = 0
    repo: str = ""

    @property
    def short_hash(self) -> str:
        return self.hash[:7]

    def categorize(self) -> str:
        """Categorize commit based on message and files"""
        message_lower = self.message.lower()

        # Check commit message patterns
        for category, patterns in COMMIT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    return category

        # Check file patterns
        for file in self.files_changed:
            for category, patterns in FILE_PATTERNS.items():
                for pattern in patterns:
                    if re.search(pattern, file, re.IGNORECASE):
                        return category

        return "commit"


@dataclass
class PullRequest:
    """Pull request information"""
    number: int
    title: str
    author: str
    state: str  # open, closed, merged
    merged: bool
    created_at: datetime
    merged_at: Optional[datetime]
    commits: int
    additions: int
    deletions: int
    changed_files: int
    labels: List[str] = field(default_factory=list)
    repo: str = ""

    def categorize(self) -> str:
        """Categorize PR based on labels and title"""
        title_lower = self.title.lower()

        # Check labels first
        for label in self.labels:
            label_lower = label.lower()
            if "bug" in label_lower or "fix" in label_lower:
                return "bug_fix"
            if "security" in label_lower:
                return "security_fix"
            if "feature" in label_lower or "enhancement" in label_lower:
                return "feature"
            if "docs" in label_lower or "documentation" in label_lower:
                return "documentation"

        # Check title patterns
        for category, patterns in COMMIT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, title_lower, re.IGNORECASE):
                    return category

        return "pull_request"


@dataclass
class Issue:
    """Issue information"""
    number: int
    title: str
    author: str
    state: str  # open, closed
    created_at: datetime
    closed_at: Optional[datetime]
    labels: List[str] = field(default_factory=list)
    assignees: List[str] = field(default_factory=list)
    repo: str = ""


@dataclass
class CodeReview:
    """Code review information"""
    pr_number: int
    reviewer: str
    state: str  # approved, changes_requested, commented
    submitted_at: datetime
    comments: int = 0
    repo: str = ""


# =============================================================================
# GIT OPERATIONS
# =============================================================================

class GitOperations:
    """Local git repository operations"""

    def __init__(self, repo_path: str = "."):
        self.repo_path = repo_path

    def get_commits(
        self,
        since: Optional[datetime] = None,
        author: Optional[str] = None,
        limit: int = 100,
    ) -> List[GitCommit]:
        """Get commits from local git repository"""
        try:
            cmd = ["git", "-C", self.repo_path, "log", f"-{limit}", "--format=%H|%an|%ae|%s|%aI"]

            if since:
                cmd.append(f"--since={since.isoformat()}")
            if author:
                cmd.append(f"--author={author}")

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            commits = []
            for line in result.stdout.strip().split("\n"):
                if not line:
                    continue
                parts = line.split("|")
                if len(parts) >= 5:
                    commit = GitCommit(
                        hash=parts[0],
                        author_name=parts[1],
                        author_email=parts[2],
                        message=parts[3],
                        timestamp=datetime.fromisoformat(parts[4].replace("Z", "+00:00")),
                    )
                    # Get file changes
                    commit.files_changed = self._get_commit_files(commit.hash)
                    commits.append(commit)

            return commits

        except subprocess.CalledProcessError as e:
            logger.error(f"Git log error: {e}")
            return []

    def _get_commit_files(self, commit_hash: str) -> List[str]:
        """Get files changed in a commit"""
        try:
            cmd = ["git", "-C", self.repo_path, "show", "--name-only", "--format=", commit_hash]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return [f for f in result.stdout.strip().split("\n") if f]
        except subprocess.CalledProcessError:
            return []

    def get_commit_stats(self, commit_hash: str) -> Tuple[int, int]:
        """Get additions and deletions for a commit"""
        try:
            cmd = ["git", "-C", self.repo_path, "show", "--stat", "--format=", commit_hash]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            # Parse the last line for stats
            lines = result.stdout.strip().split("\n")
            if lines:
                last_line = lines[-1]
                additions = 0
                deletions = 0
                if "insertion" in last_line:
                    match = re.search(r"(\d+) insertion", last_line)
                    if match:
                        additions = int(match.group(1))
                if "deletion" in last_line:
                    match = re.search(r"(\d+) deletion", last_line)
                    if match:
                        deletions = int(match.group(1))
                return additions, deletions
        except subprocess.CalledProcessError:
            pass
        return 0, 0


# =============================================================================
# GITHUB API CLIENT
# =============================================================================

class GitHubClient:
    """GitHub API client for tracking contributions"""

    def __init__(self, token: Optional[str] = None):
        self.token = token or GITHUB_TOKEN
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    async def get_commits(
        self,
        owner: str,
        repo: str,
        since: Optional[datetime] = None,
        author: Optional[str] = None,
        per_page: int = 100,
    ) -> List[GitCommit]:
        """Get commits from GitHub repository"""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits"
        params = {"per_page": per_page}

        if since:
            params["since"] = since.isoformat()
        if author:
            params["author"] = author

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()

                commits = []
                for item in response.json():
                    commit_data = item.get("commit", {})
                    author_data = commit_data.get("author", {})

                    commit = GitCommit(
                        hash=item.get("sha", ""),
                        author_name=author_data.get("name", ""),
                        author_email=author_data.get("email", ""),
                        message=commit_data.get("message", "").split("\n")[0],
                        timestamp=datetime.fromisoformat(
                            author_data.get("date", "").replace("Z", "+00:00")
                        ) if author_data.get("date") else datetime.now(),
                        repo=f"{owner}/{repo}",
                    )
                    commits.append(commit)

                return commits

            except httpx.HTTPError as e:
                logger.error(f"GitHub API error: {e}")
                return []

    async def get_pull_requests(
        self,
        owner: str,
        repo: str,
        state: str = "all",
        per_page: int = 100,
    ) -> List[PullRequest]:
        """Get pull requests from GitHub repository"""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls"
        params = {"state": state, "per_page": per_page}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()

                prs = []
                for item in response.json():
                    pr = PullRequest(
                        number=item.get("number", 0),
                        title=item.get("title", ""),
                        author=item.get("user", {}).get("login", ""),
                        state=item.get("state", ""),
                        merged=item.get("merged_at") is not None,
                        created_at=datetime.fromisoformat(
                            item.get("created_at", "").replace("Z", "+00:00")
                        ) if item.get("created_at") else datetime.now(),
                        merged_at=datetime.fromisoformat(
                            item.get("merged_at", "").replace("Z", "+00:00")
                        ) if item.get("merged_at") else None,
                        commits=item.get("commits", 0),
                        additions=item.get("additions", 0),
                        deletions=item.get("deletions", 0),
                        changed_files=item.get("changed_files", 0),
                        labels=[l.get("name", "") for l in item.get("labels", [])],
                        repo=f"{owner}/{repo}",
                    )
                    prs.append(pr)

                return prs

            except httpx.HTTPError as e:
                logger.error(f"GitHub API error: {e}")
                return []

    async def get_issues(
        self,
        owner: str,
        repo: str,
        state: str = "all",
        per_page: int = 100,
    ) -> List[Issue]:
        """Get issues from GitHub repository"""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues"
        params = {"state": state, "per_page": per_page}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()

                issues = []
                for item in response.json():
                    # Skip pull requests (they show up in issues endpoint too)
                    if "pull_request" in item:
                        continue

                    issue = Issue(
                        number=item.get("number", 0),
                        title=item.get("title", ""),
                        author=item.get("user", {}).get("login", ""),
                        state=item.get("state", ""),
                        created_at=datetime.fromisoformat(
                            item.get("created_at", "").replace("Z", "+00:00")
                        ) if item.get("created_at") else datetime.now(),
                        closed_at=datetime.fromisoformat(
                            item.get("closed_at", "").replace("Z", "+00:00")
                        ) if item.get("closed_at") else None,
                        labels=[l.get("name", "") for l in item.get("labels", [])],
                        assignees=[a.get("login", "") for a in item.get("assignees", [])],
                        repo=f"{owner}/{repo}",
                    )
                    issues.append(issue)

                return issues

            except httpx.HTTPError as e:
                logger.error(f"GitHub API error: {e}")
                return []

    async def get_reviews(
        self,
        owner: str,
        repo: str,
        pr_number: int,
    ) -> List[CodeReview]:
        """Get code reviews for a pull request"""
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/reviews"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                reviews = []
                for item in response.json():
                    review = CodeReview(
                        pr_number=pr_number,
                        reviewer=item.get("user", {}).get("login", ""),
                        state=item.get("state", "").lower(),
                        submitted_at=datetime.fromisoformat(
                            item.get("submitted_at", "").replace("Z", "+00:00")
                        ) if item.get("submitted_at") else datetime.now(),
                        repo=f"{owner}/{repo}",
                    )
                    reviews.append(review)

                return reviews

            except httpx.HTTPError as e:
                logger.error(f"GitHub API error: {e}")
                return []

    async def get_user_contributions(
        self,
        username: str,
        repos: Optional[List[str]] = None,
        since: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get all contributions for a user across repos"""
        repos = repos or TRACKED_REPOS
        since = since or (datetime.now() - timedelta(days=30))

        contributions = {
            "commits": [],
            "pull_requests": [],
            "issues_created": [],
            "issues_resolved": [],
            "reviews": [],
        }

        for repo in repos:
            owner, repo_name = repo.split("/")

            # Get commits
            commits = await self.get_commits(owner, repo_name, since=since, author=username)
            contributions["commits"].extend(commits)

            # Get PRs
            prs = await self.get_pull_requests(owner, repo_name)
            user_prs = [pr for pr in prs if pr.author == username]
            contributions["pull_requests"].extend(user_prs)

            # Get issues
            issues = await self.get_issues(owner, repo_name)
            contributions["issues_created"].extend([i for i in issues if i.author == username])
            contributions["issues_resolved"].extend([
                i for i in issues
                if i.state == "closed" and username in i.assignees
            ])

            # Get reviews for merged PRs
            for pr in prs:
                if pr.merged:
                    reviews = await self.get_reviews(owner, repo_name, pr.number)
                    contributions["reviews"].extend([r for r in reviews if r.reviewer == username])

        return contributions


# =============================================================================
# WEBHOOK HANDLER
# =============================================================================

class WebhookHandler:
    """Handle GitHub webhook events"""

    def __init__(self, secret: Optional[str] = None):
        self.secret = secret or GITHUB_WEBHOOK_SECRET
        self._event_handlers = {
            "push": self._handle_push,
            "pull_request": self._handle_pull_request,
            "issues": self._handle_issues,
            "pull_request_review": self._handle_review,
        }

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify GitHub webhook signature"""
        if not self.secret:
            return True  # Skip verification if no secret

        expected = "sha256=" + hmac.new(
            self.secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)

    async def handle_event(
        self,
        event_type: str,
        payload: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Handle a webhook event and return contributions"""
        handler = self._event_handlers.get(event_type)
        if handler:
            return await handler(payload)
        return []

    async def _handle_push(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle push event"""
        contributions = []
        repo = payload.get("repository", {}).get("full_name", "")
        sender = payload.get("sender", {}).get("login", "")

        for commit in payload.get("commits", []):
            author = commit.get("author", {}).get("username", sender)
            message = commit.get("message", "").split("\n")[0]

            git_commit = GitCommit(
                hash=commit.get("id", ""),
                author_name=commit.get("author", {}).get("name", ""),
                author_email=commit.get("author", {}).get("email", ""),
                message=message,
                timestamp=datetime.now(),
                files_changed=commit.get("added", []) + commit.get("modified", []),
                repo=repo,
            )

            contribution_type = git_commit.categorize()

            contributions.append({
                "developer": author,
                "type": contribution_type,
                "description": message,
                "commit_hash": git_commit.hash,
                "repo": repo,
            })

        return contributions

    async def _handle_pull_request(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle pull request event"""
        action = payload.get("action", "")
        pr_data = payload.get("pull_request", {})
        repo = payload.get("repository", {}).get("full_name", "")

        # Only process merged PRs
        if action != "closed" or not pr_data.get("merged"):
            return []

        pr = PullRequest(
            number=pr_data.get("number", 0),
            title=pr_data.get("title", ""),
            author=pr_data.get("user", {}).get("login", ""),
            state="merged",
            merged=True,
            created_at=datetime.now(),
            merged_at=datetime.now(),
            commits=pr_data.get("commits", 0),
            additions=pr_data.get("additions", 0),
            deletions=pr_data.get("deletions", 0),
            changed_files=pr_data.get("changed_files", 0),
            labels=[l.get("name", "") for l in pr_data.get("labels", [])],
            repo=repo,
        )

        contribution_type = pr.categorize()

        return [{
            "developer": pr.author,
            "type": contribution_type,
            "description": pr.title,
            "pr_number": pr.number,
            "repo": repo,
        }]

    async def _handle_issues(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle issues event"""
        action = payload.get("action", "")
        issue_data = payload.get("issue", {})
        repo = payload.get("repository", {}).get("full_name", "")

        contributions = []

        if action == "opened":
            contributions.append({
                "developer": issue_data.get("user", {}).get("login", ""),
                "type": "issue_created",
                "description": issue_data.get("title", ""),
                "issue_number": issue_data.get("number", 0),
                "repo": repo,
            })
        elif action == "closed":
            # Credit the assignees for resolving
            for assignee in issue_data.get("assignees", []):
                contributions.append({
                    "developer": assignee.get("login", ""),
                    "type": "issue_resolved",
                    "description": f"Resolved: {issue_data.get('title', '')}",
                    "issue_number": issue_data.get("number", 0),
                    "repo": repo,
                })

        return contributions

    async def _handle_review(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle pull request review event"""
        action = payload.get("action", "")
        review = payload.get("review", {})
        pr = payload.get("pull_request", {})
        repo = payload.get("repository", {}).get("full_name", "")

        # Only count submitted reviews
        if action != "submitted":
            return []

        reviewer = review.get("user", {}).get("login", "")
        pr_author = pr.get("user", {}).get("login", "")

        # Don't reward self-reviews
        if reviewer == pr_author:
            return []

        return [{
            "developer": reviewer,
            "type": "code_review",
            "description": f"Reviewed PR #{pr.get('number', 0)}: {pr.get('title', '')}",
            "pr_number": pr.get("number", 0),
            "repo": repo,
        }]


# =============================================================================
# CONTRIBUTION TRACKER
# =============================================================================

class ContributionTracker:
    """
    Main contribution tracking system.

    Combines GitHub API, webhooks, and local git operations
    to track all developer contributions.
    """

    def __init__(
        self,
        github_token: Optional[str] = None,
        webhook_secret: Optional[str] = None,
        tracked_repos: Optional[List[str]] = None,
    ):
        self.github = GitHubClient(github_token)
        self.webhook_handler = WebhookHandler(webhook_secret)
        self.git_ops = GitOperations()
        self.tracked_repos = tracked_repos or TRACKED_REPOS

        # Processed contribution IDs to prevent duplicates
        self._processed: Set[str] = set()

        logger.info(f"ContributionTracker initialized for {len(self.tracked_repos)} repos")

    async def scan_contributions(
        self,
        since: Optional[datetime] = None,
        developers: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Scan for new contributions across all tracked repos.

        Args:
            since: Only get contributions after this date
            developers: Filter by specific developers

        Returns:
            List of contribution data
        """
        since = since or (datetime.now() - timedelta(days=7))
        all_contributions = []

        for repo in self.tracked_repos:
            owner, repo_name = repo.split("/")

            # Get commits
            commits = await self.github.get_commits(owner, repo_name, since=since)
            for commit in commits:
                if developers and commit.author_name not in developers:
                    continue

                contribution_id = f"commit:{commit.hash}"
                if contribution_id in self._processed:
                    continue

                self._processed.add(contribution_id)
                all_contributions.append({
                    "developer": commit.author_name,
                    "type": commit.categorize(),
                    "description": commit.message,
                    "commit_hash": commit.hash,
                    "repo": repo,
                    "timestamp": commit.timestamp,
                })

            # Get merged PRs
            prs = await self.github.get_pull_requests(owner, repo_name, state="closed")
            for pr in prs:
                if not pr.merged:
                    continue
                if pr.merged_at and pr.merged_at < since:
                    continue
                if developers and pr.author not in developers:
                    continue

                contribution_id = f"pr:{repo}:{pr.number}"
                if contribution_id in self._processed:
                    continue

                self._processed.add(contribution_id)
                all_contributions.append({
                    "developer": pr.author,
                    "type": pr.categorize(),
                    "description": pr.title,
                    "pr_number": pr.number,
                    "repo": repo,
                    "timestamp": pr.merged_at or pr.created_at,
                })

        return all_contributions

    async def process_webhook(
        self,
        event_type: str,
        payload: Dict[str, Any],
        signature: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Process a GitHub webhook event.

        Args:
            event_type: GitHub event type
            payload: Webhook payload
            signature: X-Hub-Signature-256 header

        Returns:
            List of contribution data from the event
        """
        # Verify signature if provided
        if signature:
            payload_bytes = json.dumps(payload).encode()
            if not self.webhook_handler.verify_signature(payload_bytes, signature):
                logger.warning("Invalid webhook signature")
                return []

        # Handle the event
        contributions = await self.webhook_handler.handle_event(event_type, payload)

        # Filter out already processed
        new_contributions = []
        for c in contributions:
            contribution_id = self._generate_id(c)
            if contribution_id not in self._processed:
                self._processed.add(contribution_id)
                new_contributions.append(c)

        return new_contributions

    def _generate_id(self, contribution: Dict[str, Any]) -> str:
        """Generate unique ID for a contribution"""
        if contribution.get("commit_hash"):
            return f"commit:{contribution['commit_hash']}"
        elif contribution.get("pr_number"):
            return f"pr:{contribution.get('repo', '')}:{contribution['pr_number']}"
        elif contribution.get("issue_number"):
            return f"issue:{contribution.get('repo', '')}:{contribution['issue_number']}"
        else:
            return hashlib.sha256(json.dumps(contribution, default=str).encode()).hexdigest()[:16]

    async def get_developer_stats(self, username: str) -> Dict[str, Any]:
        """Get contribution statistics for a developer"""
        contributions = await self.github.get_user_contributions(
            username,
            repos=self.tracked_repos,
        )

        return {
            "username": username,
            "total_commits": len(contributions["commits"]),
            "total_prs": len(contributions["pull_requests"]),
            "merged_prs": len([pr for pr in contributions["pull_requests"] if pr.merged]),
            "issues_created": len(contributions["issues_created"]),
            "issues_resolved": len(contributions["issues_resolved"]),
            "code_reviews": len(contributions["reviews"]),
        }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Data Classes
    "GitCommit",
    "PullRequest",
    "Issue",
    "CodeReview",
    # Operations
    "GitOperations",
    "GitHubClient",
    "WebhookHandler",
    # Main Tracker
    "ContributionTracker",
    # Constants
    "TRACKED_REPOS",
    "CONTRIBUTION_REWARDS",
]
