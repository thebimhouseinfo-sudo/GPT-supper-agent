# GSA — Refactor Upgrade Plan (single integration line)

Status: **PLANNING DRAFT — chờ Human duyệt bản Criteria và kế hoạch trước khi chạy source implementation**.
Working branch: **`upgrade/gsa-refactor`** (tạo từ `main` tại `be8b663a878cca9c5b2920145f57fd20291d6164`).
Criteria duy nhất: **`docs/refactor/GSA-LY-THUYET-CRITERIA-REFRACTOR-DRAFT.md`** trên chính nhánh này; blob được đọc để lập plan: `562778aad9c9d224e265ba6c519e8056f22eda7f`.
Mức thẩm quyền: **plan triển khai đề xuất**, không phải Criteria khác; nội dung CHƯA CHỐT trong Criteria không được tự động chuyển thành yêu cầu bắt buộc.

## GOAL

Từ GSA hiện có, phát triển một **generic coding/project-agent framework gọn, đáng tin và có thể dùng ngay** cho dự án mới hoặc dự án đang triển khai dở trên ChatGPT Web. Mỗi GSA Project có **một Criteria hiện hành** mô tả đích cần đạt; Planner khởi tạo `AGENTS.md` tối thiểu; Coder và Tester hoạt động generic, chỉ nạp **add-in chuyên môn tùy chọn** khi Task cần. Planner, Reviewer và Critic Reviewer (CR) dùng chung trên mọi Project. Sau phê duyệt thực thi, GSA tự đi qua các bước AUTO trong cùng lượt hoạt động và tự xử lý kiểm chứng/sửa lỗi trong quyền; chỉ dừng ở quyết định Human thật, blocker được chứng minh hoặc phiên bị gián đoạn. Git, Memory, review và resume phải đúng quyền và dựa trên bằng chứng thực tế, không dựa vào lời hứa.

**Hoàn thành nghĩa là:** các luồng trên được chứng minh bằng test âm/dương, public-path/live pilot phù hợp, exact revision và kết quả người dùng nhìn thấy; một codebase có ít trách nhiệm trùng lặp và ít thao tác thừa hơn nhưng không yếu đi ở ranh giới bảo mật, idempotency, compatibility hoặc evidence.

**Không làm:** dựng lại lịch sử approval/chat trước khi GSA tiếp nhận Project; viết bootstrap riêng cho từng repository; thêm agent thường trực, engine gate thứ hai, background worker, kiến trúc đa model theo TOML Codex hoặc bộ Decision Logger hồi cứu. Không thay ý nghĩa Criteria dựa trên đề xuất của AI. Không tự merge `main`/deploy production.

## 1. Nguồn sự thật và phạm vi refactor

1. **Criteria** nắm WHAT/WHY/acceptance; duy nhất, chỉnh trực tiếp khi User phát sinh lý thuyết mới. Các đoạn `CHƯA CHỐT` tiếp tục ở **cùng** Criteria. Plan chỉ nắm HOW/WHEN và luôn kiểm tra lại Criteria blob mới nhất trước khi chỉnh công việc liên quan. Thay đổi Criteria không đòi viết một theory/roadmap khác.
2. **Source hiện tại** là bằng chứng thực thi, không tự động là chuẩn sản phẩm. Đối chiếu thực tế `main` + nhánh integration + runtime live; không suy ra deployed production chỉ từ README. Source truth thuộc repo sản phẩm; Project Memory là control plane thuộc private GitHub Memory Repo.
3. **Plan lịch sử:** `docs/plans/GSA-UPGRADE-INTEGRATION-ROADMAP.md` là kế hoạch CP0–CP7 đã qua; `GSA-RELIABILITY-*` và `LLC*` cũng thuộc các đợt riêng. Chỉ dùng để khảo sát tương thích/bài học. **Plan này là kế hoạch refactor đang hoạt động duy nhất** trên `upgrade/gsa-refactor`; không tiếp tục triển khai CP0–CP7 cũ lần nữa.
4. **Branch:** mọi thay đổi refactor hội tụ vào `upgrade/gsa-refactor`. Mặc định không phân nhánh thêm; một nhánh ngắn cho thử nghiệm có lý do phải được hợp nhất/đối chiếu vào nhánh này trước khi mốc sau tiêu thụ. `main` giữ nguyên cho đến quyết định release riêng. Đối chiếu drift bằng diff/commit thực, không tự merge/rebase toàn bộ nhánh cũ.
5. **Hạ tầng giữ lại:** authenticated GSA MCP (Supabase), GitHub Memory Repo, GitHub source, quyền Project/role, exact-SHA readback, NEXT/current durable workflow; `V2_STABLE` lịch sử vẫn đọc/tiếp tục được. Không bulk migrate Jobs/Run/Verification cũ. ChatGPT Web không là daemon chạy nền.

**Reality baseline đã khảo sát khi lập plan:** `supabase/functions/gsa-mcp/index.ts` hiện là runtime tập trung (~498 KB), chứa chức năng identity, memory-path/namespace, checkpoint/Job/Run và tool contract; `skills/gsa-job-runtime/SKILL.md` giữ giao thức điều phối; `skills/gsa-bootstrap/SKILL.md` là bootstrap runtime/account (khác Fresh Start Project); có các bộ test `test-lab/runtime-logic.test.cjs`, `reliability-*.test.cjs`, `llc58/59/60-*.test.cjs` và CI `.github/workflows/gsa-next-logic.yml`. Đây là các điểm cần khảo sát **từng phần theo thay đổi**, không phải lý do tự tách module hoặc sao chép toàn bộ runtime.

## 2. Nguyên tắc triển khai và review

