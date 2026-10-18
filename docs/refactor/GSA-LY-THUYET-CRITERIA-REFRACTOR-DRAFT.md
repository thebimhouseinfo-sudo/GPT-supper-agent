# GPT Super Agent — Lý thuyết sản phẩm và Criteria hành vi

**Bản dựng lại để người dùng đọc, sửa và chốt trước đợt refactor — 17/10/2026**
**Bản cập nhật cho nhánh upgrade/gsa-refactor: Generic Framework + optional Coder/Tester Add-in; Fresh Start / Adopt Existing Project là định hướng tiếp nhận Project (17/10/2026).**  
**Trạng thái: WORKING CRITERIA cho đợt refactor; toàn văn đang được người dùng hiệu chỉnh, CHƯA PHẢI APPROVED BASELINE.**
**Single Source of Truth:** Trong nhánh nâng cấp, chính tài liệu này là nơi duy nhất tích lũy và cập nhật lý thuyết/Criteria refactor trước khi được chốt. Không tạo các bản lý thuyết cạnh tranh. Sau khi chốt, phải chuyển thành Criteria canonical của GSA; các plan tiếp theo chỉ dẫn chiếu, triển khai và kiểm chứng, không tự trở thành nguồn yêu cầu mới.  

Tài liệu này trả lời trực tiếp ba câu hỏi: **GSA là gì? GSA phải hoạt động ra sao? Khi nào có thể nói GSA làm đúng?** Đây không phải kế hoạch lập trình, sơ đồ database, bản kiểm kê gate hay chỉ dẫn triển khai refactor. Người đọc có thể hiểu toàn bộ mà không phải mở tài liệu khác.

Bản khảo cứu chi tiết `GSA_REQUIREMENT_ARCHAEOLOGY_2026-10-17.md` **được giữ nguyên** như hồ sơ bằng chứng. Tài liệu đang đọc là bản diễn đạt lại thành lý thuyết sản phẩm và criteria dễ thảo luận. Những điểm chưa có quyết định cuối cùng được giữ rõ ở cuối, không bị AI tự chọn thay.

**Ký hiệu rất ít, dùng khi cần:** **[Người dùng]** là hướng được người dùng nêu trực tiếp; **[Nền tảng]** là nguyên lý từ các tài liệu GSA đã được quản trị, không mặc định do người dùng tự viết; **[Đề xuất AI — chưa chốt]** là cách hiện thực do tài liệu/agent gợi ý; **[Chưa chốt]** là hai hướng đang xung đột hoặc thiếu quyết định. Những lý thuyết có bằng chứng đã bị thay thế được ~~gạch ngang~~.

---

## I. GSA là ứng dụng gì?

**GSA là một coding/project agent hoạt động thông qua ChatGPT Web và các connector.** Người dùng trình bày mục tiêu bằng hội thoại. GSA hiểu dự án đang làm, giúp xác định yêu cầu, lập kế hoạch, viết hoặc sửa phần mềm bằng công cụ được cấp, kiểm tra chất lượng và duy trì tiến độ qua nhiều cuộc chat. Mục tiêu trước mắt là **làm việc thực sự tốt trên các dự án thật**, không phải đua nhau thêm mọi tính năng của một “siêu ứng dụng”. **[Người dùng]**

GSA khác Codex local hay một daemon chạy liên tục. ChatGPT là nơi suy luận và ra quyết định điều phối **khi đang có lượt hoạt động**; nó có thể mất phản hồi, đầy context, bị lỗi mạng hoặc kết thúc chat. Vì vậy GSA không được dựa vào trí nhớ của một hội thoại để bảo đảm công việc tồn tại. **Nó phải duy trì được trạng thái công việc, không cần duy trì được phiên chat.** **[Người dùng + Nền tảng]**

GSA cũng không nên biến thành phần mềm quản lý dự án khổng lồ. Kế hoạch, checklist, review, kiểm thử và lưu vết tồn tại để **giúp hoàn thành đúng công việc**, không phải tự trở thành sản phẩm chính. Nếu một lớp điều phối phức tạp hơn lợi ích nó mang lại, đó là dấu hiệu phải thiết kế lại.

### Cấu trúc của GSA

Có năm phần phối hợp nhưng không làm thay việc của nhau:

**1. ChatGPT Web — cửa giao tiếp và môi trường suy luận tạm thời.** Người dùng giao việc, xem plan, duyệt những lựa chọn cần mình quyết định và nhận báo cáo. GSA có thể điều phối liên tiếp nhiều vai trong một lượt còn hoạt động. Khi lượt đã dừng, không có quyền mặc nhiên tuyên bố vẫn đang làm việc ở nền.

**2. GSA Harness — bộ quy tắc làm việc dùng chung.** Orchestrator chịu trách nhiệm biết đang làm gì, bước nào kế tiếp, có quyền gì và phải dừng khi nào. Các agent như Planner, Coder, Tester, Reviewer và Designer thực hiện phần chuyên môn riêng. Skills bổ sung cách làm phù hợp mà không bắt toàn bộ agent đọc hết mọi hướng dẫn. Harness phục vụ chất lượng và quyền hạn; nó không tự đặt ra yêu cầu sản phẩm.

**3. Project Memory — trí nhớ bền vững của công việc.** Mỗi Project có danh tính, các quyết định được duyệt, tiêu chí, kế hoạch, Job đang chạy, kết quả từng bước, bằng chứng và phần còn dang dở. Khi bắt đầu chat mới, GSA lấy lại thông tin cần thiết từ đây, không phụ thuộc việc có thể nhớ được cuộc chat trước hay không. Nguồn lưu hiện tại là một **private GitHub Memory Repo do người dùng cấu hình**. Supabase chủ yếu xử lý danh tính/cấu hình và những dịch vụ phụ trợ được thiết kế rõ ràng; không thay Memory Repo làm nơi ghi sự thật của Project. **[Nền tảng]**

**4. Source Repository — nơi phần mềm thực sự tồn tại.** Code, tài nguyên của sản phẩm, Git history và phiên bản triển khai nằm trong repository của dự án. Project Memory ghi điều gì đã làm và vì sao; source repo cho biết **code thực tế là gì**. Một Project có thể có nhiều repo đã được đăng ký, nhưng quyền đọc và ghi phải rõ; không được dùng repo không thuộc phạm vi đang mở chỉ vì agent thấy liên quan.

**5. Công cụ thực thi và kiểm chứng.** GSA sử dụng GitHub, CI, browser, host ứng dụng, các connector và môi trường test có thể truy cập. Công cụ có mặt trên danh sách không đồng nghĩa chắc chắn đang chạy được. Chỉ phép thử thực tế ở đúng đường thực thi mới chứng minh được năng lực tương ứng.

**Ranh giới nền tảng:** GSA không tự dựng một daemon, scheduler, database hay harness thứ hai chỉ để mô phỏng Codex local. Khi một cơ chế thật sự thiếu, phải chứng minh thiếu ở đâu trước khi bổ sung. **[Người dùng về sự tinh gọn; cách triển khai cụ thể là Nền tảng/Đề xuất AI]**

---

## II. Đơn vị làm việc và vai trò của các agent

**Project** là bối cảnh dài hạn. **Project Plan** mô tả đích cần đạt và con đường phát triển. **Milestone** là một điểm kết quả có thể kiểm chứng trong kế hoạch đó. **Job** là một phần việc có mục tiêu hữu hạn, đủ gọn để làm và review mà không làm suy giảm context. **Task** là phần chia nhỏ của Job khi cần. **Run** là một lần một vai thực hiện một phần việc cụ thể. Như vậy, cấu trúc lưu trạng thái hiện hành là **Project → Job → Task (khi cần) → Run**; milestone là **mốc của kế hoạch**, không bắt buộc là một tầng lifecycle mới. **[Nền tảng]**

Không phải việc nhỏ nào cũng cần một dự án nhiều Phase, nhiều Job, nhiều milestone. Ngược lại, một kế hoạch phát triển **toàn Project** phải có milestone sau khi Planner hoàn thiện kế hoạch, bởi nếu không thì không thể biết đang tiến tới mục tiêu nào, mốc nào đã xong, mốc nào tự chạy và mốc nào phải hỏi người dùng. **[Người dùng — yêu cầu mới]**

