import type { LessonDetail, LessonResource, LessonSection } from "../features/training/types";

function buildDemoResources(sectionId: string, baseTitle: string, index: number): LessonResource[] {
  return [
    {
      id: `${sectionId}-video`,
      type: "video",
      title: `Video hướng dẫn: ${baseTitle}`,
      description: "Clip minh họa thao tác an toàn và lỗi thường gặp tại hiện trường.",
      isRequired: index === 0,
      sectionId,
      orderIndex: 1,
      durationLabel: "3–5 phút",
    },
    {
      id: `${sectionId}-pdf`,
      type: "pdf",
      title: `PDF quy trình liên quan`,
      description: "Quy trình/SOP liên quan để học viên tham khảo trước khi thao tác.",
      isRequired: false,
      sectionId,
      orderIndex: 2,
      fileLabel: "PDF",
    },
    {
      id: `${sectionId}-doc`,
      type: "document",
      title: `Tài liệu tham khảo`,
      description: "Ghi chú kỹ thuật, checklist và biểu mẫu xác nhận an toàn.",
      isRequired: false,
      sectionId,
      orderIndex: 3,
      fileLabel: "DOC",
    },
  ];
}

export function buildFallbackSections(lesson: LessonDetail): LessonSection[] {
  const content = lesson.content ?? [];
  const checklist = lesson.checklist ?? [];

  return content.map((item, index) => {
    const sectionId = `${lesson.id}-section-${index + 1}`;
    return {
      id: sectionId,
      title: `Ý chính ${index + 1}`,
      summary: item,
      content: [
        `${item} Đây là nội dung chính cần hiểu theo ngữ cảnh vận hành thực tế.`,
        "Người học cần nắm rõ điều kiện an toàn trước khi thao tác và cách nhận biết các dấu hiệu rủi ro tại hiện trường.",
        lesson.objective
          ? `Nội dung này liên hệ trực tiếp với mục tiêu bài học: ${lesson.objective}`
          : "Nội dung này cần được chuyển hóa thành hành vi an toàn khi làm việc với thiết bị điện.",
      ],
      checklist: checklist.slice(index, index + 2).length
        ? checklist.slice(index, index + 2)
        : checklist.slice(0, 2),
      warning:
        "Không nên hiểu nội dung ở mức khái niệm. Cần đối chiếu với thao tác thực tế và quy trình hiện trường.",
      examples: [
        "Kiểm tra tình trạng thiết bị trước khi thao tác.",
        "Xác nhận điều kiện cô lập nguồn điện và trách nhiệm của người thực hiện.",
      ],
      isRequired: true,
      orderIndex: index + 1,
      resources: buildDemoResources(sectionId, item, index),
    };
  });
}