- Mỗi Phase dưới đây tương ứng **một Milestone kết quả**, không tạo sáu loại lifecycle/gate mới. Trong mỗi Phase, Planner tạo một hoặc vài Job có **một causal chain**; Task là bước hữu ích, không tách thành micro-Job cho mỗi lệnh Git, doc hoặc test.
- **User approval:** chốt Criteria/plan để bắt đầu implementation; quyết định đổi mục tiêu/quyền; merge vào `main`; production deploy; các thao tác phá hủy/ngoài quyền vẫn cần đúng Human authority. Chấp thuận plan không phải tự động chấp thuận release. Không invent Human Gate chỉ cho việc tạo file/copy checkpoint.
- **AUTO sau phê duyệt:** tiến tới Task/Job/Milestone phụ thuộc tiếp theo **trong cùng lượt còn hoạt động**, khi đủ quyền và evidence đã được ghi/đọc lại. Checkpoint không phải tín hiệu kết thúc cuộc chat. Không giả lập tự chạy khi phiên đóng.
- **Reviewer:** chỉ áp dụng review bắt buộc theo **Foundation F13** cho nhóm nhạy cảm có thể xác định từ thay đổi thực tế: shared contracts/interfaces/schema; persisted-data migration/format; auth/permission/security-sensitive logic; CI/CD/workflow/deploy config; destructive operations; dependency manifest/lockfile làm đổi runtime/build. Ngoài floor này, review chỉ ở mốc có rủi ro thật hoặc đã được duyệt; **không** tự bắt Reviewer cho mọi lần đổi logic thông thường hoặc mọi Task. **Tester:** checkpoint khi có câu hỏi thực nghiệm/consumer hoặc behavior quan trọng; không tự đặt checkpoint khắp nơi. **CR vẫn Human-invoked** cho đến khi User thay đổi mục XI của Criteria; không tự kích hoạt CR theo mốc.
- Khi phát hiện gap mới: xác định đó là **sai hiện thực hóa** (Coder sửa), **sai plan** (Planner sửa plan), hay **đòi thêm/thay đổi WHAT** (trở lại Criteria cho User). Reviewer không biến nhận xét chưa duyệt thành requirement. Mọi gate/record mới phải có một failure scenario không thể bảo vệ bằng cơ chế hiện tại.
- **Progress proof:** trạng thái PREPARED hoặc "CI green" riêng không chứng minh kết quả. Ghi nhận exact source/runtime revision, executed test oracle, failed/skipped/unverified, người chịu trách nhiệm, rollback. Không tự tạo ngưỡng hiệu năng hoặc quota-savings % để làm PASS.
- **Change control:** Khi Criteria đổi giữa chừng, Planner cập nhật đúng phần Phase/Job bị ảnh hưởng; các phần không ảnh hưởng tiếp tục được. Không mở lại toàn bộ lịch sử và không tạo "plan V2" độc lập.

## 3. Milestone map toàn Project

| Mốc | Kết quả kiểm chứng được | Phụ thuộc | Bằng chứng tối thiểu | Tiếp theo |
|---|---|---|---|---|
| **M0 — Targeted Reality/Gate audit** | Bản đồ tối thiểu các đường ảnh hưởng tới M1–M5: KEEP / SIMPLIFY / REMOVE / NEEDS_PROBE, gắn rủi ro và Criteria | Criteria working + repo/runtime read | Ownership/call chain ở bề mặt sẽ thay đổi; negative controls phù hợp | **AUTO → M1** nếu plan đã được duyệt |
| **M1 — Fresh Start & Criteria** | Dự án mới và dự án dở được setup nhẹ; một Criteria hiện hành; `AGENTS.md` generic tối thiểu, không lịch sử approval | M0 | Project Memory/SHA readback và 2 đường khởi tạo; negative cross-Project | **AUTO → M2** |
| **M2 — Coder/Tester add-in** | Generic không cấu hình vẫn làm; Project chỉ thêm skills Coder/Tester, nạp lazy và không override | M1 | 3 kịch bản no-add-in / Coder add-in / Tester add-in, negative unauthorized skill | **AUTO → mốc phụ thuộc; M3 có thể làm độc lập** |
| **M3 — Criteria-first Planner** | Plan/milestone có GOAL, coverage đúng và không thêm requirement; thay Criteria chỉ cập nhật phần ảnh hưởng | **M1 (không cần M2)** | Plan review test missing/extra, revision change, AUTO/HUMAN | **AUTO → M4 sau khi M2 cũng sẵn sàng cho kịch bản add-in** |
| **M4 — Same-turn orchestration** | Checkpoint/readback rồi thực hiện AUTO hợp lệ; Reviewer/Tester/repair loop không bắt User gõ "continue" | **M2 + M3** | Planning loop + source/checkpoint scenario có đúng stop condition | **AUTO → M5** |
| **M5 — Simplify + durable correctness** | Bỏ/hợp nhất chỗ dư dựa trên evidence; recovery, Git, real testing giữ đúng quyền | M0–M4 | Before/after behavior/evidence và negative cases, regression V2/NEXT | **AUTO → M6** |
| **M6 — Field acceptance & release prep** | Chạy những luồng thật trên staging và Project pilot; bằng chứng đầy đủ, giới hạn rõ, có phương án rollback | M0–M5 | Exact staging/source, pilot results, review/CI/limitations | **HUMAN: main merge; HUMAN: production deploy** |

**Giải thích trạng thái mốc:** AUTO là đường điều phối đã được chấp thuận trong phiên đang hoạt động; HUMAN là quyền quyết định riêng, không là "checkpoint pending" chung. Nếu một Phase gặp blocker thực, chỉ phần việc phụ thuộc dừng. Mốc hoàn tất phải có kết quả đủ kiểm chứng, không chỉ có một report hay file schema mới. Một mốc đang chờ kiểm chứng host không bị giả PASS.

## Phase M0 — Kiểm kê thực tế và audit gate

### GOAL

Xác định chính xác **cái gì đang có, vì sao tồn tại, cái gì thiếu hoặc trùng** trước khi viết refactor. Bảo vệ hành vi đúng và không nhân bản cơ chế.