**Planner** là chủ sở hữu **khám phá mục tiêu sản phẩm và lập Criteria**, không chỉ là người chia Task. Trước khi lập Project Plan, Planner làm rõ kết quả người dùng thực sự muốn, mức tối thiểu chấp nhận được, ai sử dụng và để làm gì (**cá nhân / nhóm nội bộ / thương mại**, chỉ chọn khi có dữ liệu từ người dùng); **quy mô thực tế hiện nay**, quy mô tương lai đã được cam kết, môi trường vận hành, dữ liệu/quyền tin cậy, rủi ro và mức an toàn/độ ổn định tương xứng, các giới hạn và **những gì cố ý không làm**. Không mặc định giả định đa người dùng, doanh nghiệp, phân phối đại trà hoặc yêu cầu kỹ thuật cao chỉ vì người dùng ví von một sản phẩm khác. Chỉ hỏi những lựa chọn còn thiếu thực sự ảnh hưởng GOAL/phạm vi; không hỏi lại thông tin đã rõ. Planner soạn Criteria và sau khi có Criteria được duyệt mới làm GOAL, Phase/Job/Task, milestone, dependency, nghiệm thu, review/test. Planner **không viết code sản phẩm** và không tự quyết định thay người dùng. **[Người dùng — bổ sung 18/10/2026; tham khảo bootstrap Planner]**

**Technical Advisor (Advisor) — cố vấn kiến thức kỹ thuật cho Human, KHÔNG phải Reviewer thứ hai. [Người dùng — làm rõ 18/10/2026]** Advisor giúp **người dùng hiểu trước khi tự quyết định**: (1) yêu cầu **có khả thi về kỹ thuật** trong điều kiện/nền tảng hiện tại không, còn điều kiện tiên quyết hoặc khảo sát/xác minh nào bị bỏ sót; (2) **độ phức tạp, công sức, chi phí phát triển và bảo trì, rủi ro** tương ứng; (3) phần yêu cầu/giải pháp **dư so với nhu cầu/quy mô thực**, hoặc **thiếu để đáp ứng mục tiêu**, tránh cả overengineering và thiếu sót; (4) **tác động trực tiếp lẫn dây chuyền** tới kiến trúc, các subsystem, dữ liệu, kiểm thử, phần source đã làm, tiến độ và giá trị công việc đã hoàn thành. **Một yêu cầu nhỏ có thể buộc tái thiết kế gần như toàn dự án:** Advisor phải nói rõ mức ảnh hưởng thực tế, không giả định chỉ là một Task nhỏ. Khi hữu ích, Advisor so sánh phương án tương xứng (ví dụ *Tạm dùng / Ổn / Nâng cao*) nhưng **không ép thành mẫu ba mức** cho mọi trường hợp; nêu cả việc chưa đủ dữ kiện để đánh giá, không bịa kiến thức hay tính chắc chắn. Căn cứ là **mong muốn của Human + hiện trạng Project**; nếu không có bằng chứng về hiện trạng, phải nói rõ giả định và cần kiểm tra điều gì. Sau tư vấn, **Human có thể giữ nguyên hoặc điều chỉnh mong muốn**, Planner làm rõ và ghi **quyết định của Human** vào một Criteria hiện hành. Advisor **không chấm điểm chất lượng Criteria/plan/code, không kiểm tuân thủ hay PASS/FAIL thay Reviewer/CR, không quyết định thay Human, không sửa Criteria/source**. Advisor là vai generic, tham gia **trước lần Human duyệt Criteria đầu tiên** hoặc **trước khi Human quyết định sửa Criteria đã duyệt**; nếu nội dung cuối đổi đáng kể sau tư vấn thì tư vấn lại chỉ phần đổi, không lặp cho sửa câu chữ, không tham gia liên tục mỗi Task/chat.

**Coder** biến phần việc đã được duyệt thành source thực. Coder chọn kỹ thuật và chi tiết triển khai, được quyền tự sửa sai trong phạm vi đã duyệt, nhưng không được lén sửa tiêu chí để hợp thức hóa code, tự đổi ý nghĩa sản phẩm hoặc viết sang một repo khác. Coder phải tự xem lại diff, GOAL, tiêu chí, test và kết quả thực trước khi bàn giao.

**Tester** kiểm chứng sản phẩm có thật sự làm được việc đã yêu cầu hay không. Tester có thể thử chức năng, đo hành vi hoặc dò khả năng của môi trường; kết quả đo chưa có chuẩn so sánh không được tự biến thành PASS. Tester độc lập với nhận định “Coder nói đã xong”, không sửa product source để tạo ra kết quả xanh.

**Reviewer** đánh giá độc lập kế hoạch hoặc code, dựa vào yêu cầu đã duyệt và bằng chứng hiện có. Reviewer được phát hiện cả **cái thiếu lẫn cái thừa**; một đề xuất cải tiến không tự trở thành lỗi bắt buộc phải sửa. Review của một Job nhỏ không cần bị biến thành một chuỗi nghi lễ nhiều tầng.

**Critic Reviewer (CR)** là vai phản biện độc lập sau khi Reviewer thường đã PASS, không tự sửa source/Criteria và không dựa mù vào PASS trước. CR được gọi khi **Human yêu cầu `crl`** hoặc **milestone đã được Human duyệt ghi sẵn `crl`**; GSA tự kích hoạt khi tới mốc đó trong lượt hợp lệ. Không auto CR sau mọi Task/Job nếu milestone không yêu cầu, không cần người dùng nhắc lại ở milestone đã cho phép. Phân biệt CR với Technical Advisor (chỉ tư vấn trước phê duyệt/sửa Criteria).

**Designer, UI Coder, debugging và các kỹ năng đặc thù** chỉ tham gia khi công việc thật sự cần. UI Coder là chuyên môn của Coder, không mặc định là một hệ điều phối mới. GSA không cần lập agent mới chỉ vì một skill có phương pháp làm việc riêng.

**GSA generic framework và Coder/Tester Add-in. [Người dùng — bổ sung 18/10/2026]** GSA có bộ **role, harness và skills generic** dùng chung; Planner, Advisor, Reviewer, CR và Orchestrator không bị tùy biến theo Project. **Coder và Tester** luôn có harness/skills generic dùng được ngay khi Project không thêm gì. Khi cần, Project được khai báo **add-in riêng cho cả harness instructions và skills của Coder/Tester**, chứa hướng dẫn chuyên môn, API/host conventions, phương pháp kiểm chứng phù hợp; **chỉ bổ sung theo vai và Task, không override** global harness, quyền hạn, Criteria, security, Human approval hay loop nền tảng. Không nạp add-in hàng loạt khi chỉ mở Project; không bắt lập bộ harness/skills riêng cho mỗi repo.

Ví dụ, Coder của một dự án AutoCAD có thể nạp skill quy định đúng **AutoLISP** và các phần mở rộng Visual LISP được host cho phép, tránh đưa cú pháp Common Lisp hay Lisp khác vào code. Tester có thể nạp skill kiểm chứng việc load/chạy lệnh và kết quả ngay trong bản vẽ AutoCAD thay vì dùng unit test làm bằng chứng duy nhất. Project web không phải mang những skills này.

**AGENTS.md ở Project Memory. [Người dùng — quyết định mới]** Planner tạo và duy trì `GSA-Projects/projects/<project-id>/AGENTS.md` tối thiểu từ generic template. File trỏ tới **khai báo add-in harness/skills của Coder và Tester** nếu có, không chép global harness/Criteria, không cấp quyền mới hoặc yêu cầu tạo thư mục trống. Metadata và add-in của Project thuộc Project Memory; tài liệu kỹ thuật trong source repo chỉ được tham khảo, không thành override tự động. Không có add-in vẫn là cấu hình hợp lệ.

---

## III. Luồng 1 — Bắt đầu Project, hiểu yêu cầu và lập Criteria

**Fresh Start / Adopt Existing Project. [Người dùng — quyết định mới 17/10/2026]** GSA phải tiếp nhận được cả dự án mới lẫn dự án đã triển khai giữa chừng. Khi Project chưa từng dùng GSA, chỉ cần một lần setup cơ bản: xác định Project và repository thuộc quyền, đọc cấu trúc/stack và hiện trạng source ở mức đủ làm việc, ghi điểm bắt đầu và các giới hạn thực tế đã biết, khởi tạo `AGENTS.md` generic tối thiểu, rồi cùng người dùng xác lập **Criteria mới mô tả đích đến của dự án từ thời điểm sử dụng GSA**. Không bắt phải dựng lại lịch sử chat, mọi phê duyệt cũ, mọi milestone đã qua hay toàn bộ Job/Run trong quá khứ. Không chạy bootstrap harness riêng và không cần review toàn bộ repository trước khi bắt đầu một công việc nhỏ. Dự án đang làm dở không được bị reset, làm lại hay giả vờ rằng các phần cũ đã được GSA nghiệm thu.

