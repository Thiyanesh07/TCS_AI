"""
API target URL validator for QualiTrust AI.
Enforces SSRF prevention, disallowing internal addresses, loopback,
cloud metadata, private CIDRs, and credentials in URLs.
"""

import socket
import ipaddress
from urllib.parse import urlparse
from typing import Tuple, Optional
from app.core.config import settings


def validate_api_target_url(target_url: str) -> Tuple[bool, Optional[str]]:
    """
    Validates external API target URL.
    Returns: (is_valid, error_message)
    """
    if not target_url:
        return False, "Target URL is required."

    try:
        parsed = urlparse(target_url.strip())
    except Exception:
        return False, "Malformed target URL format."

    # 1. Scheme check: HTTPS enforced unless explicit dev override
    if parsed.scheme.lower() not in ("http", "https"):
        return False, "Target URL scheme must be HTTP or HTTPS."

    if parsed.scheme.lower() == "http" and not settings.ALLOW_INSECURE_TARGET_URLS:
        return False, "Insecure HTTP scheme is disallowed. HTTPS is required."

    # 2. Check for embedded credentials (e.g. https://user:pass@example.com)
    if parsed.username or parsed.password:
        return False, "Target URL must not contain embedded user credentials."

    hostname = parsed.hostname
    if not hostname:
        return False, "Target URL must contain a valid host name."

    # 3. Disallow localhost and common local domain names
    lower_host = hostname.lower()
    if lower_host in ("localhost", "127.0.0.1", "::1", "metadata.google.internal") or lower_host.endswith(".local") or lower_host.endswith(".internal"):
        if not settings.ALLOW_INSECURE_TARGET_URLS:
            return False, "Target host cannot resolve to localhost or internal network names."

    # 4. Resolve DNS and inspect target IP address against SSRF blacklist
    try:
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror:
        return False, f"Could not resolve host '{hostname}'."

    for item in addr_info:
        ip_str = item[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue

        if not settings.ALLOW_INSECURE_TARGET_URLS:
            if ip.is_loopback:
                return False, f"Target resolves to loopback IP address ({ip_str})."
            if ip.is_private:
                return False, f"Target resolves to private network IP address ({ip_str})."
            if ip.is_link_local:
                return False, f"Target resolves to link-local IP address ({ip_str})."
            if ip.is_multicast:
                return False, f"Target resolves to multicast IP address ({ip_str})."
            if ip.is_reserved:
                return False, f"Target resolves to reserved IP address ({ip_str})."
            # Explicit cloud metadata check
            if str(ip) == "169.254.169.254":
                return False, "Target resolves to cloud metadata service address."

    return True, None