- **JP0 (SMALL/MEDIUM; Planner + Reviewer, source read-only):** chỉ dựng sơ đồ ownership/call chain cho các bề mặt sẽ chạm tới trong M1–M5: project create/open/status, Criteria/AGENTS.md, role/skill loading, Planner/review, AUTO continuation và giao điểm với cursor/checkpoint/Git. Những miền không bị sửa giữ nguyên và chỉ kiểm khi phụ thuộc thật. Đánh dấu MCP-owned vs ChatGPT orchestration vs GitHub external action. L0 tree → L1 selective source; không đọc toàn bộ index.ts hay audit mọi historical gate vô điều kiện.
- **JP0 audit:** với mỗi cơ chế **sẽ đụng tới hoặc thực sự chặn** luồng mới (đặc biệt NEXT claim/lease, applicability, plan revision, review floor, cursor, SHA readback), chỉ ra rủi ro thật, criterion, owner và oracle âm. Phân loại **KEEP, SIMPLIFY, REMOVE, NEEDS_PROBE**; cơ chế không liên quan mặc định **không làm scope audit phình ra**. Không bỏ cơ chế chỉ vì code dài.
- **Đầu ra:** tập findings **trong plan/milestone implementation**, không biến thành bộ Criteria thứ hai. Nếu phát hiện thiếu yêu cầu sản phẩm, bổ sung đề xuất tại đúng Criteria và xin Human chốt. Kết quả chỉ phát hiện, chưa tự sửa source.

**M0 PASS khi:** không có giả định "hàm tồn tại = khả năng live đã được chứng minh"; đủ ownership và rủi ro cho **bề mặt thực sự thay đổi**; mọi đề xuất REMOVE/SIMPLIFY ảnh hưởng security/evidence có failure scenario và negative oracle. Phần không liên quan không cần audit để bắt đầu M1; không tạo gate riêng để duyệt từng dòng.

### Kết quả thực thi P0/M0 — Reality Audit (17/10/2026)

**Disposition: P0 SCOPED AUDIT COMPLETE — sẵn sàng lập detail plan dựa trên các phát hiện.** Đây là kết quả audit read-only; **không** đồng nghĩa M1–M6 đã triển khai hoặc runtime đã vượt E2E. Không tạo Job/Run/Verification hay tự ghi sang Project Memory trong P0. Không thay đổi sản phẩm, security contract, Criteria hoặc `main`.

**Input và giới hạn bằng chứng:**

- Target: `upgrade/gsa-refactor`, integration HEAD lúc bắt đầu `c9f0b74edf83349eab0cf0764e48d3568fda2290`. Criteria source blob: `562778aad9c9d224e265ba6c519e8056f22eda7f` (29 Criteria); plan trước P0 blob: `5bada42155a555e52943bc72a27ea7dcbe5aaa8c`.
- Chương trình GSA MCP trên GitHub: `supabase/functions/gsa-mcp/index.ts` blob `fe94c3f291d5f97673fb889df3b89b8fcfb72c3b` (8.408 dòng, ~498 KB) — **source read**, không chứng minh đây là bytes đã deploy. GSA runtime đang kết nối báo `SERVER_DEPLOYED`, `PRODUCTION`, `NEXT`, build marker `P3-J-7793-R2`; build marker **không** là exact SHA của deployment.
- Source phụ trợ đã đối chiếu: `skills/gsa-bootstrap/SKILL.md`; `skills/gsa-job-runtime/SKILL.md`; `docs/architecture/{FOUNDATION,PROJECT-MEMORY,AGENT-HARNESSES,EXECUTION-AND-REVIEW}.md`; tests `test-lab/{runtime-logic,reliability-cursor,reliability-runtime,llc58-plan-intent,llc59-autonomy-harness,llc60-planning-loop}.test.cjs`; CI `.github/workflows/gsa-next-logic.yml`.
- Read-only public-path probes bằng MCP thật: `project_open`, `get_agent_harness` (Coder/Tester), `get_skill_catalog`, `authorize_project_scope`, `authorize_memory_mutation`; thêm GitHub tree của Project Memory. **Không gọi GitHub create/update/delete với Memory Repo; không dispatch source Job; không gọi E2E host và không chạy CI.** Các negative probes chỉ kiểm preflight, không chứng minh khai thác được lỗ hổng hoặc chứng minh an toàn end-to-end.

**Bản đồ thực tế — component/ownership/risk/điểm tiếp nhận:**