Khi người dùng **mở** một Project đã setup, GSA chỉ xác định đúng dự án và dữ liệu hiện hành ở mức tối thiểu; mở Project không có nghĩa tự sửa code. Nếu đang tiếp tục một Job đã được GSA quản lý, dùng checkpoint và bằng chứng thực tế từ thời điểm tiếp nhận trở đi để khôi phục. **Fresh Start là khởi điểm quản trị mới, không phải xóa hay viết lại source và lịch sử Git.**

Nếu người dùng nói “sửa lỗi này”, GSA phải phân biệt giữa báo cáo hiện tượng, câu hỏi về nguyên nhân và chỉ thị triển khai. Những điều đã nằm trong Project Memory không được hỏi lại. Những điều ảnh hưởng bản chất sản phẩm mà chưa được quyết định phải được nêu rõ; chi tiết cơ học có thể suy ra từ bằng chứng.

**Trước lần chốt Criteria đầu tiên:** Planner làm rõ GOAL, người dùng, quy mô thực và tương lai đã cam kết, giới hạn, điều kiện chấp nhận và những gì chưa biết; giữ `CHƯA CHỐT` trong **một Criteria draft**. **Advisor không review “Criteria viết đúng chưa” mà giải thích cho Human những hệ quả kỹ thuật của mong muốn này khi đối chiếu hiện trạng**, kể cả yêu cầu phải xác minh thêm hay nguy cơ phải thay đổi kiến trúc rất lớn dù yêu cầu tưởng nhỏ. Human cân nhắc, **điều chỉnh hoặc giữ yêu cầu**, sau đó mới chốt; nếu nội dung đổi đáng kể sau tư vấn, Advisor tư vấn lại đúng tác động của phần mới, không lặp với thay đổi câu chữ. Planner ghi quyết định cuối vào cùng Criteria; chưa chốt thì không biến thành baseline. Không bắt mọi tin nhắn hay Task qua Advisor.

**Criteria mới là mục tiêu tương lai, không phải bản tái dựng quá khứ. [Người dùng — quyết định mới]** Project có **một bộ Criteria gốc hiện hành** diễn đạt sản phẩm cần hướng tới điều gì, những giới hạn nào phải giữ và bằng chứng nào chứng minh đạt đích. Planner đề xuất từ yêu cầu hiện tại và hiện trạng source đã quan sát được để người dùng duyệt. Criteria không cần chứng minh ai đã từng duyệt từng tính năng cũ; phần đã tồn tại được ghi nhận như hiện trạng, không mặc nhiên là mục tiêu đúng hay kết quả PASS. Sau khi người dùng duyệt, Criteria trở thành baseline cho kế hoạch **từ thời điểm Fresh Start**, không được agent tự đổi nội dung để vừa với code hay gate.

Criteria cấp Job/Task là các phép cụ thể hóa phần việc từ Project Criteria, không phải một bản lý thuyết sản phẩm cạnh tranh. Một phát hiện mới chỉ làm thay đổi Criteria gốc khi người dùng xem và chấp nhận sự thay đổi có ý nghĩa đó.

**Cập nhật lý thuyết trong một Criteria duy nhất. [Người dùng — quy định 17–18/10/2026]** Khi Criteria còn là draft chưa duyệt, Planner cập nhật **cùng file** theo hội thoại và đánh dấu `CHƯA CHỐT` khi còn bàn. Khi Criteria **đã được Human duyệt**, Planner cùng Human làm rõ đề xuất thay đổi **trước khi ghi**; Technical Advisor **giải thích tác động kỹ thuật và phụ thuộc của delta trên kiến trúc/source hiện có, mức độ sửa hoặc làm lại, những gì thiếu/thừa và các phương án thực tế** để Human hiểu rồi tự quyết định sửa, giữ hay đổi hướng. Advisor không phán review PASS/FAIL hoặc trực tiếp sửa file. Nếu delta cuối thay đổi đáng kể so với bản đã tư vấn, làm rõ tác động mới **trước khi ghi**, không gọi lại Advisor cho sửa câu chữ. **Chỉ sau quyết định Human**, Planner mới sửa đúng mục liên quan trong cùng Criteria, ghi/readback Git revision và lưu lịch sử; không tạo Criteria V2, approval engine/Decision Logger hoặc sửa plan trước Criteria.

**Ranh giới trách nhiệm:** Criteria quyết định **WHAT/WHY** — đích, quy mô sử dụng được chốt, giới hạn và nghiệm thu; Project Plan/Milestone/Job quyết định **HOW/WHEN**. Planner giữ quyền soạn và thay đổi đúng scope sau Human decision; Advisor tư vấn **trước** lần duyệt đầu hoặc **trước** sửa Criteria đã duyệt; Reviewer kiểm plan có bám Criteria, CR là phản biện độc lập khác Advisor. Khi Criteria được thay đổi hợp lệ: **Criteria ghi/readback trước → Planner kiểm lại Overall GOAL và tất cả Phase GOAL có liên quan → sửa GOAL nào bị ảnh hưởng cho khớp Criteria → mới sửa Milestone/Task/Job detail bị ảnh hưởng → Reviewer RL trên phiên bản mới**. Phần không liên quan giữ nguyên; không bắt Human duyệt lại mọi GOAL không đổi hoặc tạo bản plan cạnh tranh.

**Criteria 01 — Đúng dự án, tiếp nhận nhẹ:** Với dự án mới hoặc đang triển khai dở, GSA xác định đúng source repository, quyền truy cập và baseline hiện tại qua bước setup tối thiểu, không hồi cứu toàn bộ lịch sử. Mở Project không tự cấp quyền sửa source. Khi hoàn tất setup, Project có thể dùng ngay generic framework.

**Criteria 02 — Planner chốt mục tiêu và phạm vi thật, không đoán:** Trước khi đề xuất duyệt Criteria hoặc lập Project Plan, Planner làm rõ kết quả phải đạt, mức tối thiểu dùng được, ai dùng, mục đích **cá nhân / nội bộ / thương mại**, quy mô hiện tại và tương lai thực sự cam kết, dữ liệu/môi trường tin cậy, an toàn/độ ổn định tương xứng, giới hạn và không làm. Chỉ hỏi lựa chọn còn thiếu ảnh hưởng quyết định; không tự suy rộng từ ví dụ hay áp mặc định kiến trúc/quy mô do AI nghĩ ra.

**Criteria 03 — Technical Advisor giúp Human hiểu tính khả thi và hệ quả trước khi chốt Criteria:** Project có một Criteria hiện hành thể hiện GOAL tương lai do Human quyết định. Planner làm rõ nhu cầu, mục đích, quy mô và chuẩn bị Criteria draft. **Trước lần Human duyệt Criteria đầu**, Technical Advisor **tư vấn kiến thức kỹ thuật** dựa trên yêu cầu và hiện trạng: khả thi hay không, còn thiếu điều kiện tiên quyết, độ khó/chi phí/rủi ro, phần thừa hoặc thiếu so với nhu cầu thật, tác động từ một sửa đổi cục bộ tới subsystem hoặc khả năng **phải thiết kế lại phần lớn kiến trúc**. Nêu rõ giả định/điểm phải khảo sát, phương án lựa chọn khi cần và hậu quả của từng lựa chọn. **Human dựa vào tư vấn để giữ hoặc điều chỉnh mong muốn và tự chốt**; Planner chỉ ghi đúng quyết định vào **một Criteria**. Advisor không phải Critic Reviewer thứ hai, không kiểm plan/code để phán PASS/FAIL và không phê duyệt thay Human. Criteria chưa được Human chốt không tự thành baseline; source cũ là hiện trạng tham khảo, không phải lịch sử phải tái dựng.

---

## IV. Luồng 2 — Planner làm Project Plan và Milestone

Planner dùng Criteria đã có để lập một kế hoạch từ tổng thể đến công việc cụ thể. **Overall GOAL nằm rõ ở đầu plan**, mỗi Phase có GOAL riêng và việc trong Phase phải có tác dụng trực tiếp đối với GOAL đó. Một Project Plan hoàn chỉnh còn cần **bản đồ milestone**, chứ không chỉ một danh sách task. **[Người dùng]**

