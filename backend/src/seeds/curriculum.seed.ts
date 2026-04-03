export type CourseSeed = {
  id: string;
  slug: string;
  title: string;
  audience: string[];
  isPublished: boolean;
};

export type LessonType = "theory" | "scenario" | "equipment" | "response" | "first_aid";

export type RawLessonSeed = {
  id: string;
  title: string;
  objective: string;
  content: string[];
  checklist: string[];
  quiz: string[];
};

export type LessonSeed = RawLessonSeed & {
  courseId: string;
  moduleId: string;
  orderIndex: number;
  lessonType: LessonType;
  isRequired: boolean;
};

export type RawModuleSeed = {
  id: string;
  title: string;
  duration: string;
  progress: number;
  level: string;
  iconKey: string;
  summary: string;
  lessons: RawLessonSeed[];
};

export type ModuleSeed = Omit<RawModuleSeed, "lessons"> & {
  courseId: string;
  orderIndex: number;
  isRequired: boolean;
  lessons: LessonSeed[];
};

export type QuickQuizSeed = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

export type IncidentSeed = {
  title: string;
  severity: "Thấp" | "Trung bình" | "Cao" | "Rất cao";
  status: string;
  lesson: string;
};

export const courseSeedData: CourseSeed = {
  id: "electrical-safety-foundation",
  slug: "dao-tao-an-toan-dien-nen-tang",
  title: "Đào tạo an toàn điện cho doanh nghiệp kỹ thuật điện",
  audience: ["Kỹ thuật viên hiện trường", "Bảo trì", "Vận hành", "HSE"],
  isPublished: true,
};

const lessonTypeById: Record<string, LessonType> = {
  "m1-l1": "theory",
  "m1-l2": "theory",
  "m2-l1": "theory",
  "m2-l2": "theory",
  "m3-l1": "theory",
  "m3-l2": "theory",
  "m4-l1": "scenario",
  "m4-l2": "scenario",
  "m5-l1": "theory",
  "m5-l2": "equipment",
  "m6-l1": "response",
  "m6-l2": "first_aid",
};