| ID | Bằng chứng nguồn và owner | Kết luận P0 | Disposition và công việc thuộc mốc |
|---|---|---|---|
| **P0-F01 — Project admission** | MCP `project_create` [index.ts L4551–4616] chỉ chuẩn bị `PROJECT.md` rồi hướng dẫn GitHub persist; `project_open` [L4679–4725] chỉ xác nhận manifest và lifecycle. GitHub caller thực hiện create/readback. | **GAP** so C01/C23/C24/C26: chưa có Fresh Start setup Criteria/AGENTS.md. Không được nhầm `gsa-bootstrap` (Auth/Memory Repo) với setup sản phẩm. | **EXTEND existing, M1.** Bổ sung Project setup tối thiểu; `project_open` thông thường vẫn nhẹ và không tự code; legacy Projects không bị ép migration. |
| **P0-F02 — Canonical Criteria** | Toàn bộ 8.408 dòng index.ts hiện không có registry/đọc `CRITERIA.md` hoặc `AGENTS.md`; `PROJECT.md` hiện chỉ identity/repo; `validateNextPlanningModel` [L1151–1162] cho phép không có NEXT milestone collections, hợp lệ đối với Job thường. | **GAP** C03/C05/C28/C29: chưa có Project Criteria canonical và kiểm tra consistency giữa Criteria hiện hành với Project-wide Plan. **Không được sửa validator để bắt mọi Job có milestone** (C05 chỉ bắt khi lập Project Plan). | **EXTEND minimal, M1/M3.** Đề xuất một `projects/<project-id>/CRITERIA.md` và Project Plan được bind tới Criteria revision; dùng Git history/CAS; không làm song song Criteria-V2/Knowledge shadow. |
| **P0-F03 — Harness loading** | `ROLE_HARNESSES`/`ROLE_SKILLS` [L2058+, L2231–2239]; `renderHarness` [L2528–2548] ghép BASE + vai; `get_agent_harness` [L4878–4918] nhận role/mode, **không nhận Project ID hoặc AGENTS config**. Live Coder/Tester cũng không chỉ dẫn bind Project Add-in. | **GAP** C19/C23–25: global generic đã có, Project-specific binding chưa có. | **KEEP generic + EXTEND M1/M2.** Nạp `AGENTS.md` trong Project context bằng đường có scope; chỉ Coder/Tester nhận add-in, Planner/Reviewer/CR vẫn generic. Không tạo override framework. |
| **P0-F04 — Skill catalog/loader** | `get_skill_catalog` [L4920–4939] liệt kê `RUNTIME_SKILLS`; `load_skill` [L4941–4966] dùng `z.enum` 9 tên; `RUNTIME_SKILLS` có thêm `tester-lab` [L2452+]. Live catalog **trả 10 tên**, còn tool `load_skill` công khai chỉ chấp nhận 9. | **Observed catalog/loader mismatch**, không phải giả thuyết. Project skills không thể chỉ thêm tên vào catalog rồi mặc nhiên load được. | **FIX/EXTEND M2**, tái dùng progressive skill loading. Oracle: mỗi tên được quảng bá có đường load hợp lệ hoặc được đánh dấu không nạp bằng công cụ đó; không tự thêm tool tùy tiện. |
| **P0-F05 — Dispatch skill boundary** | `job_prepare` [L5022–5028] chỉ cho Task `required_skills` là `ui-coder-frontend`; `resolveRequiredTaskSkills` [L408–429] tra skills global theo tên; `run_begin` [L6586–6609, L6683–6688] chèn body đã resolve vào Run. | **GAP + trust risk**: chưa ràng buộc skill Project tới đúng owner/role/Task; không có Project-scoped registry. Chỉ mở rộng enum không đủ; hiện runner nhận skill global theo tên, chưa có role add-in boundary hoàn chỉnh. | **EXTEND/VERIFY M2.** Task-scoped, role-restricted Coder/Tester add-in; no-add-in vẫn full generic; skill sai vai/sai Project/untrusted instruction không cấp quyền. |
| **P0-F06 — Planning continuation** | `planningLoopContinuationDecision` [L1945–1995], `plan_review_record` [L5631–5776]; `llc60-planning-loop.test.cjs` có test model, negative control và stop tại Human execution approval. Trả `AWAITING_DURABLE_READBACK`, không tự ghi Git. | **KEEP** same-turn routing đã thiết kế; **NEEDS_PROBE** real ChatGPT chain sau từng external write. Không coi helper model test là automation E2E PASS. | **M3/M4.** Reuse typed continuation; xác minh Planner→Reviewer→repair→READY và AUTO Task tiếp theo trên exact persisted Job, không chế tạo scheduler. |
| **P0-F07 — Project identity + memory scope** | `projectScopeDecision` [L2721–2766] từ chối cross-Project path; `project_open` [L4706–4725] dùng `validMemoryPath` regex [L2716–2718] nhưng không đối chiếu path ID với manifest ID; `authorize_memory_mutation` [L4477–4517] chỉ kiểm repo+`projects/<uuid>/`, không bind active Project. | **Observed boundary mismatch** qua read-only preflight: `project_open` với manifest Project A + `memory_path` giả của Project B vẫn trả `openable=true`. `authorize_memory_mutation(create, B/AGENTS.md)` riêng lẻ trả `allowed=true`, trong khi `authorize_project_scope(MUTATE_MEMORY, B/AGENTS.md)` trả **DENY**; sai repo và `delete` thiếu Human Gate vẫn DENY. **Chưa có unauthorized Git mutation** và guard tổng hợp có thể ngăn nếu caller dùng đúng hai guard. | **KEEP scope/security, FIX/PROBE M1 + M5.** Định nghĩa test bắt caller buộc path/Project identity/truth/correct order; đảm bảo project-create mới vẫn dùng được (chưa có Project manifest). Không tăng guard layers tùy tiện mà nên củng cố bind và hợp nhất trách nhiệm. |
| **P0-F08 — NEXT evidence/checkpoint** | `checkpoint_claim_prepare` [L5952+], `checkpoint_verification_prepare` [L6248+], `checkpoint_gate_evaluate` [L6466+], `evaluateNextEvidenceGate` [L907+]. Checkpoint claim/lease, evidence applicability gắn revision/token. | **KEEP / NEEDS_PROBE** negative end-to-end. Bảo vệ bằng chứng stale, duplicate token và success giả; hiện P0 chưa chứng minh xóa/hợp nhất được. | **M4/M5/M6.** Không ép tạo checkpoint cho mỗi Task; giữ những cái thực sự có dependency/evidence; chỉ SIMPLIFY khi oracle trước/sau không đổi. |
| **P0-F09 — Cursor, lost-response, plan change** | `execution_cursor_prepare` [L3071+], `execution_cursor_resume_evaluate` [L3132+], `execution_recovery_evaluate` [L3165+], `job_plan_change_*` [L2903–3070]. Existing reliability/LLC58 tests có negative control về stale SHA, retry, ancestry. | **KEEP / NEEDS_PROBE** cross-chat/failed-write real path; tránh duplicate source write và lặp Job khi Human đổi Criteria. | **M3/M5/M6.** Không đọc/ghi cursor trên routine reads; đổi Criteria chỉ supersede Job bị ảnh hưởng, current-revision Reviewer PASS; không bulk migrate legacy `V2_STABLE`. |
| **P0-F10 — Review floor, Git and test truth** | Foundation F13 định nghĩa exact sensitive classes; `skills/gsa-job-runtime` và `llc59` nêu CI self-diagnosis; GitHub CI workflow có Deno typecheck + bounded Node suites. | **KEEP floor/authority**, **SIMPLIFY CANDIDATE** chỉ cho *review/reconciliation lặp thừa ngoài F13*. CI workflow và test source hiện được **đọc**, chưa chạy ở P0. | **M3–M6.** Reviewer dựa risk và sensitive changes; không mặc định review mỗi Task. Tiếp tục CI tự điều tra, real host mới chứng minh host-pass; merge/deploy riêng Human decision. |

**Negative evidence thực thi (preflight, không mutation):**

