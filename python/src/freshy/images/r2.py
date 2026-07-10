"""Upload venue images to Cloudflare R2."""

from __future__ import annotations

import logging
import os
import uuid
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class R2Config:
    account_id: str
    access_key_id: str
    secret_access_key: str
    bucket_name: str
    public_url: str


@dataclass(frozen=True)
class UploadedImage:
    object_key: str
    public_url: str


def read_r2_config_from_env() -> R2Config:
    account_id = os.environ.get("R2_ACCOUNT_ID", "").strip()
    access_key_id = os.environ.get("R2_ACCESS_KEY_ID", "").strip()
    secret_access_key = os.environ.get("R2_SECRET_ACCESS_KEY", "").strip()
    bucket_name = os.environ.get("R2_BUCKET_NAME", "").strip()
    public_url = os.environ.get("R2_PUBLIC_URL", "").strip()

    missing = [
        name
        for name, value in (
            ("R2_ACCOUNT_ID", account_id),
            ("R2_ACCESS_KEY_ID", access_key_id),
            ("R2_SECRET_ACCESS_KEY", secret_access_key),
            ("R2_BUCKET_NAME", bucket_name),
            ("R2_PUBLIC_URL", public_url),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing R2 environment variables: {', '.join(missing)}")

    return R2Config(
        account_id=account_id,
        access_key_id=access_key_id,
        secret_access_key=secret_access_key,
        bucket_name=bucket_name,
        public_url=public_url,
    )


def upload_place_image(
    *,
    slug: str,
    data: bytes,
    content_type: str,
    extension: str,
    config: R2Config,
) -> UploadedImage:
    """Upload bytes to R2 under places/{slug}/."""
    try:
        import boto3
        from botocore.config import Config
    except ImportError as exc:
        raise RuntimeError(
            "boto3 is required for --upload-r2. Install with: pip install freshy[r2]"
        ) from exc

    object_key = f"places/{slug}/{uuid.uuid4()}.{extension}"
    endpoint = f"https://{config.account_id}.r2.cloudflarestorage.com"

    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=config.access_key_id,
        aws_secret_access_key=config.secret_access_key,
        config=Config(signature_version="s3v4"),
    )
    client.put_object(
        Bucket=config.bucket_name,
        Key=object_key,
        Body=data,
        ContentType=content_type,
    )

    base = config.public_url.rstrip("/")
    public_url = f"{base}/{object_key}"
    logger.info("[Images] Uploaded %s", public_url)
    return UploadedImage(object_key=object_key, public_url=public_url)
