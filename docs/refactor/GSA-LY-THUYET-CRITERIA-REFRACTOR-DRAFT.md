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

**Planner** chịu trách nhiệm hiểu yêu cầu, đọc bối cảnh, dựng logic, soạn tiêu chí nghiệm thu, đặt GOAL, chia Phase/Job/Task, lập milestone, dependency, lịch review/test và điểm dừng. Planner **không viết code sản phẩm** và không tự đổi mục tiêu người dùng. Khi một Project chưa có đủ lý thuyết để lập kế hoạch, Planner tìm hiểu và hỏi đúng quyết định còn thiếu; không đoán. **[Người dùng + Nền tảng]**

**Coder** biến phần việc đã được duyệt thành source thực. Coder chọn kỹ thuật và chi tiết triển khai, được quyền tự sửa sai trong phạm vi đã duyệt, nhưng không được lén sửa tiêu chí để hợp thức hóa code, tự đổi ý nghĩa sản phẩm hoặc viết sang một repo khác. Coder phải tự xem lại diff, GOAL, tiêu chí, test và kết quả thực trước khi bàn giao.

**Tester** kiểm chứng sản phẩm có thật sự làm được việc đã yêu cầu hay không. Tester có thể thử chức năng, đo hành vi hoặc dò khả năng của môi trường; kết quả đo chưa có chuẩn so sánh không được tự biến thành PASS. Tester độc lập với nhận định “Coder nói đã xong”, không sửa product source để tạo ra kết quả xanh.

**Reviewer** đánh giá độc lập kế hoạch hoặc code, dựa vào yêu cầu đã duyệt và bằng chứng hiện có. Reviewer được phát hiện cả **cái thiếu lẫn cái thừa**; một đề xuất cải tiến không tự trở thành lỗi bắt buộc phải sửa. Review của một Job nhỏ không cần bị biến thành một chuỗi nghi lễ nhiều tầng.

**Critic Reviewer (CR)** là lớp phản biện độc lập, không dựa vào kết luận trước đó của người review và không tự sửa source. **Quy tắc cũ là CR chỉ do Human gọi**. Khả năng người dùng ủy quyền CR theo milestone để khỏi gọi lặp lại là yêu cầu mới **chưa chốt ranh giới**; xem mục VII. Không được tự đổi luật chỉ vì muốn tăng tự động hóa.

**Designer, UI Coder, debugging và các kỹ năng đặc thù** chỉ tham gia khi công việc thật sự cần. UI Coder là chuyên môn của Coder, không mặc định là một hệ điều phối mới. GSA không cần lập agent mới chỉ vì một skill có phương pháp làm việc riêng.

**GSA generic framework và Coder/Tester Add-in. [Người dùng — quyết định mới 17/10/2026]** GSA không phải tạo một bộ harness khác cho từng repository. Planner, Reviewer và Critic (CR) dùng chung cấu hình ở cấp GSA, không có biến thể theo Project. Coder và Tester cũng luôn có đầy đủ năng lực **generic**, hoạt động bình thường khi Project không khai báo gì thêm. Project chỉ có thể **bổ sung (add-in)** kỹ năng, kiến thức và hướng dẫn chuyên môn cho Coder hoặc Tester; **không override, không thay thế vai trò generic, không thay đổi quyền hạn hay workflow nền tảng**. Skills được nạp theo Task, không tải toàn bộ khi mở Project.

Ví dụ, Coder của một dự án AutoCAD có thể nạp skill quy định đúng **AutoLISP** và các phần mở rộng Visual LISP được host cho phép, tránh đưa cú pháp Common Lisp hay Lisp khác vào code. Tester có thể nạp skill kiểm chứng việc load/chạy lệnh và kết quả ngay trong bản vẽ AutoCAD thay vì dùng unit test làm bằng chứng duy nhất. Project web không phải mang những skills này.

**AGENTS.md ở Project Memory. [Người dùng — quyết định mới]** Planner phải tạo và duy trì một file `AGENTS.md` tối thiểu tại gốc thư mục GSA Project (`GSA-Projects/projects/<project-id>/AGENTS.md`) bằng template generic sẵn có. Tài liệu chỉ ghi thông tin Project và khai báo Coder/Tester add-in nếu thật sự cần; nó không sao chép lại global harness, không tự đặt criteria và không yêu cầu bootstrap toàn bộ từng source repository. Không có add-in là một cấu hình hợp lệ.

---

## III. Luồng 1 — Bắt đầu Project, hiểu yêu cầu và lập Criteria

**Fresh Start / Adopt Existing Project. [Người dùng — quyết định mới 17/10/2026]** GSA phải tiếp nhận được cả dự án mới lẫn dự án đã triển khai giữa chừng. Khi Project chưa từng dùng GSA, chỉ cần một lần setup cơ bản: xác định Project và repository thuộc quyền, đọc cấu trúc/stack và hiện trạng source ở mức đủ làm việc, ghi điểm bắt đầu và các giới hạn thực tế đã biết, khởi tạo `AGENTS.md` generic tối thiểu, rồi cùng người dùng xác lập **Criteria mới mô tả đích đến của dự án từ thời điểm sử dụng GSA**. Không bắt phải dựng lại lịch sử chat, mọi phê duyệt cũ, mọi milestone đã qua hay toàn bộ Job/Run trong quá khứ. Không chạy bootstrap harness riêng và không cần review toàn bộ repository trước khi bắt đầu một công việc nhỏ. Dự án đang làm dở không được bị reset, làm lại hay giả vờ rằng các phần cũ đã được GSA nghiệm thu.