1. `authorize_project_scope(MUTATE_MEMORY, active_project/AGENTS.md)` → **ALLOW**; với `other_project/AGENTS.md` → **DENY**. Đây là guard đúng owner.
2. `authorize_memory_mutation(create, configured_repo, active_project/AGENTS.md)` → **ALLOW**; `create` với `other_project/AGENTS.md` → **ALLOW ở guard này**; repo khác → **DENY**; `delete` chưa có Human Gate → **DENY**. Đây là lý do không được chỉ gọi một guard để kết luận "đúng active Project".
3. `project_open` cùng nội dung manifest và SHA nhưng thay `memory_path` sang `projects/ffffffff-ffff-ffff-ffff-ffffffffffff/PROJECT.md` vẫn trả danh tính Project A, `openable=true`. Test cho thấy thiếu identity/path binding ở entrypoint, **không** phải chứng minh người dùng có thể sửa Project B.
4. `get_skill_catalog` live trả `tester-lab`, trong khi schema `load_skill` không hỗ trợ. `get_agent_harness(coder|tester)` live vẫn generic, không có đường Project add-in.
5. `get_runtime_status` live báo production NEXT; không dùng marker `P3-J-7793-R2` làm exact deployed SHA.

**Kết luận phân loại (không ép xóa gate):**

- **KEEP bảo vệ:** Project scope, Memory repository sandbox, Human merge/deploy, current-revision review, exact Git readback, NEXT evidence applicability, cursor/recovery, CI honesty, V2 compatibility. Các lỗi bind đường dẫn/cấu hình ở P0-F07 cần sửa, không phải lý do bỏ quyền kiểm soát.
- **EXTEND tối thiểu:** Fresh Start + Criteria/AGENTS.md, Project skill add-in for Coder/Tester, Criteria-first Planner và Task skill binding (P0-F01–F05).
- **SIMPLIFY ứng viên:** các vòng review/role handoff/truy xuất evidence không có rủi ro thực, sau khi kiểm chứng đường gọi chính xác (P0-F06/F08/F10). **Chưa có quyết định REMOVE nào đủ chứng cứ tại P0.**
- **NEEDS_PROBE:** public-path continuation qua GitHub writes, host E2E, crash/retry, actual NEXT checkpoint consumer, released binary parity với reviewed source — thuộc M4–M6. Không đánh dấu PASS cho những gì chưa chạy.

**Đầu vào để Planner lập detail plan tiếp theo (sau P0):** ưu tiên xử lý **P0-F07 identity/path guard** như một ràng buộc an toàn cho M1; triển khai **P0-F01/F02/F03** trước (setup/Criteria/AGENTS); sau đó M2 dựa **P0-F04/F05** với negative role/project/skill tests, đồng thời M3 có thể chuẩn bị song song sau M1; M4 dùng continuation hiện có, M5 giản lược có chứng cứ và M6 chạy E2E. Khi detail plan viết, cập nhật **cùng file này**, không lập plan cạnh tranh và không thay đổi Criteria nếu user không thay lý thuyết.

**P0 exit check:** có input exact revision, owner/tool boundary, observed gaps và negative probes; risk/security quan trọng có oracle cho bước sau; không đưa nguồn ngoài Project vào scope mutation; không thêm Human Gate chỉ để ký tên audit. **M0 hoàn tất ở mức scoped analysis/read-only; implementation correctness vẫn CHƯA KIỂM CHỨNG cho các luồng mới.**


## Phase M1 — Fresh Start, một Criteria và AGENTS.md tối thiểu

### GOAL

Một Project bắt đầu từ trạng thái **hiện tại**, với hướng đi do người dùng chọn; không bootstrap harness lại và không hồi cứu phê duyệt lịch sử.

- **JP1 (MEDIUM; one Project onboarding chain):** dùng cơ chế `PROJECT.md` và đăng ký repo hiện có; thêm thao tác setup-on-demand cho Project khi bắt đầu làm việc thực sự, không buộc Project open nhanh phải quét hết source. Kiểm tra quyền; quan sát tên stack/config/entrypoint theo mức cần thiết; ghi source baseline được nhìn thấy, chưa nhận mọi code cũ là PASS.
- **JP1 criteria:** đề xuất **quy ước triển khai mặc định** `projects/<project-id>/CRITERIA.md` trong private Project Memory (một file có vị trí xác định cho mỗi Project; không tạo gate để hỏi tên file). Human xác nhận **nội dung** Criteria; chưa duyệt thì có trạng thái **CHƯA CHỐT** trong file duy nhất, không thể lén chuyển vào source implementation dựa trên yêu cầu chưa duyệt. Mọi yêu cầu lý thuyết Human mới phải sửa cùng file bằng current SHA/readback; plan ghi Criteria revision đã đọc và diễn giải **chỉ phần được duyệt**. Giữ Git history, không tạo `CRITERIA-V2.md`, decision shadow hay roadmap lý thuyết cạnh tranh.
- **JP1 AGENTS:** Planner tạo/duy trì `projects/<project-id>/AGENTS.md` generic rất ngắn từ template; chỉ khai báo Project-specific Coder/Tester add-ins khi có. Thiếu add-in là hợp lệ. Không copy toàn bộ GSA global harness vào Project.
- **Compatibility:** setup không phá Project đang có Work/Verification; không sửa source cũ; không bulk-migrate Job lịch sử hoặc bắt User chứng minh mỗi quyết định cũ.

**M1 PASS khi:** fixture/Project test cô lập cho cả **new** và **brownfield** tạo đúng identity, Criteria (theo trạng thái user duyệt), AGENTS.md và source baseline qua thao tác ngắn, không dựng lịch sử; mở Project cũ thiếu AGENTS không crash và không tự chạm source. Cross-Project write, unowned repo, stale Criteria SHA và chấp thuận giả đều bị từ chối. **Live pilot thuộc M6**, không thử đụng vào hai Project thật ở M1 chỉ để pass setup.

## Phase M2 — Generic Coder/Tester + Project add-in tùy chọn

### GOAL

Tùy biến **chuyên môn** mà không tạo nhiều phiên bản của agent hoặc làm mất generic coding/testing.

