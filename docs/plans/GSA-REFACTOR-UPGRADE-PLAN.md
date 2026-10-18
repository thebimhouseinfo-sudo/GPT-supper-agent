# GSA — Refactor Upgrade Plan (single integration line)

Status: **PLANNING DRAFT — chờ Human duyệt bản Criteria và kế hoạch trước khi chạy source implementation**.
Working branch: **`upgrade/gsa-refactor`** (tạo từ `main` tại `be8b663a878cca9c5b2920145f57fd20291d6164`).
Criteria duy nhất: **`docs/refactor/GSA-LY-THUYET-CRITERIA-REFRACTOR-DRAFT.md`** trên chính nhánh này; current blob để kiểm lại GOAL và plan: `7b6d95c719fa632ef0249925d4795549d6d18402` (Criteria vẫn WORKING, chưa Human phê duyệt baseline).
Mức thẩm quyền: **plan triển khai đề xuất**, không phải Criteria khác; nội dung CHƯA CHỐT trong Criteria không được tự động chuyển thành yêu cầu bắt buộc.

## GOAL

Từ GSA hiện có, phát triển một **generic coding/project-agent framework gọn, đáng tin và có thể dùng ngay** cho dự án mới hoặc dự án đang triển khai dở trên ChatGPT Web. Mỗi GSA Project có **một Criteria hiện hành** mô tả đích cần đạt; **Planner làm rõ GOAL, người dùng, mục đích sử dụng, quy mô thực và giới hạn trước khi lập kế hoạch**; **Advisor generic** tư vấn trên **toàn Criteria dự thảo trước lần Human duyệt đầu** và **trước khi sửa Criteria đã duyệt**; Human chốt. Planner tạo `AGENTS.md` tối thiểu; Coder và Tester generic, chỉ nạp **add-in chuyên môn tùy chọn** khi Task cần. Planner, Advisor, Reviewer và Critic Reviewer (CR) dùng chung trên mọi Project, mỗi vai có trách nhiệm riêng. Sau phê duyệt thực thi, GSA tự đi qua các bước AUTO trong cùng lượt hoạt động và tự xử lý kiểm chứng/sửa lỗi trong quyền; chỉ dừng ở quyết định Human thật, blocker được chứng minh hoặc phiên bị gián đoạn. Git, Memory, review và resume phải đúng quyền và dựa trên bằng chứng thực tế, không dựa vào lời hứa.

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
| **M1 — Fresh Start & Criteria** | Setup nhẹ Project mới/đang làm dở; một Criteria hiện hành và `AGENTS.md` tối thiểu, không hồi cứu lịch sử | M0 | GitHub/Memory readback, **3 tình huống NEW / ADOPT / REGISTERED**; quyền Project và retry không ghi trùng | **AUTO → M2** |
| **M2 — Coder/Tester add-in** | Generic không cấu hình vẫn làm; Project chỉ thêm skills Coder/Tester, nạp lazy và không override | M1 | 3 kịch bản no-add-in / Coder add-in / Tester add-in, negative unauthorized skill | **AUTO → mốc phụ thuộc; M3 có thể làm độc lập** |
| **M3 — Criteria-first Planner** | Plan/milestone có GOAL, coverage đúng và không thêm requirement; thay Criteria chỉ cập nhật phần ảnh hưởng | **M1 (không cần M2)** | Plan review test missing/extra, revision change, AUTO/HUMAN | **AUTO → M4 sau khi M2 cũng sẵn sàng cho kịch bản add-in** |
| **M4 — Same-turn orchestration** | Checkpoint/readback rồi thực hiện AUTO hợp lệ; Reviewer/Tester/repair loop không bắt User gõ "continue" | **M2 + M3** | Planning loop + source/checkpoint scenario có đúng stop condition | **AUTO → M5** |
| **M5 — Simplify + durable correctness** | Bỏ/hợp nhất chỗ dư dựa trên evidence; recovery, Git, real testing giữ đúng quyền | M0–M4 | Before/after behavior/evidence và negative cases, regression V2/NEXT | **AUTO → M6** |
| **M6 — Field acceptance & release prep** | Chạy những luồng thật trên staging và Project pilot; bằng chứng đầy đủ, giới hạn rõ, có phương án rollback | M0–M5 | Exact staging/source, pilot results, review/CI/limitations | **HUMAN: main merge; HUMAN: production deploy** |

**Giải thích trạng thái mốc:** AUTO là đường điều phối đã được chấp thuận trong phiên đang hoạt động; HUMAN là quyền quyết định riêng, không là "checkpoint pending" chung. Nếu một Phase gặp blocker thực, chỉ phần việc phụ thuộc dừng. Mốc hoàn tất phải có kết quả đủ kiểm chứng, không chỉ có một report hay file schema mới. Một mốc đang chờ kiểm chứng host không bị giả PASS.

### Criteria revision → GOAL impact review (18/10/2026)

**Chỉ sửa GOAL trước khi sửa detail:** Human bổ sung trình tự Advisor/Criteria và GOAL-first review. Đối chiếu Criteria **working** blob `7b6d95c719fa632ef0249925d4795549d6d18402` (C02/C03/C06/C20/C23/C26/C28/C29), Planner kiểm GOAL tổng và từng Phase như sau. Đây là **impact assessment trong cùng Upgrade Plan**, không phải một Criteria phụ và không phải phê duyệt source implementation.

| GOAL | Quyết định sau đối chiếu | Căn cứ |
|---|---|---|
| **Overall** | **ĐIỀU CHỈNH** — Planner discovery + Advisor đúng hai checkpoint và Human decision | C02 C03 C23 C26 |
| **M0** | **GIỮ** — targeted audit đã hoàn thành, không hồi tố test/source | C06 C21 C22 |
| **M1** | **ĐIỀU CHỈNH** — chốt GOAL/quy mô phù hợp và Advisor xem toàn Criteria trước first approval | C01 C02 C03 C23 C26 |
| **M2** | **GIỮ** — add-in Coder/Tester chỉ tùy chọn, Advisor không là add-in | C19 C23 C25 |
| **M3** | **ĐIỀU CHỈNH** — khi Criteria sửa, review GOAL tổng/Phase trước detail | C04 C06 C20 C28 C29 |
| **M4** | **GIỮ** — AUTO trong lượt có hiệu lực | C07 C08 |
| **M5** | **GIỮ** — simplification/recovery đúng quyền | C11 C12 C21 C22 |
| **M6** | **GIỮ** — field acceptance phải kiểm cả behavior mới theo Criteria, không đổi đích milestone | C09 C17 C23 C26 C29 |

**Trình tự áp dụng:** đã kiểm đủ GOAL → lưu GOAL revisions trong **chính plan** → readback → mới cập nhật chi tiết M1/M3 và acceptance liên quan. Các nội dung không được Human quyết định vẫn giữ CHƯA CHỐT ở Criteria; không tạo GOAL hay phase mới.


## Phase M0 — Kiểm kê thực tế và audit gate

### GOAL

Xác định chính xác **cái gì đang có, vì sao tồn tại, cái gì thiếu hoặc trùng** trước khi viết refactor. Bảo vệ hành vi đúng và không nhân bản cơ chế.

- **JP0 (SMALL/MEDIUM; Planner + Reviewer, source read-only):** chỉ dựng sơ đồ ownership/call chain cho các bề mặt sẽ chạm tới trong M1–M5: project create/open/status, Criteria/AGENTS.md, role/skill loading, Planner/review, AUTO continuation và giao điểm với cursor/checkpoint/Git. Những miền không bị sửa giữ nguyên và chỉ kiểm khi phụ thuộc thật. Đánh dấu MCP-owned vs ChatGPT orchestration vs GitHub external action. L0 tree → L1 selective source; không đọc toàn bộ index.ts hay audit mọi historical gate vô điều kiện.
- **JP0 audit:** với mỗi cơ chế **sẽ đụng tới hoặc thực sự chặn** luồng mới (đặc biệt NEXT claim/lease, applicability, plan revision, review floor, cursor, SHA readback), chỉ ra rủi ro thật, criterion, owner và oracle âm. Phân loại **KEEP, SIMPLIFY, REMOVE, NEEDS_PROBE**; cơ chế không liên quan mặc định **không làm scope audit phình ra**. Không bỏ cơ chế chỉ vì code dài.
- **Đầu ra:** tập findings **trong plan/milestone implementation**, không biến thành bộ Criteria thứ hai. Nếu phát hiện thiếu yêu cầu sản phẩm, bổ sung đề xuất tại đúng Criteria và xin Human chốt. Kết quả chỉ phát hiện, chưa tự sửa source.