Khi người dùng **mở** một Project đã setup, GSA chỉ xác định đúng dự án và dữ liệu hiện hành ở mức tối thiểu; mở Project không có nghĩa tự sửa code. Nếu đang tiếp tục một Job đã được GSA quản lý, dùng checkpoint và bằng chứng thực tế từ thời điểm tiếp nhận trở đi để khôi phục. **Fresh Start là khởi điểm quản trị mới, không phải xóa hay viết lại source và lịch sử Git.**

Nếu người dùng nói “sửa lỗi này”, GSA phải phân biệt giữa báo cáo hiện tượng, câu hỏi về nguyên nhân và chỉ thị triển khai. Những điều đã nằm trong Project Memory không được hỏi lại. Những điều ảnh hưởng bản chất sản phẩm mà chưa được quyết định phải được nêu rõ; chi tiết cơ học có thể suy ra từ bằng chứng.

**Criteria mới là mục tiêu tương lai, không phải bản tái dựng quá khứ. [Người dùng — quyết định mới]** Project có **một bộ Criteria gốc hiện hành** diễn đạt sản phẩm cần hướng tới điều gì, những giới hạn nào phải giữ và bằng chứng nào chứng minh đạt đích. Planner đề xuất từ yêu cầu hiện tại và hiện trạng source đã quan sát được để người dùng duyệt. Criteria không cần chứng minh ai đã từng duyệt từng tính năng cũ; phần đã tồn tại được ghi nhận như hiện trạng, không mặc nhiên là mục tiêu đúng hay kết quả PASS. Sau khi người dùng duyệt, Criteria trở thành baseline cho kế hoạch **từ thời điểm Fresh Start**, không được agent tự đổi nội dung để vừa với code hay gate.

Criteria cấp Job/Task là các phép cụ thể hóa phần việc từ Project Criteria, không phải một bản lý thuyết sản phẩm cạnh tranh. Một phát hiện mới chỉ làm thay đổi Criteria gốc khi người dùng xem và chấp nhận sự thay đổi có ý nghĩa đó.

**Cập nhật lý thuyết phải đi thẳng vào Criteria. [Người dùng — nguyên tắc mới 17/10/2026]** Khi người dùng bổ sung, sửa hoặc loại bỏ một yêu cầu lý thuyết của Project, GSA/Planner cập nhật **ngay tài liệu Criteria duy nhất hiện hành** của chính Project đó. Không lưu thay đổi ấy thành một draft plan, ghi chú lý thuyết hoặc document mới để rồi hy vọng sau này ghép lại. Nếu yêu cầu còn đang bàn và chưa phải quyết định cuối, ghi ngay tại vị trí liên quan trong cùng Criteria với trạng thái **CHƯA CHỐT** và các phương án đang mở; không lặng lẽ coi là đã duyệt. Khi được chốt, sửa đúng mục liên quan, đánh dấu hoặc gạch phần bị thay thế và giữ khả năng đối chiếu lịch sử qua Git. Không cần xây thêm decision engine hay gate mới để làm việc này.

**Ranh giới trách nhiệm:** Criteria quyết định **WHAT/WHY** — đích cần đạt, giới hạn và điều kiện nghiệm thu; Project Plan/Milestone/Job quyết định **HOW/WHEN** — công việc và trình tự đạt Criteria. Planner/Reviewer/CR được đề xuất cập nhật Criteria, nhưng không được tự đổi ý định người dùng từ các finding kỹ thuật, lỗi code hoặc nhu cầu vượt gate. Nếu người dùng thay đổi lý thuyết khiến plan hiện tại không còn đúng, cập nhật Criteria trước, sau đó chỉ điều chỉnh phần plan bị ảnh hưởng; không giữ hai nguồn mệnh lệnh song song.

**Criteria 01 — Đúng dự án, tiếp nhận nhẹ:** Với dự án mới hoặc đang triển khai dở, GSA xác định đúng source repository, quyền truy cập và baseline hiện tại qua bước setup tối thiểu, không hồi cứu toàn bộ lịch sử. Mở Project không tự cấp quyền sửa source. Khi hoàn tất setup, Project có thể dùng ngay generic framework.

**Criteria 02 — Không đoán ý định:** Trước khi lập kế hoạch hoặc code, GSA xác định được GOAL, phạm vi và tiêu chí đủ rõ cho quyết định sắp thực hiện. Thiếu một lựa chọn quan trọng thì phải nêu đúng lựa chọn thiếu, không sáng tác yêu cầu.

**Criteria 03 — Một chuẩn mục tiêu hướng tới:** Project có một Criteria hiện hành được người dùng duyệt, phản ánh đích đến từ thời điểm bắt đầu sử dụng GSA. Plan, milestone và Job tạo sau đó phải phục vụ Criteria; trạng thái source cũ là đầu vào quan sát, không tự trở thành criteria hoặc lịch sử approval bắt buộc phải tái dựng.

