# Integration Hardening Status (Synchronized)

**Last synced:** 2025-09-24  
**Source of truth:** [`docs/INTEGRATION_FIXES_PR.md`](../../INTEGRATION_FIXES_PR.md)

This entry mirrors the refreshed integration summary. The earlier version asserted fixes that were never applied (e.g., missing import additions). The synchronized notes now reflect the actual state of the repository.

## Highlights

- ✅ RTK Query base API consolidated around `baseQueryWithReauth` with redundant imports removed.
- ✅ Complaint attachments served by both `/complaints/:id/attachments` and `/uploads/complaint/:id/attachment` via the same controller.
- ✅ Dashboard utilities centralized in `client/lib` modules and actively imported.
- ⚠️ `/api/auth/refresh` endpoint absent; frontend mutation remains unused until implemented.
- ⚠️ Legacy Redux thunks still back several dashboards; migration planning required.
- ⚠️ Documentation cleanup identified unused helper components awaiting removal.

Consult the linked primary document for full testing notes and next steps.