**M0 PASS khi:** không có giả định "hàm tồn tại = khả năng live đã được chứng minh"; đủ ownership và rủi ro cho **bề mặt thực sự thay đổi**; mọi đề xuất REMOVE/SIMPLIFY ảnh hưởng security/evidence có failure scenario và negative oracle. Phần không liên quan không cần audit để bắt đầu M1; không tạo gate riêng để duyệt từng dòng.

### Kết quả thực thi P0/M0 — Reality Audit (17/10/2026)

**Disposition: P0 SCOPED AUDIT COMPLETE (RL corrected) — sẵn sàng lập detail plan dựa trên các phát hiện.** Đây là kết quả audit read-only; **không** đồng nghĩa M1–M6 đã triển khai hoặc runtime đã vượt E2E. Không tạo Job/Run/Verification hay tự ghi sang Project Memory trong P0. Không thay đổi sản phẩm, security contract, Criteria hoặc `main`.

**Input và giới hạn bằng chứng:**

- Target: `upgrade/gsa-refactor`, integration HEAD lúc bắt đầu `c9f0b74edf83349eab0cf0764e48d3568fda2290`. Criteria source blob: `562778aad9c9d224e265ba6c519e8056f22eda7f` (29 Criteria); plan trước P0 blob: `5bada42155a555e52943bc72a27ea7dcbe5aaa8c`.
- Chương trình GSA MCP trên GitHub: `supabase/functions/gsa-mcp/index.ts` blob `fe94c3f291d5f97673fb889df3b89b8fcfb72c3b` (8.408 dòng, ~498 KB) — **source read**, không chứng minh đây là bytes đã deploy. GSA runtime đang kết nối báo `SERVER_DEPLOYED`, `PRODUCTION`, `NEXT`, build marker `P3-J-7793-R2`; build marker **không** là exact SHA của deployment.
- Source phụ trợ đã đối chiếu: `skills/gsa-bootstrap/SKILL.md`; `skills/gsa-job-runtime/SKILL.md`; `docs/architecture/{FOUNDATION,PROJECT-MEMORY,AGENT-HARNESSES,EXECUTION-AND-REVIEW}.md`; tests `test-lab/{runtime-logic,reliability-cursor,reliability-runtime,llc58-plan-intent,llc59-autonomy-harness,llc60-planning-loop}.test.cjs`; CI `.github/workflows/gsa-next-logic.yml`.
- Read-only public-path probes bằng MCP thật: `project_open`, `get_agent_harness` (Coder/Tester), `get_skill_catalog`, `authorize_project_scope`, `authorize_memory_mutation`; thêm GitHub tree của Project Memory. **Không gọi GitHub create/update/delete với Memory Repo; không dispatch source Job; không gọi E2E host và không chạy CI.** Các negative probes chỉ kiểm preflight, không chứng minh khai thác được lỗ hổng hoặc chứng minh an toàn end-to-end.

**Bản đồ thực tế — component/ownership/risk/điểm tiếp nhận:**

| ID | Bằng chứng nguồn và owner | Kết luận P0 | Disposition và công việc thuộc mốc |
|---|---|---|---|
| **P0-F01 — Project admission** | MCP `project_create` [index.ts L4551–4616] chỉ chuẩn bị `PROJECT.md` rồi hướng dẫn GitHub persist; `project_open` [L4679–4725] chỉ xác nhận manifest và lifecycle. GitHub caller thực hiện create/readback. | **GAP** so C01/C23/C24/C26: chưa có Fresh Start setup Criteria/AGENTS.md. Không được nhầm `gsa-bootstrap` (Auth/Memory Repo) với setup sản phẩm. | **EXTEND existing, M1.** Bổ sung Project setup tối thiểu; `project_open` thông thường vẫn nhẹ và không tự code; legacy Projects không bị ép migration. |
| **P0-F02 — Canonical Criteria** | Trong 8.408 dòng MCP chưa có đường đọc/nạp file `CRITERIA.md`/`AGENTS.md`; `job_prepare` [L4970–5038, L5155–5206] tạo Job từ objective/Tasks nhưng không nhận `criteria_ref` hay `criteria_revision`, còn `validateNextPlanningModel` [L1151–1162] hợp lệ khi Job thường không khai báo milestone collections. Đây là bằng chứng **thiếu Project-wide Criteria binding trong giao diện hiện tại**, không chứng minh mọi thành phần của GSA đều không có khái niệm criteria. | **GAP** C03/C05/C28/C29: chưa có con đường canonical Criteria → Project Plan → các Job với current revision bảo đảm nhất quán. **Không ép mọi Job nhỏ có milestone** (C05 chỉ áp dụng Project Plan). | **EXTEND minimal, M1/M3.** Một `projects/<project-id>/CRITERIA.md` (quy ước triển khai đề xuất) và Project Plan đọc/bind current approved Criteria revision; không nhân bản lý thuyết trong Job/Knowledge hoặc tạo `CRITERIA-V2.md`. Kiểm tra revision trong luồng cập nhật plan đúng nơi cần, không tạo per-tool gate. |
| **P0-F03 — Harness loading** | `ROLE_HARNESSES`/`ROLE_SKILLS` [L2058+, L2231–2239]; `renderHarness` [L2528–2548] ghép BASE + vai; `get_agent_harness` [L4878–4918] nhận role/mode, **không nhận Project ID hoặc AGENTS config**. Live Coder/Tester cũng không chỉ dẫn bind Project Add-in. | **GAP** C19/C23–25: global generic đã có, Project-specific binding chưa có. | **KEEP generic + EXTEND M1/M2.** Nạp `AGENTS.md` trong Project context bằng đường có scope; chỉ Coder/Tester nhận add-in, Planner/Reviewer/CR vẫn generic. Không tạo override framework. |
| **P0-F04 — Skill catalog/loader** | `get_skill_catalog` [L4920–4939] liệt kê `RUNTIME_SKILLS`; `load_skill` [L4941–4966] dùng `z.enum` 9 tên; `RUNTIME_SKILLS` có thêm `tester-lab` [L2452+]. Live catalog **trả 10 tên**, nhưng input enum của `load_skill` chỉ hỗ trợ 9. `tester-lab` được mô tả là Test Lab độc lập, không phải default production Tester. | **Observed catalog/loader contract mismatch**; **chưa xác định** việc không expose `tester-lab` qua production loader là chủ ý hay lỗi. Không đề nghị tự động bật kỹ năng đặc biệt chưa được làm rõ quyền. | **VERIFY INTENT → FIX nếu cần, M2.** Giữ hoặc ghi rõ phân loại Test Lab-only trong catalog, hoặc cung cấp đường load được ủy quyền tương ứng; với Project add-in, catalog/loader/binding phải nhất quán và không phá isolation. |
| **P0-F05 — Dispatch skill boundary** | `job_prepare` [L5022–5028] chỉ cho Task `required_skills` là `ui-coder-frontend`; `resolveRequiredTaskSkills` [L408–429] tra skills global theo tên; `run_begin` [L6586–6609, L6683–6688] chèn body đã resolve vào Run. | **GAP + trust risk**: chưa ràng buộc skill Project tới đúng owner/role/Task; không có Project-scoped registry. Chỉ mở rộng enum không đủ; hiện runner nhận skill global theo tên, chưa có role add-in boundary hoàn chỉnh. | **EXTEND/VERIFY M2.** Task-scoped, role-restricted Coder/Tester add-in; no-add-in vẫn full generic; skill sai vai/sai Project/untrusted instruction không cấp quyền. |
| **P0-F06 — Planning continuation** | `planningLoopContinuationDecision` [L1945–1995], `plan_review_record` [L5631–5776]; `llc60-planning-loop.test.cjs` có test model, negative control và stop tại Human execution approval. Trả `AWAITING_DURABLE_READBACK`, không tự ghi Git. | **KEEP** same-turn routing đã thiết kế; **NEEDS_PROBE** real ChatGPT chain sau từng external write. Không coi helper model test là automation E2E PASS. | **M3/M4.** Reuse typed continuation; xác minh Planner→Reviewer→repair→READY và AUTO Task tiếp theo trên exact persisted Job, không chế tạo scheduler. |
| **P0-F07 — Project identity, canonical paths, Memory preflight** | `validMemoryPath` [L2716–2718] chỉ kiểm regex prefix; `project_open` [L4679–4725] tiếp nhận `project_manifest_text`, `project_manifest_sha` và `memory_path` từ caller, không tự fetch current GitHub blob; `projectScopeDecision` [L2721–2766] kiểm prefix; `authorize_memory_mutation` [L4477–4517] nhận boolean `human_gate_approved` từ caller mà không tự gắn chứng cứ Human. | **IMPORTANT — contract/preflight findings, chưa chứng minh GitHub exploit:** (a) `project_open(A content, B path)` và `A/not-PROJECT.md` vẫn `openable=true`; (b) `projects/A/../B/AGENTS.md` được cả hai guard ALLOW; (c) UUID giả được Memory guard ALLOW; (d) Memory guard repo-wide ALLOW cho đường dẫn của B không tự là cross-Project exploit. **CR-01:** ngay cả với canonical path, manifest/SHA hay cờ Human do caller cung cấp chưa chứng minh GitHub state hiện hành và phê duyệt Human thật. | **PRIORITY FIX M1, verify M5/M6:** Tái dùng path validator và Project ownership flow hiện hữu; bind đúng `projects/<manifest.project_id>/PROJECT.md`, từ chối `.`/`..`/UUID không hợp lệ; trước consequential write, re-fetch/reconcile current manifest/approved Project context + exact SHA; khi cần Human approval phải xác thực qua luồng Human hiện có chứ không suy từ boolean đơn lẻ. Tạo Project mới hợp lệ khi chưa có manifest; không xây thêm gate engine. |
| **P0-F08 — NEXT evidence/checkpoint** | `checkpoint_claim_prepare` [L5952+], `checkpoint_verification_prepare` [L6248+], `checkpoint_gate_evaluate` [L6466+], `evaluateNextEvidenceGate` [L907+]. Checkpoint claim/lease, evidence applicability gắn revision/token. | **KEEP / NEEDS_PROBE** negative end-to-end. Bảo vệ bằng chứng stale, duplicate token và success giả; hiện P0 chưa chứng minh xóa/hợp nhất được. | **M4/M5/M6.** Không ép tạo checkpoint cho mỗi Task; giữ những cái thực sự có dependency/evidence; chỉ SIMPLIFY khi oracle trước/sau không đổi. |
| **P0-F09 — Cursor, lost-response, plan change và legacy Job** | `execution_cursor_prepare` [L3071+], `execution_cursor_resume_evaluate` [L3132+], `execution_recovery_evaluate` [L3165+], `job_plan_change_*` [L2903–3070]; reliability/LLC58 tests có negative stale-SHA/replay. Trong Memory Repo hiện có Job CP6 `01a10052-71c7-76ff-949f-04fe20f5320b` trạng thái `IN_PROGRESS`, thuộc dòng upgrade lịch sử. | **KEEP / NEEDS_PROBE; CR-02:** Job legacy cùng Project ID không có nghĩa được tự tiếp tục trong refactor mới. Không đóng hay supersede Job cũ chỉ vì Fresh Start; cũng không bắt phục dựng toàn bộ lịch sử. | **M1/M3/M5/M6:** Bind selected Job + branch/objective + current revision rõ ràng trước dispatch; Project open không auto resume bất kỳ Job nào; chỉ tiếp tục Job đã có Human authorization đúng scope, giữ nguyên Job legacy/unaffected. Plan change áp dụng theo impact matrix, không bulk migrate `V2_STABLE`. |
| **P0-F10 — Review floor, Git and test truth** | Foundation F13 định nghĩa exact sensitive classes; `skills/gsa-job-runtime` và `llc59` nêu CI tự chẩn đoán; GitHub CI workflow có Deno typecheck + bounded Node suites. | **KEEP floor/authority**; **SIMPLIFY CANDIDATE** chỉ cho review/reconciliation lặp thừa ngoài F13, và chỉ khi có cùng test oracle trước/sau. CI script đã **đọc**, chưa chạy tại P0. | **M3–M6.** Reviewer dựa risk và sensitive changes; không mặc định review mọi Task. CI GREEN không thay real host PASS; merge/deploy riêng Human decision. |
| **P0-F11 — Git Admin ownership / integration scope** | GSA MCP `server.registerTool` list không có Git Admin/merge tool chuyên dụng; source chỉ sử dụng các ref/branch trong cursor và nhận xét về GitHub. GitHub connector cung cấp thao tác repository/branch và hiện có nhánh `upgrade/gsa-refactor` riêng so với `main`. Chưa chạy merge/PR/release. | **NEEDS_PROBE**, không đủ cơ sở nói GSA đã có Git Admin dùng được hoặc phải tạo một agent mới. Khả năng Git Admin hiện chủ yếu thuộc lớp Orchestrator + GitHub connector + Human authority, không phải MCP CRUD đã kiểm chứng E2E. | **M5/M6.** Lập ma trận quản lý branch/integration (HEAD, outstanding changes, absorption/reconciliation, release), đánh giá khi nào GitHub tools thật sự thực thi được và quyền merge/deploy tách rời; chỉ mở rộng tool/role nếu test chứng minh thiếu. |