Mỗi milestone nói bằng lời dễ hiểu: phải tạo ra kết quả gì; phụ thuộc vào điều gì; kết quả được kiểm chứng thế nào; ai sẽ làm; review/test nào có giá trị; hoàn thành mốc thì **tự chuyển bước** hay **chờ người dùng**; nếu liên quan Git/release thì được làm tới đâu. Planner phải chỉ ra milestone nào chỉ là tiến độ nội bộ, milestone nào là ranh giới nghiệm thu hoặc quyền quyết định. Không cần dựng thêm một gate runtime cho mỗi ô checklist.

**Sau mỗi lần Criteria được chỉnh:** Planner phải **kiểm tra GOAL ở đầu Project Plan và GOAL của từng Phase trước khi chạm phần detail**. Đối chiếu Criteria revision mới với plan đang có để xác định GOAL nào GIỮ/ĐIỀU CHỈNH/BỔ SUNG/LOẠI BỎ theo đúng quyết định Human, đánh dấu phần chịu ảnh hưởng; chỉ khi tầng GOAL đã khớp Criteria mới sửa milestone, dependency, Job/Task, test và acceptance của phần bị ảnh hưởng. Reviewer kiểm tầng GOAL/coverage trước, sau đó mới kiểm detail và chạy repair loop đến PASS hoặc blocker thật. **Không mở lại toàn bộ những việc hợp lệ, không thêm requirement/gate chỉ từ góp ý review.** **[Người dùng — quy định 18/10/2026]**

Một plan tốt không chỉ **đầy đủ** mà còn **không thừa**. Nếu Reviewer đề xuất thêm một phase, checkpoint, bảng dữ liệu hay công cụ, phải chứng minh chúng giúp đạt Criteria hoặc xử lý rủi ro đã có bằng chứng. Khi phát hiện điều ngoài phạm vi, hãy tách thành đề xuất cho tương lai; không âm thầm nhét vào đợt triển khai hiện tại.

**Review Loop có hai mức, cùng dùng workflow hiện có, không tạo lifecycle mới:** `rl` (*nhỏ*) = Planner/Coder làm hoặc sửa đúng phạm vi → tự kiểm → Reviewer review độc lập trên revision/evidence → nếu FAIL/CHANGES_REQUIRED thì cùng Planner/Coder sửa và **tự gọi lại Reviewer** đến PASS hoặc blocker thực; không dừng sau một lượt sửa. `crl` (*lớn*) = chạy `rl` tới PASS → gọi **CR độc lập** → nếu CR FAIL thì Planner/Coder sửa theo finding bằng **`rl` nội bộ tới PASS**, rồi gọi CR lại; lặp đến CR PASS hoặc blocker/budget thực, không chạy vô hạn không tiến độ. Nếu CR PASS, Orchestrator **trả lời người dùng hoặc tiếp tục milestone AUTO kế tiếp**, tùy quyền, trạng thái công việc và tình huống chat; không mặc định dừng sau PASS. **User có thể gọi tắt `rl`, `crl`, hoặc `planner rl` theo ngữ cảnh; milestone được Human chốt có thể khai báo loại loop để GSA tự kích hoạt khi đến mốc.** Review luôn truy vết GOAL/Criteria và revision; không yêu cầu CR nếu chỉ định `rl` nhỏ.

**Criteria 04 — Plan truy vết được:** Mỗi Phase và milestone của Project Plan đều giải thích bằng kết quả cụ thể vì sao chúng đưa Project tiến gần hơn tới GOAL và tiêu chí gốc; không có công việc chỉ tồn tại vì agent từng gợi ý.

**Criteria 05 — Milestone quyết định công việc và review tự động có giới hạn:** Project Plan hoàn chỉnh có milestone, nghiệm thu và AUTO/HUMAN stop; có thể ghi sẵn **`rl` hoặc `crl` tại milestone được Human duyệt**, tới mốc GSA tự chạy đúng loại loop mà không hỏi lại sau mỗi FAIL. CR không tự chạy nếu milestone không yêu cầu hay Human không gọi `crl`. Không thêm milestone cho Job nhỏ chỉ để gọi loop.

**Criteria 06 — Review giữ GOAL bám Criteria, không drift:** Reviewer kiểm Overall GOAL/Phase GOAL so với Criteria revision hiện hành trước khi review detail; lỗi thiếu/thừa phải được Planner sửa và tự lặp `rl` đến PASS hoặc blocker. Nếu `crl` được Human gọi hoặc có trong milestone, sau Reviewer PASS phải CR review độc lập; CR FAIL quay về Planner/Coder `rl` trước lần CR tiếp theo. Không phát minh GOAL/gate từ một finding hoặc lặp các phần không liên quan.

---

## V. Luồng 3 — Thực thi, review, test và tiếp tục qua milestone

Khi người dùng chấp thuận kế hoạch và cho phép thực thi trong phạm vi nhất định, GSA có trách nhiệm chủ động làm việc cho tới giới hạn được phép, thay vì cứ hoàn thành một thao tác rồi xin “tiếp tục” lần nữa.

Luồng thông thường là: Orchestrator chọn Job/Task đủ điều kiện → Coder/Designer thực hiện → Coder tự kiểm → Tester hoặc Reviewer tham gia **tại mốc đã được lên kế hoạch hoặc do rủi ro thực sự đòi hỏi** → kết quả được ghi và xác minh → Orchestrator chọn bước kế tiếp. Nếu kiểm thử phát hiện lỗi sản phẩm thuộc phạm vi đã duyệt, Coder sửa và thử lại. Nếu phát hiện thiếu specification, trở lại Planner; không sửa bừa code để né lỗi.

**[Người dùng — yêu cầu mới] Checklist phải điều khiển đúng hành vi.** Mỗi milestone cần ghi rõ AUTO/Human/Manual/Blocked và, **nếu cần review loop**, loại `rl` hoặc `crl` đã được Human phê duyệt để GSA tự kích hoạt khi đến mốc; không tạo Human Gate mới chỉ vì một vòng review. Quy tắc `crl` không được hiểu là luôn gọi CR cho mọi milestone. Các tên `AUTO_START`, `HUMAN_GATE`, `MANUAL_START`, `BLOCKED` là **[Đề xuất AI — chưa chốt về tên field]**, không phải đòi hỏi phải tạo bốn state mới trong database. Điều quan trọng là **hành vi được phân biệt và thực thi đúng**.

**Review loop cũng không phải điểm dừng:** Mỗi lượt FAIL trả về finding có bằng chứng và chỉ sửa phần liên quan; Coder/Planner chủ động chạy lại Reviewer/CR theo loại loop, không tự chuyển cho người dùng khâu điều phối. Một loop được ủy quyền qua milestone tiếp tục tới PASS/blocker thực; khi PASS mới dựa vào milestone/chat quyết định trả lời hay chạy tiếp.

**Checkpoint không phải điểm dừng.** Sau khi lưu checkpoint, GSA phải đọc lại dữ liệu cần thiết, kiểm tra bước kế tiếp và, **nếu thuộc chuỗi AUTO đã được duyệt và vẫn có quyền**, thực hiện luôn trong lượt hiện tại. Câu “đã checkpoint, hãy bảo tôi tiếp tục” là **sai hành vi** khi chưa có Human Gate, blocker hay kết thúc công việc.

Ngược lại, khi milestone đến một quyết định sản phẩm, đổi scope, quyền ghi ngoài phạm vi, merge/deploy chưa được duyệt hay một kiểm thử chỉ con người mới làm được, GSA phải dừng thật sự và chỉ yêu cầu đúng quyết định còn thiếu. Tự động hóa không phải giấy phép vượt Human Gate.

**Criteria 07 — AUTO và Review Loop không dừng giữa chừng:** Trong một lượt có quyền, bước AUTO đủ dependency phải chạy tiếp sau checkpoint/readback. Với `rl` hoặc `crl` đã được yêu cầu hoặc gắn trong milestone duyệt trước, Orchestrator tự tiếp tục **review → sửa → review lại** (và CR khi cần) tới PASS/blocker thật, rồi tự sang bước AUTO hợp lệ tiếp theo hoặc trả kết quả theo milestone/chat; không yêu cầu User nhắc `continue`, `review`, `rl` sau từng lượt.

**Criteria 08 — Dừng đúng chỗ:** Đến mốc chờ người dùng, hết quyền, thiếu năng lực thật hoặc không thể giải quyết xung đột an toàn, GSA dừng với lý do cụ thể. Không dừng chỉ vì muốn bàn giao sự điều phối cơ học cho người dùng.

