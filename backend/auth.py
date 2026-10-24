import hashlib
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """PBKDF2-HMAC-SHA256 password hashing with salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(stored_hash: str, password_attempt: str) -> bool:
    """Verifies a password against the stored salt$hash string."""
    try:
        salt, key_hex = stored_hash.split('$')
        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            password_attempt.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return secrets.compare_digest(computed_key.hex(), key_hex)
    except Exception:
        return False

def generate_session_token() -> str:
    return secrets.token_hex(32)

# In-memory rate limiting tracker for authentication protection
_LOGIN_ATTEMPTS: Dict[str, list] = {}

def check_login_rate_limit(key: str, max_attempts: int = 10, window_seconds: int = 60) -> bool:
    """Returns True if within rate limit, False if rate limit exceeded."""
    now = datetime.now()
    attempts = _LOGIN_ATTEMPTS.get(key, [])
    # Keep attempts within sliding window
    attempts = [t for t in attempts if (now - t).total_seconds() < window_seconds]
    if len(attempts) >= max_attempts:
        _LOGIN_ATTEMPTS[key] = attempts
        return False
    attempts.append(now)
    _LOGIN_ATTEMPTS[key] = attempts
    return True