**Negative evidence thực thi (preflight, không mutation):**

1. `authorize_project_scope(MUTATE_MEMORY, active_project/AGENTS.md)` → **ALLOW**; với `other_project/AGENTS.md` → **DENY**. Đây là guard đúng owner.
2. `authorize_memory_mutation(create, configured_repo, active_project/AGENTS.md)` → **ALLOW**; `create` với `other_project/AGENTS.md` → **ALLOW ở guard này**; repo khác → **DENY**; `delete` chưa có Human Gate → **DENY**. Đây là lý do không được chỉ gọi một guard để kết luận "đúng active Project".
3. `project_open` cùng nội dung manifest và SHA nhưng thay `memory_path` sang `projects/ffffffff-ffff-ffff-ffff-ffffffffffff/PROJECT.md` **hoặc** `projects/<active-id>/not-PROJECT.md` vẫn `openable=true`. Parser không chứng minh path thực đã được fetch, vì payload blob/SHA do caller cung cấp.
6. `authorize_project_scope(MUTATE_MEMORY)` và `authorize_memory_mutation(create)` cùng **ALLOW** cho `projects/<active-id>/../<other-id>/AGENTS.md`; Memory-only guard còn ALLOW `projects/------------------------------------/AGENTS.md`. Đây là negative preflight không canonical; chưa chứng minh GitHub sẽ chuẩn hóa/cho phép ghi vượt scope. Fix là canonical path validation, không cần tạo Human Gate mới.
4. `get_skill_catalog` live trả `tester-lab`, trong khi schema `load_skill` không hỗ trợ. `get_agent_harness(coder|tester)` live vẫn generic, không có đường Project add-in.
5. `get_runtime_status` live báo production NEXT; không dùng marker `P3-J-7793-R2` làm exact deployed SHA.

**Kết luận phân loại (không ép xóa gate):**

- **KEEP bảo vệ:** Project scope, Memory repository sandbox, Human merge/deploy, current-revision review, exact Git readback, NEXT evidence applicability, cursor/recovery, CI honesty, V2 compatibility. Các lỗi bind đường dẫn/cấu hình ở P0-F07 cần sửa, không phải lý do bỏ quyền kiểm soát.
- **EXTEND tối thiểu:** Fresh Start + Criteria/AGENTS.md, Project skill add-in for Coder/Tester, Criteria-first Planner và Task skill binding (P0-F01–F05). **P0-F07 path canonicalization phải có trong cùng M1 trước các flow ghi Project Memory mới.**
- **SIMPLIFY ứng viên:** các vòng review/role handoff/truy xuất evidence không có rủi ro thực, sau khi kiểm chứng đường gọi chính xác (P0-F06/F08/F10). **Chưa có quyết định REMOVE nào đủ chứng cứ tại P0.**
- **NEEDS_PROBE:** public-path continuation qua GitHub writes, host E2E, crash/retry, actual NEXT checkpoint consumer, Git Admin end-to-end và released binary parity với reviewed source — thuộc M4–M6. Không đánh dấu PASS cho những gì chưa chạy.

**Đầu vào để Planner lập detail plan tiếp theo (sau P0):** M1 trước tiên xử lý **CR-01/P0-F07 trusted Project/path/Human-approval boundary** tại đường ghi Project Memory, và **CR-02/P0-F09 selection/isolation của Job legacy**; triển khai P0-F01/F02/F03 (Fresh Start/Criteria/AGENTS) trên cơ chế an toàn này. M2 dựa P0-F04/F05, M3 có thể chuẩn bị song song với M2 sau M1. M5/M6 phải kiểm tra **CR-03 end-to-end authorize → GitHub write → exact readback ở Test Lab cô lập**, không coi preflight ALLOW là proof of write authorization. M4 dùng continuation hiện có, M5 giản lược có chứng cứ, M6 chạy E2E. Khi lập detail plan chỉ cập nhật **cùng file**, không sửa Criteria hay tạo plan cạnh tranh.

**P0 exit check:** có input exact revision, owner/tool boundary, observed gaps và negative probes; risk/security quan trọng có oracle cho bước sau; không đưa nguồn ngoài Project vào scope mutation; không thêm Human Gate chỉ để ký tên audit. **M0 hoàn tất ở mức scoped analysis/read-only; implementation correctness vẫn CHƯA KIỂM CHỨNG cho các luồng mới.**

### P0 — RL độc lập (vòng 2 trên audit) và Planner correction

**Reviewer vòng 1 — CHANGES_REQUIRED (đối chiếu exact P0 commit `ea380514d6d54d3f9677a04832404da03e09a5ca` với source/tool contract):**

