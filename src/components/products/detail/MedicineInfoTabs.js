import React, { useMemo, useState } from 'react';

const sections = [
  { id: 'usage', label: 'Công dụng', headingPrefix: 'Công dụng của' },
  { id: 'dosage', label: 'Cách dùng', headingPrefix: 'Cách dùng' },
  { id: 'adverse_effect', label: 'Tác dụng phụ', headingPrefix: 'Tác dụng phụ của' },
  { id: 'careful', label: 'Lưu ý', headingPrefix: 'Lưu ý khi dùng' },
  { id: 'preservation', label: 'Bảo quản', headingPrefix: 'Bảo quản' },
];

const splitContent = (content) => {
  return String(content || 'Thông tin đang được cập nhật.');
};

const standaloneHeadingLabels = new Set([
  'Công dụng',
  'Chỉ định',
  'Dược lực học',
  'Dược động học',
  'Cách dùng',
  'Liều dùng',
  'Làm gì khi dùng quá liều?',
  'Làm gì khi quên 1 liều?',
  'Chống chỉ định',
  'Thận trọng khi sử dụng',
  'Tác dụng phụ',
  'Tương tác thuốc',
  'Bảo quản',
]);

const getNextNonEmptyLine = (lines, currentIndex) => {
  return lines
    .slice(currentIndex + 1)
    .find((line) => line.trim().length > 0);
};

const normalizeHeading = (value) => value.trim().replace(/:$/, '');

const isStandaloneHeading = (line, lines, index) => {
  const text = line.trim();
  const nextLine = getNextNonEmptyLine(lines, index);

  if (!text || !nextLine) return false;
  if (standaloneHeadingLabels.has(normalizeHeading(text))) return true;
  if (text.length > 60) return false;
  if (/^[,.:;!?%)]/.test(text)) return false;
  if (/[.,;]$/.test(text)) return false;

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 8) return false;

  return text.endsWith('?') || text.endsWith(':');
};

const getReadableBlocks = (content) => {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let paragraphLines = [];

  const pushParagraph = () => {
    if (paragraphLines.length === 0) return;

    blocks.push({
      type: 'paragraph',
      text: paragraphLines
        .join(' ')
        .replace(/\s+([,.:;!?%)])/g, '$1')
        .replace(/([(])\s+/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    });
    paragraphLines = [];
  };

  lines.forEach((line, index) => {
    const text = line.trim();

    if (!text) {
      pushParagraph();
      return;
    }

    if (isStandaloneHeading(text, lines, index)) {
      pushParagraph();
      blocks.push({ type: 'heading', text });
      return;
    }

    paragraphLines.push(text);
  });

  pushParagraph();

  return blocks;
};

const renderContent = (content) => {
  return getReadableBlocks(content).map((block, index) => {
    if (block.type === 'heading') {
      return (
        <div key={`${block.text}-${index}`} className="font-bold text-gray-900">
          {block.text}
        </div>
      );
    }

    return (
      <div key={`${block.text}-${index}`}>
        {block.text}
      </div>
    );
  });
};

const MedicineInfoTabs = ({ medicalInfo, productName }) => {
  const [activeId, setActiveId] = useState(sections[0].id);

  const activeSection = useMemo(() => {
    return sections.find((section) => section.id === activeId) || sections[0];
  }, [activeId]);

  const content = splitContent(medicalInfo?.[activeSection.id]);

  return (
    <section className="lg:col-span-3 bg-white border border-gray-100 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4">
        <aside className="md:border-r border-gray-100 bg-gray-50 md:bg-white">
          {sections.map((section) => {
            const active = activeId === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`w-full text-left px-5 py-4 border-b last:border-b-0 font-semibold transition ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </aside>

        <article className="md:col-span-3 p-5 md:p-7 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            {activeSection.headingPrefix} {productName}
          </h2>

          <div className="mt-5 space-y-4 text-gray-800">
            <div className="text-base leading-8">
              {renderContent(content)}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default MedicineInfoTabs;
