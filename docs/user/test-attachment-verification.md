# Attachment Preview & Verification Guide

## Purpose

Confirm that complaint attachments (images/PDF) upload and preview correctly across the app.

## Prerequisites

- App running locally (npm run dev)
- Test images and a small PDF (<= 2MB each)
- User roles: Guest and Citizen

## Steps

1. Guest Flow

- Go to the unified complaint form (/complaint)
- Add 1–3 images (jpg/png/webp) and 1 PDF
- Submit and complete OTP
- Verify: Thumbnails render, PDF shows as file badge, upload size/type validation enforced

2. Citizen Flow

- Login as a citizen
- Create a new complaint with 2 images
- Verify: Previews show; removing a file updates the list

3. Complaint Details

- Open the newly created complaint details
- Verify: Attachment gallery loads; clicking opens full-view modal; PDF downloads

4. Error Cases

- Try uploading >10MB file → expect validation error toast
- Try uploading unsupported type (.exe) → blocked with message

## Troubleshooting

- If previews don't render, check console and network tab for /api/uploads responses
- Ensure MAX_FILE_SIZE env matches UI validation
- Verify server upload path is writable

## Notes

- Max 5 files per complaint
- Images are compressed client-side when possible