- **R-P0-01 / IMPORTANT:** Audit F07 chưa kiểm noncanonical segments và gắn nhầm tính chất sandbox-only của `authorize_memory_mutation` với active-Project guard. **Evidence:** Read-only `authorize_project_scope` và `authorize_memory_mutation` đều trả ALLOW cho `projects/<active-id>/../<other-id>/AGENTS.md`; Memory guard còn ALLOW UUID gồm 36 dấu `-`. `project_open` chấp nhận cả non-`PROJECT.md` path. **Planner fix:** mở rộng F07 theo đúng ba nhóm lỗi input binding/normalization/defense layers; đặt M1 fix sớm, yêu cầu negative API tests, không khẳng định exploit đã xảy ra.
- **R-P0-02 / IMPORTANT:** F02 kết luận thiếu Criteria toàn Project mà chưa chỉ ra Job không bind tới Criteria revision; bằng chứng `validateNextPlanningModel` "cho phép milestone rỗng" không chứng minh điều này một mình. **Planner fix:** chỉ rõ `job_prepare` không nhận current Criteria reference/revision, giữ nguyên quyền Job thường không cần milestone.
- **R-P0-03 / MINOR:** F04 kết luận mismatch đúng nhưng vội coi `tester-lab` phải bật qua production `load_skill`; body mô tả skill này là Test Lab độc lập. **Planner fix:** phân biệt bất nhất catalog/loader được quan sát với ý định thiết kế chưa xác nhận; không mở rộng capability/authority bằng suy đoán.
- **R-P0-04 / IMPORTANT:** P0 chưa phân ranh Git Admin mặc dù M5 sẽ phát triển nhánh tích hợp. **Planner fix:** bổ sung F11 mô tả Git ownership/capability chưa kiểm chứng, không tự tạo Admin agent.
- **R-P0-05 / MINOR:** PASS audit cần hạn chế phát biểu: các probe đều là preflight chỉ đọc, no exact deployed source, no runner/host E2E. **Planner fix:** giữ rõ trạng thái `NEEDS_PROBE` và tách P0 audit exit khỏi implementation/release PASS.

**Review vòng 2 — phạm vi acceptance cho bản sửa:** lập lại trace từ 29 Criteria sang phase map hiện hành; cả F01–F11 đều có owner/impact/next action; F07 có tests reject canonical path mismatch và dot segments; F04 không cấp thêm skill qua inference; M1 canonical identity fix đi trước Project Memory writes; F08/F09 giữ tính đúng của evidence/cursor; không có blanket REMOVE, thêm gate, Criteria mới, code mutation, production claim hoặc M1 detail plan chưa được lập.

**Trạng thái RL trước CR:** P0 scoped audit file REVIEW PASS trên bằng chứng tĩnh + read-only preflight; không phải GSA durable `PLANNING_REVIEW`/Job Reviewer Verification. CR đã yêu cầu bổ sung ba ràng buộc quan trọng dưới đây; mã runtime **CHƯA SỬA**. Khi lập M1–M6 detail plan sau P0, chỉ thay đổi **cùng file này**.

### P0 — Human-invoked CR findings → Planner disposition (17/10/2026)

**Đối tượng:** P0 audit commit `0e7fd156ff8c88e330d4c99f945e2ea929e18e3f`; code source blob `fe94c3f291d5f97673fb889df3b89b8fcfb72c3b`; Criteria blob `562778aad9c9d224e265ba6c519e8056f22eda7f`. **CR verdict: PASS_WITH_FINDINGS; prior Reviewer: PARTIAL_DISAGREEMENT.** Đó là đánh giá độc lập trên source/Project Memory, **không** phải durable `CRITIC_REVIEW` record vì P0 không có Job chuyên biệt; không được giả lập Verification bằng cách mượn ID Job lịch sử.

- **CR-01 / IMPORTANT — trusted authorization input:** Có thể đưa `project_manifest_text`, `project_manifest_sha`, `memory_path` và `human_gate_approved` qua tool contract mà chưa có chứng cứ chúng phản ánh dữ liệu hiện hành/approval đáng tin ở boundary tương ứng. **Planner ACCEPT:** M1 xử lý canonical path *và* trusted source/authorization binding trên đường gọi hiện hữu; invalid/stale manifest, SHA và approval không được coi là cấp quyền; không mở khóa delete/merge/deploy bằng một boolean tự khai. M5 kiểm regression security. Việc yêu cầu chứng cứ phê duyệt chỉ đặt ở **Human actions thực sự cần**, không thêm approval cho mọi read/normal write.
- **CR-02 / IMPORTANT — unrelated legacy `IN_PROGRESS`:** GSA Project Memory còn Job CP6 `01a10052-71c7-76ff-949f-04fe20f5320b`, review revision 3 PASS nhưng thuộc scope lịch sử. **Planner ACCEPT:** Fresh Start chỉ chốt point-in-time, working branch, Criteria và explicit selected Job; không auto-resume, mutate/supersede hay migrate Job CP6 do Project ID trùng. Khi chỉ `project_open`, không dispatch; chỉ dùng impact/reconciliation nếu Human thực sự đổi scope của Job đó. Bounded test fixture không cần duyệt lại lịch sử.
- **CR-03 / IMPORTANT — full write-path proof missing:** Preflight read-only chưa chứng minh GitHub bảo vệ khi caller làm theo hoặc bỏ qua guard. **Planner ACCEPT:** M1 chạy unit/contract negative path and approval tests; M5 kiểm caller-boundary và tool/error propagation; M6 dùng Project Memory + repo thử nghiệm **cô lập được cấp quyền**, có case legitimate CREATE/UPDATE/readback và negative invalid path, foreign Project, stale SHA, fake approval. Nếu backend chỉ trả PREPARE/ALLOW hoặc tool write chưa thể chạy thì kết quả **UNVERIFIED**, không PASS. Không thử unauthorized mutation ở source/Memory production.

**Phạm vi thay đổi:** chỉ bổ sung bằng chứng/điều kiện nghiệm thu cho M1, M5, M6; **không** thêm Criteria mới, Phase mới, gate/role mới, sửa source hay yêu cầu hồi cứu phê duyệt. P0 vẫn hoàn tất **audit scoped**, không được dùng PASS tài liệu để tuyên bố ba lỗi đã sửa.



## Phase M1 — Fresh Start, một Criteria và AGENTS.md tối thiểu

### GOAL

Tiếp nhận **đúng Project/source** bằng setup nhẹ; Planner làm rõ **GOAL, mục đích sử dụng, quy mô thực/tương lai đã cam kết và giới hạn tương xứng**, soạn **một Criteria tương lai**, Advisor generic phản biện **toàn draft trước lần Human duyệt đầu**; Human chốt, `AGENTS.md` generic tối thiểu được tạo. **Mở Project không tạo Job, không sửa source, không truy xét quá khứ.** Criteria đã duyệt là đầu vào để M3 lập Project Plan/milestone.

**Criteria trực tiếp:** C01–C03, C23–C24, C26–C29. **Bảo vệ đang có:** C11–C12 (resume/không lặp write), C15 (đúng quyền), C17 (test thật), C21–C22 (không thêm gate thừa). Những cái này là **giới hạn an toàn**, không tạo GOAL hoặc approval workflow thứ hai.

**M1 DONE khi:** setup được **3 tình huống** NEW (repo mới), ADOPT_EXISTING_REPO (đã có code, chưa dùng GSA), REGISTERED_BROWNFIELD (đã có `PROJECT.md`); đúng Project identity/baseline, một Criteria hiện hành với **GOAL/phạm vi đủ để lập kế hoạch đã được người dùng chốt** (các chi tiết chưa quyết định vẫn được ghi rõ `CHƯA CHỐT`), `AGENTS.md` tối thiểu; không đụng code/legacy Jobs; retry sau mất phản hồi không tạo ghi trùng. **Không bắt chứng minh một tính năng/concurrency guarantee mà Criteria không yêu cầu.**

#### M1 — Execution detail: 5 Task, một causal chain

**Job Pack JP1:** chỉ một chuỗi onboarding; có thể chia khi một phần thay đổi security thực sự cần review độc lập theo F13. Không tạo micro-Job, Project Plan riêng, gate mới hoặc bảng dữ liệu cấp quyền mới.

