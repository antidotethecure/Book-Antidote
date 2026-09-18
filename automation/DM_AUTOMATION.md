# DM Queue daily refill — standard operating procedure

You are a Claude session that was woken by a scheduled Routine to do ONE thing: keep the
restaurant DM queue at antidotethefoodie.com/dm topped up with 50–60 real, verified,
never-duplicated Instagram leads, expanding outward from inner Los Angeles ring by ring.
You have no memory of any prior run — everything you need is in this repo. Follow this
document exactly; don't improvise the process, only the research content.

## What this system is and isn't

This is a **paid food-content-production outreach list**, not a free-review list. The
DM pitch template on the page already says plainly "this is a paid production, not a free
review" — never change that back to implying anything is free, and never invent a specific
price.

Every business on this list must be real and independently verified. Never guess an
Instagram handle, phone number, or address. If you can't verify something, drop it rather
than include it with fabricated or guessed contact info.

## Files involved

- **Repo**: `antidotethecure/book-antidote` (the live site is served from its `main` branch
  via GitHub Pages, custom domain antidotethefoodie.com — confirmed via the `CNAME` file at
  the repo root).
- **Live page**: `dm/index.html` in that repo. This is the file you edit and push.
- **Claude artifact mirror**: `https://claude.ai/artifact/MkR5HXS3meE5jHMfwef2Vv` — the same
  page also gets published here on every update. Keep both in sync.
- **State file**: `automation/dm-progress.json` in the same repo — tracks which ring is
  next, every handle ever added (so you never re-add a business), and the history of
  batches (so you know which one is oldest when trimming).
- **This file**: `automation/DM_AUTOMATION.md`.

## Keep the DM tick sync (added 2026-09-17)

`dm/index.html` has a `syncTick(id, isDone)` function called from the checkbox `change`
handler. It posts each "done" tick to `https://drizzle-bowl-scores.higgsfield.app/api/dm-ticks`
so Antidote's assistant can count the DMs he sent today. When you rebuild or merge the page,
keep that function and its call exactly as they are. Never remove them.

## Step by step

1. **Clone/pull the repo fresh.** Use `add_repo` with `access: "push"` for
   `antidotethecure/book-antidote`, then `git clone --depth 1` per that tool's
   instructions. Before ever pushing, `git fetch origin main` and merge (`git merge
   origin/main`) — other unrelated work sometimes lands on this repo's `main` between runs;
   never force-push, never discard those commits.

2. **Read `automation/dm-progress.json`.** Note `nextRingIndex`, `targetMin`, `targetMax`,
   the `rings` array, and `usedHandles` (a flat list of every Instagram handle already on
   the list historically — never propose one of these again).

3. **Read the live `dm/index.html`.** Extract the current `RAW` array, `REGION` map, and
   `LIGHT` set from its `<script>` block, and count how many rows are currently in `RAW`.

4. **Decide the ring.** Take `rings[nextRingIndex]`. If `nextRingIndex` is past the end of
   the array, wrap to 0 — the exclusion list (`usedHandles`) keeps this from producing
   duplicates even when a ring repeats.

5. **Research that ring.** Spawn a research agent (the general-purpose agent, with
   `run_in_background: false` since you need its result before continuing) with a brief
   modeled on this pattern (used successfully for the OC and IE batches already on this
   list — check recent commits to `dm/index.html` for the exact phrasing if you want the
   full template):
   - Real, independently-operating restaurants only — no national/regional chains.
   - Cities: the ring's `cities` list, exactly as given.
   - Exclude every handle in `usedHandles` — tell the agent the list explicitly.
   - Target count: enough to bring the total row count to somewhere in
     `[targetMin, targetMax]` after this batch is added (see step 7 for the trim that may
     also happen) — in practice this usually means asking for roughly 12–16 new leads,
     but adjust based on the current total from step 3.
   - Verify each Instagram handle by live search — never guess.
   - Mix of cuisines, prioritize smaller/independent spots over already-famous ones.
   - Standout dish field: only fill in if a real review/article explicitly names one, with
     its source URL; leave blank otherwise. Never invent a dish.
   - Ask the agent to also report which real businesses it found but excluded (closed, no
     verifiable handle, chain, etc.) — keep that in your own summary/commit message context,
     it doesn't need to go on the page.

6. **Turn the agent's results into rows.** Each row is
   `[name, category, city, "@handle", "https://site-or-empty", "phone-or-empty", "hook-or-empty"]`
   — same shape as the existing rows in `RAW`. Prefix bare domains with `https://`. Escape
   quotes/backslashes for JS string literals. Drop any row whose handle is already in
   `usedHandles` (the agent was told to avoid these, but double-check).

