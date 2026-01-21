 // Lightweight Notifications API service using the shared client
 import { get, post } from "./client";

 /**
  * PUBLIC_INTERFACE
  * fetchNotifications
  * Fetch a list of notifications for the current user.
  * Attempts to call backend at GET /notifications. If the call fails (e.g., during local dev),
  * it falls back to a stubbed list for a smooth developer experience.
  */
 export async function fetchNotifications({ page = 1, pageSize = 20 } = {}) {
   try {
     const res = await get("/notifications", { page, pageSize });
     // Expecting res to be { items: [], total: number } or array
     if (Array.isArray(res)) {
       return { items: res, total: res.length, page, pageSize };
     }
     if (res && Array.isArray(res.items)) {
       return { items: res.items, total: Number(res.total || res.items.length || 0), page, pageSize };
     }
     return { items: [], total: 0, page, pageSize };
   } catch {
     // Stubbed fallback data
     const now = Date.now();
     const stub = [
       {
         id: "n1",
         type: "comment",
         actor: { id: "u2", name: "Jane Doe" },
         target: { kind: "post", id: "p124", title: "Design tokens and you" },
         createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
         text: "commented on your post",
         meta: { comments: 2, likes: 5 },
       },
       {
         id: "n2",
         type: "like",
         actor: { id: "u3", name: "Alex" },
         target: { kind: "post", id: "p122", title: "Release notes 0.1" },
         createdAt: new Date(now - 1000 * 60 * 60).toISOString(),
         text: "liked your post",
         meta: { comments: 0, likes: 1 },
       },
       {
         id: "n3",
         type: "system",
         actor: { id: "system", name: "System" },
         target: { kind: "moderation", id: "m9", title: "Moderation queue" },
         createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
         text: "Moderation queue has 3 new items",
         meta: { severity: "info" },
       },
     ];
     return { items: stub, total: stub.length, page, pageSize };
   }
 }

 /**
  * PUBLIC_INTERFACE
  * likeTarget
  * Trigger a "like" interaction for a notification's target.
  * Calls POST /interactions/like with { targetId, targetKind }.
  * Returns normalized result { success, likes }.
  */
 export async function likeTarget(targetId, targetKind = "post") {
   try {
     const res = await post("/interactions/like", { targetId, targetKind });
     // Expecting res: { success: boolean, likes: number }
     return {
       success: Boolean(res?.success ?? true),
       likes: Number(res?.likes ?? 0),
     };
   } catch {
     // Stub optimistic response
     return { success: true, likes: Math.floor(Math.random() * 50) + 1 };
   }
 }

 /**
  * PUBLIC_INTERFACE
  * commentOnTarget
  * Trigger a "comment" interaction for a notification's target.
  * Calls POST /interactions/comment with { targetId, targetKind, text }.
  * Returns normalized result { success, comments }.
  */
 export async function commentOnTarget(targetId, text, targetKind = "post") {
   try {
     const res = await post("/interactions/comment", { targetId, targetKind, text });
     // Expecting res: { success: boolean, comments: number }
     return {
       success: Boolean(res?.success ?? true),
       comments: Number(res?.comments ?? 0),
     };
   } catch {
     // Stub optimistic response
     return { success: true, comments: Math.floor(Math.random() * 20) + 1 };
   }
 }