| Task | Owner | HOW — việc thực hiện | Dependency | DONE / evidence |
|---|---|---|---|---|
| **M1-T1 — Project identity và scope** | Coder; Reviewer khi đụng security/contract | Dùng helper và guard đã có: kiểm đúng `projects/<project-id>/PROJECT.md` với manifest ID, configured Memory Repo và repository OWNED; từ chối noncanonical path (`.`, `..`, UUID giả, path ngoài Project). Trước ghi kiểm current GitHub manifest/expected SHA; preflight ALLOW không thay GitHub write/readback. Không thêm lớp approval chỉ để thực hiện setup. | P0 | Đúng Project, fail-closed khi khác scope/stale manifest; NEW legitimate vẫn tạo được |
| **M1-T2 — NEW / ADOPT / REGISTERED** | Coder; Reviewer cho persisted format | NEW và ADOPT chưa dùng GSA: xác minh repo chưa bị Project khác OWNED, tạo `PROJECT.md` qua luồng có sẵn; REGISTERED thì mở đúng Project hiện hành, không tạo ID mới. Đọc source HEAD/config tối thiểu và ghi **source baseline trong chính `PROJECT.md`** (repo/branch/commit nếu có, trạng thái chưa có HEAD hoặc không đọc được, thời điểm quan sát); tương thích Project cũ. Repo chưa có commit vẫn hợp lệ, không bịa HEAD. **Khi CREATE/UPDATE mất phản hồi:** re-fetch Project/OWNED claim và đúng Git SHA, nhận lại ID + phần đã ghi nếu cùng intent, chỉ làm phần thiếu; không gọi `project_create` lặp mù. Nếu repo thực sự đã OWNED bởi Project khác, báo đúng conflict, không tự attach. Không truy lịch sử, không tự source write, không tự resume Job. | T1 | 3 tình huống hoạt động; baseline persisted trước Job; retry không duplicate, Project/ownership chính xác |
| **M1-T3 — Một Criteria hiện hành** | Planner template, Coder lưu/nạp | Khởi tạo/cập nhật **một** `projects/<project-id>/CRITERIA.md`: GOAL, giới hạn, acceptance của người dùng. Phần còn bàn ghi `CHƯA CHỐT` ngay trong cùng file; **Human xác nhận rõ nội dung trong hội thoại thì ghi là đã chốt**, dùng update theo current blob SHA và readback. Không tự suy diễn approval từ agent, Git commit hoặc im lặng; **không yêu cầu API/chữ ký provenance mới** để chốt Criteria. Mở lại Project vẫn phân biệt phần đã chốt/chưa chốt; sửa draft không thay phần được duyệt. File SHA bảo vệ ghi đè, không đại diện cho ý định Human. Đưa đúng ref/revision cho M3, nơi sẽ bind Criteria với Project Plan/Job. | T2 | User chốt → ghi đúng một file → Git readback → mở lại vẫn đúng; chưa chốt không thành code requirement |
| **M1-T4 — AGENTS.md tối thiểu** | Planner template, Coder lưu | Tạo `projects/<project-id>/AGENTS.md` theo template generic: Project identity/repo và đường dẫn tới Criteria, tùy chọn khai báo Coder/Tester add-in nếu có. Không chép global harness, không đặt Criteria, không tạo quyền/gate/skill trống. Project không có add-in vẫn dùng generic; execution add-in thuộc M2. | T2 + canonical Criteria path từ T3 | File tối thiểu đúng Project root, readback; không bootstrap từng source repo |
| **M1-T5 — Bounded testing và compatibility** | Coder self-check → Tester; Reviewer theo F13 | Kiểm các luồng tạo/mở Project, ghi/đọc Criteria, restart/retry không tạo trùng, đúng quyền và legacy Job isolation trên source/revision thật. Kiểm test script/oracle (known-bad phải RED). Không cần chạy test destructive thật trên Memory production; E2E full public-path thuộc M6. | T1–T4 | Đạt test có căn cứ phía dưới, không làm sai V2_STABLE/NEXT hoặc Job legacy |

**Dependency:** `T1 → T2 → T3 → T4 → T5`. Soạn template T3/T4 có thể song song nhưng hoàn thành theo input thật. Sau khi M1 PASS, M2 và M3 có thể bắt đầu độc lập theo milestone map; M4 đợi cả hai. Không yêu cầu User gọi lại từng Task/Review trong phiên còn hoạt động, không tự gọi CR.

#### M1 — Source surfaces và ranh giới triển khai

- **MCP:** `supabase/functions/gsa-mcp/index.ts`: existing `project_create`, `project_open`, `project_register_repositories`, manifest parse/build, Project/Memory scope helpers. Sửa tối thiểu đúng behavior; không thêm authority engine hoặc hardcode Project riêng.
- **Memory:** `docs/architecture/PROJECT-MEMORY.md` nếu cần ghi format cho Criteria/AGENTS và các trường baseline optional trong `PROJECT.md`; baseline là **snapshot xuất phát** của source, không phải criteria hay current HEAD sau mọi commit.
- **Harness:** hướng dẫn generic Planner/Orchestrator dùng đúng Project Memory và Criteria hiện hành, không tạo per-repo bootstrap. Coder/Tester add-in thực thi thuộc M2; Job/Project Plan criteria binding thuộc M3.
- **Tests/CI:** tái sử dụng `test-lab/runtime-logic.test.cjs` và các test gần đường bị sửa; nếu chưa có oracle tương ứng thì thêm một bounded M1 test suite và nối vào existing CI. Reviewer F13 kiểm security/persisted format/CI nếu thay đổi. Không coi mock PASS là real host PASS.
- **Git/source:** viết source refactor chỉ trên `upgrade/gsa-refactor` sau khi được Human duyệt thực thi. **Không sửa Project Memory production** để thử case sai quyền; staging/test namespace do người dùng cấp khi có E2E.

**Phân biệt acceptance và risk probe:**
- **Bắt buộc (C01/C11/C12/C15):** đúng Project, không write ngoài scope; khi mất phản hồi kiểm GitHub để tránh tạo lại Project/commit và tiếp tục phần thiếu; nếu có conflict OWNED thật, dừng có lý do. Việc tạo Project mới mà caller retry phải không nhân đôi cùng hành động.
- **Không phải một Criteria mới:** stress giả định hai Project được CREATE đồng thời trên hai path GitHub khác nhau (trước đây gọi `N10`). Chỉ lập probe riêng **khi có bằng chứng hoạt động thực tế hoặc thay đổi code tạo rủi ro liên quan**; không mặc nhiên yêu cầu atomic uniqueness/lock/registry mới để M1 PASS. Nếu một probe cho thấy lỗi cụ thể ảnh hưởng ownership thì phải xử lý trước khi tuyên bố tính đúng của đường đó.
- **Human approval:** hội thoại có chỉ thị Human rõ ràng là căn cứ chốt Criteria; lưu cùng một file và readback. Không bịa trạng thái duyệt từ lời agent. Quyền DELETE/merge/deploy cần Human authority theo contract hiện có nhưng **không thuộc onboarding M1**.

#### M1 — Test matrix có nguồn từ Criteria/rủi ro thực

| ID | Case | Oracle |
|---|---|---|
| **P1** | NEW repo trống/chưa có HEAD | Tạo Project và metadata source không bịa commit; Criteria/AGENTS tối thiểu được ghi đúng |
| **P2** | ADOPT_EXISTING_REPO đã có source, chưa có GSA Project | Đăng ký một Project, ghi source baseline hiện có, không sửa code hay hồi cứu approval |
| **P3** | REGISTERED_BROWNFIELD thiếu một file setup | Dùng lại ID cũ, bổ sung đúng file còn thiếu; không tạo Job mới hoặc resume Job cũ |
| **P4** | User xác nhận Criteria rồi mở lại Project; tiếp tục chỉnh một mục CHƯA CHỐT | Cùng `CRITERIA.md` có phần đã chốt; readback/reopen đúng, draft không đổi phần đã duyệt; không cần host provenance API mới |
| **P5** | Project không có Coder/Tester add-in | `AGENTS.md` tối thiểu hợp lệ, generic roles vẫn dùng được |
| **P6** | Project/Criteria write bị mất phản hồi rồi retry | Readback xác minh phần đã ghi, dùng lại ID/commit, chỉ làm tiếp phần thiếu; không duplicate write |
| **N1** | Manifest của A + Project path của B hoặc basename sai | Không mở sai Project |
| **N2** | Path traversal, UUID/segment không canonical | DENY trước write |
| **N3** | Stale/forged manifest hay SHA, repository mismatch | No-write/reconcile; không tin caller tự khai |
| **N4** | Memory repo guard ALLOW nhưng active Project guard DENY | Không gọi GitHub write vượt Project |
| **N5** | Onboarding gặp yêu cầu DELETE/destructive không thuộc setup | Không tự làm; báo riêng quyền/điều kiện cần, không chặn setup hợp lệ |
| **N6** | Criteria update với stale SHA | Không ghi đè nội dung được chốt; fetch và reconcile |
| **N7** | Project có legacy Job `IN_PROGRESS` | Open/setup không auto resume, cancel hay supersede |
| **N8** | Repo đã OWNED bởi Project khác hoặc intent chưa rõ | Không tự attach/gán quyền; chỉ hỏi khi thật sự thiếu quyết định |
| **N9** | Mutate fixture để bỏ guard hoặc cho CHƯA CHỐT thành approved | Test phải RED, tránh false-green |