**Criteria 09 — Kiểm chứng đúng việc:** Không gọi Job hoàn tất chỉ nhờ lời Coder, một lời Reviewer PASS hoặc một kết quả test không kiểm được. Cần bằng chứng tương ứng với tiêu chí và phiên bản sản phẩm được đánh giá.

**Criteria 10 — Review đúng mức và đúng mốc:** Không mặc định Reviewer sau mọi Task, Tester sau mỗi sửa, CR sau mọi milestone. `rl` dùng Reviewer thường khi cần; `crl` thêm CR sau `rl` PASS theo Human call/milestone đã chốt. CR FAIL quay lại `rl`, không bỏ qua Reviewer hoặc sinh gate phụ. Loop phải có giới hạn tiến độ/điều kiện dừng khi blocker thật, không bỏ việc giữa hai vòng mà không lý do.

---

## VI. Luồng 4 — Chat mất phản hồi, mạng lỗi, và việc làm dở

GSA chạy qua ChatGPT Web nên **không có cam kết tự chạy nền sau khi phiên bị ngắt**. Nhưng trạng thái bền vững phải đủ để khi có lượt mới, GSA biết đúng việc nào đã hoàn tất, việc nào chưa và thao tác nào đang có kết quả không rõ.

Ví dụ: GSA gửi lệnh ghi code lên GitHub rồi mất kết nối. Khi người dùng mở lại, không thể suy ra “lệnh thất bại” chỉ vì chat không nhận được phản hồi. GSA phải đọc lại branch và nội dung đích: nếu ghi đã xảy ra thì không ghi trùng; nếu chắc chắn chưa xảy ra thì xử lý tiếp theo quyền; nếu có thay đổi không nhận diện được thì dừng để hòa giải. Một lời tool trả về “prepared” cũng không chứng minh write đã được lưu thành công.

Mỗi lần checkpoint cần giữ **đủ** thông tin để tìm lại last good state; không có nghĩa phải ghi thêm một file sau **mọi** tool call. GSA nên lưu trạng thái ở các ranh giới thực sự quan trọng, tránh tăng độ trễ và tránh tạo nguồn sự thật song song. Những bản record kỹ thuật như cursor, claim/lease hay cache là **phương tiện**, không được tự biến thành mục tiêu sản phẩm.

Vòng retry cần có giới hạn để không gọi tool liên tiếp mà chẳng có tiến độ. “Tiến độ” là kết quả có thể đọc lại và so sánh được, không phải số lần gọi API. Khi đã hết phương án hợp lệ, GSA dừng và ghi rõ bước khôi phục. Khi có một lượt hợp lệ khác, hệ thống tiếp tục từ trạng thái đã xác minh, không viết lại mọi thứ từ đầu.

**Shortcut `stopchat` (người dùng — 18/10/2026):** Khi phiên quá dài/lag hoặc Human gõ `stopchat`, GSA **tạm dừng tại điểm an toàn**, ghi/readback checkpoint hay Project Memory **chỉ nếu có trạng thái cần lưu**, rồi cung cấp **chỉ dẫn chuyển phiên ngắn có thể copy**: Project/repo/nhánh/source-of-truth, Criteria & Plan revision, active Job/milestone/Task, tiến độ đã kiểm chứng, kết quả write chưa rõ, blocker/Human approvals và **bước tiếp theo** cùng cách gọi tiếp tục. Nếu gần đầy context, GSA có thể **đề xuất** dùng `stopchat`, không tự đóng chat hoặc hứa chạy nền. Chat mới dùng Project Memory/Git thật để khôi phục thay vì tin hoàn toàn đoạn tóm tắt; **mở Project để bàn luận không tự code**, còn Human yêu cầu tiếp tục Job có quyền thì nối tiếp từ bước chưa xong.

**Criteria 11 — Resume và `stopchat` không lạc việc:** Sau gián đoạn hoặc Human gọi `stopchat`, GSA tìm được last-good state và work còn thiếu qua Project Memory/Git; `stopchat` chuẩn bị chỉ dẫn chuyển chat ngắn với Project, source-of-truth, đúng branch/SHA, Job/milestone, approvals, blockers và bước tiếp theo, không viết lại lịch sử/commit. Không tạo checklist file/record mới nếu durable memory đã đủ; chat mới chỉ tiếp tục thực thi khi Human có yêu cầu/ủy quyền phù hợp.

**Criteria 12 — Không lặp write:** Mất phản hồi trong một thao tác Git/Memory không khiến lần sau vô tình tạo thêm commit, source change, evidence hoặc Job trùng cho cùng hành động.

**Criteria 13 — Trung thực với session boundary:** `stopchat` là chuẩn bị handoff và dừng an toàn, **không** đóng ChatGPT Web bằng phép màu, không tự chạy nền và không được báo các tool write chưa xác minh đã PASS. Nếu không thể persist/readback checkpoint, nói rõ và cung cấp thông tin để khôi phục thủ công trong chat mới.

---

## VII. Luồng 5 — Git, quản trị dự án và kiểm soát nguồn

**[Người dùng]** GSA phải có năng lực **Admin**, đặc biệt trong quản trị code của dự án qua Git. Công việc thường có nhiều lần sửa, nhiều checkpoint và lịch sử branch. Nếu agent cứ mở branch mới rồi không tích hợp, code sẽ nằm rải rác, khó biết bản nào đúng và có thể mất cả những phần đã viết.

Với một đợt phát triển/refactor, nên có **một đường tích hợp chính đã xác định**. Branch phụ chỉ tồn tại khi có tác dụng rõ và phải được tích hợp vào đường chính ngay khi điều kiện review/test và quyền liên quan đã đáp ứng. Trước khi dọn lịch sử, GSA phải xác minh code còn độc nhất ở nhánh nào, commit nào đã có trong branch đích và điều gì chưa được hợp nhất. Không xóa, force-push, merge mù hoặc coi chữ “merged” trong hội thoại là bằng chứng.

**Admin là **chức năng quản trị**, không phải vai agent cần tạo riêng. [Người dùng — quyết định 18/10/2026]** Orchestrator/Planner phối hợp các Git/Project tools sẵn có để biết **source core of truth**: code và source revision chính xác nằm ở **source repository**, Criteria/Plan/trạng thái điều phối nằm trong **Project Memory**, branch tích hợp được chọn rõ, production `main`/deploy tách quyền. Chọn **milestone và gói chức năng đủ nhỏ để review/merge có ý nghĩa, đủ lớn để không sinh micro-merge**. Hợp nhất các phần đã PASS theo đường branch đã duyệt, không mở nhiều branch chính song song; merge production/deploy vẫn theo quyền Human.

Cần phân biệt bốn việc: viết code vào branch làm việc, tích hợp công việc đã review, merge vào production `main`, và deploy sản phẩm. Chúng **không có cùng quyền**. Với GitHub connector, một lần tạo hoặc sửa file thường đã là ghi lên remote; không thể áp nguyên quy tắc “commit local xong mới push” của Codex CLI. Milestone cần nói rõ quyền của từng loại thao tác trong môi trường thực tế GSA. Merge production và deploy cần quyết định người dùng theo các contract hiện hành; không mặc nhiên auto chỉ vì checklist có chữ AUTO.

**Criteria 14 — Một nguồn source và merge theo milestone có ý nghĩa:** Tại mỗi milestone, GSA xác định source repo và **branch tích hợp chính**, code/commit nào đã được hấp thụ, phần nào chưa. Chia gói triển khai/merge **theo capability có đầu ra kiểm chứng**, không dồn tất cả tới cuối chương trình hoặc merge lặt vặt từng Task; không bỏ rơi source trên branch phụ. Project Memory lưu tiến độ/Criteria/Plan, không thay source repo làm sự thật về code.

**Criteria 15 — Git đúng quyền:** Một milestone tự động không làm GSA tự merge production, deploy, xóa branch hoặc sửa repo khác khi chưa có quyền tương ứng.

**Criteria 16 — Admin không gây việc thừa:** Admin là năng lực Git/source management của workflow có sẵn, không thêm agent mới. Chỉ so branch/history liên quan đến correctness của milestone đang làm; branch/commit cũ không liên quan không chặn Job. Quyết định merge ở mỗi function pack phải dựa diff/ancestry, reviewer/test và quyền thật, không tự xóa/force push.

---

## VIII. Luồng 6 — Chất lượng thực tế, khả năng dùng công cụ và công việc đặc thù