---

## IV. Luồng 2 — Planner làm Project Plan và Milestone

Planner dùng Criteria đã có để lập một kế hoạch từ tổng thể đến công việc cụ thể. **Overall GOAL nằm rõ ở đầu plan**, mỗi Phase có GOAL riêng và việc trong Phase phải có tác dụng trực tiếp đối với GOAL đó. Một Project Plan hoàn chỉnh còn cần **bản đồ milestone**, chứ không chỉ một danh sách task. **[Người dùng]**

Mỗi milestone nói bằng lời dễ hiểu: phải tạo ra kết quả gì; phụ thuộc vào điều gì; kết quả được kiểm chứng thế nào; ai sẽ làm; review/test nào có giá trị; hoàn thành mốc thì **tự chuyển bước** hay **chờ người dùng**; nếu liên quan Git/release thì được làm tới đâu. Planner phải chỉ ra milestone nào chỉ là tiến độ nội bộ, milestone nào là ranh giới nghiệm thu hoặc quyền quyết định. Không cần dựng thêm một gate runtime cho mỗi ô checklist.

Một plan tốt không chỉ **đầy đủ** mà còn **không thừa**. Nếu Reviewer đề xuất thêm một phase, checkpoint, bảng dữ liệu hay công cụ, phải chứng minh chúng giúp đạt Criteria hoặc xử lý rủi ro đã có bằng chứng. Khi phát hiện điều ngoài phạm vi, hãy tách thành đề xuất cho tương lai; không âm thầm nhét vào đợt triển khai hiện tại.

Planning Review có thể chạy tự động qua các vòng Planner sửa → Reviewer đánh giá → Planner sửa lại cho đến khi đạt kết quả hoặc gặp trở ngại thực sự. Review phải dựa trên kế hoạch đã được ghi và ngữ cảnh đủ độc lập, không bắt Human tự nói “RL” sau từng vòng. Câu lệnh `planner rl` vẫn là lối gọi tắt, không phải một loại lifecycle mới.

**Criteria 04 — Plan truy vết được:** Mỗi Phase và milestone của Project Plan đều giải thích bằng kết quả cụ thể vì sao chúng đưa Project tiến gần hơn tới GOAL và tiêu chí gốc; không có công việc chỉ tồn tại vì agent từng gợi ý.

**Criteria 05 — Milestone bắt buộc khi lập Project Plan:** Không được coi một Project Plan đầy đủ là hoàn tất nếu chưa có milestone, điều kiện nghiệm thu và điểm AUTO/STOP rõ. Job nhỏ trong một plan đã duyệt không phải lập thêm milestone giả.

**Criteria 06 — Review không làm drift:** Sau một vòng review, mục tiêu và ranh giới được duyệt vẫn giữ nguyên; finding ngoài Criteria được ghi là đề xuất, không biến thành việc bắt buộc hoặc gate mới.

---

## V. Luồng 3 — Thực thi, review, test và tiếp tục qua milestone

Khi người dùng chấp thuận kế hoạch và cho phép thực thi trong phạm vi nhất định, GSA có trách nhiệm chủ động làm việc cho tới giới hạn được phép, thay vì cứ hoàn thành một thao tác rồi xin “tiếp tục” lần nữa.

Luồng thông thường là: Orchestrator chọn Job/Task đủ điều kiện → Coder/Designer thực hiện → Coder tự kiểm → Tester hoặc Reviewer tham gia **tại mốc đã được lên kế hoạch hoặc do rủi ro thực sự đòi hỏi** → kết quả được ghi và xác minh → Orchestrator chọn bước kế tiếp. Nếu kiểm thử phát hiện lỗi sản phẩm thuộc phạm vi đã duyệt, Coder sửa và thử lại. Nếu phát hiện thiếu specification, trở lại Planner; không sửa bừa code để né lỗi.

**[Người dùng — yêu cầu mới] Checklist phải có ý nghĩa điều khiển rõ ràng.** Mỗi milestone cần nói bước nào được phép tự bắt đầu, bước nào phải dừng xin quyết định, bước nào chỉ chạy khi được gọi thủ công và bước nào tạm không thể chạy vì điều kiện thực tế chưa đáp ứng. Các tên `AUTO_START`, `HUMAN_GATE`, `MANUAL_START`, `BLOCKED` là **[Đề xuất AI — chưa chốt về tên field]**, không phải đòi hỏi phải tạo bốn state mới trong database. Điều quan trọng là **hành vi được phân biệt và thực thi đúng**.

**Checkpoint không phải điểm dừng.** Sau khi lưu checkpoint, GSA phải đọc lại dữ liệu cần thiết, kiểm tra bước kế tiếp và, **nếu thuộc chuỗi AUTO đã được duyệt và vẫn có quyền**, thực hiện luôn trong lượt hiện tại. Câu “đã checkpoint, hãy bảo tôi tiếp tục” là **sai hành vi** khi chưa có Human Gate, blocker hay kết thúc công việc.