**Verification:** Test đúng source revision; review ở checkpoint F13 khi có thay đổi nhạy cảm, không sau mọi Task. **Nếu GOAL/phạm vi cần để lập kế hoạch chưa được Human chốt, setup có thể lưu hoàn chỉnh nhưng không đánh dấu M1 READY để M3 lập plan; chỉ hỏi đúng quyết định còn thiếu (C02/C03).** M1 có thể PASS theo evidence cho các hành vi **thực sự thuộc M1**; không bị giữ bởi API approval hoặc hypothetical race không nằm trong Criteria. Nếu rights/retry hiện thực sai, không tự gọi PASS. Phần chưa kiểm được ở live host ghi `UNVERIFIED`, không tự chuyển thành success. E2E Project setup thật trên test environment và release thuộc M6.

**Tiếp tục:** khi đủ test/review evidence, Planner/Orchestrator tiếp tục M2/M3 theo dependency **trong lượt đang hoạt động**; Human duyệt riêng việc sửa code và merge/deploy. Không đồng nhất `plan review PASS` với `runtime PASS`.

#### M1 — Criteria alignment & RL (18/10/2026)

**Human instruction:** "Planner xem lại và sửa, cần bám sát goal. Goal bám sát criteria, đừng bịa". **Target:** Criteria blob `562778aad9c9d224e265ba6c519e8056f22eda7f`, plan cũ `62190ebe6b1ac5c6c23a4ab52f22d6dffe0209a6`.

**Finding 1 (C02/C03/C20/C28/C29):** plan cũ có yêu cầu chứng thực Human-origin bằng host API, không phải yêu cầu của Criteria. **Repair:** Human xác nhận rõ trong hội thoại → một Criteria → readback/reopen; không thêm chứng chỉ/gate.
**Finding 2 (C01/C11/C12/C21/C22):** giữ oracle chống duplicate khi lost response; bỏ `N10` concurrency interleaving như điều kiện bắt buộc M1. Nếu có failure cụ thể về quyền/ownership thì xử lý theo đúng rủi ro đã chứng minh.
**Finding 3 (C01/C26):** milestone map sửa "2 đường" thành ba tình huống NEW / ADOPT / REGISTERED.
**GOAL check:** C01–C03/C23–C24/C26–C29 trực tiếp vào M1 GOAL; các kiểm thử security/retry là điều kiện bảo vệ và HOW, không sinh WHAT mới. Các review history ở dưới thuộc **SUPERSEDED**; không dùng verdict cũ cho revision sau sửa.

**Reviewer independent check:** phát hiện điều kiện M1 DONE chưa nói rõ Human chốt Criteria gốc (C03/C26); Planner đã sửa GOAL, DONE và Verification như trên. **Review PASS ở mức consistency của plan sau source readback**, không phải bằng chứng M1 runtime đã thực thi, GSA durable `PLANNING_REVIEW`, CRITIC_REVIEW hay quyền sửa source.

#### M1 — Historical CR/RL notes (SUPERSEDED by Criteria alignment above, 18/10/2026)

#### M1 — Planner tiếp nhận CR-M1-05/06 → RL độc lập (18/10/2026)

**Target:** P0+M1 integration plan trên `upgrade/gsa-refactor`; Criteria blob `562778aad9c9d224e265ba6c519e8056f22eda7f`; source baseline `fe94c3f291d5f97673fb889df3b89b8fcfb72c3b`; CR target trước đó `1456bfbc10dac053f8f0c9995603d5fca17a6f1f`. Reviewer/Planner **không** đọc RL PASS lịch sử như authorization cho revision mới.

**CR-M1-05 — ACCEPT (IMPORTANT):** Chỉ có đường chống fake APPROVED, thiếu positive path Human xác nhận Criteria và khôi phục state trong phiên mới. **Planner sửa** T3 + P4: Human-origin confirmation trên exact item/visible revision → same-file CAS update/readback → reopen → approved set đúng; draft edit thay blob SHA không thay semantic approved set. Nếu test surface không chứng minh được host Human-origin, phần host proof là UNVERIFIED, không lén approve và không tạo Decision Logger.

**CR-M1-06 — ACCEPT (IMPORTANT):** `project_create` tạo UUID mới mỗi call (`index.ts` L4585). **Planner sửa** T2 + P6 + N10: trước retry sau uncertain GitHub CREATE, tìm OWNED claim trong Memory Repo thật và re-fetch PROJECT.md; nếu chỉ một Project phù hợp, reuse ID; nếu không có claim và đã xác minh, mới create; đồng thời tạo hai Project ở path khác có thể race, do đó kiểm hậu CREATE, fail closed trên multi-claim và không gọi là unique transactional guarantee. Trường hợp conflict thật cần Human reconcile; không tạo registry/lock ngầm. Các tình huống unknown-write và concurrent interleaving có oracle đỏ/xanh riêng.

**Review topology:** 5 Task hiện hành không đổi; 6 positive (P1–P6), 10 negative (N1–N10), không thêm Phase/Criteria/approval gate. REVIEWER bắt đầu kiểm bằng source contract, security floor và known-bad tests; nếu thiếu evidence, đưa CHANGES_REQUIRED cụ thể. **Không có M1 Job durable/PLANNING_REVIEW Verification trong yêu cầu file-level này**; không nhận "GitHub readback plan" là implementation hoặc E2E PASS.

**Disposition sau Reviewer vòng 2:** **RL PASS — chỉ mức detail plan/file** trên revision Planner repair `6c129ef321887a77809e8cb63da987df53a82e95` đã được GitHub exact readback và đối chiếu với Criteria/source. Đã kiểm P4/P6/N8/N10, source-of-truth, original Goal/Phase Goals, 6 positives/10 negatives và reviewer correction R1/R2. **Không** tuyên bố test race/actual GitHub create đã PASS, không cấp Human approval cho source implementation, không thay durable GSA Planning Review/CRITIC_REVIEW record. Nếu khi làm N10 vẫn chứng minh hai READY hoặc host Human-origin chưa kiểm được, ghi CHANGES_REQUIRED/BLOCKED/UNVERIFIED đúng phần liên quan; tiếp tục sửa **cùng plan**, không dựng thêm gate.

**Reviewer RL vòng 1 sau Planner repair — CHANGES_REQUIRED (current draft `587679f9748ab7f0bc9a4df2b8ba9970f9744104`):**
- **M1-RL-05 / IMPORTANT:** Project có sẵn OWNED claim chưa chắc là đúng **lượt retry**; tự attach sai user intent/Project identity. **Planner sửa:** chỉ reuse với claim đúng scope/identity/retry được xác minh; nếu một repo đã OWNED nhưng user yêu cầu tạo khác, hỏi quyết định có ý nghĩa, không bypass source registration conflict.
- **M1-RL-06 / IMPORTANT:** scan-before/after trên hai GitHub path khác nhau không atomic, nên từng creator có thể hậu kiểm trước khi bên kia commit và cùng báo READY. **Planner sửa:** bổ sung interleaving adversarial trong N10, kết quả false READY = test RED và M1 chưa PASS; cần biện pháp bảo đảm tối thiểu có bằng chứng hoặc báo blocker, không tuyên bố quét hai lượt đã giải quyết race.

**Review vòng 2 — recheck requirement:** verify exact new plan revision has no unconditional auto-bind to existing GSA Project, no claimed atomic uniqueness from ordinary GitHub scan, accurate P6/N8/N10, T3 Human approved→readback→reopen and effective-set stability; no criteria/phase/gate/branch mới. Kết luận PASS chỉ cho **tính rõ ràng/khả thi của kế hoạch kiểm chứng**, không tự xác nhận runtime đã vượt concurrency test; một test tương lai RED hoặc limitation không tự trở thành PASS.


#### M1 — CR independent review (17/10/2026) → Planner corrections

**Target review:** M1 detail tại commit `5aae5808956061bda81f141e990dcae8c4d391ac` (blob `fe6f4201edb603ef5831c448a5498ac938da1c3a`), Criteria source blob `562778aad9c9d224e265ba6c519e8056f22eda7f`. **CR verdict: FAIL/CHANGES_REQUIRED**, đối chiếu file-level RL trước: **DISAGREE về tính sẵn sàng thực thi**, không phải durable GSA CRITIC_REVIEW Verification vì chưa có M1 Job durable. **Planner disposition:** chấp nhận bốn findings trong cùng plan, không sửa Criteria hay source.