GSA được đánh giá bằng **việc thật có chạy đúng không**. Build thành công, typecheck xanh hoặc một bài helper tự kiểm PASS chỉ nói rằng các kiểm tra đó đạt. Chúng không chứng minh ứng dụng thực đã load tool, dùng đúng connector, tương tác được với host, giữ được dữ liệu sau restart hoặc hoạt động đúng trên bản deploy. Những phép thử dùng để nghiệm thu phải đánh vào đường đi mà người dùng thật sự sử dụng.

Nếu CI báo lỗi và GSA có quyền đọc GitHub Actions, GSA phải tự lấy run/job/step/log trước khi yêu cầu người dùng đi tìm hộ. Nếu công cụ thường dùng không hoạt động, có thể khám phá phương án hợp lệ khác nhưng phải ghi đúng môi trường nào được kiểm. Coder tự chẩn đoán và sửa lỗi trong phạm vi đã duyệt; Tester độc lập xác minh.

Lỗi không tầm thường phải được hiểu theo chuỗi thật: yêu cầu người dùng → entrypoint/tool → bộ điều phối → hàm và dữ liệu → runtime/host → kết quả người dùng thấy. Sau khi một bản hotfix đã thất bại, tiếp tục vá từng thông báo lỗi mà không kiểm tra toàn bộ đường liên quan là một hành vi cần loại bỏ.

Với UI/frontend, Designer làm rõ hướng nhìn và coverage khi thật sự cần; UI Coder triển khai trực tiếp trong source đích, có thể tự xem bằng browser; Tester kiểm tra lại kết quả chạy thật và đưa bằng chứng người dùng mở được, chẳng hạn ảnh chụp và link. Không yêu cầu Penpot hay công cụ thiết kế ngoài như một bước **bắt buộc cho mọi sản phẩm**. Nếu người dùng chủ động muốn Penpot hoặc workflow đặc biệt, đó có thể là kỹ năng tùy chọn.

**Criteria 17 — Test thực và ảnh UI tại đúng Project:** Chỉ PASS khi bằng chứng đúng revision/host/đường chạy; CI xanh giả hoặc mock không chứng minh E2E. Với UI, **ảnh kiểm tra/screenshot được lưu trong thư mục kiểm thử của chính source repo Project đó** (theo cấu trúc test/evidence phù hợp của repo), và **trả cho người dùng link GitHub tới đúng thư mục/ảnh, commit/ref đã kiểm** để xem. Không lưu ảnh dự án A trong repo B, không chỉ đưa đường dẫn tạm của phiên ChatGPT. Bảo vệ dữ liệu nhạy cảm trước khi đưa ảnh lên GitHub theo quyền repo; nếu không thể lưu an toàn thì báo BLOCKED/UNVERIFIED, không bí mật chuyển chỗ lưu khác.

**Criteria 18 — Agent tự xử lý việc mình có thể:** Coder/Tester/Orchestrator không chuyển việc đọc log, phân tích lỗi, rerun kiểm tra hay sửa lỗi trong quyền cho người dùng chỉ vì bước đó khó.

**Criteria 19 — Harness và skills chuyên môn đúng Project:** Khi Task cần CAD/AutoLISP, Revit/C#, UI/browser..., **Coder/Tester load add-in harness instructions và skills đã khai báo của đúng Project và đúng vai** để áp dụng API/host, ngôn ngữ và cách nghiệm thu thật; không nạp nhầm Project/role hay dùng generic test làm bằng chứng duy nhất. Không add-in vẫn làm việc bằng generic harness; add-in không sửa Criteria, quyền hay workflow core.

---

## IX. Luồng 7 — Khi người dùng đổi plan hoặc GSA phát hiện bài học mới

Người dùng có thể thay đổi mục tiêu giữa chừng. **Với Criteria đã được duyệt, Planner cùng Human làm rõ thay đổi dự kiến nhưng chưa sửa file; Technical Advisor giải thích tính khả thi và hệ quả kỹ thuật của thay đổi đối với hiện trạng Project để Human cân nhắc giữ nguyên, điều chỉnh hoặc chốt mong muốn; Planner chỉ sửa và readback Criteria sau quyết định của Human.** Tiếp theo **kiểm tra Overall GOAL và từng Phase GOAL so với Criteria mới trước khi sửa detail plan**. GSA không được coi mọi Job cũ là vô giá trị và làm lại tất cả. Planner xác định phần nào giữ nguyên, phần nào cần kiểm chứng lại, phần nào phải thay thế, và phần nào cần người dùng quyết định. Công việc đã hoàn tất vẫn là lịch sử có thể truy nguyên; evidence của bản cũ không tự trở thành PASS cho bản mới.

Tương tự, mỗi lần gặp sự cố, GSA được phép ghi Lessons Learned để không lặp lỗi. **Ghi một lesson không đồng nghĩa được phép viết thêm gate, schema hoặc sửa toàn harness ngay lập tức.** Mọi đề xuất mới cần nhìn lại Criteria và xem chức năng đã có xử lý được chưa. Đừng lặp sai lầm: thiếu tiêu chí → sinh thêm gate → gate gây tắc → thêm workaround → source phình ra.

**[Người dùng — quyết định thay thế 17/10/2026] Không hồi cứu quyết định lịch sử.** ~~Tổng hợp mọi phê duyệt nằm trong chat cũ để người dùng click xác nhận lại trước khi bắt đầu Project.~~ Hướng này không còn là yêu cầu refactor. Khi tiếp nhận dự án đang làm dở, GSA thiết lập **Fresh Start** từ một Criteria mới được người dùng xác nhận, không mở công việc truy nguyên quá khứ. Các quyết định mới có ảnh hưởng lớn vẫn phải được ghi lại trong Project Memory theo cơ chế hiện có và tuân thủ ranh giới phê duyệt, nhưng **không bắt buộc xây Decision Logger riêng hoặc ép user dùng nút click thay cho hội thoại**. Nếu về sau muốn UX chọn phương án, đó là cải tiến tùy chọn, không phải điều kiện setup hay gate mới.

**Criteria 20 — Thay đổi Criteria do Human quyết định sau khi hiểu tác động kỹ thuật; GOAL trước detail:** Khi Human cân nhắc sửa Criteria đã duyệt, Planner làm rõ yêu cầu và tình trạng Project; **Advisor tư vấn trước khi ghi** về tính khả thi, phần thiếu/thừa, độ phức tạp/rủi ro và **ảnh hưởng dây chuyền tới kiến trúc, code/Job đã làm, chi phí làm lại** — không thay Reviewer/CR phán PASS/FAIL. Human biết hệ quả và có thể **giữ, điều chỉnh hoặc xác nhận** thay đổi; nếu quyết định đổi phạm vi đáng kể so với phần Advisor đã xem, tư vấn lại đúng phần thay đổi trước ghi. Planner chỉ cập nhật Criteria đã được Human chốt vào **một file** và Git readback. **Sau mỗi lần thay đổi hợp lệ**, Planner rà Overall GOAL và tất cả Phase GOAL trước; chỉ khi tầng GOAL khớp Criteria mới điều chỉnh detail/milestone/Job/Task/test bị ảnh hưởng, Reviewer RL trên revision mới; giữ nguyên phần không ảnh hưởng.

**Criteria 21 — Giữ gate chỉ khi có mục đích bảo vệ thực:** Gate là lựa chọn kỹ thuật, **không phải requirement tự thân**. Mỗi gate phải chứng minh đang bảo vệ quyền, correctness, security/recovery hay evidence quan trọng bằng hành vi/test có căn cứ. Gate trùng lặp, chỉ gây kẹt hoặc trì hoãn workflow không cần thiết thì **gộp/bỏ** nếu tính đúng và quyền vẫn được bảo toàn; không giữ theo thói quen và không xóa bừa theo quota. Không sinh gate mới để vá gate cũ.

**Criteria 22 — Refactor gọn, không mắc kẹt bởi gate:** Ưu tiên đường làm việc thực sự tiến tới GOAL với số lớp kiểm soát tối thiểu đủ an toàn; gate gây BLOCKED giả hoặc thêm latency mà không chứng minh được rủi ro được bảo vệ phải được sửa/gộp/loại khi có oracle tương ứng. Không đặt số lượng gate/dòng code mục tiêu rồi cắt mù; giữ kiểm tra quyền source/merge/deploy, Git write correctness, real test và resume khi cần.

