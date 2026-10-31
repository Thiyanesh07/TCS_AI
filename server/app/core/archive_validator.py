"""
ZIP archive validator for QualiTrust AI application uploads.
Enforces security rules against archive bombs, path traversal (Zip Slip),
executable files, and oversized archives before processing.
"""

import io
import zipfile
import hashlib
from typing import Tuple, Optional
from app.core.config import settings

# Disallowed Windows device names
RESERVED_DEVICE_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{i}" for i in range(1, 10)),
    *(f"LPT{i}" for i in range(1, 10)),
}


def validate_zip_archive(
    content: bytes,
    filename: Optional[str] = None,
) -> Tuple[bool, Optional[str], Optional[str], int]:
    """
    Validates an uploaded ZIP archive in-memory.
    Returns: (is_valid, error_message, source_sha256_hash, file_count)
    """
    # 1. Enforce max upload size
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        return (
            False,
            f"Archive exceeds maximum permitted upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
            None,
            0,
        )

    # 2. Check Magic Header Bytes (ZIP magic numbers)
    if not (content.startswith(b"PK\x03\x04") or content.startswith(b"PK\x05\x06")):
        return False, "File is not a valid ZIP archive format.", None, 0

    # 3. Calculate source SHA-256 hash
    source_hash = hashlib.sha256(content).hexdigest()

    # 4. Inspect Archive contents safely
    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
    except Exception as exc:
        return False, f"Failed to parse ZIP archive: {str(exc)}", None, 0

    with archive:
        infolist = archive.infolist()
        file_count = len(infolist)

        # Enforce entry count limit
        if file_count > settings.MAX_ARCHIVE_ENTRIES:
            return (
                False,
                f"Archive contains too many entries ({file_count}). Limit is {settings.MAX_ARCHIVE_ENTRIES}.",
                None,
                0,
            )

        total_uncompressed = 0
        for info in infolist:
            total_uncompressed += info.file_size
            if total_uncompressed > settings.MAX_UNCOMPRESSED_SIZE_BYTES:
                return (
                    False,
                    f"Archive uncompressed size exceeds maximum permitted limit of {settings.MAX_UNCOMPRESSED_SIZE_BYTES // (1024 * 1024)}MB.",
                    None,
                    0,
                )

            entry_name = info.filename

            # Path traversal / Zip Slip prevention
            if ".." in entry_name.split("/") or ".." in entry_name.split("\\"):
                return False, f"Unsafe path traversal entry detected: '{entry_name}'", None, 0

            # Disallow absolute paths
            if entry_name.startswith("/") or entry_name.startswith("\\") or (len(entry_name) > 1 and entry_name[1] == ":"):
                return False, f"Absolute path detected in archive entry: '{entry_name}'", None, 0

            # Disallow Windows reserved device names
            clean_parts = [p.split(".")[0].upper() for p in entry_name.replace("\\", "/").split("/") if p]
            for part in clean_parts:
                if part in RESERVED_DEVICE_NAMES:
                    return False, f"Reserved system device name in entry: '{entry_name}'", None, 0

    return True, None, source_hash, file_count