- **CR-M1-01 (ACCEPT):** BROWNFIELD chưa đăng ký GSA không thể dùng `PROJECT.md` sẵn. Planner phân thành NEW, ADOPT_EXISTING_REPO và REGISTERED_BROWNFIELD; NEW/ADOPT dùng project_create, REGISTERED dùng project_open rồi setup on-demand, không đòi đào lịch sử.
- **CR-M1-02 (ACCEPT):** fallback lưu baseline vào Job evidence là sai vì chưa chắc có Job. Planner chốt **các trường onboarding metadata tùy chọn ngay trong `PROJECT.md`**, đọc/lưu bằng CAS, bảo toàn parser/registry/lifecycle, không tạo file thứ hai.
- **CR-M1-03 (ACCEPT):** file SHA không bằng approved criteria revision. Một file Criteria có ID mục, trạng thái APPROVED/CHƯA CHỐT và provenance được xác minh ở phần approved; chỉnh draft không mất hiệu lực nội dung approved hay tự cấp approval, M3 sẽ phụ trách pin/propagate changes.
- **CR-M1-04 (ACCEPT with narrow scope):** onboarding không sử dụng DELETE; M1 bảo đảm no destructive dispatch, còn tổng thể authenticated DELETE provenance kiểm ở M5/M6. Giữ fail-closed nhưng không mở gate mới chặn Fresh Start.

**Kết quả Planner:** 5 Task vẫn một chuỗi, 5 positive/9 negative case vẫn hữu dụng, không tạo Phase/gate mới. Reviewer phải kiểm metadata và effective Criteria state trên code thực tế. **Kết luận M1 hiện hành nằm ở các Task phía trên**, còn RL lịch sử trước CR ở cuối đã SUPERSEDED và không tạo một implementation direction thứ hai.
#### M1 — RL trước CR-M1-05/06 (SUPERSEDED; lịch sử revision cũ)

**Target:** detail M1 sau CR, Criteria blob `562778aad9c9d224e265ba6c519e8056f22eda7f` và source blob `fe94c3f291d5f97673fb889df3b89b8fcfb72c3b`. Đây là RL ở cấp file plan, không phải GSA durable Job Planning Review.

**Reviewer vòng 1 — CHANGES_REQUIRED:**
- **M1-CR-R1 / IMPORTANT:** T2 nhầm repo GitHub hợp lệ chưa có HEAD với lỗi quyền/tool. **Planner sửa:** `EMPTY_REPOSITORY` là một source baseline hợp lệ với repo chưa có commit; `NEEDS_SOURCE_BASELINE` chỉ khi có source HEAD nhưng không xác minh được; không bịa SHA.
- **M1-CR-R2 / MINOR:** RL cũ vẫn ghi phương án optional baseline và PASS trước CR, có thể thành hai chỉ dẫn cạnh tranh. **Planner sửa:** đánh dấu đoạn đó SUPERSEDED và chỉ lấy hiện trạng Task M1 sau CR làm implementation direction.

**Reviewer vòng 2 — xét lại:** NEW blank, ADOPT_EXISTING_REPO và REGISTERED_BROWNFIELD; baseline persist được trước khi Job tồn tại, đúng `PROJECT.md`; một Criteria có approved/pending riêng với file CAS SHA; Human destructive approval không chặn setup; legacy Job không auto resume; 5 Task/5 positive/9 negative; no gate/phase/Criteria mới. **PASS mức file scope nếu exact GitHub readback xác nhận.**

**Giới hạn:** Không phải durable GSA Reviewer Verification hay CI/E2E PASS. Chỉ triển khai source khi có Human authorization cho plan chi tiết.

#### M1 — RL lịch sử trước CR (SUPERSEDED; không định nghĩa M1 hiện hành)

**Review target:** detail M1 của `GSA-REFACTOR-UPGRADE-PLAN.md` theo Criteria blob `562778aad9c9d224e265ba6c519e8056f22eda7f`, source `index.ts` blob `fe94c3f291d5f97673fb889df3b89b8fcfb72c3b`; đây là review file-level **không có durable Job Reviewer Verification**.

**Vòng 1 — CHANGES_REQUIRED, ba lỗi cụ thể:**

- **M1-R1 / IMPORTANT:** Task Criteria M1 đồng thời đòi enforcement Job/Plan revision, trong khi M3 có owner và test cho criteria-first Planner. **Planner sửa:** M1 chỉ cung cấp canonical current ref/revision và kiểm tra trạng thái; M3 bind/enforce đối với Job/Plan. Không tạo gate chặn M1 vì M3 chưa triển khai.
- **M1-R2 / IMPORTANT:** T2 nói "ghi baseline" nhưng không xác định vị trí/source authority, dễ tạo file trạng thái cạnh tranh hoặc stale baseline bị gọi là current. **Planner sửa:** snapshot source HEAD/branch thuộc metadata onboarding optional trong `PROJECT.md` nếu existing contract cho phép, CAS/readback; không tạo theory/history doc thứ hai và không refresh baseline trong routine open.
- **M1-R3 / IMPORTANT:** Proof authenticated Human click/current GitHub SHA chưa có API trực tiếp trong MCP; bắt mọi setup chờ một approval verification không khả thi sẽ gây gate mới. **Planner sửa:** phân biệt GitHub caller readback và MCP advisory, scope requirement trên boundary nguy hiểm; nếu Human provenance chỉ là boolean không chứng minh được thì fail-closed **thao tác nhạy cảm cụ thể**, không chặn việc tạo Criteria/AGENTS bình thường. N3 test caller no-write, không đánh đồng preflight với end-to-end.

**Vòng 2 — điều kiện PASS:** detail chỉ mô tả HOW/WHEN dựa 29 Criteria, không thay GOAL; M1-T1–T5 có bounded output và causal order; không tự chốt các mục Criteria CHƯA CHỐT; no bootstrap Codex; no duplicate source-of-truth; current-SHA/legacy guards có negative oracles; M1 not claim E2E GitHub writes/real host; chỉ code khi Human phê duyệt detail plan. Reviewer không tự sửa source; CR Human-only.

**Disposition:** **M1 detail plan RL PASS ở cấp tài liệu nếu checks above được đọc lại trên exact Git blob**. Không dùng verdict này thay GSA persisted Reviewer Verification hay cho phép tự release.

## Phase M2 — Generic Coder/Tester + Project add-in tùy chọn

### GOAL

Tùy biến **chuyên môn** mà không tạo nhiều phiên bản của agent hoặc làm mất generic coding/testing.

- **JP2 (MEDIUM; one skill-loading integration chain):** nạp global harness Coder/Tester trước; đọc `AGENTS.md` của Project đã được bind và được phép; nếu khai báo skill chuyên ngành cho đúng vai, nạp **chỉ skill phù hợp Task** từ Project Memory (có thể tổ chức tối giản dưới `SKILLS/coder/` và `SKILLS/tester/` khi thực sự cần). Không buộc tạo thư mục rỗng. Ưu tiên luồng GitHub đọc sẵn có và catalog/load_skill hiện tại; mở rộng bề mặt công cụ chỉ khi test chứng minh không đủ, không viết skill engine mới.
- **JP2 không override:** Planner/Reviewer/CR luôn dùng shared generic. Coder/Tester vẫn có generic loop, quyền và evidence requirements như cũ. Add-in là nội dung chuyên môn (dialect/API/host/test strategy), **không** được định nghĩa lại role, source-write authority, tự đặt Criteria, tắt review, cấp secret hay thêm quyền đọc/ghi repo.
- **JP2 assurance:** validate path thuộc Project; skill binding theo exact Project/Task, stale/missing/malformed add-in được báo đúng. **Chỉ fallback generic nếu Task không phụ thuộc skill chuyên biệt**; Task bắt buộc host/dialect chuyên biệt phải báo chưa có skill/khả năng chứ không chạy sai như generic. Không tự trộn add-in của Project khác; nội dung add-in không có quyền override instruction/security/Criteria. Không nạp skills vô can vào context.

**M2 PASS khi:** generic no-add-in PASS, CAD/AutoLISP Coder add-in được chọn đúng Task và không biến cú pháp Common Lisp thành mặc định, Tester host-check add-in tạo đúng chiến lược kiểm chứng; negative thử "disable security", cross-Project skill, wrong-role skill đều không có tác dụng vượt quyền. Host thật không được tuyên bố PASS nếu chỉ dùng fixture.

## Phase M3 — Planner bắt buộc criteria-first và milestone có ý nghĩa

### GOAL