**Criteria 23 — Framework generic phù hợp ChatGPT Web, không sao chép bootstrap local:** GSA có generic Planner (product discovery), Advisor (hai mốc Criteria), Coder, Tester, Reviewer, CR, Orchestrator dùng chung; **không cấu hình model riêng cho agent** vì môi trường ChatGPT Web không cho GSA tự phân model per-role như local coding agent. Chỉ kế thừa từ bootstrap các **hành vi phù hợp** (discovery, review, skills/harness add-in cần thiết, handoff), không mang TOML/model pin, daemon, local shell/hook, sandbox riêng hay gate không có trong GSA. Coder/Tester add-in tùy chọn theo Project, không tạo duplicate harness, role admin hay approval engine.

**Criteria 24 — Một `AGENTS.md` tối thiểu khai báo add-in khi cần:** Planner quản lý `AGENTS.md` gốc Project Memory, trỏ đến add-in **skills và harness** tùy chọn của đúng Coder/Tester; global role/harness vẫn thuộc GSA. Không bắt tạo skill/harness rỗng hoặc file Criteria thứ hai. Project không có add-in hợp lệ, và AGENTS.md không là nơi cấp quyền hoặc gate mới.

**Criteria 25 — Coder/Tester add-in có cả harness + skills:** Project có thể bổ sung **harness instructions và kỹ năng** chuyên biệt cho Coder/Tester (AutoLISP, Swift, frontend, browser/host verification...) theo **role và Task**. Không add-in thì generic đầy đủ. Không cho Project override Planner/Advisor/Reviewer/CR/Orchestrator, quyền hạn, Human approval, Criteria hay review loop. Không nạp skill không liên quan, không sao chép mỗi source repo một harness toàn cục.

**Criteria 26 — Fresh Start và Technical Advisor đúng vai trò:** Với Project mới hoặc đang triển khai dở, GSA xác nhận identity/quyền/source baseline bằng setup ngắn, `AGENTS.md` generic; Planner làm rõ GOAL, người dùng, mục đích, quy mô và giới hạn, soạn **một Criteria hướng tới tương lai**. **Technical Advisor giúp Human hiểu feasibility, điều kiện tiên quyết, thiếu/thừa, độ phức tạp, chi phí/rủi ro và mức ảnh hưởng của yêu cầu đối với hiện trạng Project** (có thể là thay đổi gần như toàn kiến trúc), trước khi Human duyệt lần đầu. Human giữ hoặc điều chỉnh yêu cầu sau tư vấn; Planner ghi đúng lựa chọn vào Criteria rồi mới lập Project Plan/milestone. Không hồi cứu approval/Job lịch sử, không tự sửa/xóa source cũ hoặc mặc định code cũ đã PASS.

**Criteria 27 — Criteria hướng tương lai, không làm lại quá khứ:** Criteria duy nhất của Project định nghĩa **đích cần đạt**; source hiện tại là **điểm xuất phát** và được đánh giá từng phần khi công việc cần đến. Chỉ những việc thuộc mục tiêu/ảnh hưởng thực tế mới cần khảo sát sâu hoặc kiểm chứng lại. Các quyết định được người dùng duyệt sau Fresh Start được ghi nhận đủ để tiếp tục công việc, không tạo chương trình truy vết ngược hoặc Decision Logger bắt buộc.

**Criteria 28 — Một nguồn sự thật duy nhất cho lý thuyết sản phẩm:** Mọi GOAL, quy mô, ranh giới và thay đổi lý thuyết có hiệu lực của Project nằm trong **một Criteria hiện hành**. Bản **chưa duyệt lần đầu** có thể được Planner chỉnh ngay khi khám phá yêu cầu, với `CHƯA CHỐT` rõ ràng. **Sau khi đã duyệt**, Planner thảo luận đề xuất mà chưa sửa file; chỉ sau Advisor pre-change review và quyết định Human mới cập nhật đúng Criteria duy nhất, đánh dấu phần thay thế và giữ Git history. Plan/Job/Review là HOW hoặc evidence, không làm nơi lưu theory thứ hai; không bắt tạo Decision Logger hay approval API mới.

**Criteria 29 — Chống drift qua GOAL review trước detail:** Mọi plan phải dùng đúng Criteria revision có hiệu lực. Sau **mỗi lần Criteria thay đổi**, Planner và Reviewer so trước **Overall GOAL + GOAL từng Phase** với Criteria mới và impact (giữ/sửa phần nào), chỉ sau đó mới cập nhật **detail** của phần bị ảnh hưởng. Nếu yêu cầu chỉ xuất hiện trong plan/PR/review/chat mà chưa được Human chốt vào Criteria thì không là scope. Mọi đề xuất thêm GOAL/gate ngoài Criteria phải quay lại Human để quyết định, không tự hợp thức hóa bằng một tài liệu khác.

---

## X. Những hành vi và lý thuyết cũ không nên mang sang bản GSA mới

Phần gạch ngang dưới đây là **những hướng từng tồn tại trong lịch sử nhưng đã có lý thuyết/phương án về sau thay thế**. Không được nhầm chúng với những lỗi từng xảy ra: lỗi vận hành không phải là “yêu cầu cũ” do người dùng chấp thuận.

- ~~Lưu Project Memory chính trên Google Drive.~~ Hiện dùng private GitHub Memory Repo được người dùng cấu hình, tách khỏi source repo; Supabase không trở thành kho Project Memory thay thế.
- ~~Dùng Task / Review Unit / PR / Change Set như hierarchy thực thi bắt buộc cho mọi việc.~~ Hiện Project → Job → Task (tùy chọn) → Run; milestone là mốc kế hoạch, PR là hoạt động Git chứ không phải cấp chủ sở hữu bắt buộc.
- ~~Lập thêm một Project trùng lặp chỉ để chạy NEXT Test Lab.~~ Lab dùng không gian được tách hợp lệ của cùng Project.
- ~~Mọi Job mới mãi mãi dùng mặc định V2_STABLE.~~ Sau production cutover đã được cho phép, Job mới dùng NEXT; các Job lịch sử còn nhận diện bằng quy tắc cũ, không tự chuyển ngầm.
- ~~Penpot hoặc một external design workspace là bước bắt buộc trước mọi UI Coder.~~ Frontend có thể triển khai thẳng tại source repo và dùng specialist skill theo tác vụ; Penpot chỉ là khả năng tùy chọn khi thật sự cần.
- ~~Mọi plan review bắt buộc phải chuyển sang chat khác.~~ Planning Reviewer có thể độc lập theo vai và theo bản Job đã lưu ngay trong cùng lượt; loại review khác có thể cần mức cách ly khác.
- ~~Khi production main đổi, tự merge/rebase toàn bộ vào một nhánh correction đang chạy.~~ Với chương trình correction từng được duyệt, thay bằng đối chiếu có chọn lọc và chứng minh thay đổi nào cần nhập; **đây là chính sách theo bối cảnh chương trình đó**, không phải luật cứng cho mọi dự án.
- ~~Chỉ cần dựa vào trí nhớ chat để xử lý lại một source write mất phản hồi.~~ Các thay đổi quan trọng phải có trạng thái durable đủ để đối chiếu Git thật và tiếp tục an toàn.

**Những hành vi cần loại bỏ, dù không phải một lý thuyết user từng duyệt:** tạo gate vô cớ; review cứ mở thêm scope; checkpoint xong dừng khi còn AUTO; hỏi người dùng copy log có thể tự đọc; nói PASS dựa vào helper thay vì real path; tạo branch rồi bỏ quên; vá lỗi theo từng triệu chứng; tự sửa plan/criteria để qua gate; chồng một vòng quản trị mới lên vòng cũ; ép dự án đã chạy từ trước phải tái dựng toàn bộ lịch sử chấp thuận trước khi dùng GSA; phân tán các thay đổi lý thuyết của người dùng ra nhiều draft plan và ghi chú rồi để chúng trở thành các source of truth cạnh tranh. Đây là **anti-criteria do vấn đề thực tế và yêu cầu cải thiện của người dùng chỉ ra**, không phải bằng chứng mọi việc đó hiện còn xảy ra cùng mức độ.

---

## XI. Những lựa chọn đã chốt và điểm còn mở

Các quyết định trong mục này cập nhật từ trao đổi Human ngày 18/10/2026; các phương án lịch sử chỉ còn để đối chiếu, **không được coi là requirement song song**.

