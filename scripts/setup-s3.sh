#!/usr/bin/env bash
# Create S3 bucket + IAM user for Vibra media uploads (avatars, banners, gallery, chat).
# Requires: aws CLI configured (vibra-deploy).
#
# Usage:
#   bash scripts/setup-s3.sh
# Prints env vars to add on the Lightsail server / .env
set -euo pipefail

export PATH="${HOME}/Library/Python/3.9/bin:${HOME}/.local/bin:/opt/homebrew/bin:${PATH}"

REGION="${AWS_REGION:-us-east-2}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BUCKET="${S3_BUCKET_NAME:-vibra-media-${ACCOUNT_ID}}"
IAM_USER="${S3_IAM_USER:-vibra-s3}"
POLICY_NAME="${S3_POLICY_NAME:-VibraMediaS3Access}"

echo "==> Account ${ACCOUNT_ID} / region ${REGION}"
echo "==> Bucket ${BUCKET}"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "==> Bucket already exists"
else
  echo "==> Creating bucket"
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=${REGION}"
  fi
fi

echo "==> Block public access (use public-read objects selectively via ACL/policy later)"
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "==> Bucket ownership / ACL enabled for optional public-read objects"
aws s3api put-bucket-ownership-controls \
  --bucket "$BUCKET" \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerPreferred}]' >/dev/null || true

# Public read for objects under media prefixes (avatars/banners/gallery readable by web)
echo "==> Bucket policy: public read for media/*"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET}/media/*"]
    }
  ]
}
EOF
)"

echo "==> CORS for browser / Netlify uploads"
aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "$(cat <<EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "Location"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
)"

POLICY_DOC="$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::${BUCKET}"]
    },
    {
      "Sid": "ObjectRW",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:PutObjectAcl"],
      "Resource": ["arn:aws:s3:::${BUCKET}/media/*"]
    }
  ]
}
EOF
)"

if ! aws iam get-user --user-name "$IAM_USER" >/dev/null 2>&1; then
  echo "==> Creating IAM user ${IAM_USER}"
  aws iam create-user --user-name "$IAM_USER" >/dev/null
fi

echo "==> Putting IAM policy ${POLICY_NAME}"
aws iam put-user-policy \
  --user-name "$IAM_USER" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$POLICY_DOC"

echo "==> Creating access key for ${IAM_USER}"
KEY_JSON="$(aws iam create-access-key --user-name "$IAM_USER" --output json)"
ACCESS_KEY="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["AccessKey"]["AccessKeyId"])' <<<"$KEY_JSON")"
SECRET_KEY="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["AccessKey"]["SecretAccessKey"])' <<<"$KEY_JSON")"

PUBLIC_BASE="https://${BUCKET}.s3.${REGION}.amazonaws.com"

echo
echo "============================================"
echo " S3 ready"
echo " BUCKET=${BUCKET}"
echo " REGION=${REGION}"
echo " PUBLIC_BASE=${PUBLIC_BASE}"
echo
echo " Add to Lightsail ~/vibra/.env :"
echo " S3_BUCKET=${BUCKET}"
echo " S3_REGION=${REGION}"
echo " S3_PUBLIC_BASE_URL=${PUBLIC_BASE}"
echo " AWS_ACCESS_KEY_ID=${ACCESS_KEY}"
echo " AWS_SECRET_ACCESS_KEY=${SECRET_KEY}"
echo "============================================"
echo
echo "Save the secret now; IAM will not show it again."
