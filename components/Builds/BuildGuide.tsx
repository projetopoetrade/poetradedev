import { marked } from "marked";

interface BuildGuideProps {
  content: string;
}

export default function BuildGuide({ content }: BuildGuideProps) {
  const html = marked.parse(content) as string;

  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-amber-700 dark:prose-code:text-amber-300 prose-li:text-gray-700 dark:prose-li:text-gray-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