**1. CR và Review Loop — [Đã chốt].** User gọi `rl` (nhỏ) hoặc `crl` (lớn); milestone đã được Human duyệt cũng có thể chỉ định trước loại loop, đến mốc Orchestrator tự chạy. `rl`: Planner/Coder ↔ Reviewer đến PASS/blocker. `crl`: `rl` PASS → CR; CR FAIL quay về `rl`, CR PASS thì trả kết quả hoặc tiếp tục đúng milestone. Không gọi CR ngoài lệnh/milestone đã cho phép, không thêm lifecycle/gate mới.

**2. Chat mới / `stopchat` — [Đã chốt shortcut, còn cách trigger resume cụ thể cần dựa quyền hiện hành].** `stopchat` chuẩn bị checkpoint/handoff ngắn, hướng dẫn chat mới tiếp tục trên đúng source/Project/Job với link và SHA, không tự chạy nền. Mở Project thông thường không tự thực thi; khi Human yêu cầu tiếp tục Job có quyền, khôi phục từ durable state và Git. Không thêm cơ chế tự resume không có trong ChatGPT Web.

**3. Ảnh UI — [Đã chốt].** Ảnh kiểm tra UI nằm trong **thư mục kiểm thử của chính repository dự án**; trả link GitHub tới thư mục/ảnh trên đúng revision cho user. Nếu nội dung nhạy cảm hoặc quyền lưu chưa đủ, xử lý an toàn và báo giới hạn, không tự đổi sang repo khác.

**4. Coder/Tester add-in — [Đã chốt].** Khai báo **skills và harness tùy chọn** tại GSA Project Memory/AGENTS.md, nạp lazy theo role/Task. GSA generic luôn chạy được, add-in không override shared framework/permission/Criteria.

**5. Gate — [Đã chốt nguyên tắc, quyết định cụ thể theo audit kỹ thuật].** Chỉ giữ gate thật sự cần cho quyền/correctness/evidence/recovery; gate trùng hay hay gây mắc kẹt không bảo vệ rủi ro thì gộp/bỏ sau khi kiểm chứng. Không bắt giữ mọi gate cũ, không đặt chỉ tiêu xóa.

**6. Admin / Git — [Đã chốt].** Admin là **chức năng**, không mở agent riêng; source repository + integration branch là sự thật của code, Project Memory là sự thật của Criteria/Plan/Job. Merge từng function pack/milestone vừa đủ kiểm chứng, không merge lẻ tẻ hay dồn khổng lồ, vẫn tuân thủ Human merge/deploy.

**7. Agent model config — [Loại khỏi GSA Web].** Không xây mapping model per-role hoặc file cấu hình model; bootstrap là template local agent nên phần này không phù hợp. Không nhầm role/harness với lựa chọn model trong ChatGPT.

**8. Git auto push — [Đã phân biệt].** GitHub connector ghi remote source trực tiếp; không ép workflow commit-local/push kiểu Codex. Giữ khác biệt work branch integration / merge production main / deploy và đúng quyền Human.

**9. ~~Decision Logger/UX click~~ — [Không bắt buộc].** Human quyết định trong hội thoại, ghi đúng một Criteria; không thêm engine approval riêng khi chưa có nhu cầu.

---

## XII. Bức tranh một GSA đúng — câu chuyện nghiệm thu tổng thể

Người dùng đưa vào GSA một dự án đang làm dở hoặc mới tạo. GSA làm Fresh Start ngắn: xác nhận repository/quyền, quan sát source tối thiểu và tạo AGENTS.md generic. **Planner hỏi đúng nhu cầu: sản phẩm để làm gì, cho ai, quy mô thật, giới hạn và mức tối thiểu dùng được**, ghi một Criteria draft hướng tới tương lai; **Advisor tư vấn cho Human về tính khả thi, điều kiện tiên quyết, độ phức tạp, thiếu/thừa và hệ quả kiến trúc thực tế của mong muốn trước lần duyệt đầu**; nếu yêu cầu tưởng nhỏ nhưng có thể phải thiết kế lại phần lớn Project, Advisor phải nói rõ. Human giữ hoặc điều chỉnh mong muốn sau khi hiểu tác động rồi chốt Criteria. Không cần hồi cứu lịch sử. Planner sau đó lập Project Plan có GOAL/Phase GOAL, milestones và quyết định cần Human. Người dùng duyệt. GSA chuyển sang thực thi theo đúng giới hạn đã cho.

Trong một lượt đang hoạt động, Planner/Coder làm và tự kiểm. Nếu milestone yêu cầu `rl`, Reviewer kiểm, FAIL thì agent sửa và tự lặp đến PASS. Nếu milestone yêu cầu `crl`, sau `rl` PASS gọi CR; CR FAIL quay về `rl` rồi gọi lại CR, đến PASS hoặc blocker thực. Tester kiểm chứng riêng theo tiêu chí/host khi cần; **review PASS không tự là sản phẩm E2E PASS**. Sau checkpoint và loop PASS, GSA chạy bước AUTO tiếp theo hoặc trả kết quả theo tình hình chat/quyền; chỉ dừng hỏi Human ở điểm thực sự cần quyết định.

Nếu chat quá dài/lag, Human gọi `stopchat`: GSA ghi/readback trạng thái cần thiết, đưa chỉ dẫn chuyển phiên ngắn chứa đúng Project/branch/SHA/Job và next action. Không chạy nền, không tự code khi chỉ mở Project trong chat mới.

Nếu lúc ghi source bị mất mạng, phiên chat kết thúc hoặc công cụ không phản hồi, kết quả dở dang vẫn có thể được kiểm tra lại ở phiên sau. GSA đối chiếu Git và Memory, không tạo commit trùng, không sửa lại phần đã hoàn tất, không báo hoàn thành giả. Khi người dùng tiếp tục một Job đã được ủy quyền, GSA làm tiếp từ bước còn thiếu. Người dùng thấy rõ tính năng đã chạy thật, còn điều gì chưa test được, và đâu là các bước yêu cầu quyền merge/release riêng.

Khi người dùng quyết định đổi Criteria đã duyệt, Planner làm rõ phần trước/sau; Advisor **giải thích tác động kỹ thuật của thay đổi dự kiến lên kiến trúc/việc đã làm trước khi sửa file**, không phán review PASS/FAIL; Human có thể giữ hoặc chỉnh mong muốn rồi chốt, Planner cập nhật cùng file và readback. Planner **so và sửa GOAL tổng/Phase GOAL chịu ảnh hưởng trước khi sửa detail plan**, Reviewer kiểm lại theo Criteria revision mới; không làm lại phần hợp lệ.

Với UI, mỗi Project lưu ảnh kiểm thử trong repo của chính nó và gửi người dùng link GitHub để xem. Coder/Tester có thể load skills **và harness add-in** của đúng Project khi cần, không override framework chung. Admin vận hành như chức năng merge các gói kết quả hợp lý, không tạo agent mới. Những gate thật sự gây tắc mà không bảo vệ rủi ro sẽ được tinh gọn theo kiểm chứng; không xây model-assignment theo vai từ bootstrap local.

Sau thời gian làm việc, repository không tích tụ nhiều nhánh bỏ quên; Projects không có hai bộ criteria cạnh tranh; harness không phải liên tục được vá bằng gate mới để vượt gate cũ. GSA ngày càng hiểu chuyên môn từng Project tốt hơn nhờ skills và lý thuyết đã được duyệt, nhưng bộ máy chung vẫn gọn.

**Đó là đích sản phẩm để Planner sau này lập kế hoạch refactor.** Planner không được thay câu chuyện này bằng việc tái tạo từng schema, helper hoặc gate xuất hiện trong lịch sử. Chỉ khi người dùng duyệt bản lý thuyết và chốt các điểm ở mục XI, tài liệu mới có thể trở thành Criteria baseline duy nhất cho việc thiết kế một phiên bản GSA tinh gọn hơn.

---

### Ghi chú ngắn về nguồn và tính chắc chắn

Nội dung được tổng hợp từ các yêu cầu trực tiếp trong những cuộc trao đổi về GSA, các bản nền tảng/plan lý thuyết trong repository và hồ sơ truy nguyên đã lập ngày 17/10/2026. **Các nhãn “Người dùng”, “Nền tảng”, “Đề xuất AI” là mức độ truy nguyên đã biết, không phải bằng chứng pháp lý về tác giả từng dòng.** Tài liệu này không thay thế lịch sử, không xác nhận mọi tính năng hiện đã chạy được và không cho phép tự sửa source. Muốn kiểm chứng câu nào bị thay đổi qua các giai đoạn, dùng bản kiểm kê gốc; **không cần đọc bản kiểm kê đó để hiểu Criteria này**.