export const rawCurriculumSeedData: RawModuleSeed[] = [
  {
    id: "m1",
    title: "Nhận diện nguy cơ an toàn điện",
    duration: "35 phút",
    progress: 100,
    level: "Bắt buộc",
    iconKey: "shield",
    summary:
      "Giúp học viên nhận biết các dạng tai nạn điện, phân biệt tiếp xúc trực tiếp và gián tiếp, và hiểu nguyên tắc không an toàn thì không thao tác.",
    lessons: [
      {
        id: "m1-l1",
        title: "Các dạng tai nạn điện",
        objective: "Nhận biết các dạng tai nạn điện phổ biến trong doanh nghiệp kỹ thuật điện.",
        content: [
          "Điện giật là tai nạn phổ biến nhất trong các sự cố điện.",
          "Đốt cháy điện thường liên quan đến dòng điện lớn hoặc hồ quang điện.",
          "Hỏa hoạn do điện có thể phát sinh khi dây dẫn quá tải hoặc phát nhiệt kéo dài.",
          "Nổ do điện có thể xảy ra trong buồng điện hoặc khu vực có chất dễ nổ.",
        ],
        checklist: [
          "Ưu tiên phòng tránh điện giật hàng đầu.",
          "Hồ quang điện có thể gây bỏng rất nặng.",
          "Sự cố điện có thể kéo theo cháy hoặc nổ.",
        ],
        quiz: [
          "Dạng tai nạn điện nào phổ biến nhất trong thực tế?",
          "Đốt cháy điện thường gắn với yếu tố nào?",
        ],
      },
      {
        id: "m1-l2",
        title: "Tiếp xúc trực tiếp và tiếp xúc gián tiếp",
        objective: "Phân biệt được hai nhóm tiếp xúc nguy hiểm và các tình huống điển hình tại hiện trường.",
        content: [
          "Tiếp xúc trực tiếp là chạm vào phần tử đang mang điện.",
          "Phần đã cắt điện vẫn có thể nguy hiểm nếu còn tích điện hoặc còn điện áp cảm ứng.",
          "Tiếp xúc gián tiếp xảy ra qua vỏ thiết bị, rào chắn, giá đỡ hoặc phần kim loại bị mang điện.",
          "Người lao động có quyền từ chối công việc nếu điều kiện không bảo đảm an toàn.",
        ],
        checklist: [
          "Không thấy dây trần chưa chắc đã an toàn.",
          "Vỏ thiết bị vẫn có thể mang điện.",
          "Điện cảm ứng là rủi ro dễ bị bỏ sót.",
        ],
        quiz: [
          "Chạm vào vỏ tủ điện bị rò điện thuộc loại tiếp xúc nào?",
          "Phát biểu nào đúng về điện cảm ứng và phần đã cắt điện?",
        ],
      },
    ],
  },
  {
    id: "m2",
    title: "Dòng điện tác động lên cơ thể người",
    duration: "40 phút",
    progress: 82,
    level: "Bắt buộc",
    iconKey: "zap",
    summary:
      "Tập trung vào cơ chế dòng điện đi qua cơ thể, ngưỡng nguy hiểm, mức phản ứng và vì sao AC công nghiệp đặc biệt nguy hiểm.",
    lessons: [
      {
        id: "m2-l1",
        title: "Cơ chế tổn thương do dòng điện",
        objective: "Hiểu vì sao điện gây tổn thương cho tim, hô hấp và hệ thần kinh.",
        content: [
          "Dòng điện đi qua người có thể gây tổn thương toàn thân.",
          "Tác dụng kích thích làm co cơ và khiến nạn nhân khó rời nguồn điện.",
          "Tác dụng gây chấn thương thường liên quan đến điện áp cao và hồ quang điện.",
          "Thời gian tiếp xúc càng dài, mức nguy hiểm càng tăng.",
        ],
        checklist: [
          "Dòng điện qua người là yếu tố gây hại trực tiếp.",
          "Co cơ có thể làm nạn nhân không tự buông được.",
          "Điện áp cao có thể gây bỏng do hồ quang.",
        ],
        quiz: [
          "Cơ quan nào bị đe dọa nghiêm trọng nhất khi dòng điện đi qua người?",
          "Vì sao nạn nhân có thể không tự buông được nguồn điện?",
        ],
      },
      {
        id: "m2-l2",
        title: "Ngưỡng dòng điện và mức phản ứng của cơ thể",
        objective: "Nắm các mốc phản ứng sinh lý cơ bản theo cường độ dòng điện.",
        content: [
          "Dòng điện nhỏ đã có thể gây tê, run hoặc đau nhẹ.",
          "Dòng điện tăng sẽ gây co cơ, khó rời nguồn điện và khó thở.",
          "Mức cao hơn có thể làm tê liệt hô hấp và ngừng tim.",
          "Dòng AC 50–60Hz nguy hiểm hơn DC trong nhiều tình huống.",
        ],
        checklist: [
          "Không cần dòng điện quá lớn mới nguy hiểm.",
          "Không tự rời nguồn điện là dấu hiệu rất nghiêm trọng.",
          "AC công nghiệp là loại đặc biệt nguy hiểm.",
        ],
        quiz: [
          "Dòng điện xoay chiều nguy hiểm hơn ở dải tần số nào?",
          "Mức tham chiếu nào gần ngưỡng không nguy hiểm lớn nhất cho AC?",
        ],
      },
    ],
  },
  {
    id: "m3",
    title: "Yếu tố làm tăng mức độ nguy hiểm",
    duration: "35 phút",
    progress: 68,
    level: "Bắt buộc",
    iconKey: "alertTriangle",
    summary:
      "Giải thích vì sao độ ẩm, điện trở cơ thể, đường đi dòng điện, tần số và sức khỏe người lao động ảnh hưởng mạnh tới mức độ tai nạn.",
    lessons: [
      {
        id: "m3-l1",
        title: "Điện trở cơ thể và ảnh hưởng của môi trường",
        objective: "Hiểu vai trò của điện trở cơ thể và các điều kiện môi trường bất lợi.",
        content: [
          "Điện trở cơ thể thay đổi theo tình trạng da và môi trường.",
          "Da ướt, trầy xước hoặc bẩn dẫn điện sẽ làm điện trở giảm mạnh.",
          "Độ ẩm, mồ hôi, bụi, hóa chất và nhiệt độ cao đều làm rủi ro tăng.",
          "Trong tính toán đơn giản, điện trở người thường lấy khoảng 1000Ω.",
        ],
        checklist: [
          "Môi trường ẩm ướt làm nguy cơ điện giật tăng mạnh.",
          "Da ướt hoặc tổn thương là điều kiện rất bất lợi.",
          "Mức nguy hiểm thay đổi theo từng hoàn cảnh thực tế.",
        ],
        quiz: [
          "Yếu tố nào làm điện trở cơ thể giảm?",
          "Trong tính toán đơn giản, điện trở người thường lấy xấp xỉ bao nhiêu?",
        ],
      },
      {
        id: "m3-l2",
        title: "Đường đi của dòng điện, tần số và sức khỏe người lao động",
        objective: "Hiểu vì sao cùng một dòng điện nhưng mức độ nguy hiểm có thể khác nhau.",
        content: [
          "Đường đi của dòng điện qua tim là đặc biệt nguy hiểm.",
          "Tay phải qua chân là đường đi rất đáng lo ngại trong các tình huống so sánh.",
          "AC nguy hiểm hơn DC trong nhiều trường hợp tiếp xúc với người.",
          "Người mệt, say rượu, suy nhược hoặc có bệnh tim dễ bị sốc điện hơn.",
        ],
        checklist: [
          "Đường đi của dòng điện quyết định mức độ nguy hiểm.",
          "Tay–chân và tay–tay là các đường chạm rất rủi ro.",
          "Tình trạng sức khỏe ảnh hưởng trực tiếp đến tai nạn điện.",
        ],
        quiz: [
          "Đường đi nào được nêu là nguy hiểm hơn trong bảng so sánh?",
          "Đối tượng nào nhạy cảm hơn khi bị điện giật?",
        ],
      },
    ],
  },
  {
    id: "m4",
    title: "Điện áp tiếp xúc và điện áp bước",
    duration: "30 phút",
    progress: 52,
    level: "Tăng cường",
    iconKey: "wrench",
    summary:
      "Tập trung vào rủi ro quanh điểm chạm đất, trạm điện, tủ điện và ý nghĩa của việc kiểm soát vị trí đứng khi có sự cố.",
    lessons: [
      {
        id: "m4-l1",
        title: "Dòng điện đi vào đất và vùng nguy hiểm quanh điểm chạm đất",
        objective: "Hiểu hiện tượng phân bố điện áp khi có dòng sự cố đi xuống đất.",
        content: [
          "Thiết bị hỏng cách điện có thể làm dòng điện đi vào đất.",
          "Xung quanh điểm chạm đất sẽ hình thành vùng điện thế phân bố không đều.",
          "Điện áp giảm dần khi ra xa điểm chạm đất.",
          "Khu vực quanh điểm sự cố cần được cô lập chặt chẽ.",
        ],
        checklist: [
          "Điểm chạm đất không chỉ nguy hiểm tại đúng vị trí tiếp xúc.",
          "Càng gần điểm sự cố, chênh lệch điện thế càng lớn.",
          "Không đi vào vùng nghi chạm đất nếu chưa được kiểm soát.",
        ],
        quiz: [
          "Khi dòng điện sự cố đi vào đất, điện áp quanh điểm chạm đất thay đổi thế nào?",
          "Tại sao khu vực quanh điểm chạm đất phải được cô lập?",
        ],
      },
      {
        id: "m4-l2",
        title: "Điện áp tiếp xúc và điện áp bước",
        objective: "Phân biệt được 2 khái niệm quan trọng trong an toàn hiện trường điện.",
        content: [
          "Điện áp tiếp xúc là chênh lệch điện thế giữa thiết bị có điện áp và vị trí người đứng.",
          "Điện áp bước xuất hiện khi hai chân đứng trên hai điểm có điện thế khác nhau.",
          "Điện áp bước có thể gây điện giật dù không chạm tay vào thiết bị.",
          "Trong vùng sự cố cần hạn chế dang rộng chân và kiểm soát di chuyển.",
        ],
        checklist: [
          "Không chỉ chạm tay vào thiết bị mới có thể bị điện giật.",
          "Hai chân đứng xa nhau trong vùng sự cố làm rủi ro tăng.",
          "Luôn cô lập hiện trường và cảnh báo người xung quanh.",
        ],
        quiz: [
          "Điện áp bước xuất hiện khi nào?",
          "Hành vi nào nên tránh trong vùng nghi có điện áp bước?",
        ],
      },
    ],
  },
  {
    id: "m5",
    title: "Biện pháp bảo vệ khi làm việc với mạng điện",
    duration: "50 phút",
    progress: 74,
    level: "Bắt buộc",
    iconKey: "users",
    summary:
      "Nắm nguyên tắc an toàn chung, các lớp bảo vệ kỹ thuật, và cách dùng PPE cùng phương tiện phụ trợ đúng bối cảnh công việc điện.",
    lessons: [
      {
        id: "m5-l1",
        title: "Nguyên tắc bảo vệ khi làm việc với mạng điện",
        objective: "Nắm các nguyên tắc cốt lõi để giảm dòng điện qua người và kiểm soát mối nguy trước khi thao tác.",
        content: [
          "Không tiếp xúc với phần tử mang điện.",
          "Chỉ tổ chức công việc khi mối nguy điện đã được kiểm soát.",
          "Hệ thống bảo vệ phải tác động nhanh khi có sự cố.",
          "Có thể giảm nguy cơ bằng cách điện, cô lập nguồn, nối đất và tăng điện trở sàn trong một số tình huống.",
        ],
        checklist: [
          "Luôn kiểm soát mối nguy trước khi thao tác.",
          "Không phụ thuộc vào một lớp bảo vệ duy nhất.",
          "Cách điện, nối đất và tổ chức công việc phải đi cùng nhau.",
        ],
        quiz: [
          "Nguyên tắc nào đúng nhất trước khi thao tác điện?",
          "Biện pháp nào có thể giúp giảm dòng điện qua người trong một số tình huống?",
        ],
      },
      {
        id: "m5-l2",
        title: "Phương tiện bảo vệ cá nhân và phương tiện phụ trợ",
        objective: "Nhận biết đúng các phương tiện bảo vệ sử dụng trong công việc điện.",
        content: [
          "PPE và phương tiện phụ trợ gồm găng, ủng, thảm, sào cách điện, dụng cụ thử điện, biển báo và rào chắn.",
          "Thiết bị nối đất di động và ngắn mạch hỗ trợ kiểm soát an toàn trong một số công việc chuyên môn.",
          "PPE không thay thế hoàn toàn cho quy trình cô lập nguồn và xác nhận an toàn.",
          "Cần kiểm tra tình trạng thiết bị trước khi sử dụng.",
        ],
        checklist: [
          "PPE phải đúng loại, đúng cấp điện áp, đúng tình trạng.",
          "Biển báo và rào chắn giúp ngăn thao tác nhầm.",
          "Không dùng PPE hỏng, ẩm hoặc quá hạn kiểm định.",
        ],
        quiz: [
          "Thiết bị nào thuộc nhóm bảo vệ cách điện cá nhân?",
          "PPE có thay thế hoàn toàn cho quy trình cô lập nguồn không?",
        ],
      },
    ],
  },
  {
    id: "m6",
    title: "Cấp cứu người bị điện giật",
    duration: "45 phút",
    progress: 46,
    level: "Tối quan trọng",
    iconKey: "heartPulse",
    summary:
      "Trang bị đúng trình tự cứu nạn: bảo đảm an toàn cho người cứu, tách nạn nhân khỏi nguồn điện và sơ cứu ban đầu kịp thời.",
    lessons: [
      {
        id: "m6-l1",
        title: "Tách nạn nhân khỏi nguồn điện an toàn",
        objective: "Biết đúng trình tự cứu nạn và tránh biến người cứu thành nạn nhân thứ hai.",
        content: [
          "Ưu tiên cắt nguồn điện gần nhất nếu có thể.",
          "Nếu không cắt được điện hạ áp, dùng vật cách điện phù hợp để tách nạn nhân.",
          "Không chạm trực tiếp tay vào nạn nhân khi nguồn điện chưa được loại trừ.",
          "Với điện cao áp, chỉ xử lý khi có phương tiện và điều kiện an toàn chuyên ngành.",
        ],
        checklist: [
          "Người cứu phải an toàn trước.",
          "Cắt nguồn là ưu tiên số một nếu thực hiện được.",
          "Phải phân biệt hạ áp và cao áp.",
        ],
        quiz: [
          "Hành động ưu tiên đầu tiên khi phát hiện người bị điện giật là gì?",
          "Khi không thể cắt điện hạ áp, nên làm gì?",
        ],
      },
      {
        id: "m6-l2",
        title: "Sơ cứu ban đầu cho người bị điện giật",
        objective: "Biết đánh giá nhanh tình trạng nạn nhân và chuyển sang sơ cứu đúng hướng.",
        content: [
          "Kiểm tra tri giác, nhịp thở và tim mạch ngay sau khi tách nạn nhân khỏi nguồn điện.",
          "Phân loại nạn nhân: còn tỉnh, bất tỉnh nhưng còn thở, hoặc ngừng thở/ngừng tim.",
          "Nếu cần, tiến hành hô hấp nhân tạo và ép tim ngoài lồng ngực.",
          "Duy trì sơ cứu và gọi hỗ trợ y tế cho đến khi được tiếp nhận.",
        ],
        checklist: [
          "Tách khỏi nguồn điện chưa phải là kết thúc cứu nạn.",
          "Phải đánh giá nhanh và đúng tình trạng nạn nhân.",
          "Không bỏ nạn nhân một mình sau cứu hộ.",
        ],
        quiz: [
          "Sau khi tách nạn nhân khỏi nguồn điện, cần kiểm tra ngay điều gì?",
          "Khi nạn nhân ngừng thở hoặc tim ngừng đập, cần làm gì?",
        ],
      },
    ],
  },
];