- **JP2 (MEDIUM; one skill-loading integration chain):** nạp global harness Coder/Tester trước; đọc `AGENTS.md` của Project đã được bind và được phép; nếu khai báo skill chuyên ngành cho đúng vai, nạp **chỉ skill phù hợp Task** từ Project Memory (có thể tổ chức tối giản dưới `SKILLS/coder/` và `SKILLS/tester/` khi thực sự cần). Không buộc tạo thư mục rỗng. Ưu tiên luồng GitHub đọc sẵn có và catalog/load_skill hiện tại; mở rộng bề mặt công cụ chỉ khi test chứng minh không đủ, không viết skill engine mới.
- **JP2 không override:** Planner/Reviewer/CR luôn dùng shared generic. Coder/Tester vẫn có generic loop, quyền và evidence requirements như cũ. Add-in là nội dung chuyên môn (dialect/API/host/test strategy), **không** được định nghĩa lại role, source-write authority, tự đặt Criteria, tắt review, cấp secret hay thêm quyền đọc/ghi repo.
- **JP2 assurance:** validate path thuộc Project; skill binding theo exact Project/Task, stale/missing/malformed add-in được báo đúng. **Chỉ fallback generic nếu Task không phụ thuộc skill chuyên biệt**; Task bắt buộc host/dialect chuyên biệt phải báo chưa có skill/khả năng chứ không chạy sai như generic. Không tự trộn add-in của Project khác; nội dung add-in không có quyền override instruction/security/Criteria. Không nạp skills vô can vào context.

**M2 PASS khi:** generic no-add-in PASS, CAD/AutoLISP Coder add-in được chọn đúng Task và không biến cú pháp Common Lisp thành mặc định, Tester host-check add-in tạo đúng chiến lược kiểm chứng; negative thử "disable security", cross-Project skill, wrong-role skill đều không có tác dụng vượt quyền. Host thật không được tuyên bố PASS nếu chỉ dùng fixture.

## Phase M3 — Planner bắt buộc criteria-first và milestone có ý nghĩa

### GOAL

Planner biết **đích đến**, tạo Project Plan đủ mốc nhưng không tạo gate, Task hoặc lý thuyết dư.

- **JP3 (MEDIUM; Planner + planning Reviewer):** khi lập kế hoạch cho toàn Project, dùng một Criteria current revision; thể hiện `## GOAL` ở đầu plan, `### GOAL` ở đầu Phase; lập milestone đủ kết quả, dependencies, cách nghiệm thu và trạng thái **AUTO sau approval / Human decision / manual trigger / blocked by actual evidence** dưới dạng điều phối hiện có, không thêm bốn lifecycle enum.
- **JP3 coverage:** Reviewer rà cả **thiếu** và **thừa**. Mọi Task/Phase phải trả lời "giúp Criteria nào, bằng chứng gì"; finding chỉ là đề xuất nếu không thể gắn vào Criteria hiện hành hoặc security/observed risk. Job nhỏ nằm trong Project Plan không cần fake milestone. Tận dụng NEXT milestones/topology sẵn có khi phù hợp.
- **JP3 change:** Human chỉnh lý thuyết → cập nhật **một Criteria** trước (revision/approval rõ) → Planner đối chiếu phụ thuộc và đóng băng **forward dispatch của Job thực sự bị ảnh hưởng** tại ranh giới an toàn; các Job không liên quan tiếp tục. Với Job đổi `planning_revision`, phải có **Reviewer PASS lại trên revision mới**; không dùng reviewer PASS của Job revision cũ. Giữ evidence chưa bị ảnh hưởng để đối chiếu; plan không được chứa product requirements ngoài Criteria. Không tự tạo thêm gate chỉ để sửa kế hoạch.

**M3 PASS khi:** review PASS với Project Plan có mốc đủ; bỏ một criterion khiến Reviewer tìm được thiếu, thêm requirement ngoài Criteria khiến Reviewer phát hiện drift; **đổi Criteria trong khi Job IN_PROGRESS** chỉ dừng/đổi các Job bị ảnh hưởng, còn Job bị sửa revision bắt buộc được review lại; Job không đổi không bị làm lại hoặc xin duyệt vô cớ. Test Plan/Criteria exact revision chứ không chỉ so chuỗi.

## Phase M4 — Điều phối trong một lượt, dừng đúng điểm

### GOAL

GSA tiếp tục thực hiện phần đã được duyệt **trong lượt ChatGPT còn sống**, không hỏi User chuyển vai hoặc gõ "continue" sau checkpoint.

- **JP4A (MEDIUM; planner↔reviewer):** tái sử dụng typed continuation hiện có cho Job DRAFT/revision/PLANNING_REVIEW/READY. MCP PREPARE → authorize/git persist → exact readback → route next action trong cùng turn; CHANGES_REQUIRED → Planner sửa → Reviewer đánh giá lại đến PASS hoặc blocker/Human thật. Không trình một lần PREPARE thành đã hoàn tất. Giữ stop tại Human approval khởi chạy source theo contract hiện tại.
- **JP4B (MEDIUM; approved execution):** với Task đã có quyền, Orchestrator tự dispatch Coder, phát hiện CI/log/test failure và sửa trong Task; gọi Tester/Reviewer ở mốc cần, record evidence/readback, tiếp tục Task AUTO kế tiếp. Dùng existing Run/Handoff/Verification, tránh event bus, scheduler hay shadow lifecycle. Không auto CR khi mục XI chưa chốt.
- **JP4B STOP đúng chỗ:** người dùng thay đổi GOAL/scope, thiếu quyền merge/deploy, security boundary, unsupported capability, CAS conflict, no progress đã chứng minh => stop với reason + next action nhỏ nhất. Chat closed => chỉ resume khi User/host có invocation mới, không hứa background loop.

**M4 PASS khi:** ít nhất một chuỗi ba bước AUTO liên tiếp qua checkpoint + one repair/retest không yêu cầu Human nhắc; một review CHANGES_REQUIRED tự quay về Planner; một real Human stop không bị vượt; vòng không tiến triển dừng có lý do; không tăng số lần Memory mutation cho routine read vô ích.

## Phase M5 — Cắt gọn có kiểm chứng, giữ đúng security/recovery/Git

### GOAL

Loại bớt phần nghi lễ và workaround không còn phục vụ Criteria, nhưng vẫn bảo vệ các rủi ro đã được chứng minh.