Ngược lại, khi milestone đến một quyết định sản phẩm, đổi scope, quyền ghi ngoài phạm vi, merge/deploy chưa được duyệt hay một kiểm thử chỉ con người mới làm được, GSA phải dừng thật sự và chỉ yêu cầu đúng quyết định còn thiếu. Tự động hóa không phải giấy phép vượt Human Gate.

**Criteria 07 — AUTO thực sự tự chạy:** Trong một phiên còn hoạt động, một bước AUTO có dependency đã hoàn tất phải được GSA tự chuyển tới bước được phép tiếp theo sau checkpoint/readback, không bắt người dùng nói “continue”, “review”, “test” hay “repair”.

**Criteria 08 — Dừng đúng chỗ:** Đến mốc chờ người dùng, hết quyền, thiếu năng lực thật hoặc không thể giải quyết xung đột an toàn, GSA dừng với lý do cụ thể. Không dừng chỉ vì muốn bàn giao sự điều phối cơ học cho người dùng.

**Criteria 09 — Kiểm chứng đúng việc:** Không gọi Job hoàn tất chỉ nhờ lời Coder, một lời Reviewer PASS hoặc một kết quả test không kiểm được. Cần bằng chứng tương ứng với tiêu chí và phiên bản sản phẩm được đánh giá.

**Criteria 10 — Không review tràn lan:** Không mặc định Reviewer sau mọi Task, Tester sau mọi lần sửa hoặc CR sau mọi milestone. Vòng review/test phải có lý do về criteria, rủi ro hoặc yêu cầu kiểm chứng.

---

## VI. Luồng 4 — Chat mất phản hồi, mạng lỗi, và việc làm dở

GSA chạy qua ChatGPT Web nên **không có cam kết tự chạy nền sau khi phiên bị ngắt**. Nhưng trạng thái bền vững phải đủ để khi có lượt mới, GSA biết đúng việc nào đã hoàn tất, việc nào chưa và thao tác nào đang có kết quả không rõ.

Ví dụ: GSA gửi lệnh ghi code lên GitHub rồi mất kết nối. Khi người dùng mở lại, không thể suy ra “lệnh thất bại” chỉ vì chat không nhận được phản hồi. GSA phải đọc lại branch và nội dung đích: nếu ghi đã xảy ra thì không ghi trùng; nếu chắc chắn chưa xảy ra thì xử lý tiếp theo quyền; nếu có thay đổi không nhận diện được thì dừng để hòa giải. Một lời tool trả về “prepared” cũng không chứng minh write đã được lưu thành công.

Mỗi lần checkpoint cần giữ **đủ** thông tin để tìm lại last good state; không có nghĩa phải ghi thêm một file sau **mọi** tool call. GSA nên lưu trạng thái ở các ranh giới thực sự quan trọng, tránh tăng độ trễ và tránh tạo nguồn sự thật song song. Những bản record kỹ thuật như cursor, claim/lease hay cache là **phương tiện**, không được tự biến thành mục tiêu sản phẩm.

Vòng retry cần có giới hạn để không gọi tool liên tiếp mà chẳng có tiến độ. “Tiến độ” là kết quả có thể đọc lại và so sánh được, không phải số lần gọi API. Khi đã hết phương án hợp lệ, GSA dừng và ghi rõ bước khôi phục. Khi có một lượt hợp lệ khác, hệ thống tiếp tục từ trạng thái đã xác minh, không viết lại mọi thứ từ đầu.

**Criteria 11 — Sống qua việc mất chat:** Sau một lần gián đoạn giữa các bước, GSA có thể xác định kết quả bền vững cuối cùng và bước còn thiếu mà không yêu cầu người dùng kể lại cả lịch sử.

**Criteria 12 — Không lặp write:** Mất phản hồi trong một thao tác Git/Memory không khiến lần sau vô tình tạo thêm commit, source change, evidence hoặc Job trùng cho cùng hành động.

**Criteria 13 — Thành thật về giới hạn:** Khi không có active session hoặc công cụ thật sự không thể hoạt động, GSA không hứa sẽ tiếp tục chạy nền hay báo PASS thay cho phần chưa được kiểm chứng.

---

## VII. Luồng 5 — Git, quản trị dự án và kiểm soát nguồn

**[Người dùng]** GSA phải có năng lực **Admin**, đặc biệt trong quản trị code của dự án qua Git. Công việc thường có nhiều lần sửa, nhiều checkpoint và lịch sử branch. Nếu agent cứ mở branch mới rồi không tích hợp, code sẽ nằm rải rác, khó biết bản nào đúng và có thể mất cả những phần đã viết.

Với một đợt phát triển/refactor, nên có **một đường tích hợp chính đã xác định**. Branch phụ chỉ tồn tại khi có tác dụng rõ và phải được tích hợp vào đường chính ngay khi điều kiện review/test và quyền liên quan đã đáp ứng. Trước khi dọn lịch sử, GSA phải xác minh code còn độc nhất ở nhánh nào, commit nào đã có trong branch đích và điều gì chưa được hợp nhất. Không xóa, force-push, merge mù hoặc coi chữ “merged” trong hội thoại là bằng chứng.

**Admin là một năng lực, chưa chắc cần một agent mới. [Người dùng muốn chức năng; Đề xuất AI — chưa chốt về hình thức]** Có thể giao cho Orchestrator/Planner sử dụng công cụ Git hiện có nếu đáp ứng; chỉ nên mở vai riêng khi chứng minh được việc tách vai có ích hơn chi phí điều phối.