export const curriculumSeedData: ModuleSeed[] = rawCurriculumSeedData.map((module, moduleIndex) => ({
  ...module,
  courseId: courseSeedData.id,
  orderIndex: moduleIndex + 1,
  isRequired: module.level !== "Tăng cường",
  lessons: module.lessons.map((lesson, lessonIndex) => ({
    ...lesson,
    courseId: courseSeedData.id,
    moduleId: module.id,
    orderIndex: lessonIndex + 1,
    lessonType: lessonTypeById[lesson.id] ?? "theory",
    isRequired: module.level !== "Tăng cường",
  })),
}));

export const quickQuizSeedData: QuickQuizSeed[] = [
  {
    id: 1,
    question: "Yếu tố nào nguy hiểm nhất đối với cơ thể người khi xảy ra điện giật?",
    options: ["Màu dây điện", "Dòng điện đi qua người", "Kích thước tủ điện", "Chiều dài cáp"],
    answer: 1,
  },
  {
    id: 2,
    question: "Trong môi trường ẩm ướt, nguy cơ điện giật tăng vì sao?",
    options: [
      "Da dẫn điện tốt hơn, điện trở cơ thể giảm",
      "Thiết bị chạy nhanh hơn",
      "Điện áp tự tăng lên",
      "Không ảnh hưởng gì",
    ],
    answer: 0,
  },
  {
    id: 3,
    question: "Khi không thể cắt điện, hành động nào đúng để cứu nạn nhân điện hạ áp?",
    options: [
      "Dùng tay không kéo nạn nhân",
      "Đứng trên nền ướt để tiếp cận nhanh",
      "Dùng găng/ủng cách điện và vật cách điện để tách nạn nhân",
      "Tưới nước để làm mát dây điện",
    ],
    answer: 2,
  },
  {
    id: 4,
    question: "Điện áp bước xuất hiện khi nào?",
    options: [
      "Khi hai tay chạm cùng một dây",
      "Khi hai chân đứng trên hai điểm có điện thế khác nhau",
      "Khi ngắt CB trong tủ điện",
      "Khi dùng găng tay cách điện",
    ],
    answer: 1,
  },
];