7. **Merge and trim.**
   - Append the new rows to the END of the existing `RAW` array (never reorder or edit
     existing rows — their ids are derived from their Instagram handle, `id:r[3].slice(1)
     .toLowerCase()` in the page's `LEADS` mapping, so appending is safe for anyone's saved
     checkmarks; removing or reordering existing rows is also safe by id, but only do it as
     described below).
   - If the new total would exceed `targetMax` (60), remove the **entire oldest batch** from
     `RAW` (matched by the handles listed in that batch's `entryIds` in `dm-progress.json`)
     to make room — not a partial trim, the whole batch, per the site owner's explicit
     choice. Never remove the batch you just added, even if that leaves the total above 60
     temporarily. Never remove the manually-curated first batch unless it is genuinely the
     oldest at that point and every other batch has already been removed.
   - Update the `REGION` map: add an entry for every new city, choosing a sensible region
     bucket (reuse an existing bucket name if the city is a natural fit — e.g. anything
     South Bay coastal joins `"South Bay"` if that bucket exists — or introduce a new bucket
     named after the ring, e.g. `"Downtown & Central LA"`, `"Valley"`, `"Gateway Cities"`).
     Keep bucket count reasonable (aim for 5–10 total) so the region filter dropdown stays
     usable.
   - Update the `LIGHT` set: add any new coffee/bakery/pastry-only spot by exact name,
     matching the judgment already used for existing entries (e.g. "Toasted Inc" — coffee/
     toast, not a full meal).

8. **Update the masthead copy.** The `<p class="sub">` text should stay roughly evergreen
   ("Rolling list, topped up automatically... expanding outward... 50–60 leads") — update
   only if the wording has drifted from that intent. Do not revert the pitch template's
   "paid production, not a free review" line.

9. **Validate before publishing** — this has caught real bugs before, don't skip it:
   - Extract the `<script>` block and run `node --check` on it.
   - Confirm `RAW` has no malformed rows (7 fields each), no duplicate handles, and every
     city has a `REGION` entry.
   - Do a stubbed-DOM `render()` execution (see recent commits to `dm-queue` for the pattern
     used) and confirm the row count matches expectations and ids are unique.

10. **Push to the repo FIRST — this is the actual deliverable, do this before touching the
    artifact.** Two runs in a row (2026-09-17 and 2026-09-18) got as far as publishing to the
    Claude artifact and then silently stopped — never reached the repo push, never updated
    `dm-progress.json` — with no error, no message, nothing. The cause wasn't fully diagnosed,
    but the pattern was the same both times: the artifact publish happened, the repo push
    didn't. Whatever the reason, the fix is priority order: **the live site at
    antidotethefoodie.com/dm is what the site owner actually looks at. If you only get through
    one of "push to repo" or "publish to artifact" before running out of room, it must be the
    repo push.** So do that first, not last:
    a. Build the BARE page (no `<!doctype>`, no `<html>`, no `<head>`, no `<body>` — starts
       directly with `<title>Restaurant DM Queue</title>`, ends with `</script>`).
    b. Wrap it for the repo: `<!doctype html>\n<html lang="en"><head>\n<meta
       charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,
       viewport-fit=cover">\n<meta name="robots" content="noindex,nofollow">\n` then the bare
       content unchanged, closed with `\n</body></html>`. (Confirm against `dm/index.html`'s
       current head before writing, in case the pattern has shifted.)
    c. Write it to `dm/index.html`. In the SAME commit, also update
       `automation/dm-progress.json` (append the new batch — today's date, `"source":"auto"`,
       the ring name, the new handles; append those handles to `usedHandles`; remove the
       trimmed batch's entry from `batches` if you trimmed; set `nextRingIndex` to the next
       index, wrapping to 0 past the end of `rings`). One commit, both files, so a partial
       run can't leave the page and the state file disagreeing with each other.
    d. `git fetch origin main` + merge (state may have changed since step 1 — this repo is
       shared with other work, e.g. an unrelated "Drizzle Bowl" feature; never discard those
       commits). Commit with a message naming the ring and city list. Push.
    e. **Verify it before doing anything else**: re-fetch `dm/index.html` from `origin/main`
       (the actual remote, not your local working copy) and confirm its `RAW` row count
       matches what you intended, and that `dm-progress.json` on `origin/main` shows the
       `nextRingIndex` you just set. Do not proceed to the artifact until this is confirmed —
       if it fails, that is the "fundamentally broken" case in step 12, stop and say so rather
       than trying the artifact anyway.

11. **Then publish the same bare page to the Claude artifact** (from step 10a), following the
    artifact tool's read-then-publish flow (read the current live version first, then publish
    your merged file over it — it refuses a publish that hasn't seen the latest live version).
    This is a secondary mirror — if you're low on room and the repo push in step 10 already
    succeeded, it's fine to skip this and let the next run catch it up; it is never fine to
    skip step 10.

    **Sizing the batch when a trim is needed:** if adding fewer new leads than the oldest
    batch contains would drop the total below `targetMin` once that batch is removed, research
    a bigger batch that day — enough new verified leads that, after the trim, the total lands
    back at or near `targetMax`, not just whatever a single ring happens to yield. A small
    fixed-size batch colliding with a large trim is how the list ends up far under the floor
    for days at a stretch.

12. **Do not message the user** if step 10 completed and verified (step 11 is optional, see
    above). This was explicitly requested to run fully autonomously with no per-run check-in —
    the person will look at the site itself if they want to see what changed. Only break this
    rule if step 10 is fundamentally broken and you cannot get it to complete at all — in that
    case, a brief note is better than a silent partial run.

## Guardrails — never do these

- Never fabricate a business, handle, phone number, address, or standout dish.
- Never imply the review/production is free — the pitch stays "paid production, not a free
  review."
- Never force-push, rewrite history, or discard commits you didn't make.
- Never drop a partial batch when trimming — whole oldest batch only.
- Never change the row `id` scheme (handle-derived) back to positional.