Cần phân biệt bốn việc: viết code vào branch làm việc, tích hợp công việc đã review, merge vào production `main`, và deploy sản phẩm. Chúng **không có cùng quyền**. Với GitHub connector, một lần tạo hoặc sửa file thường đã là ghi lên remote; không thể áp nguyên quy tắc “commit local xong mới push” của Codex CLI. Milestone cần nói rõ quyền của từng loại thao tác trong môi trường thực tế GSA. Merge production và deploy cần quyết định người dùng theo các contract hiện hành; không mặc nhiên auto chỉ vì checklist có chữ AUTO.

**Criteria 14 — Không phân tán code:** Tại mỗi milestone, người dùng có thể biết nguồn tích hợp chính là gì, các branch nào đang làm việc, phần nào đã được hấp thụ và phần nào chưa; không có code quan trọng bị bỏ quên mà không được báo.

**Criteria 15 — Git đúng quyền:** Một milestone tự động không làm GSA tự merge production, deploy, xóa branch hoặc sửa repo khác khi chưa có quyền tương ứng.

**Criteria 16 — Không tạo việc quản trị thừa:** Git Admin không biến những branch lịch sử không liên quan thành lý do dừng mọi Job; chỉ cảnh báo và yêu cầu hòa giải khi chúng thực sự ảnh hưởng correctness hoặc quyền của việc đang làm.

---

## VIII. Luồng 6 — Chất lượng thực tế, khả năng dùng công cụ và công việc đặc thù

GSA được đánh giá bằng **việc thật có chạy đúng không**. Build thành công, typecheck xanh hoặc một bài helper tự kiểm PASS chỉ nói rằng các kiểm tra đó đạt. Chúng không chứng minh ứng dụng thực đã load tool, dùng đúng connector, tương tác được với host, giữ được dữ liệu sau restart hoặc hoạt động đúng trên bản deploy. Những phép thử dùng để nghiệm thu phải đánh vào đường đi mà người dùng thật sự sử dụng.

Nếu CI báo lỗi và GSA có quyền đọc GitHub Actions, GSA phải tự lấy run/job/step/log trước khi yêu cầu người dùng đi tìm hộ. Nếu công cụ thường dùng không hoạt động, có thể khám phá phương án hợp lệ khác nhưng phải ghi đúng môi trường nào được kiểm. Coder tự chẩn đoán và sửa lỗi trong phạm vi đã duyệt; Tester độc lập xác minh.

Lỗi không tầm thường phải được hiểu theo chuỗi thật: yêu cầu người dùng → entrypoint/tool → bộ điều phối → hàm và dữ liệu → runtime/host → kết quả người dùng thấy. Sau khi một bản hotfix đã thất bại, tiếp tục vá từng thông báo lỗi mà không kiểm tra toàn bộ đường liên quan là một hành vi cần loại bỏ.

Với UI/frontend, Designer làm rõ hướng nhìn và coverage khi thật sự cần; UI Coder triển khai trực tiếp trong source đích, có thể tự xem bằng browser; Tester kiểm tra lại kết quả chạy thật và đưa bằng chứng người dùng mở được, chẳng hạn ảnh chụp và link. Không yêu cầu Penpot hay công cụ thiết kế ngoài như một bước **bắt buộc cho mọi sản phẩm**. Nếu người dùng chủ động muốn Penpot hoặc workflow đặc biệt, đó có thể là kỹ năng tùy chọn.

**Criteria 17 — Test chứng minh hành vi:** Một tiêu chí chỉ PASS khi test, kiểm tra thực tế hay bằng chứng đủ mạnh để phân biệt hành vi đúng/sai trên đúng revision; test giả xanh hoặc kiểm thử nhầm phiên bản không được đóng tiêu chí.

**Criteria 18 — Agent tự xử lý việc mình có thể:** Coder/Tester/Orchestrator không chuyển việc đọc log, phân tích lỗi, rerun kiểm tra hay sửa lỗi trong quyền cho người dùng chỉ vì bước đó khó.