export const incidentsSeedData: IncidentSeed[] = [
  {
    title: "Chạm vỏ tủ điện tại khu vực bảo trì",
    severity: "Cao",
    status: "Đang huấn luyện",
    lesson: "Nhận diện tiếp xúc gián tiếp, kiểm tra nối đất và xác nhận cô lập nguồn trước thao tác.",
  },
  {
    title: "Nguy cơ điện áp bước gần điểm chạm đất",
    severity: "Cao",
    status: "Mô phỏng",
    lesson: "Rời khu vực theo bước ngắn, tránh dang rộng chân, cô lập hiện trường.",
  },
  {
    title: "Môi trường ẩm và dụng cụ cầm tay điện áp thấp",
    severity: "Trung bình",
    status: "Đã review",
    lesson: "Điện áp thấp vẫn có thể nguy hiểm nếu điều kiện tiếp xúc xấu và thời gian tác động kéo dài.",
  },
];

export const rescueStepsSeedData: string[] = [
  "Đảm bảo an toàn cho người cứu trước tiên.",
  "Cắt nguồn điện gần nhất nếu có thể.",
  "Nếu không thể cắt điện, dùng găng/ủng/vật cách điện phù hợp để tách nạn nhân.",
  "Đưa nạn nhân đến nơi thoáng khí, kiểm tra tri giác, thở, tim mạch.",
  "Nếu nạn nhân ngừng thở hoặc tim ngừng đập, tiến hành hô hấp nhân tạo và ép tim ngoài lồng ngực.",
  "Gọi cấp cứu và duy trì sơ cứu cho đến khi nhân viên y tế tiếp nhận.",
];