Planner tạo Project Plan/GOAL/milestone từ Criteria **đã được Human duyệt**. **Sau mỗi Criteria edit hợp lệ, kiểm và điều chỉnh Overall GOAL + mọi Phase GOAL bị ảnh hưởng trước rồi mới cập nhật detail/milestone/Job/Task/test**, giữ phần không đổi; Reviewer kiểm đúng Criteria revision và không thêm gate/yêu cầu sản phẩm dư.

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
- **JP5B (MEDIUM; durable safety; CR-01/CR-03):** giữ exact Project/branch/scope, optimistic SHA/CAS, idempotent unknown-write recovery và append-preserving evidence; chỉ đọc cursor/checkpoint khi cần mutation hoặc resume. Giữ NEXT và V2_STABLE; stale evidence không PASS. Kiểm cả negative entrypoint/tool/binding/caller flow cho wrong Project, stale manifest, invalid path, forged `human_gate_approved`, split preflight vs actual Git write, duplicate/replay; expected DENY phải không dẫn đến write hoặc bị giải thích là approval. Nếu hệ thống đang yêu cầu nhiều preflight độc lập, chỉ hợp nhất khi test bảo vệ vẫn fail-closed, không thêm gate mới.
- **JP5C (SMALL/MEDIUM; Git + test autonomy):** một integration branch chính, status/absorption rõ; không ép dọn toàn bộ branch lịch sử. Coder tự lấy CI jobs/steps/logs và sửa lỗi source/test trong quyền; nếu runner không chạy, classify ENVIRONMENT_FAILURE/UNVERIFIED và dùng tool khác chỉ khi đã chứng minh capability; không tuyên bố CI PASS thay.
- **So sánh before/after:** số công đoạn Human không cần thiết, lượt tool/Memory write trên các scenario lặp lại, context/skill load thực tế, số nhánh có source chưa nhập, số gate có rủi ro và oracle riêng. Đây là **chỉ số mô tả**, không đặt target % tiết kiệm hay gate-count tùy tiện.

**M5 PASS khi:** hành vi E1/E17/E19/E21–E35 **liên quan bề mặt bị sửa** còn tương thích; negative security, stale approval/manifest, cross-Project canonical path, crash/retry, duplicate write, Git scope, legacy-Job dispatch và release vẫn fail-closed. M5 review test script/oracle: known-bad phải RED, contract tests không được đánh đồng PREPARE/ALLOW với Git mutation thành công. Mọi cơ chế đề xuất cắt gọn phải có before/after oracle; **không quota xóa gate/module**. Nếu không có gì đủ căn cứ để loại, giữ và báo lý do.

## Phase M6 — Acceptance thực tế, hợp nhất, release

### GOAL

Chỉ tuyên bố thành công khi đúng luồng GSA người dùng sử dụng chạy được, không chỉ CI helper GREEN.

- **JP6A (MEDIUM; exact source/release proof):** chạy Deno typecheck cho `supabase/functions/gsa-mcp/index.ts`; các Node test trong `test-lab/` và test âm mới thực sự kiểm lỗi; kiểm tra chính script oracle với known-bad fixture ở các điểm rủi ro. Kiểm thử trên isolated `gsa-mcp-next` và test Memory namespace đúng; proof deployed-source readback phải khớp exact reviewed revision. Không biến Test Lab thành sản phẩm đã phát hành.
- **JP6B (MEDIUM; real workflow pilot):** 5 kịch bản có mục tiêu riêng:
  1. New Project + generic agents + Criteria/AGENTS.md tối thiểu.
  2. Adopt brownfield midstream (ví dụ GSA-Localconnector chỉ khi Project/host được cấp quyền): không hồi cứu chat, không sửa những phần ngoài scope, **không auto-resume Job legacy có trạng thái IN_PROGRESS** chỉ vì chung Project.
  3. Project add-in cho Coder và Tester (fixture + ít nhất một host/tool thực tế khi khả năng được xác minh); no-add-in vẫn tốt.
  4. Human đổi Criteria ngay khi một Job đang IN_PROGRESS; đánh giá affected/unaffected, current Criteria SHA, stale plan-review evidence, auto review/repair/checkpoint + real Human stop + restart/unknown-write recovery.
  5. **CR-03 authorized write-path integration:** tạo Project/Memory trong namespace + repo thử nghiệm cô lập **thuộc scope được cấp quyền**; kiểm full `authorize_project_scope` + `authorize_memory_mutation` → GitHub CREATE/UPDATE (CAS) → authoritative readback, và negative cases (foreign Project, dot segments, wrong file, forged/stale manifest SHA, fake Human approval, write error/lost-response). **Negative DENY phải chặn trước GitHub write:** kiểm tra bằng spy/recording tại connector boundary và absence-of-commit/readback; không chủ động tạo mutation trái quyền để chứng minh backend. Chỉ thử GitHub WRITE cho các Project/namespace được ủy quyền trong Test Lab. Nếu chưa có quyền hoặc không đủ công cụ, ghi UNVERIFIED.
  Test exact source, memory state, permissions, negative cases, honest limitations và câu trả lời hướng người dùng. Không coi missing host, PREPARE/ALLOW hoặc tool-registration là PASS.
- **JP6C (SMALL; release candidate):** chứng minh các code thay đổi đã vào `upgrade/gsa-refactor`, reconcile `main` drift theo bằng chứng, Reviewer đánh giá exact candidate, Tester lưu bằng chứng, giữ rollback source/deployed runtime. Trình Human **hai quyết định tách biệt**: merge `main` và production deploy. Sau khi được duyệt, deploy/readback/smoke; nếu fail thì rollback theo đã xác minh, không tự báo phát hành thành công.
- **Đóng dự án refactor:** Criteria của **GSA sản phẩm** được promote từ working draft thành **một canonical file** (không duy trì bản sao song song) **khi người dùng duyệt**; đây là việc quản trị tài liệu của chính GSA, tách với khả năng tạo `projects/<project-id>/CRITERIA.md` cho **các Project do GSA quản lý**. Historical plans chỉ tham khảo. Không tự hợp thức hóa Criteria chưa được Human chốt qua PASS kỹ thuật. Project mới dùng setup mới, legacy Project không bị ép migration.

**M6 PASS khi:** E2E public path và Project pilot chứng minh Criteria áp dụng trên đúng version đang test; **full write-path test CR-03** đạt với GitHub readback cho positive cases và negative DENY không thực hiện writes; không tự resume Job legacy; current Project/approval binding có bằng chứng đáng tin. Những giới hạn UNVERIFIED phải minh bạch; production chỉ PASS sau quyết định merge/deploy riêng và xác minh deployment. Không bắt buộc phải chứng minh thao tác destructive bằng cách thực hiện hủy dữ liệu thật.

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

### RL sau CR — Planner → Reviewer → repair → re-review (17/10/2026)

**Đối tượng review:** bản Planner nhận CR ở commit `a081228c5a8af3b729f9d1f89353ee155862a9be`, blob `ee9a3674c03474bc15da16c592ebacd96eab9663`. Reviewer không được tự sửa Criteria/GOAL; chỉ đối chiếu yêu cầu C01/C03/C06/C09/C11/C12/C15/C20/C21/C26–C29, hành vi source đã kiểm, source/API GitHub thuộc scope và ba CR finding. Đây là RL **file-level**, không phải durable GSA `PLANNING_REVIEW`.

**Reviewer vòng 1 — CHANGES_REQUIRED (minor, bounded):**
- **RL-CR-R1:** M1 PASS có thể bị hiểu là Fresh Start tự tạo Job mới. **Planner sửa:** setup kết thúc khi Project/Criteria/AGENTS READY; chỉ khởi tạo Job khi Human duyệt một objective cụ thể. Old CP6 không tự resume.
- **RL-CR-R2:** M6 liệt kê 5 trường hợp nhưng header nói "ít nhất 4"; gây lệch điều kiện nghiệm thu. **Planner sửa:** thống nhất 5 kịch bản.
- **RL-CR-R3:** wording "negative full write-path" có nguy cơ bị diễn dịch thành cố tình thử ghi trái quyền vào production Project. **Planner sửa:** negative guard phải chặn trước GitHub write; kiểm bằng recording boundary/absence-of-commit và readback; chỉ dùng GitHub write thật trên Test Lab/repo được cấp quyền.

**Reviewer vòng 2 — PASS trong phạm vi file plan:** 3/3 CR findings đã có owner, Phase, negative oracle và điều kiện nghiệm thu; không cần phát triển auth engine, background worker, branch phụ, historical-approval archaeology hoặc milestone mới. M1 không yêu cầu Job hoặc review toàn history để open Project; M5 giữ safety/security và tool-error truth; M6 chỉ yêu cầu readback cho write hợp lệ và no-write cho DENY. 29/29 Criteria còn được map, 7 Phase GOAL, dependency không thay đổi. **Không có source code, Memory Job, Criteria hoặc `main` nào được mutation bởi RL tài liệu này.**

**Disposition:** **PLAN RL PASS (file scope)**. Kết luận chỉ xác nhận P0 CR feedback đã được tích hợp thành việc triển khai và acceptance của các Phase sau. Không gọi đây là CRITIC_REVIEW Verification, GSA durable Planning Review PASS, runtime security PASS hoặc giấy phép bắt đầu M1 source implementation.