**Criteria 19 — Chuyên môn đúng dự án:** Khi áp dụng kỹ năng đặc thù (CAD/AutoLISP, Revit/C#, UI/browser...), agent thực sự được cung cấp giới hạn ngôn ngữ, API, host và cách nghiệm thu của Project đó; kỹ năng không áp dụng không được biến thành yêu cầu phổ quát.

---

## IX. Luồng 7 — Khi người dùng đổi plan hoặc GSA phát hiện bài học mới

Người dùng có thể thay đổi mục tiêu giữa chừng. GSA không được coi mọi Job cũ là vô giá trị và làm lại tất cả. Planner xác định phần nào giữ nguyên, phần nào cần kiểm chứng lại, phần nào phải thay thế, và phần nào cần người dùng quyết định. Công việc đã hoàn tất vẫn là lịch sử có thể truy nguyên; evidence của bản cũ không tự trở thành PASS cho bản mới.

Tương tự, mỗi lần gặp sự cố, GSA được phép ghi Lessons Learned để không lặp lỗi. **Ghi một lesson không đồng nghĩa được phép viết thêm gate, schema hoặc sửa toàn harness ngay lập tức.** Mọi đề xuất mới cần nhìn lại Criteria và xem chức năng đã có xử lý được chưa. Đừng lặp sai lầm: thiếu tiêu chí → sinh thêm gate → gate gây tắc → thêm workaround → source phình ra.

**[Người dùng — quyết định thay thế 17/10/2026] Không hồi cứu quyết định lịch sử.** ~~Tổng hợp mọi phê duyệt nằm trong chat cũ để người dùng click xác nhận lại trước khi bắt đầu Project.~~ Hướng này không còn là yêu cầu refactor. Khi tiếp nhận dự án đang làm dở, GSA thiết lập **Fresh Start** từ một Criteria mới được người dùng xác nhận, không mở công việc truy nguyên quá khứ. Các quyết định mới có ảnh hưởng lớn vẫn phải được ghi lại trong Project Memory theo cơ chế hiện có và tuân thủ ranh giới phê duyệt, nhưng **không bắt buộc xây Decision Logger riêng hoặc ép user dùng nút click thay cho hội thoại**. Nếu về sau muốn UX chọn phương án, đó là cải tiến tùy chọn, không phải điều kiện setup hay gate mới.

**Criteria 20 — Thay đổi có kiểm soát:** Khi user duyệt thay đổi mục tiêu, GSA ghi ngay nội dung thay đổi vào Criteria duy nhất, sau đó điều chỉnh phần kế hoạch và công việc bị ảnh hưởng, bảo toàn phần hợp lệ, không ghi đè lịch sử và không để thiếu yêu cầu đã được chốt. Bản plan không được tự trở thành nguồn lý thuyết cạnh tranh.

**Criteria 21 — Không dùng gate để vá gate:** Mỗi gate còn lại phải chứng minh nó bảo vệ một quyền, một rủi ro thực hoặc một tiêu chí; phần trùng chức năng, chỉ có tác dụng vá gate khác hoặc không còn mục đích phải được đánh giá để hợp nhất/loại bỏ. Không thêm gate mới chỉ vì một agent lo ngại theo giả định.

**Criteria 22 — Tinh gọn mà không mất bảo đảm:** Refactor thành công khi luồng làm việc đơn giản và đáng tin hơn, code/độ phức tạp không còn tăng vô lý, nhưng bảo vệ quyền, chống ghi nhầm/ghi trùng, tính trung thực của test và khả năng resume vẫn hoạt động. Không đặt một con số dòng code/gate cố định rồi cắt để đạt KPI.

**Criteria 23 — Framework dùng chung, không bootstrap lặp lại:** Một GSA Project mới có thể bắt đầu công việc với generic Planner/Coder/Tester/Reviewer/CR của GSA ngay sau khi được khai báo và cấp quyền phù hợp; không cần dùng Codex hay agent khác tạo lại vai, model config, hooks, gate engine và push cả bộ harness vào từng source repo. Thiết lập một Project thông thường phải là thao tác nhẹ, dựa trên template có sẵn, không tiêu hao lượng lớn lượt suy luận để dựng lại năng lực generic.

**Criteria 24 — AGENTS.md tối thiểu do Planner quản lý:** Khi thiết lập kế hoạch cho Project, Planner phải bảo đảm có `AGENTS.md` ở gốc GSA Project Memory, khởi tạo từ template chung và cập nhật khi đặc thù dự án thay đổi. Project không có yêu cầu chuyên biệt vẫn hợp lệ với nội dung tối thiểu. File không được là bản sao thứ hai của Criteria, không là nơi cấp quyền mới, không buộc tạo skill rỗng và không trở thành Human Gate mới chỉ vì được tạo.

**Criteria 25 — Add-in Coder/Tester là bổ sung tùy chọn:** Trong cùng một GSA framework, Project có add-in AutoLISP, Swift hoặc frontend thì Coder/Tester nạp đúng kiến thức và kỹ năng cần cho Task; Project không có add-in vẫn dùng generic behavior đầy đủ. Planner, Reviewer và CR không bị Project thay thế cấu hình. Add-in không được thay workflow, phạm vi ghi, tiêu chí nghiệm thu, quyền approval hoặc quy tắc an toàn của framework. Một task không cần kỹ năng đặc thù không phải đọc hoặc gọi kỹ năng ấy.

**Criteria 26 — Fresh Start cho dự án đang triển khai:** GSA có thể tiếp nhận một repository đã có source, kế hoạch cũ hoặc các phần việc chưa hoàn tất chỉ bằng một bước setup ngắn. Thiết lập Project identity, quyền, baseline source và `AGENTS.md` tối thiểu; người dùng xác nhận Criteria mới rồi Planner lập plan/milestone cho chặng tiếp theo. Không bắt dựng lại mọi quyết định, Job hay approval từ lịch sử trước khi GSA tham gia. Không sửa, xóa hoặc coi code lịch sử là đã được nghiệm thu.

**Criteria 27 — Criteria hướng tương lai, không làm lại quá khứ:** Criteria duy nhất của Project định nghĩa **đích cần đạt**; source hiện tại là **điểm xuất phát** và được đánh giá từng phần khi công việc cần đến. Chỉ những việc thuộc mục tiêu/ảnh hưởng thực tế mới cần khảo sát sâu hoặc kiểm chứng lại. Các quyết định được người dùng duyệt sau Fresh Start được ghi nhận đủ để tiếp tục công việc, không tạo chương trình truy vết ngược hoặc Decision Logger bắt buộc.

**Criteria 28 — Một nguồn sự thật duy nhất cho lý thuyết sản phẩm:** Tất cả thay đổi lý thuyết do người dùng nêu từ lúc Project bắt đầu dùng GSA phải được cập nhật trực tiếp vào **một Criteria hiện hành** của Project. Không tạo draft plan, working note, theory doc hoặc roadmap độc lập như một nơi ghi yêu cầu khác. Những phần đang thảo luận được đánh dấu CHƯA CHỐT ngay trong Criteria; phần đã bị thay thế được gạch hoặc ghi rõ tình trạng, không giữ hai yêu cầu cùng hiệu lực. Các plan/Job/Review chỉ dẫn chiếu và triển khai Criteria hiện hành. Khi user thay đổi Criteria, Planner đánh giá ảnh hưởng và cập nhật kế hoạch phụ thuộc, không bắt user rà soát hàng loạt tài liệu mâu thuẫn.

**Criteria 29 — Kiểm tra chống drift và nguồn chân lý cạnh tranh:** Một yêu cầu mới không được coi đã nằm trong scope triển khai nếu chỉ xuất hiện ở plan, PR, ghi chú, bài review hoặc hội thoại mà chưa được phản ánh trong Criteria hiện hành với trạng thái rõ ràng. Reviewer kiểm rằng kế hoạch không thêm nghĩa vụ ngoài Criteria; nếu phát hiện khác biệt phải quay lại Criteria để người dùng chốt, không sinh thêm gate chỉ để hợp thức hóa một tài liệu thứ hai. GSA phải nạp đúng phiên bản Criteria hiện hành mỗi khi lập/sửa plan và tiếp tục Job quan trọng.

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

## XI. Những chỗ còn hai lý thuyết, chưa được phép AI tự kết luận

Tài liệu này cố ý **không giải quyết hộ người dùng** các lựa chọn dưới đây. Chúng không làm mất hiệu lực những Criteria cốt lõi ở trên; chúng xác định các phần của Criteria còn phải được chốt trước khi Planner thiết kế chi tiết refactor.

**1. CR tự động tới mức nào? [Chưa chốt]** Lý thuyết cũ: CR độc lập, chỉ Human trực tiếp gọi mỗi lần. Mong muốn mới: người dùng không phải nhắc CR/review liên tục nếu review đã nằm trong milestone đã được duyệt. Hai phương án có thể bàn tiếp là giữ CR Human-only hoặc cho phép **ủy quyền từ trước cho một mốc cụ thể**. Không được im lặng biến CR thành tự chạy toàn cục.

**2. Tự tiếp tục ở ranh giới phiên chat? [Chưa chốt về cách kích hoạt]** Lý thuyết cũ: Handoff theo người gọi, chat mới không tự code khi chỉ mở Project. Mong muốn mới: khi đã có một chuỗi AUTO hợp lệ, GSA không tự ngưng sau checkpoint. Hai điều này cùng đúng nếu phân biệt **mở Project để thảo luận** với **đang tiếp tục một Job đã có ủy quyền**. Nhưng hành vi kích hoạt resume ở phiên mới cần được quy định rõ; không bịa khả năng chạy nền.

**3. Ảnh kiểm thử lưu ở đâu? [Chưa chốt]** Yêu cầu ban đầu của người dùng: ảnh chụp test nằm trong thư mục test của target repo và có link dễ xem. Đề án về sau do agent/CR phát triển: chia ảnh có thể lưu repo với ảnh cần lưu riêng tư, tách source ref khỏi evidence ref. **Không được gạch yêu cầu người dùng chỉ vì một đề án sau này đã được review.** Cần chốt phân loại nào và cách bảo vệ thông tin riêng tư ra sao.

**4. ~~Project customization đặt ở đâu?~~ [Đã chốt hướng 17/10/2026]** Project add-in thuộc phạm vi GSA Project Memory: Planner tạo `AGENTS.md` tại `projects/<project-id>/AGENTS.md`. Chỉ Coder và Tester nhận add-in chuyên biệt; Planner/Reviewer/CR vẫn generic. Source repository có thể chứa tài liệu kỹ thuật tham khảo nhưng không tự trở thành một nơi override GSA harness. Cơ chế nạp và kiểm chứng cụ thể vẫn là quyết định triển khai của refactor, không phải lý do tạo thêm vòng gate.

**5. Mức giữ lại của các gate NEXT? [Chưa chốt]** Những cơ chế kiểm soát source revision, claim/lease, evidence applicability và recovery hiện từng giải quyết rủi ro thật. Nhưng số lượng record, enum, schema và vòng xác minh cụ thể phần lớn phát triển trong các plan/implementation, **không tự là yêu cầu gốc**. Khi refactor cần audit xem cơ chế nào tối thiểu vẫn bảo vệ được rủi ro. Không xóa bừa và không giữ bừa.

**6. Admin là một agent hay là năng lực của Orchestrator? [Chưa chốt]** Người dùng yêu cầu có Admin/Git Admin; **[Đề xuất AI — chưa chốt]** là tái sử dụng vai hiện hành thay vì tạo agent vĩnh viễn. Criteria chỉ yêu cầu chức năng quản trị thực sự dùng được, chưa quyết định cấu trúc vai.

**7. Model riêng cho agent trong GSA Web? [Chưa chốt và chưa chứng minh khả thi]** Ý tưởng Planner/Coder/Reviewer/CR dùng model khác nhau thuộc cuộc trao đổi **Bootstrap cho Codex local**. Không được coi file TOML của Codex là bằng chứng ChatGPT Web cho phép ép model ở từng role GSA.

**8. Git “auto push” phải dịch thế nào sang GSA? [Chưa chốt]** Với Codex local, commit và push có thể tách biệt; với GitHub connector của GSA, source write thường là remote commit ngay. Quyền source write, tích hợp vào branch, merge production và deploy phải được hiểu tách biệt khi Planner mô tả milestone. Không tự copy nguyên quy tắc local Git.

**9. ~~Decision Logger/UX click là điều kiện của refactor?~~ [Đã thay thế 17/10/2026]** Không bắt buộc. Trọng tâm đã chuyển sang Fresh Start và Criteria mới hướng tương lai. Việc tiếp nhận dự án không phụ thuộc chức năng hồi cứu quyết định hoặc UI click riêng. Human approval cho các thao tác quan trọng vẫn giữ theo contract an toàn hiện hữu.

---

## XII. Bức tranh một GSA đúng — câu chuyện nghiệm thu tổng thể

Người dùng đưa vào GSA một dự án đã triển khai dở, hoặc tạo dự án mới. GSA làm Fresh Start ngắn gọn: xác nhận repository và quyền, quan sát hiện trạng tối thiểu, tạo AGENTS.md generic rồi cùng người dùng chốt **Criteria mới là đích của dự án từ đây trở đi**. GSA không lục lại các chat cũ để chứng minh mọi quyết định lịch sử. Planner dựa trên Criteria này lập Project Plan có GOAL/Phase GOAL, milestone, việc phải làm và nơi cần người dùng quyết định. Người dùng duyệt. GSA chuyển sang thực thi theo đúng giới hạn đã cho.

Trong một lượt đang hoạt động, Coder viết source và tự kiểm. Có lỗi thì agent tự xem log, tự phân tích và sửa trong phạm vi. Tại mốc cần Tester hoặc Reviewer, hệ thống tự gọi theo kế hoạch; người dùng không phải đứng điều khiển từng lượt. Khi checkpoint thành công, GSA **tiếp tục bước AUTO kế tiếp**, không dùng checkpoint làm lời chào kết thúc. Khi đến một quyết định cần người dùng, hệ thống dừng đúng một chỗ và nói rõ cần quyết định gì.

Nếu lúc ghi source bị mất mạng, phiên chat kết thúc hoặc công cụ không phản hồi, kết quả dở dang vẫn có thể được kiểm tra lại ở phiên sau. GSA đối chiếu Git và Memory, không tạo commit trùng, không sửa lại phần đã hoàn tất, không báo hoàn thành giả. Khi người dùng tiếp tục một Job đã được ủy quyền, GSA làm tiếp từ bước còn thiếu. Người dùng thấy rõ tính năng đã chạy thật, còn điều gì chưa test được, và đâu là các bước yêu cầu quyền merge/release riêng.

Sau thời gian làm việc, repository không tích tụ nhiều nhánh bỏ quên; Projects không có hai bộ criteria cạnh tranh; harness không phải liên tục được vá bằng gate mới để vượt gate cũ. GSA ngày càng hiểu chuyên môn từng Project tốt hơn nhờ skills và lý thuyết đã được duyệt, nhưng bộ máy chung vẫn gọn.

**Đó là đích sản phẩm để Planner sau này lập kế hoạch refactor.** Planner không được thay câu chuyện này bằng việc tái tạo từng schema, helper hoặc gate xuất hiện trong lịch sử. Chỉ khi người dùng duyệt bản lý thuyết và chốt các điểm ở mục XI, tài liệu mới có thể trở thành Criteria baseline duy nhất cho việc thiết kế một phiên bản GSA tinh gọn hơn.

---

### Ghi chú ngắn về nguồn và tính chắc chắn

Nội dung được tổng hợp từ các yêu cầu trực tiếp trong những cuộc trao đổi về GSA, các bản nền tảng/plan lý thuyết trong repository và hồ sơ truy nguyên đã lập ngày 17/10/2026. **Các nhãn “Người dùng”, “Nền tảng”, “Đề xuất AI” là mức độ truy nguyên đã biết, không phải bằng chứng pháp lý về tác giả từng dòng.** Tài liệu này không thay thế lịch sử, không xác nhận mọi tính năng hiện đã chạy được và không cho phép tự sửa source. Muốn kiểm chứng câu nào bị thay đổi qua các giai đoạn, dùng bản kiểm kê gốc; **không cần đọc bản kiểm kê đó để hiểu Criteria này**.