- **JP5A (MEDIUM; focused ownership simplification):** áp dụng kết quả M0 cho luồng đang thay đổi; loại/hợp nhất các contract, schema, prompt hoặc duplicated checks có cùng authority và oracle. **Không** tạo parallel Job lifecycle/lease, không copy source runtime đầy đủ vào prompt, không tách `index.ts` chỉ vì kích thước; nếu tách code thì phải giảm được một coupling/failure risk cụ thể và giữ test nguyên nghĩa.
- **JP5B (MEDIUM; durable safety):** giữ exact Project/branch/scope, optimistic SHA/CAS, idempotent unknown-write recovery và append-preserving evidence; chỉ đọc cursor/checkpoint khi thực sự có mutation hoặc cần resume. Giữ tương thích NEXT và lịch sử V2_STABLE; evidence stale/missing không được PASS. Test concurrency/duplicate/replay ở cả đường success và failure, không chỉ test helper.
- **JP5C (SMALL/MEDIUM; Git + test autonomy):** một integration branch chính, status/absorption rõ; không ép dọn toàn bộ branch lịch sử. Coder tự lấy CI jobs/steps/logs và sửa lỗi source/test trong quyền; nếu runner không chạy, classify ENVIRONMENT_FAILURE/UNVERIFIED và dùng tool khác chỉ khi đã chứng minh capability; không tuyên bố CI PASS thay.
- **So sánh before/after:** số công đoạn Human không cần thiết, lượt tool/Memory write trên các scenario lặp lại, context/skill load thực tế, số nhánh có source chưa nhập, số gate có rủi ro và oracle riêng. Đây là **chỉ số mô tả**, không đặt target % tiết kiệm hay gate-count tùy tiện.

**M5 PASS khi:** hành vi E1/E17/E19/E21–E35 **liên quan các bề mặt bị sửa** còn tương thích hoặc thay đổi có kiểm chứng vì Criteria mới; negative tests của security, stale evidence, crash/retry, duplicate write, Git scope và release vẫn fail-closed. Mọi cơ chế đề xuất cắt gọn phải có before/after oracle; **không đặt quota bắt buộc phải xóa một gate/module** vì điều đó khuyến khích phá cơ chế đúng. Nếu không có gì đủ căn cứ loại, giữ nguyên và báo lý do; giá trị tinh gọn vẫn được đo từ giảm bước/vòng gọi vô ích trong các luồng mới.

## Phase M6 — Acceptance thực tế, hợp nhất, release

### GOAL

Chỉ tuyên bố thành công khi đúng luồng GSA người dùng sử dụng chạy được, không chỉ CI helper GREEN.

- **JP6A (MEDIUM; exact source/release proof):** chạy Deno typecheck cho `supabase/functions/gsa-mcp/index.ts`; các Node test trong `test-lab/` và test âm mới thực sự kiểm lỗi; kiểm tra chính script oracle với known-bad fixture ở các điểm rủi ro. Kiểm thử trên isolated `gsa-mcp-next` và test Memory namespace đúng; proof deployed-source readback phải khớp exact reviewed revision. Không biến Test Lab thành sản phẩm đã phát hành.
- **JP6B (MEDIUM; real workflow pilot):** ít nhất 4 kịch bản:
  1. New Project + generic agents + Criteria/AGENTS.md tối thiểu.
  2. Adopt brownfield midstream (ví dụ GSA-Localconnector chỉ khi Project/host được cấp quyền): không hồi cứu chat, không sửa những phần ngoài scope.
  3. Project add-in cho Coder và Tester (fixture + ít nhất một host/tool thực tế khi khả năng được xác minh); no-add-in vẫn tốt.
  4. Human đổi Criteria ngay khi một Job đang IN_PROGRESS; đánh giá affected/unaffected, current Criteria SHA, stale plan-review evidence, auto review/repair/checkpoint + real Human stop + restart/unknown-write recovery.
  Test exact source, memory state, permissions, negative cases, honest limitations và câu trả lời hướng người dùng. Không coi missing host=PASS.
- **JP6C (SMALL; release candidate):** chứng minh các code thay đổi đã vào `upgrade/gsa-refactor`, reconcile `main` drift theo bằng chứng, Reviewer đánh giá exact candidate, Tester lưu bằng chứng, giữ rollback source/deployed runtime. Trình Human **hai quyết định tách biệt**: merge `main` và production deploy. Sau khi được duyệt, deploy/readback/smoke; nếu fail thì rollback theo đã xác minh, không tự báo phát hành thành công.
- **Đóng dự án refactor:** Criteria của **GSA sản phẩm** được promote từ working draft thành **một canonical file** (không duy trì bản sao song song) **khi người dùng duyệt**; đây là việc quản trị tài liệu của chính GSA, tách với khả năng tạo `projects/<project-id>/CRITERIA.md` cho **các Project do GSA quản lý**. Historical plans chỉ tham khảo. Không tự hợp thức hóa Criteria chưa được Human chốt qua PASS kỹ thuật. Project mới dùng setup mới, legacy Project không bị ép migration.

**M6 PASS khi:** E2E public path và Project pilot chứng minh Criteria applicable trên version đang test; các giới hạn UNVERIFIED minh bạch, User có thể thấy GSA hoạt động ít thao tác hơn. Production PASS chỉ sau quyết định và xác minh deploy riêng.

## 4. Coverage — tất cả 29 Criteria hiện hành

Các ID là tham chiếu từ **Criteria duy nhất**, không định nghĩa lại WHAT. Khi Criteria đổi, Planner cập nhật mapping này cùng plan ảnh hưởng.

| Phase/mốc | Criteria được thực hiện hoặc chứng minh |
|---|---|
| M0 | C03 C06 C09 C17 C21 C22 C29 |
| M1 | C01 C02 C03 C23 C24 C26 C27 C28 C29 |
| M2 | C19 C23 C24 C25 |
| M3 | C02 C03 C04 C05 C06 C20 C28 C29 |
| M4 | C07 C08 C09 C10 C13 C18 |
| M5 | C09 C11 C12 C13 C14 C15 C16 C17 C18 C21 C22 |
| M6 | C01 C04 C05 C07 C08 C09 C10 C11 C12 C14 C15 C16 C17 C19 C20 C21 C22 C23 C24 C25 C26 C27 C28 C29 |

