# Refactoring Progress - Pilgrimages Module

## ✅ Completed (Critical Issues)

1. **UUID Validation** ✅
   - Added to: route.ts, [id]/route.ts, [id]/documents/route.ts, [id]/participants/route.ts, [id]/participants/[participantId]/route.ts, [id]/schedule/route.ts, [id]/payments/route.ts

2. **JSON Parsing Error Handling** ✅
   - Added to: route.ts, [id]/route.ts, [id]/participants/route.ts, [id]/participants/[participantId]/route.ts, [id]/schedule/route.ts, [id]/payments/route.ts

3. **Parish Access Validation** ✅
   - Added to: route.ts, [id]/route.ts, [id]/documents/route.ts, [id]/participants/route.ts, [id]/participants/[participantId]/route.ts, [id]/schedule/route.ts, [id]/payments/route.ts

4. **Permission Standardization** ✅
   - Changed `pilgrimages:edit` → `pilgrimages:update` in: [id]/route.ts, [id]/documents/route.ts, [id]/schedule/route.ts
   - Changed `pilgrimages:manage_participants` → `pilgrimages:update` in: [id]/participants/route.ts, [id]/participants/[participantId]/route.ts
   - Changed `pilgrimages:manage_payments` → `pilgrimages:update` in: [id]/payments/route.ts

5. **Date Range Validations** ✅
   - Added to createPilgrimageSchema: endDate >= startDate, registrationDeadline <= startDate, maxParticipants >= minParticipants
   - Added to updatePilgrimageSchema: same validations

6. **File Upload Security** ✅
   - Sanitized file extensions in [id]/documents/route.ts

7. **Error Response Format** ✅
   - Using formatValidationErrors in: route.ts, [id]/route.ts, [id]/participants/route.ts, [id]/participants/[participantId]/route.ts, [id]/schedule/route.ts, [id]/payments/route.ts

8. **Export Participants Hook** ✅
   - Added TODO comment, removed API call to non-existent endpoint

9. **Frontend alert()** ✅
   - Removed alert() call in participants page (validation handled by form)

## ⏳ Remaining Routes

Routes that still need the same fixes (UUID validation, parish access, permission standardization, JSON error handling, formatValidationErrors):

1. `[id]/schedule/[scheduleId]/route.ts`
2. `[id]/payments/[paymentId]/route.ts`
3. `[id]/payments/summary/route.ts`
4. `[id]/documents/[documentId]/route.ts`
5. `[id]/documents/[documentId]/download/route.ts`
6. `[id]/transport/route.ts`
7. `[id]/transport/[transportId]/route.ts`
8. `[id]/accommodation/route.ts`
9. `[id]/accommodation/[accommodationId]/route.ts`
10. `[id]/meals/route.ts`
11. `[id]/meals/[mealId]/route.ts`
12. `[id]/participants/[participantId]/confirm/route.ts`
13. `[id]/participants/[participantId]/cancel/route.ts`
14. `[id]/approve/route.ts`
15. `[id]/publish/route.ts`
16. `[id]/close/route.ts`
17. `[id]/cancel/route.ts`
18. `[id]/statistics/route.ts`
19. `[id]/workflow/route.ts`

## Summary

**Progress**: ~30% of routes refactored (6 out of ~20 routes)
**Critical routes**: ✅ All main CRUD routes done
**Remaining**: Sub-resource routes and workflow routes