Một criterion có thể có **implementation owner** ở một mốc và **acceptance evidence** ở M6. Không nhân bản requirement text sang Job/plan.

## 5. Quyết định còn mở — không tự biến thành scope

Các mục dưới đây **vẫn nằm ở mục XI của Criteria**, không có plan con nào được phép chốt thay:
- CR: Human-only hay ủy quyền trước ở milestone? **Giữ Human-only hiện hành** trừ khi User chốt khác; M4 không phụ thuộc auto CR.
- Resume ở chat mới: cần invocation rõ ràng để bắt đầu Job; open Project đơn thuần không tự chạy source. Không có daemon/background promise.
- Screenshot/evidence backend: chưa chốt policy; giữ cơ chế an toàn hiện tại, M6 không viết lại storage ngoài scope. Nếu live acceptance cần thay đổi policy, quay lại Criteria.
- NEXT lease/evidence gates: chỉ được SIMPLIFY/REMOVE từng cơ chế sau M0 oracle và tests, không "cắt toàn bộ NEXT".
- Git Admin agent riêng, role-specific model controls và Git auto-push semantics: không phỏng đoán khả năng host. M5 giải quyết tối thiểu nhu cầu git tracking bằng vai/connector hiện có; mở rộng quyền cần Human.

**Mốc HUMAN cần thiết:** (a) duyệt Criteria baseline + plan execution trước M0 thay đổi source; (b) quyết định material phát sinh cho scope chịu ảnh hưởng; (c) final main merge; (d) final production deploy. Với phần chưa chốt không ảnh hưởng một Phase, không dựng gate giả chặn Phase đó.

## 6. Self-review / acceptance checklist của plan

- Đặt GOAL dựa đúng working Criteria, không thêm mục tiêu ngoài C01–C29; mọi Phase có ### GOAL; M0–M6 có kết quả kiểm chứng và dependency có lý do.
- Một branch refactor duy nhất, không tái sử dụng CP0–CP7 cũ làm current plan; historical V2/NEXT/Memory được giữ tương thích.
- Explicit fresh-start, generic agents, optional skills, AGENTS.md, single Criteria, same-turn AUTO, durable resume, real test proof và Human authority.
- Không giả định callback nút Human click, model override của ChatGPT Web, background worker, hoặc capability unavailable. Các điểm CHƯA CHỐT không bị agent tự chốt.
- Reviewer phải tìm cả điều **thiếu** lẫn điều **thừa**; CR vẫn Human-invoked; test đúng public path/exact revision.
- **Review state:** kiểm tra nội bộ về cấu trúc và Criteria coverage. **Chưa có GSA durable Job planning Reviewer PASS** cho plan này; không được quảng cáo là plan approved hoặc bắt đầu source implementation từ commit tài liệu.

**Kết thúc bản plan:** triển khai chỉ sau Human xác nhận kế hoạch và các quyền theo phạm vi. Khi người dùng bổ sung lý thuyết mới, cập nhật Criteria **trước**, sửa các Phase của plan chịu ảnh hưởng **sau**; không tạo thêm "truth file".


## 7. RL — Reviewer findings và Planner repair trong cùng plan

**Review target:** plan trên `upgrade/gsa-refactor`; Criteria duy nhất `docs/refactor/GSA-LY-THUYET-CRITERIA-REFRACTOR-DRAFT.md` tại blob `562778aad9c9d224e265ba6c519e8056f22eda7f`. Đây là RL trên **file plan hiện có**, chưa có durable GSA Job + `PLANNING_REVIEW` Verification, nên không tự nhận công cụ đã cấp GSA Reviewer PASS.

**Reviewer vòng 1 (CHANGES_REQUIRED — bằng chứng trong bản plan và Foundation F13):**
- **R1 / IMPORTANT — dependency thừa:** M3 phụ thuộc M2 dù criteria-first Planner không cần skill add-in; đây là serial gate làm chậm tiến độ. **Sửa:** M3 chỉ phụ thuộc M1; M4 cần cả M2 và M3.
- **R2 / IMPORTANT — review floor bị mở rộng:** câu "review mọi thay đổi logic" rộng hơn F13 và C10/C21. **Sửa:** chỉ cơ chế review bắt buộc đúng nhóm nhạy cảm F13; còn lại dựa theo risk/checkpoint đã duyệt.
- **R3 / IMPORTANT — M5 bị thúc phải loại bỏ một cơ chế:** điều kiện quota xóa ít nhất một gate có thể xâm phạm security/compatibility. **Sửa:** mỗi KEEP/REMOVE/SIMPLIFY có lý do; không xóa để đạt con số.
- **R4 / IMPORTANT — Criteria change thiếu runnable test:** test cũ nói invalidation phần ảnh hưởng nhưng không nói Job revision Reviewer readback khi sửa Job IN_PROGRESS. **Sửa:** thêm affected/unaffected, stale revision, review-bound evidence và M6 pilot.
- **R5 / MINOR — audit và pilot bị nhân đôi:** M0 audit chưa khoanh phạm vi; M1 yêu cầu hai pilot thật trước M6. **Sửa:** scoped ownership/failure map; M1 dùng isolated fixtures, M6 mới chạy live pilots.
- **R6 / IMPORTANT — Criteria file location và add-in fallback chưa đủ chính xác:** chưa có path mặc định, fallback generic có thể khiến Task cần skill đặc thù bị làm sai. **Sửa:** đề nghị path chuẩn Project Memory, revision-aware reads, fallback chỉ nếu Task không phụ thuộc add-in; vẫn không tự thay người dùng duyệt nội dung.

**Reviewer vòng 2 — tiêu chuẩn recheck trước khi kết luận:** xác nhận các sửa trên hiện diện trong exact Git blob của plan, 29 Criteria vẫn được phủ, GOAL/mốc/phụ thuộc không tự tạo thêm gate, user-authority và CR Human-only không đổi; có test negative và exact-target cho revision và quyền. Nếu phát hiện lỗi mới có bằng chứng, Planner tiếp tục sửa **cùng file này**; không tạo version khác.

**Disposition:** RL ở cấp **file plan**; không làm thay kết quả GSA durable planning Review cho một Job sẽ được tạo trong triển khai, không cấp quyền mutation code/merge/deploy.